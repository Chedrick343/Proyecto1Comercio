/**
 * @fileoverview Prepara el build para GitHub Pages. Copia index.html como 404.html para
 * que las rutas del cliente (por ejemplo, /producto/123) carguen la
 * aplicación al abrirse directamente.
 */

import { copyFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');