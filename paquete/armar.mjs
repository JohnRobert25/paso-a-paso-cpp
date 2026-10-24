// Arma el paquete para la app y la página de prueba (npm run para-la-app):
//   1. compila el intérprete (TypeScript y la gramática) a lib/
//   2. junta en un solo código el Worker: intérprete + pasos.js + mensajes.js
//   3. lo mete dentro de index.js, que es lo único que carga la app
// Solo entra lo que esos archivos usan: las pruebas y la página de prueba se quedan fuera.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aqui = (...p) => path.join(raiz, ...p);

execFileSync(process.execPath, [aqui("node_modules/grunt-cli/bin/grunt"), "clean", "peg", "copy", "ts"], { cwd: raiz, stdio: "inherit" });

// JSCPP pide util y stream de Node, que en el navegador no hacen falta
const vacio = aqui("paquete/vacio-node.js");
const worker = await esbuild.build({
  entryPoints: [aqui("paquete/worker.js")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: "es2020",
  alias: { util: vacio, stream: vacio },
  legalComments: "none",
});
const define = { CODIGO_WORKER: JSON.stringify(worker.outputFiles[0].text) };
const comun = { entryPoints: [aqui("paquete/index.js")], bundle: true, minify: true, platform: "browser", target: "es2020", define };

mkdirSync(aqui("paquete/dist"), { recursive: true });
// la app: un módulo con export { prepararPasos }
await esbuild.build({ ...comun, format: "esm", outfile: aqui("paquete/dist/paso-a-paso.js") });
copyFileSync(aqui("paquete/paso-a-paso.d.ts"), aqui("paquete/dist/paso-a-paso.d.ts"));
copyFileSync(aqui("LICENSE"), aqui("paquete/dist/LICENSE-JSCPP.txt"));
// la página de prueba: un <script> normal (window.PasoAPaso), que también abre desde file://
await esbuild.build({ ...comun, format: "iife", globalName: "PasoAPaso", outfile: aqui("pagina/paso-a-paso-lib.js") });

const archivo = aqui("paquete/dist/paso-a-paso.js");
const kb = (n) => Math.round(n / 1024) + " KB";
console.log(`\npaquete/dist/paso-a-paso.js: ${kb(statSync(archivo).size)} (${kb(gzipSync(readFileSync(archivo)).length)} comprimido)`);
console.log("Para la app: copiar todo paquete/dist/ a src/lib/paso-a-paso/");
