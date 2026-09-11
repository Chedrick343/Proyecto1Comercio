import { algoliasearch } from "algoliasearch";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ubicación de products.json
const productsPath = path.join(
  __dirname,
  "../data/products.json"
);

// Leer productos
const products = JSON.parse(
  await readFile(productsPath, "utf-8")
);

// Variables de entorno
const appId = process.env.ALGOLIA_APP_ID;
const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;

const indexName = "grupo-03_products";

if (!appId || !adminApiKey) {
  throw new Error(
    "Faltan ALGOLIA_APP_ID o ALGOLIA_ADMIN_API_KEY en .env.local"
  );
}

// Cliente de Algolia
const client = algoliasearch(
  appId,
  adminApiKey
);

console.log(`Indexando ${products.length} productos...`);
console.log(`Índice: ${indexName}`);

await client.saveObjects({
  indexName,
  objects: products,
});

console.log("Productos indexados correctamente.");