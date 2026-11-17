/**
 * @fileoverview Cloudflare Worker que escribe en Algolia en nombre de la
 * aplicación, para que la clave de escritura nunca llegue al navegador:
 *   POST /                 guarda una orden y, si está confirmada, descuenta
 *                          su stock en el índice de productos.
 *   POST /admin-session    verifica el correo y la contraseña de un
 *                          administrador y entrega un token firmado.
 *   POST /product-changes  aplica los cambios del administrador a un producto
 *                          (precios, mínimo B2B y unidades por sucursal).
 * La ruta de productos exige el token del administrador. El Worker
 * valida cada petición y escribe con la clave almacenada como secreto de
 * Cloudflare.
 *
 * Variables de entorno:
 *   ALGOLIA_APPLICATION_ID: identificador de la aplicación de Algolia.
 *   ALGOLIA_ORDERS_INDEX_NAME: nombre del índice de órdenes.
 *   ALGOLIA_PRODUCTS_INDEX_NAME: nombre del índice de productos.
 *   ALGOLIA_USERS_INDEX_NAME: nombre del índice de usuarios.
 *   ALGOLIA_WRITE_API_KEY: clave con permiso de lectura y escritura sobre
 *       los índices (secreto).
 *   ADMIN_TOKEN_SECRET: texto aleatorio con el que se firman los tokens del
 *       administrador (secreto).
 *   ALLOWED_ORIGINS: orígenes permitidos, separados por comas.
 */

/** Tamaño máximo aceptado para el cuerpo de una petición, en bytes. */
const MAX_BODY_BYTES = 50_000;

/** Formato del número de orden: ORD-AAAAMMDD-XXXXXX. */
const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[A-Z0-9]{6}$/;

/** Unidades máximas de un producto en una orden, para limitar abusos. */
const MAX_UNITS_PER_ITEM = 100;

/** Datos de un producto que puede cambiar el administrador. */
const EDITABLE_FIELDS = ['retailPrice', 'businessPrice', 'businessMinimum', 'branchStock'];

/** Precio máximo aceptado al editar un producto. */
const MAX_PRICE = 100_000_000;

/** Mínimo B2B máximo aceptado al editar un producto. */
const MAX_BUSINESS_MINIMUM = 1000;

/** Unidades máximas aceptadas en una sucursal al editar un producto. */
const MAX_BRANCH_STOCK = 10_000;

/** Intentos para esperar a que Algolia publique un cambio. */
const MAX_TASK_CHECKS = 20;

/** Espera entre cada revisión de la tarea de Algolia, en milisegundos. */
const TASK_CHECK_DELAY_MS = 250;

/** Horas que dura el token del administrador. */
const ADMIN_TOKEN_HOURS = 12;

/**
 * Obtiene la lista de orígenes permitidos.
 *
 * @param {{ALLOWED_ORIGINS?: string}} env Variables de entorno del Worker.
 * @return {!Array<string>} Los orígenes, sin espacios ni elementos vacíos.
 */
const getAllowedOrigins = (env) =>
    (env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

/**
 * Crea los encabezados CORS para el origen de la petición. Si el origen no
 * está permitido, se omite Access-Control-Allow-Origin y el navegador
 * bloquea la respuesta.
 *
 * @param {?string} origin Origen de la petición.
 * @param {!Array<string>} allowedOrigins Orígenes permitidos.
 * @return {!Object<string, string>} Los encabezados CORS.
 */
function createCorsHeaders(origin, allowedOrigins) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin'
    };

    if (origin && allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
}

/**
 * Crea una respuesta JSON.
 *
 * @param {*} body Contenido de la respuesta.
 * @param {number} status Código de estado HTTP.
 * @param {!Object<string, string>} corsHeaders Encabezados CORS.
 * @return {!Response} La respuesta.
 */
const jsonResponse = (body, status, corsHeaders) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

/**
 * Indica si un valor es un número finito no negativo.
 *
 * @param {*} value Valor a revisar.
 * @return {boolean} Verdadero si es un monto o cantidad válida.
 */
