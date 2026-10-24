// Muestra en la terminal los mismos pasos que ve el alumno: usa paquete/pasos.js, igual que la app.
// Uso: node paso-a-paso.js programa.cpp [entrada.in] [maxPasos]
const fs = require("fs");
const { calcularPasos } = require("../paquete/pasos.js");

const codigo = fs.readFileSync(process.argv[2], "utf8");
const entrada = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : "";
const maxPasos = Number(process.argv[4] || 500);
const lineas = codigo.split(/\r?\n/);

const r = calcularPasos(codigo, entrada, { maxPasos });
if (r.tipo === "error") {
  console.log(`${r.linea ? `Error en la línea ${r.linea}` : "Error"}: ${r.texto}`);
  process.exit(1);
}

// la pila de llamadas: main(x=6) > fact(n=3); una referencia dice a quién se refiere
const pila = (marcos) => marcos
  .map((m) => `${m.funcion}(${m.vars.map((v) => `${v.nombre}${v.ref ? `→${v.ref}` : ""}=${v.valor}`).join(", ")})`)
  .join(" > ");

let escrito = "";
for (const [i, p] of r.pasos.entries()) {
  if (p.salida.length > escrito.length) {
    console.log(`           escribe: ${JSON.stringify(p.salida.slice(escrito.length))}`);
    escrito = p.salida;
  }
  if (i === r.pasos.length - 1) break;
  console.log(`Paso ${String(i + 1).padStart(3)}  línea ${String(p.linea).padStart(2)}:  ${lineas[p.linea - 1].trim()}`);
  console.log(`           ${pila(p.marcos)}`);
}
const fin = r.pasos[r.pasos.length - 1];
if (fin.error) console.log(`\n${fin.linea ? `Error en la línea ${fin.linea}` : "Error"}: ${fin.error}`);
else if (fin.cortado) console.log(`\nSe cortó en ${r.pasos.length - 1} pasos.`);
else console.log(`\nTerminó en ${r.pasos.length - 1} pasos (return ${fin.codigoSalida}). Salida completa:\n${fin.salida}`);
