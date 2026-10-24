// Corre en un hilo aparte del navegador: recibe el código y la entrada, calcula todos los pasos
// y los regresa. Mientras tanto la página sigue respondiendo.
const { calcularPasos } = require("./pasos.js");

self.onmessage = (e) => {
  const { codigo, entrada, limites } = e.data;
  let resultado;
  try {
    resultado = calcularPasos(codigo, entrada, limites);
  } catch (err) {
    // una falla del intérprete mismo, no del programa del alumno
    resultado = { tipo: "error", linea: null, texto: "El paso a paso falló por dentro: " + (err && err.message || err) };
  }
  self.postMessage(resultado);
};
