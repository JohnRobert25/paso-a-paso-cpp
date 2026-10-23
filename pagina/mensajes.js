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
    [/string index (-?\d+) out of range: size (\d+)/, (m) => Number(m[2]) === 0
      ? `La posición ${m[1]} no existe: la cadena está vacía.`
      : `La posición ${m[1]} se sale de la cadena: tiene ${m[2]} letras, de la 0 a la ${Number(m[2]) - 1}.`],
    [/(\w+): position (-?\d+) is past the end of the string \(size (\d+)\)/, (m) =>
      `En ${m[1]}, la posición ${m[2]} está después del final de la cadena, que tiene ${m[3]} letras.`],
    [/(pop_back|back|front) on an empty string/, (m) =>
      `La cadena está vacía: ${m[1] === "pop_back" ? "no hay letra que quitar" : `no tiene ${m[1] === "back" ? "última" : "primera"} letra`}.`],
    [/reference (\w+) needs a variable, not the value (.+)/, (m) =>
      `«${m[1]}» es una referencia (&): hay que darle una variable, no un valor como ${m[2]}.`],
    [/reference (\w+) needs a variable to refer to/, (m) =>
      `«${m[1]}» es una referencia (&): hay que decir a qué variable se refiere, por ejemplo int &${m[1]} = x;`],
    [/reference (\w+) of type (.+) cannot refer to a variable of type (.+)/, (m) =>
      `La referencia «${m[1]}» es de tipo ${m[2]} y no puede ser otro nombre de una variable de tipo ${m[3]}.`],
    [/(min|max) needs two values of the same type, not (.+) and (.+)/, (m) =>
      `${m[1]} necesita dos valores del mismo tipo, pero recibió ${m[2]} y ${m[3]}. Por ejemplo, si x es long long, escribe ${m[1]}(x, 0LL) en vez de ${m[1]}(x, 0).`],
    [/(min|max) takes two values/, (m) =>
      `${m[1]} compara dos valores: ${m[1]}(a, b).`],
    [/the comparison function is not valid for sort/, () =>
      "La función de comparación de sort debe usar < o >, nunca <= ni >=: cuando dos valores son iguales tiene que responder false."],
    [/the comparison function must return true or false/, () =>
      "La función de comparación debe devolver true o false (bool)."],
    [/(\w+) needs a range such as/, (m) =>
      `${m[1]} necesita un rango: el principio y el final, como ${m[1]}(a, a + n) o ${m[1]}(s.begin(), s.end()).`],
    [/(\w+): the range \[(-?\d+), (-?\d+)\) goes outside the array of (\d+) elements/, (m) =>
      `${m[1]}: el rango de la casilla ${m[2]} a la ${m[3]} se sale del arreglo, que tiene ${m[4]} casillas.`],
    [/(\w+): the range ends \((-?\d+)\) before it begins \((-?\d+)\)/, (m) =>
      `${m[1]}: el rango termina (${m[2]}) antes de empezar (${m[3]}). ¿Pusiste el final primero?`],
    [/(\w+): the beginning and the end of the range are in different arrays/, (m) =>
      `${m[1]}: el principio y el final del rango son de arreglos distintos.`],
    [/(\w+): the third argument must be a comparison function/, (m) =>
      `${m[1]}: lo tercero debe ser una función de comparación, como ${m[1]}(a, a + n, antes).`],
    [/(sto\w+): "(.*)" does not start with a number/, (m) =>
      `${m[1]} no encontró un número al principio de "${m[2]}".`],
    [/(sto\w+): (\S+) does not fit in (.+)/, (m) =>
      `${m[1]}: el número ${m[2]} no cabe en un ${m[3]}.`],
    [/swap needs two variables of the same type, not (.+) and (.+)/, (m) =>
      `swap necesita dos variables del mismo tipo, pero recibió ${m[1]} y ${m[2]}.`],
    [/swap needs two variables/, () =>
      "swap intercambia dos variables: swap(a, b)."],
    [/auto needs an initial value/, () =>
      "Con auto hay que dar un valor inicial, para saber de qué tipo es: auto x = 5;"],
    [/cannot go through the elements of (.+) with for \( : \)/, (m) =>
      `No se puede recorrer un ${m[1]} con for ( : ). Funciona con arreglos y cadenas.`],
    [/(\S+) has no member (\w+)/, (m) =>
      `${m[1]} no tiene ningún «${m[2]}».${m[1].startsWith("pair") ? " Un pair tiene first y second." : ""}`],
    [/a string cannot be compared with (\S+) to (.+)/, (m) =>
      `Una cadena no se puede comparar con ${m[1]} contra un ${m[2]}.${m[2] === "char" ? " Para un carácter usa comillas dobles: s == \"a\", o compara una letra: s[0] == 'a'." : ""}`],
    [/(\S+) needs a string or a char, not (.+)/, (m) =>
      `${m[1]} necesita una cadena o un carácter, no un ${m[2]}.`],
    [/cannot convert (.+)\((.+)\) to string/, (m) =>
      `No se puede convertir el valor ${m[1]} (${m[2]}) en string. Para un número usa to_string.`],
    [/type vector<.*> is not defined|cannot find library: vector/, () =>
      "El paso a paso todavía no conoce vector. Con Ejecutar sí funciona."],
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
    [/the (?:exact result|value) (\S+) is too large/, (m) =>
      `El valor exacto (${m[1]}) es demasiado grande para el paso a paso, que solo calcula exacto hasta 9007199254740991. Con Ejecutar sí funciona.`],
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
