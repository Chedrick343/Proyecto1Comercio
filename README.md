# POST: tienda de joyería y relojería

Proyecto del curso IC8063 Comercio Electrónico (Instituto Tecnológico de Costa Rica), grupo 2. Es una tienda en línea con catálogo, carrito, checkout con pago simulado y, desde el Proyecto III, un entorno B2B con roles, precios por tipo de cliente, inventario por sucursal y panel administrativo.

- **Aplicación:** https://chedrick343.github.io/Proyecto1Comercio/
- **Repositorio:** https://github.com/Chedrick343/Proyecto1Comercio

## Funcionalidades

- **Catálogo:** búsqueda y filtros con Algolia, detalle de producto y recomendaciones.
- **Compra:** carrito por usuario, checkout en tres pasos y servicio de pago Sandbox con escenarios de aprobación, rechazo y error.
- **Roles:** invitado, cliente B2C, cliente B2B y administrador, con permisos definidos en `src/session/permissions.ts`.
- **Precios B2B:** el cliente B2B compra con precio de empresa y debe cumplir la compra mínima de cada producto.
- **Multi-inventario:** cuatro sucursales (San José, Alajuela, Cartago y Limón); la sucursal se elige en el checkout y se valida su disponibilidad.
- **Órdenes:** registran comprador, sucursal y condiciones comerciales, y se guardan en Algolia.
- **Panel administrativo:** consulta de órdenes, productos e inventario, edición de precios, mínimo B2B y stock, y métricas de uso.

## Arquitectura

| Componente | Responsabilidad |
|---|---|
| React + TypeScript (Vite) | Interfaz, publicada en GitHub Pages |
| Algolia `grupo-02_products` | Catálogo, precios e inventario por sucursal |
| Algolia `grupo-02_users` | Usuarios, roles y hash SHA-256 de las contraseñas |
| Algolia `grupo-02_orders` | Órdenes de compra |
| Cloudflare Worker (`worker/algolia-proxy.js`) | Único punto que escribe en Algolia: guarda órdenes, descuenta stock y aplica los cambios del administrador validando su token |
| localStorage | Sesión, carritos, sucursal elegida y copia local de las órdenes |

La clave de escritura de Algolia solo existe como secreto del Worker; el navegador usa la clave pública de búsqueda.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente B2C | cliente@post.cr | Cliente2026! |
| Cliente B2B (Joyería Aurora S.A.) | compras@joyeriaaurora.cr | Empresa2026! |
| Administrador | admin@post.cr | Admin2026! |
| Sin rol válido (prueba de error) | sinrol@post.cr | SinRol2026! |

También se puede comprar como invitado.

## Ejecución local

```bash
npm install
npm run dev
```

`.env.local` define el identificador de la aplicación de Algolia, la clave pública de búsqueda, los nombres de los tres índices (`VITE_ALGOLIA_INDEX_NAME`, `VITE_ALGOLIA_USERS_INDEX_NAME`, `VITE_ALGOLIA_ORDERS_INDEX_NAME`) y la URL del Worker (`VITE_ORDERS_WORKER_URL`).

| Script | Uso |
|---|---|
| `npm run build` | Compila la aplicación |
| `npm run lint` | Revisa el código con oxlint |
| `npm run deploy` | Publica en GitHub Pages |
| `npm run seed-algolia` / `npm run seed-users` | Cargan `data/products.json` y `data/users.json` en Algolia. Requieren `ALGOLIA_APP_ID` y `ALGOLIA_ADMIN_API_KEY` en el entorno local; esas claves no se suben al repositorio |

`data/orders.json` contiene órdenes de ejemplo con la estructura del índice de órdenes.

## Cloudflare Worker

El código está en `worker/algolia-proxy.js` y se despliega manualmente en Cloudflare. Variables: `ALGOLIA_APPLICATION_ID`, `ALGOLIA_PRODUCTS_INDEX_NAME`, `ALGOLIA_USERS_INDEX_NAME`, `ALGOLIA_ORDERS_INDEX_NAME` y `ALLOWED_ORIGINS`; secretos: `ALGOLIA_WRITE_API_KEY` y `ADMIN_TOKEN_SECRET`.

## Equipo

- Roymar Castillo Carvajal
- Sergio Montoya Badilla
- Chedrick Uzaga López
