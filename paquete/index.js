// Lo que usa la app: prepararPasos corre el programa en un Worker (un hilo aparte) y regresa todos
// los pasos de una vez. El código del Worker va dentro de este archivo (CODIGO_WORKER lo pone
// armar.mjs), así que no hace falta configurar nada en la app ni servir otro archivo.
// "v0.1.0", o con el commit si se armó fuera de una etiqueta: "v0.1.0 (git v0.1.0-2-gabc1234)"
export const VERSION = VERSION_PAQUETE;

let urlWorker = null;

export function prepararPasos(codigo, entrada, limites = {}) {
  if (!urlWorker) {
    urlWorker = URL.createObjectURL(new Blob([CODIGO_WORKER], { type: "text/javascript" }));
  }
  const worker = new Worker(urlWorker);
  let terminar;
  const resultado = new Promise((resolver) => {
    terminar = (r) => {
      worker.terminate();
      resolver(r);
    };
    worker.onmessage = (e) => terminar(e.data);
    worker.onerror = (e) => {
      e.preventDefault();
      terminar({ tipo: "error", linea: null, texto: "El paso a paso falló por dentro: " + (e.message || "error desconocido") });
    };
  });
  worker.postMessage({ codigo, entrada, limites });
  return {
    resultado,
    // si ya terminó no hace nada
    cancelar: () => terminar({ tipo: "cancelado" }),
  };
}
