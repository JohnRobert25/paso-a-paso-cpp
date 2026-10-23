// Corre un programa con JSCPP: node correr-jscpp.js programa.cpp [entrada.in]
const fs = require("fs");
const JSCPP = require("..");

const codigo = fs.readFileSync(process.argv[2], "utf8");
const entrada = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : "";

let salida = "";
try {
  const codigoSalida = JSCPP.run(codigo, entrada, {
    stdio: { write: (s) => { salida += s; } },
    maxTimeout: 20000,
  });
  process.stdout.write(salida);
  process.exitCode = codigoSalida === 0 ? 0 : 3;
} catch (e) {
  process.stdout.write(salida);
  process.stderr.write(String(e.message || e).split("\n").slice(0, 4).join("\n"));
  process.exitCode = 2;
}
