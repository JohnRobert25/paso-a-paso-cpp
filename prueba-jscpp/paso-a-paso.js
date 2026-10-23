// Corre un programa paso a paso con el depurador de JSCPP y muestra cada paso:
// la línea, las variables de cada llamada y lo que se ha escrito.
// Uso: node paso-a-paso.js programa.cpp [entrada.in] [maxPasos]
const fs = require("fs");
const JSCPP = require("..");
const explicarError = require("../pagina/mensajes.js");

const codigo = fs.readFileSync(process.argv[2], "utf8");
const entrada = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : "";
const maxPasos = Number(process.argv[4] || 500);
const lineas = codigo.split(/\r?\n/);

function mostrarError(e) {
  const { linea, texto } = explicarError(e.message, codigo);
  console.log(`\n${linea ? `Error en la línea ${linea}` : "Error"}: ${texto}`);
}

let salida = "";
let dbg;
try {
  dbg = JSCPP.run(codigo, entrada, {
    debug: true,
    stdio: { write: (s) => { salida += s; } },
  });
} catch (e) {
  // no se pudo leer el programa (error de sintaxis, biblioteca que falta)
  mostrarError(e);
  process.exit(1);
}
// detenerse una vez por instrucción, no en cada parte de una expresión
dbg.setStopConditions({ isStatement: true, positionChanged: true, lineChanged: false });

function valor(v) {
  const texto = dbg.rt.makeValueString(v);
  return texto === "NaN" ? "?" : texto;
}

// la pila de llamadas: main(x=6) > fact(n=3)
function pila() {
  const marcos = [];
  for (const ambito of dbg.rt.scope) {
    if (ambito.$name.startsWith("function ")) marcos.push({ nombre: ambito.$name.slice(9), vars: [] });
    if (!marcos.length) continue;
    for (const [nombre, v] of Object.entries(ambito.variables)) {
      marcos[marcos.length - 1].vars.push(`${nombre}=${valor(v)}`);
    }
  }
  return marcos.map((m) => `${m.nombre}(${m.vars.join(", ")})`).join(" > ");
}

let paso = 0;
let escrito = 0;
let fin = false;
let anterior = "";
try {
  while (!fin && paso < maxPasos) {
    const nodo = dbg.nextNode();
    // el depurador se detiene en varias partes de una misma línea; si nada cambió, es el mismo paso
    const estado = nodo && `${nodo.sLine}|${pila()}`;
    if (nodo && estado !== anterior) {
      paso++;
      console.log(`Paso ${String(paso).padStart(3)}  línea ${String(nodo.sLine).padStart(2)}:  ${lineas[nodo.sLine - 1].trim()}`);
      console.log(`           ${pila()}`);
      anterior = estado;
    }
    fin = dbg.next() !== false;
    if (salida.length > escrito) {
      console.log(`           escribe: ${JSON.stringify(salida.slice(escrito))}`);
      escrito = salida.length;
    }
  }
  console.log(fin ? `\nTerminó en ${paso} pasos. Salida completa:\n${salida}` : `\nSe cortó en ${maxPasos} pasos.`);
} catch (e) {
  mostrarError(e);
}
