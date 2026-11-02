/**
 * @fileoverview Carga de un archivo JSON en un índice de Algolia, compartida
 * por los scripts de carga inicial.
 * Requiere ALGOLIA_APP_ID y ALGOLIA_ADMIN_API_KEY en .env.local.
 */

import { algoliasearch } from "algoliasearch";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Carpeta data/ en la raíz del proyecto. */
const DATA_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../data");

/**
 * Guarda en un índice los registros de un archivo de data/. Los registros
 * existentes con el mismo objectID se reemplazan.
 *
 * @param {string | undefined} indexName Índice de destino.
 * @param {string} fileName Archivo JSON dentro de data/ con un arreglo de registros.
 * @throws {Error} Si faltan variables de entorno o Algolia rechaza la carga.
 */
export async function seedAlgoliaIndex(indexName, fileName) {
  const appId = process.env.ALGOLIA_APP_ID;
  const adminApiKey = process.env.ALGOLIA_ADMIN_API_KEY;

  if (!appId || !adminApiKey || !indexName) {
    throw new Error("Faltan ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY o el nombre del índice en .env.local");
  }

  const records = JSON.parse(await readFile(path.join(DATA_DIRECTORY, fileName), "utf-8"));
  const client = algoliasearch(appId, adminApiKey);

  console.log(`Indexando ${records.length} registros de ${fileName} en ${indexName}...`);

  try {
    await client.saveObjects({ indexName, objects: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`Algolia rechazó la carga: ${message}`);
  }

  console.log("Registros indexados correctamente.");
}
