/**
 * @fileoverview Carga los productos de data/products.json en el índice de Algolia.
 * Requiere ALGOLIA_APP_ID y ALGOLIA_ADMIN_API_KEY en .env.local.
 * Uso: npm run seed-algolia
 */

import { seedAlgoliaIndex } from "./lib/seedAlgoliaIndex.mjs";

await seedAlgoliaIndex("products", "products.json");