const isNonNegativeNumber = (value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Revisa que la orden tenga la información mínima para guardarse. Una orden
 * confirmada además debe indicar la sucursal, porque de ahí sale el stock.
 *
 * @param {*} order Orden recibida.
 * @return {?string} La descripción del primer problema, o null si es válida.
 */
function validateOrder(order) {
    if (typeof order !== 'object' || order === null || Array.isArray(order)) {
        return 'La orden debe ser un objeto.';
    }

    if (typeof order.orderNumber !== 'string' || !ORDER_NUMBER_PATTERN.test(order.orderNumber)) {
        return 'El número de orden no es válido.';
    }

    if (typeof order.userId !== 'string' || order.userId.trim() === '') {
        return 'La orden debe indicar el usuario.';
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
        return 'La orden debe tener al menos un producto.';
    }

    const hasInvalidItem = order.items.some((item) =>
        typeof item?.productId !== 'string' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > MAX_UNITS_PER_ITEM ||
        !isNonNegativeNumber(item.unitPrice)
    );

    if (hasInvalidItem) {
        return 'Algún producto de la orden no es válido.';
    }

    if (!isNonNegativeNumber(order.total)) {
        return 'El total de la orden no es válido.';
    }

    if (order.orderStatus === 'CONFIRMED' && typeof order.branch?.id !== 'string') {
        return 'Una orden confirmada debe indicar la sucursal.';
    }

    return null;
}

/**
 * Lee el cuerpo JSON de la petición respetando el tamaño máximo.
 *
 * @param {!Request} request Petición recibida.
 * @return {!Promise<*>} El contenido interpretado.
 * @throws {RangeError} Si el cuerpo supera el tamaño máximo.
 * @throws {SyntaxError} Si el cuerpo no es JSON válido.
 */
async function readJsonBody(request) {
    const text = await request.text();

    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        throw new RangeError('Cuerpo demasiado grande.');
    }

    return JSON.parse(text);
}

/**
 * Crea los encabezados para llamar a la API de Algolia con la clave de escritura.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Object<string, string>} Los encabezados.
 */
const createAlgoliaHeaders = (env) => ({
    'X-Algolia-Application-Id': env.ALGOLIA_APPLICATION_ID,
    'X-Algolia-API-Key': env.ALGOLIA_WRITE_API_KEY,
    'Content-Type': 'application/json'
});

/**
 * Arma la dirección de un registro de un índice de Algolia.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {string} indexName Índice del registro.
 * @param {string} objectId Identificador del registro.
 * @return {string} La dirección del registro.
 */
const getObjectUrl = (env, indexName, objectId) =>
    `https://${env.ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/` +
    `${encodeURIComponent(indexName)}/${encodeURIComponent(objectId)}`;

/**
 * Obtiene un registro de un índice de Algolia.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {string} indexName Índice a consultar.
 * @param {string} objectId Identificador del registro.
 * @return {!Promise<?Object>} El registro, o null si no existe.
 * @throws {Error} Si Algolia responde con otro error.
 */
async function getObject(env, indexName, objectId) {
    const response = await fetch(getObjectUrl(env, indexName, objectId), {
        headers: createAlgoliaHeaders(env)
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Algolia respondió ${response.status} al leer ${objectId}.`);
    }

    return response.json();
}

/**
 * Descuenta las unidades de un producto en una sucursal y recalcula su stock
 * total y su disponibilidad. El stock nunca queda negativo.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {string} productId Identificador del producto.
 * @param {string} branchId Sucursal de la que salen las unidades.
 * @param {number} units Unidades a descontar.
 * @throws {Error} Si el producto no existe o Algolia no acepta el cambio.
 */
async function discountProductStock(env, productId, branchId, units) {
    const product = await getObject(env, env.ALGOLIA_PRODUCTS_INDEX_NAME, productId);

    if (!product) {
        throw new Error(`El producto ${productId} no existe.`);
    }

    const locations = (product.locations ?? []).map((location) => {
        if (location.locationId !== branchId) {
            return location;
        }

        const stock = Math.max(0, location.stock - units);
        return { ...location, stock, available: stock > 0 };
    });

    const stockQuantity = locations.reduce(
        (total, location) => total + (location.available ? location.stock : 0),
        0
    );

    const response = await fetch(
        `${getObjectUrl(env, env.ALGOLIA_PRODUCTS_INDEX_NAME, productId)}/partial`,
        {
            method: 'POST',
            headers: createAlgoliaHeaders(env),
            body: JSON.stringify({
                locations,
                stock_quantity: stockQuantity,
                in_stock: stockQuantity > 0
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Algolia respondió ${response.status} al actualizar ${productId}.`);
    }
}

