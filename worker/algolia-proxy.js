/**
 * @fileoverview Cloudflare Worker que guarda órdenes en el índice de órdenes
 * de Algolia y, cuando una orden se confirma, descuenta su stock en el índice
 * de productos. Existe para que la clave de escritura nunca llegue al
 * navegador: la aplicación envía la orden aquí y el Worker la valida y la
 * guarda con la clave almacenada como secreto de Cloudflare.
 *
 * Variables de entorno:
 *   ALGOLIA_APPLICATION_ID: identificador de la aplicación de Algolia.
 *   ALGOLIA_ORDERS_INDEX_NAME: nombre del índice de órdenes.
 *   ALGOLIA_PRODUCTS_INDEX_NAME: nombre del índice de productos.
 *   ALGOLIA_WRITE_API_KEY: clave con permiso de lectura y escritura sobre
 *       ambos índices (secreto).
 *   ALLOWED_ORIGINS: orígenes permitidos, separados por comas.
 */

/** Tamaño máximo aceptado para el cuerpo de una petición, en bytes. */
const MAX_BODY_BYTES = 50_000;

/** Formato del número de orden: ORD-AAAAMMDD-XXXXXX. */
const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[A-Z0-9]{6}$/;

/** Unidades máximas de un producto en una orden, para limitar abusos. */
const MAX_UNITS_PER_ITEM = 100;

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
        'Access-Control-Allow-Headers': 'Content-Type',
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

export default {
    /**
     * Atiende las peticiones: responde la verificación previa de CORS y
     * guarda en Algolia las órdenes válidas recibidas por POST. Si la orden
     * está confirmada, primero descuenta su stock.
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

        let order;

        try {
            order = await readJsonBody(request);
        } catch (error) {
            const status = error instanceof RangeError ? 413 : 400;
            return jsonResponse({ error: 'El contenido de la petición no es válido.' }, status, corsHeaders);
        }

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
