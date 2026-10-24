// Corre todos los programas del curso de entrenamiento-osi-cpp con g++ y con este JSCPP y los compara:
// las soluciones de los problemas (con sus ejemplos), los programas de las lecciones y los de la Referencia.
// Solo lee el contenido de la app; no cambia nada en ella.
//
//     node prueba-jscpp/curso.mts [carpeta de entrenamiento-osi-cpp] [--pasos]
//
// Con --pasos corre cada programa como el paso a paso de la app (paquete/pasos.js, con sus límites)
// y compara la salida del último paso.
//
// Deja el detalle en prueba-jscpp/resultados-curso.json.

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const argumentos = process.argv.slice(2);
const comoPasos = argumentos.includes("--pasos");
const carpeta = argumentos.find((a) => a !== "--pasos");
const app = path.resolve(carpeta || path.join(aqui, "..", "..", "..", "entrenamiento-osi-cpp"));
const contenido = (archivo: string) => import(pathToFileURL(path.join(app, "src", "contenido", archivo)).href);

const { CURSO } = await contenido("curso.ts");
const { EJEMPLOS } = await contenido("ejemplos.ts");
const { INSTRUCCIONES } = await contenido("instrucciones.ts");
const { BLOQUES } = await contenido("bloques.ts");
const requerir = createRequire(import.meta.url);
const JSCPP = requerir("..");
const { calcularPasos } = requerir("../paquete/pasos.js");

type Prueba = { tema: string; nombre: string; codigo: string; entrada: string };
const pruebas: Prueba[] = [];
const programas = (bloques: any[]) => bloques.filter((b) => typeof b === "object" && "code" in b && !b.fragmento);

for (const t of CURSO.temas) {
  for (const p of t.problemas) {
    for (const [i, ej] of (EJEMPLOS[p.alias] || []).entries()) {
      pruebas.push({ tema: t.id, nombre: `problema ${p.alias} ej${i + 1}`, codigo: p.solucion, entrada: ej.entrada });
    }
  }
  for (const l of t.lecciones) {
    for (const [i, b] of programas(l.bloques).entries()) {
      pruebas.push({ tema: t.id, nombre: `lección ${l.id} #${i + 1}`, codigo: b.code, entrada: b.entrada ?? "" });
    }
  }
}
for (const f of [...INSTRUCCIONES, ...BLOQUES]) {
  for (const [i, b] of programas(f.bloques).entries()) {
    pruebas.push({ tema: f.leccion?.tema ?? "referencia", nombre: `referencia ${f.id} #${i + 1}`, codigo: b.code, entrada: b.entrada ?? "" });
  }
}

// g++ con las mismas opciones que Compiler Explorer en la app; los ejecutables se guardan para no recompilar
const cache = path.join(aqui, ".cache-curso");
fs.mkdirSync(cache, { recursive: true });
function gpp(codigo: string, entrada: string) {
  const id = createHash("sha1").update(codigo).digest("hex").slice(0, 16);
  const exe = path.join(cache, id + ".exe");
  if (!fs.existsSync(exe)) {
    fs.writeFileSync(path.join(cache, id + ".cpp"), codigo);
    const c = spawnSync("g++", ["-O2", "-std=c++17", "-o", exe, path.join(cache, id + ".cpp")], { encoding: "utf8" });
    if (c.status !== 0) return { error: "g++ no compila: " + c.stderr.split("\n")[0] };
  }
  const r = spawnSync(exe, [], { input: entrada, encoding: "utf8", timeout: 10000 });
  return { salida: (r.stdout || "").replace(/\r\n/g, "\n") };
}