/**
 * Descuenta el stock de una orden confirmada, solo si no se había hecho antes.
 * Como la aplicación reenvía la orden en cada cambio de estado, se revisa la
 * versión guardada: si ya tiene stockDiscounted, no se vuelve a descontar.
 *
 * @param {!Object} order Orden validada y confirmada.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<boolean>} Verdadero si el stock quedó descontado.
 */
async function discountStockOnce(order, env) {
    const savedOrder = await getObject(env, env.ALGOLIA_ORDERS_INDEX_NAME, order.orderNumber);

    if (savedOrder?.stockDiscounted) {
        return true;
    }

    for (const item of order.items) {
        await discountProductStock(env, item.productId, order.branch.id, item.quantity);
    }

    console.log(`Stock descontado para la orden ${order.orderNumber} en ${order.branch.id}.`);
    return true;
}

/**
 * Guarda la orden en Algolia usando su número como objectID, así que
 * repetir el envío reemplaza la misma orden en lugar de duplicarla.
 *
 * @param {!Object} order Orden validada.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<!Response>} La respuesta de Algolia.
 */
function saveOrder(order, env) {
    return fetch(getObjectUrl(env, env.ALGOLIA_ORDERS_INDEX_NAME, order.orderNumber), {
        method: 'PUT',
        headers: createAlgoliaHeaders(env),
        body: JSON.stringify({ ...order, objectID: order.orderNumber })
    });
}

/**
 * Convierte bytes a base64 apta para URL, sin relleno.
 *
 * @param {!Uint8Array} bytes Bytes a convertir.
 * @return {string} El texto en base64url.
 */
const bytesToBase64Url = (bytes) =>
    btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Convierte base64 apta para URL a bytes.
 *
 * @param {string} value Texto en base64url.
 * @return {!Uint8Array} Los bytes.
 */
const base64UrlToBytes = (value) =>
    Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0));

/**
 * Calcula el hash SHA-256 de una contraseña, igual que la aplicación al
 * guardar los usuarios en el índice.
 *
 * @param {string} password Contraseña recibida.
 * @return {!Promise<string>} El hash en hexadecimal.
 */
async function hashPassword(password) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Prepara la clave con la que se firman y verifican los tokens.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<!CryptoKey>} La clave HMAC.
 */
const getTokenKey = (env) =>
    crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.ADMIN_TOKEN_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );

/**
 * Crea un token firmado para el administrador. Contiene su correo y la fecha
 * en que vence; la firma impide modificarlo sin conocer el secreto.
 *
 * @param {string} email Correo del administrador.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<{token: string, expiresAt: number}>} El token y su vencimiento.
 */
async function createAdminToken(email, env) {
    const expiresAt = Date.now() + ADMIN_TOKEN_HOURS * 60 * 60 * 1000;
    const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ email, role: 'ADMIN', expiresAt })));
    const signature = await crypto.subtle.sign('HMAC', await getTokenKey(env), new TextEncoder().encode(payload));

    return { token: `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`, expiresAt };
}

/**
 * Verifica el token del administrador que llega en el encabezado
 * Authorization ("Bearer <token>").
 *
 * @param {!Request} request Petición recibida.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<?string>} El correo del administrador, o null si el
 *     token falta, está alterado o venció.
 */
async function verifyAdminToken(request, env) {
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
    const [payload, signature] = token.split('.');

    if (!payload || !signature || !env.ADMIN_TOKEN_SECRET) {
        return null;
    }

    try {
        const isValid = await crypto.subtle.verify(
            'HMAC',
            await getTokenKey(env),
            base64UrlToBytes(signature),
            new TextEncoder().encode(payload)
        );
        const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));

        return isValid && data.role === 'ADMIN' && data.expiresAt > Date.now() ? data.email : null;
    } catch (error) {
        console.error('Token de administrador ilegible:', error);
        return null;
    }
}

