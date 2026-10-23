// Convierte los errores de JSCPP (en inglés y pensados para programadores) en una explicación
// en español para principiantes, con la línea donde ocurrió.
//
//     explicarError(mensaje, codigo) -> { linea, texto }
//
// Funciona en el navegador (window.explicarError) y en Node (require). El intérprete conserva
// sus mensajes en inglés; las pruebas de JSCPP dependen de ellos.
(function () {
  "use strict";

  const OPERADORES_DE_DOS = { "=<": "<=", "=>": ">=", "=!": "!=" };
  const NOMBRES_DE_IOSTREAM = ["cout", "cin", "endl"];

  // Errores de sintaxis: el analizador dice qué esperaba y qué encontró
  function errorDeSintaxis(mensaje, codigo) {
    const pos = /line (\d+) \(column (\d+)\)/.exec(mensaje);
    if (!pos) return null;
    let linea = Number(pos[1]);
    const columna = Number(pos[2]);
    const lineas = codigo.replace(/\r\n/g, "\n").split("\n");
    const texto = lineas[linea - 1] || "";
    const antes = texto.slice(0, columna - 1);
    const esperaba = (/Expected ([\s\S]*?) but /.exec(mensaje) || [])[1] || "";
    const encontro = (/ but ([\s\S]*?) found\.?\s*$/.exec(mensaje) || [])[1] || "";
    const espera = (s) => esperaba.includes(JSON.stringify(s));
    const ref = texto.trim() ? `\n\n    ${texto.trim()}` : "";

    if (encontro === "end of input") {
      return { linea, texto: "El programa se acaba antes de tiempo: falta cerrar una llave }. Revisa que cada { tenga su }." };
    }
    const dos = texto.slice(columna - 2, columna);
    if (OPERADORES_DE_DOS[dos]) {
      return { linea, texto: `«${dos}» no es un operador de C++. ¿Quisiste escribir «${OPERADORES_DE_DOS[dos]}»?` + ref };
    }
    // dentro de unas comillas sin cerrar, lo siguiente que encuentra es el fin del renglón
    if (encontro === JSON.stringify("\n") && /\["\]/.test(esperaba)) {
      return { linea, texto: "Falta cerrar las comillas \" en esta línea." + ref };
    }
    if (espera(")") && encontro === "\"{\"") {
      return { linea, texto: "Falta cerrar un paréntesis ) antes de la {." + ref };
    }
    if (/^\s*(if|while|switch)\s*[^\s(]/.test(texto)) {
      const palabra = /^\s*(\w+)/.exec(texto)[1];
      return { linea, texto: `Después de ${palabra} la condición va entre paréntesis, por ejemplo: ${palabra} (x > 3)` + ref };
    }
    if (/^\s*for\s*\(/.test(texto) && espera(";")) {
      return { linea, texto: "En un for las tres partes se separan con punto y coma, no con coma: for (int i = 0; i < n; i++)" + ref };
    }
    if (espera(";") && !antes.trim() && linea > 1) {
      // el analizador se da cuenta hasta el renglón siguiente
      let anterior = linea - 1;
      while (anterior > 1 && !lineas[anterior - 1].trim()) anterior--;
      return { linea: anterior, texto: `¿Falta un punto y coma (;) al final de la línea ${anterior}?\n\n    ${lineas[anterior - 1].trim()}` };
    }
    if (espera(";")) {
      return { linea, texto: "¿Falta un punto y coma (;) en esta línea?" + ref };
    }
    return { linea, texto: `No entiendo el código de la línea ${linea}. Revisa que esté bien escrito cerca de la columna ${columna}.` + ref };
  }

  // Errores al correr: "línea:columna mensaje"
  const REGLAS = [
    [/index out of bound (-?\d+) >= (\d+)/, (m) =>
      `El índice ${m[1]} se sale del arreglo: tiene ${m[2]} casillas, de la 0 a la ${Number(m[2]) - 1}.`],
    [/negative index (-?\d+)/, (m) =>
      `El índice ${m[1]} es negativo: las casillas de un arreglo empiezan en 0.`],
    [/NaN|uninitialized value/, () =>
      "Se usó una variable que todavía no tiene valor. En C++ tendría basura: dale un valor antes de usarla (por ejemplo, int suma = 0;)."],
    [/division by zero/, () =>
      "División entre cero: en este paso el divisor vale 0."],
    [/variable (\w+) does not exist/, (m) => NOMBRES_DE_IOSTREAM.includes(m[1])
      ? `No existe «${m[1]}»: falta #include <iostream> y using namespace std; al principio.`
      : `No existe la variable «${m[1]}». ¿La declaraste antes de usarla? ¿Está bien escrita? Las mayúsculas cuentan.`],
    [/variable (\w+) already defined/, (m) =>
      `La variable «${m[1]}» ya estaba declarada en este mismo bloque.`],
    [/cannot find library: (.+)/, (m) =>
      `El paso a paso todavía no conoce la biblioteca <${m[1].trim()}>. Con Ejecutar sí funciona.`],
    [/cannot find file: (.+)/, (m) =>
      `No existe el archivo "${m[1].trim()}".`],
    [/function (\w+) ended without returning a value/, (m) =>
      `La función ${m[1]} terminó sin llegar a un return: debe devolver un valor en todos los casos.`],
    [/you cannot return a value from a void function/, () =>
      "Una función void no devuelve nada: usa solo return; o cambia void por el tipo que devuelve."],
    [/the exact result (\S+) is too large/, (m) =>
      `El resultado exacto (${m[1]}) es demasiado grande para el paso a paso, que solo calcula exacto hasta 9007199254740991. Con Ejecutar sí funciona.`],
    [/(?:function|method) (\w+) does not seem to be implemented/, (m) =>
      `La función ${m[1]} está declarada pero no tiene cuerpo { … }.`],
    [/no method (\w+) in .* accepts/, (m) =>
      `La función ${m[1]} no acepta esos argumentos: revisa cuántos le pasas y de qué tipo.`],
    [/is not a left value|only left value/, () =>
      "Ahí se necesita una variable, algo a lo que se le pueda asignar un valor."],
    [/type (.+?) is not defined/, (m) =>
      `El tipo «${m[1]}» no existe, o el paso a paso todavía no lo conoce.`],
    [/does not support (\S+) on/, (m) =>
      `No se puede usar el operador ${m[1]} con esos tipos de datos.`],
    [/Time limit exceeded/, () =>
      "El programa tardó demasiado. ¿Tiene un ciclo infinito?"],
    [/not implemented|unhandled syntax/, () =>
      "El paso a paso todavía no entiende esta parte de C++. Con Ejecutar sí funciona."],
  ];

  function explicarError(mensaje, codigo) {
    mensaje = String(mensaje || "");
    if (/Parsing Failure|Preprocessing Failure/.test(mensaje)) {
      const r = errorDeSintaxis(mensaje, codigo || "");
      if (r) return r;
    }
    const pos = /^(\d+):(\d+) /.exec(mensaje);
    const linea = pos ? Number(pos[1]) : null;
    const sinPosicion = mensaje.replace(/^\d+:\d+ /, "").replace(/^<position unavailable> /, "");
    for (const [patron, explicar] of REGLAS) {
      const m = patron.exec(sinPosicion);
      if (m) return { linea, texto: explicar(m) };
    }
    return { linea, texto: "Error: " + sinPosicion };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = explicarError;
  else window.explicarError = explicarError;
})();
