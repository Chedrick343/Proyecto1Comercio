/**
 * @fileoverview Carga los productos de data/products.json en el índice de
 * productos de Algolia, el mismo que consulta la tienda.
 * Requiere ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY y VITE_ALGOLIA_INDEX_NAME
 * en .env.local.
 * Uso: npm run seed-algolia
 */

import { seedAlgoliaIndex } from "./lib/seedAlgoliaIndex.mjs";

await seedAlgoliaIndex(process.env.VITE_ALGOLIA_INDEX_NAME, "products.json");