/**
 * Verifica las credenciales de un administrador contra el índice de usuarios
 * y, si son correctas, entrega un token. La contraseña se compara con el hash
 * calculado aquí, porque el hash guardado en el índice se puede leer con la
 * clave pública de búsqueda.
 *
 * @param {*} body Contenido recibido: email y password.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {!Object<string, string>} corsHeaders Encabezados CORS.
 * @return {!Promise<!Response>} El token o el motivo del rechazo.
 */
async function handleAdminSession(body, env, corsHeaders) {
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
        return jsonResponse({ error: 'Faltan el correo o la contraseña.' }, 400, corsHeaders);
    }

    if (!env.ADMIN_TOKEN_SECRET || !env.ALGOLIA_USERS_INDEX_NAME) {
        console.error('Faltan ADMIN_TOKEN_SECRET o ALGOLIA_USERS_INDEX_NAME en el Worker.');
        return jsonResponse({ error: 'El Worker no está configurado para el administrador.' }, 500, corsHeaders);
    }

    try {
        const email = body.email.trim().toLowerCase();
        const [user, passwordHash] = await Promise.all([
            getObject(env, env.ALGOLIA_USERS_INDEX_NAME, email),
            hashPassword(body.password)
        ]);

        if (!user || user.passwordHash !== passwordHash) {
            return jsonResponse({ error: 'Correo o contraseña incorrectos.' }, 401, corsHeaders);
        }

        if (user.role !== 'ADMIN') {
            return jsonResponse({ error: 'Solo el administrador puede editar productos.' }, 403, corsHeaders);
        }

        console.log(`Token de administrador entregado a ${email}.`);
        return jsonResponse(await createAdminToken(email, env), 200, corsHeaders);
    } catch (error) {
        console.error('No se pudo verificar al administrador:', error);
        return jsonResponse({ error: 'No se pudo verificar al administrador.' }, 502, corsHeaders);
    }
}

/**
 * Indica si un valor es un número entero dentro de un rango.
 *
 * @param {*} value Valor a revisar.
 * @param {number} min Valor mínimo permitido.
 * @param {number} max Valor máximo permitido.
 * @return {boolean} Verdadero si es entero y está en el rango.
 */
const isWholeNumberBetween = (value, min, max) =>
    Number.isInteger(value) && value >= min && value <= max;

/**
 * Revisa la forma de una petición de cambios de producto.
 *
 * @param {*} body Contenido recibido.
 * @return {?string} La descripción del primer problema, o null si es válida.
 */
function validateProductRequest(body) {
    if (typeof body?.productId !== 'string' || body.productId.trim() === '') {
        return 'Falta el producto.';
    }

    if (!Array.isArray(body.changes) || body.changes.length === 0 || body.changes.length > 10) {
        return 'Los cambios no son válidos.';
    }

    const hasInvalidChange = body.changes.some((change) =>
        !EDITABLE_FIELDS.includes(change?.field) ||
        !Number.isInteger(change.newValue) ||
        (change.field === 'branchStock' && typeof change.branchId !== 'string')
    );

    return hasInvalidChange ? 'Algún cambio no es válido.' : null;
}

/**
 * Revisa que los valores de un producto, ya con los cambios, sigan siendo
 * válidos. El precio B2B no puede quedar mayor que el B2C.
 *
 * @param {{retailPrice: number, businessPrice: number, businessMinimum: number,
 *     locations: !Array<!Object>}} values Valores resultantes.
 * @return {?string} La descripción del primer problema, o null si son válidos.
 */
function validateProductValues({ retailPrice, businessPrice, businessMinimum, locations }) {
    if (!isWholeNumberBetween(retailPrice, 1, MAX_PRICE) || !isWholeNumberBetween(businessPrice, 1, MAX_PRICE)) {
        return 'Los precios deben ser enteros mayores que 0.';
    }

    if (businessPrice > retailPrice) {
        return 'El precio B2B no puede ser mayor que el precio B2C.';
    }

    if (!isWholeNumberBetween(businessMinimum, 1, MAX_BUSINESS_MINIMUM)) {
        return 'El mínimo B2B no es válido.';
    }

    const hasInvalidStock = locations.some(
        (location) => !isWholeNumberBetween(location.stock, 0, MAX_BRANCH_STOCK)
    );

    return hasInvalidStock ? 'Las unidades por sucursal no son válidas.' : null;
}