function jscpp(codigo: string, entrada: string) {
  if (comoPasos) {
    const r = calcularPasos(codigo, entrada);
    if (r.tipo === "error") return { salida: "", error: r.texto };
    const fin = r.pasos[r.pasos.length - 1];
    if (fin.cortado) return { salida: fin.salida, error: `cortado: más de ${r.pasos.length - 1} pasos o del límite de operaciones` };
    return { salida: fin.salida, error: fin.error || undefined };
  }
  let salida = "";
  try {
    JSCPP.run(codigo, entrada, { stdio: { write: (s: string) => { salida += s; } }, maxTimeout: 10000 });
    return { salida };
  } catch (e: any) {
    return { salida, error: String(e.message || e) };
  }
}

// como en las lecciones: renglón por renglón, sin espacios al final
const renglones = (s: string) => s.split("\n").map((l) => l.trimEnd()).join("\n").trim();

// Agrupa los errores por causa: para los de sintaxis, el renglón donde se atoró el analizador
function causa(error: string, codigo: string) {
  const sintaxis = /Parsing Failure:\s*line (\d+) \(column (\d+)\)/.exec(error);
  if (sintaxis) {
    const renglon = codigo.split("\n")[Number(sintaxis[1]) - 1] ?? "";
    return "no lo entiende: " + renglon.trim();
  }
  return error.split("\n")[0].replace(/^\d+:\d+ /, "").replace(/<position unavailable> /, "");
}

const resultados: any[] = [];
for (const p of pruebas) {
  const real = gpp(p.codigo, p.entrada);
  if (real.error) { resultados.push({ ...p, estado: "g++ falla", detalle: real.error }); continue; }
  const inicio = Date.now();
  const js = jscpp(p.codigo, p.entrada);
  const ms = Date.now() - inicio;
  let estado = "igual", detalle = "";
  if (js.error) { estado = "error"; detalle = causa(js.error, p.codigo); }
  else if (renglones(js.salida) !== renglones(real.salida!)) {
    estado = "distinto";
    detalle = `g++: ${JSON.stringify(real.salida)}  JSCPP: ${JSON.stringify(js.salida)}`;
  }
  resultados.push({ tema: p.tema, nombre: p.nombre, estado, detalle, ms });
}

// Resumen por tema
const temas = [...new Set(resultados.map((r) => r.tema))];
console.log("Tema               iguales  error  distinto  total");
for (const t of temas) {
  const deTema = resultados.filter((r) => r.tema === t);
  const n = (e: string) => deTema.filter((r) => r.estado === e).length;
  console.log(`${t.padEnd(18)} ${String(n("igual")).padStart(7)} ${String(n("error")).padStart(6)} ${String(n("distinto")).padStart(9)} ${String(deTema.length).padStart(6)}`);
}
const n = (e: string) => resultados.filter((r) => r.estado === e).length;
console.log(`${"TOTAL".padEnd(18)} ${String(n("igual")).padStart(7)} ${String(n("error")).padStart(6)} ${String(n("distinto")).padStart(9)} ${String(resultados.length).padStart(6)}`);

const distintos = resultados.filter((r) => r.estado === "distinto");
if (distintos.length) {
  console.log("\nSALIDA DISTINTA (lo más grave):");
  for (const r of distintos) console.log(`  ${r.tema} / ${r.nombre}\n     ${r.detalle}`);
}

const porCausa = new Map<string, any[]>();
for (const r of resultados.filter((r) => r.estado === "error")) {
  if (!porCausa.has(r.detalle)) porCausa.set(r.detalle, []);
  porCausa.get(r.detalle)!.push(r);
}
console.log("\nERRORES POR CAUSA (cuántos programas, en qué temas):");
for (const [c, rs] of [...porCausa].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(rs.length).padStart(3)}  ${c.slice(0, 110)}   [${[...new Set(rs.map((r) => r.tema))].join(", ")}]`);
}
const fallasGpp = resultados.filter((r) => r.estado === "g++ falla");
if (fallasGpp.length) console.log(`\n${fallasGpp.length} programas no compilaron con g++ (no cuentan):`, fallasGpp.map((r) => r.nombre).join(", "));

if (!comoPasos) fs.writeFileSync(path.join(aqui, "resultados-curso.json"), JSON.stringify(resultados, null, 2));
