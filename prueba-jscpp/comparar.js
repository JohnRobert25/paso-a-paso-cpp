// Corre cada caso de casos.txt con g++ y con JSCPP y compara las salidas.
// Uso: node comparar.js
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const dir = path.join(__dirname, "casos");
fs.mkdirSync(dir, { recursive: true });

const casos = fs.readFileSync(path.join(__dirname, "casos.txt"), "utf8")
  .split(/^=== /m).filter(Boolean)
  .map((bloque) => {
    const [encabezado, ...resto] = bloque.split("\n");
    const [nombre, etapa] = encabezado.split("|").map((s) => s.trim());
    const [codigo, entrada = ""] = resto.join("\n").split(/^--- in\n/m);
    return { nombre, etapa, codigo, entrada };
  });

const resultados = [];
for (const c of casos) {
  const cpp = path.join(dir, c.nombre + ".cpp");
  const inp = path.join(dir, c.nombre + ".in");
  const exe = path.join(dir, c.nombre + ".exe");
  fs.writeFileSync(cpp, c.codigo);
  fs.writeFileSync(inp, c.entrada);

  const comp = spawnSync("g++", ["-std=c++17", "-O0", "-o", exe, cpp], { encoding: "utf8" });
  if (comp.status !== 0) {
    resultados.push({ ...c, estado: "g++ no compila", detalle: comp.stderr.split("\n")[0] });
    continue;
  }
  const real = spawnSync(exe, [], { input: c.entrada, encoding: "utf8" }).stdout.replace(/\r\n/g, "\n");

  const t0 = Date.now();
  const js = spawnSync("node", [path.join(__dirname, "correr-jscpp.js"), cpp, inp], { encoding: "utf8", timeout: 30000 });
  const ms = Date.now() - t0;

  let estado, detalle = "";
  if (js.error) {
    estado = "se colgó";
  } else if (js.status === 2) {
    estado = "error";
    detalle = js.stderr.trim().split("\n")[0];
  } else if (js.stdout === real) {
    estado = "igual";
  } else {
    estado = "distinto";
    detalle = `g++: ${JSON.stringify(real)}  JSCPP: ${JSON.stringify(js.stdout)}`;
  }
  resultados.push({ ...c, estado, detalle, ms });
}

for (const r of resultados) {
  console.log(`${r.estado.padEnd(9)} etapa ${r.etapa.padEnd(7)} ${r.nombre.padEnd(26)} ${r.ms ?? ""}ms  ${r.detalle ?? ""}`);
}
const iguales = resultados.filter((r) => r.estado === "igual").length;
console.log(`\n${iguales} de ${resultados.length} iguales a g++`);
fs.writeFileSync(path.join(__dirname, "resultados.json"), JSON.stringify(resultados.map(({ codigo, entrada, ...r }) => r), null, 2));