/**
 * Obtiene los precios y el mínimo B2B actuales de un producto del índice.
 *
 * @param {!Object} product Producto tal como está en el índice.
 * @return {{retailPrice: number, businessPrice: number, businessMinimum: number}}
 *     Los valores comerciales.
 */
function getCommercialValues(product) {
    const retailPrice = product.b2c?.price ?? product.price ?? 0;

    return {
        retailPrice,
        businessPrice: product.b2b?.price ?? retailPrice,
        businessMinimum: product.b2b?.minimumOrder ?? 1
    };
}

/**
 * Suma las unidades de las sucursales disponibles.
 *
 * @param {!Array<!Object>} locations Inventario por sucursal.
 * @return {number} El stock total.
 */
const sumAvailableStock = (locations) =>
    locations.reduce((total, location) => total + (location.available ? location.stock : 0), 0);

/**
 * Espera a que Algolia publique una tarea de escritura, para que la
 * aplicación lea los valores nuevos al recargar. Si tarda demasiado, sigue
 * sin error: el cambio ya quedó aceptado.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {number} taskId Identificador de la tarea.
 */
async function waitForTask(env, taskId) {
    const taskUrl =
        `https://${env.ALGOLIA_APPLICATION_ID}.algolia.net/1/indexes/` +
        `${encodeURIComponent(env.ALGOLIA_PRODUCTS_INDEX_NAME)}/task/${taskId}`;

    for (let check = 0; check < MAX_TASK_CHECKS; check += 1) {
        const response = await fetch(taskUrl, { headers: createAlgoliaHeaders(env) });
        const task = response.ok ? await response.json() : null;

        if (task?.status === 'published') {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, TASK_CHECK_DELAY_MS));
    }

    console.warn(`La tarea ${taskId} de Algolia no se publicó a tiempo.`);
}

/**
 * Actualiza parcialmente un producto y espera a que el cambio se publique.
 *
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {string} productId Identificador del producto.
 * @param {!Object} attributes Atributos a reemplazar.
 * @throws {Error} Si Algolia no acepta el cambio.
 */
async function updateProduct(env, productId, attributes) {
    const response = await fetch(
        `${getObjectUrl(env, env.ALGOLIA_PRODUCTS_INDEX_NAME, productId)}/partial`,
        {
            method: 'POST',
            headers: createAlgoliaHeaders(env),
            body: JSON.stringify(attributes)
        }
    );

    if (!response.ok) {
        throw new Error(`Algolia respondió ${response.status} al actualizar ${productId}.`);
    }

    const { taskID } = await response.json();
    await waitForTask(env, taskID);
}

/**
 * Aplica los cambios del administrador a un producto: reemplaza los precios,
 * el mínimo B2B y las unidades de las sucursales indicadas, y recalcula el
 * stock total. Antes de guardar revisa que los valores resultantes sigan
 * siendo válidos.
 *
 * @param {!Object} request Petición validada: productId, changes y adminEmail.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @return {!Promise<{status: number, body: !Object}>} El resultado para el cliente.
 */
async function applyProductChanges({ productId, changes, adminEmail }, env) {
    const product = await getObject(env, env.ALGOLIA_PRODUCTS_INDEX_NAME, productId);

    if (!product) {
        return { status: 404, body: { error: 'El producto no existe.' } };
    }

    const nextValues = getCommercialValues(product);
    const locations = (product.locations ?? []).map((location) => ({ ...location }));

    for (const change of changes) {
        if (change.field === 'branchStock') {
            const location = locations.find((candidate) => candidate.locationId === change.branchId);

            if (!location) {
                return { status: 400, body: { error: 'La sucursal no existe en este producto.' } };
            }

            location.stock = change.newValue;
            location.available = change.newValue > 0;
        } else {
            nextValues[change.field] = change.newValue;
        }
    }

    const valuesError = validateProductValues({ ...nextValues, locations });

    if (valuesError) {
        return { status: 400, body: { error: valuesError } };
    }

    const stockQuantity = sumAvailableStock(locations);

    await updateProduct(env, productId, {
        b2c: { ...product.b2c, price: nextValues.retailPrice },
        b2b: { ...product.b2b, price: nextValues.businessPrice, minimumOrder: nextValues.businessMinimum },
        locations,
        stock_quantity: stockQuantity,
        in_stock: stockQuantity > 0
    });

    console.log(`${adminEmail} cambió ${productId}:`, changes);
    return { status: 200, body: { productId } };
}

