/**
 * @fileoverview Carga los usuarios iniciales de data/users.json en el índice de
 * usuarios de Algolia. Las contraseñas se guardan solo como hash SHA-256.
 * Requiere ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY y VITE_ALGOLIA_USERS_INDEX_NAME
 * en .env.local.
 * Uso: npm run seed-users
 */

import { seedAlgoliaIndex } from "./lib/seedAlgoliaIndex.mjs";

await seedAlgoliaIndex(process.env.VITE_ALGOLIA_USERS_INDEX_NAME, "users.json");
