// Prueba el depurador de JSCPP: imprime cada paso con su línea y las variables.
// Uso: node paso-a-paso.js programa.cpp [entrada.in] [maxPasos]
const fs = require("fs");
const JSCPP = require("..");

const codigo = fs.readFileSync(process.argv[2], "utf8");
const entrada = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : "";
const maxPasos = Number(process.argv[4] || 200);
const lineas = codigo.split("\n");

let salida = "";
const dbg = JSCPP.run(codigo, entrada, {
  debug: true,
  stdio: { write: (s) => { salida += s; } },
});

function variables() {
  const vars = dbg.variable();
  return vars.map((v) => `${v.name}=${JSON.stringify(v.value)}`).join(" ");
}

let paso = 0;
let fin = false;
while (!fin && paso < maxPasos) {
  const nodo = dbg.nextNode();
  if (nodo) {
    const pila = dbg.rt.scope.filter((s) => s.$name.includes("function")).map((s) => s.$name.replace(/^function /, "")).join(" > ");
    console.log(`#${String(paso).padStart(3)} L${String(nodo.sLine).padStart(2)} | ${lineas[nodo.sLine - 1].trim().padEnd(40)} | ${variables()}  [${pila}]  salida=${JSON.stringify(salida)}`);
  }
  fin = dbg.next() !== false;
  paso++;
}
console.log(fin ? `Terminó. Salida: ${JSON.stringify(salida)}` : `Cortado en ${maxPasos} pasos`);