/**
 * Atiende una petición de cambios de un producto. Solo la acepta con un token
 * válido de administrador.
 *
 * @param {!Request} request Petición recibida, para leer el token.
 * @param {*} body Contenido recibido.
 * @param {!Object<string, string>} env Variables de entorno del Worker.
 * @param {!Object<string, string>} corsHeaders Encabezados CORS.
 * @return {!Promise<!Response>} La respuesta para el cliente.
 */
async function handleProductRequest(request, body, env, corsHeaders) {
    const adminEmail = await verifyAdminToken(request, env);

    if (!adminEmail) {
        return jsonResponse({ error: 'La sesión de administrador no es válida o venció.' }, 401, corsHeaders);
    }

    const validationError = validateProductRequest(body);

    if (validationError) {
        return jsonResponse({ error: validationError }, 400, corsHeaders);
    }

    try {
        const result = await applyProductChanges({ ...body, adminEmail }, env);
        return jsonResponse(result.body, result.status, corsHeaders);
    } catch (error) {
        console.error('No se pudieron guardar los cambios del producto:', error);
        return jsonResponse({ error: 'No se pudo guardar el cambio en Algolia.' }, 502, corsHeaders);
    }
}

export default {
    /**
     * Atiende las peticiones: responde la verificación previa de CORS, envía
     * el inicio de sesión del administrador y los cambios de productos a sus
     * funciones, y guarda en Algolia las órdenes
     * válidas recibidas por POST. Si la orden está confirmada, primero
     * descuenta su stock.
     *
     * @param {!Request} request Petición recibida.
     * @param {!Object<string, string>} env Variables de entorno del Worker.
     * @return {!Promise<!Response>} La respuesta para el cliente.
     */
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        const allowedOrigins = getAllowedOrigins(env);
        const corsHeaders = createCorsHeaders(origin, allowedOrigins);

        if (!origin || !allowedOrigins.includes(origin)) {
            return jsonResponse({ error: 'Origen no permitido.' }, 403, corsHeaders);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Método no permitido.' }, 405, corsHeaders);
        }

        let body;

        try {
            body = await readJsonBody(request);
        } catch (error) {
            const status = error instanceof RangeError ? 413 : 400;
            return jsonResponse({ error: 'El contenido de la petición no es válido.' }, status, corsHeaders);
        }

        const path = new URL(request.url).pathname;

        if (path === '/admin-session') {
            return handleAdminSession(body, env, corsHeaders);
        }

        if (path === '/product-changes') {
            return handleProductRequest(request, body, env, corsHeaders);
        }

        const order = body;

        const validationError = validateOrder(order);

        if (validationError) {
            return jsonResponse({ error: validationError }, 400, corsHeaders);
        }

        let stockDiscounted = false;

        if (order.orderStatus === 'CONFIRMED') {
            try {
                stockDiscounted = await discountStockOnce(order, env);
            } catch (error) {
                // La orden se guarda igual; la aplicación descuenta el stock localmente.
                console.error('No se pudo descontar el stock de la orden:', error);
            }
        }

        try {
            const algoliaResponse = await saveOrder({ ...order, stockDiscounted }, env);

            if (!algoliaResponse.ok) {
                console.error('Algolia rechazó la orden:', algoliaResponse.status, await algoliaResponse.text());
                return jsonResponse({ error: 'No se pudo guardar la orden.' }, 502, corsHeaders);
            }

            return jsonResponse({ orderNumber: order.orderNumber, stockDiscounted }, 200, corsHeaders);
        } catch (error) {
            console.error('No se pudo contactar a Algolia:', error);
            return jsonResponse({ error: 'No se pudo guardar la orden.' }, 502, corsHeaders);
        }
    }
};
