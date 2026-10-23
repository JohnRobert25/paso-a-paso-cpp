const fs = require("fs");
const JSCPP = require("..");
const codigo = fs.readFileSync(process.argv[2], "utf8");
const lineas = codigo.split("\n");
let salida = "";
const dbg = JSCPP.run(codigo, "", { debug: true, stdio: { write: (s) => { salida += s; } } });
dbg.setStopConditions({ isStatement: true, positionChanged: true, lineChanged: false });
let paso = 0, fin = false;
while (!fin && paso < 100) {
  const nodo = dbg.nextNode();
  if (nodo) {
    // la pila: cada scope de función con sus variables
    const marcos = [];
    for (const s of dbg.rt.scope) {
      if (s.$name.startsWith("function ")) marcos.push({ f: s.$name.slice(9), v: [] });
      if (marcos.length) {
        for (const k of Object.keys(s.variables)) marcos[marcos.length - 1].v.push(k + "=" + dbg.rt.makeValueString(s.variables[k]));
      }
    }
    console.log(`#${paso} L${nodo.sLine} ${lineas[nodo.sLine - 1].trim().padEnd(28)} ${marcos.map(m => m.f + "(" + m.v.join(",") + ")").join(" > ")}`);
  }
  fin = dbg.next() !== false;
  paso++;
}
console.log("salida", JSON.stringify(salida));
