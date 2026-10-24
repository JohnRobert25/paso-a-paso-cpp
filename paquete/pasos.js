// Corre un programa con el intérprete y guarda cada paso como datos simples: la línea, las variables
// de cada llamada (ya escritas como las ve el alumno), lo escrito con cout y cuánto leyó cin.
// La página de prueba, la app (dentro de un Worker) y la prueba en la terminal usan este mismo código.
//
//     calcularPasos(codigo, entrada, limites?) -> { tipo: "pasos", pasos } | { tipo: "error", linea, texto }
const JSCPP = require("../lib/commonjs.js");
const explicarError = require("./mensajes.js");

const LIMITES = {
  maxPasos: 3000,         // pasos que se guardan para mostrar
  maxOperaciones: 300000, // freno para ciclos infinitos (unos 3 segundos)
};

// ---------- Valores como los ve el alumno ----------

// double como lo escribe cout: 6 cifras significativas (0.1 + 0.2 -> 0.3)
function formatoDouble(x) {
  if (!Number.isFinite(x)) return Number.isNaN(x) ? "?" : (x < 0 ? "-inf" : "inf");
  if (x === 0) return "0";
  const [mantisa, expTexto] = x.toExponential(5).split("e");
  const exp = Number(expTexto);
  const sinCeros = (s) => s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  if (exp < -4 || exp >= 6) return sinCeros(mantisa) + "e" + (exp < 0 ? "-" : "+") + String(Math.abs(exp)).padStart(2, "0");
  return sinCeros(x.toFixed(5 - exp));
}

function texto(v, nivel = 0) {
  const t = v.t;
  if (t.type === "primitive") {
    const n = v.v;
    if (typeof n === "number" && Number.isNaN(n)) return "?";
    if (t.name === "bool") return n ? "true" : "false";
    if (t.name.includes("char")) return n === 0 ? "'\\0'" : `'${String.fromCharCode(n)}'`;
    if (t.name === "float" || t.name === "double") return formatoDouble(n);
    if (!Number.isSafeInteger(n)) {
      // los enteros de 64 bits más grandes: un double no los guarda exactos
      if (n === 2 ** 64) return "18446744073709551615";
      if (n === 2 ** 63 && !t.name.startsWith("unsigned")) return "9223372036854775807";
      return BigInt(n).toString();
    }
    return String(n);
  }
  if (t.type === "class" && t.name === "string") {
    let s = "";
    for (const c of v.v.chars) {
      if (s.length >= 40) { s += "…"; break; }
      const n = c.v;
      s += Number.isNaN(n) ? "?" : String.fromCharCode(n < 0 ? n + 256 : n);
    }
    return `"${s}"`;
  }
  if (t.type === "class" && v.v.members && Object.keys(v.v.members).length) {
    // pair: {90, "Luis"}
    return "{" + Object.values(v.v.members).map((m) => texto(m, nivel + 1)).join(", ") + "}";
  }
  if (t.type === "pointer" && t.ptrType === "array") {
    const elementos = v.v.target;
    if (t.eleType.type === "primitive" && t.eleType.name.includes("char")) {
      let s = "";
      for (const e of elementos) {
        if (e.v === 0 || s.length > 40) break;
        s += Number.isNaN(e.v) ? "?" : String.fromCharCode(e.v);
      }
      return `"${s}"`;
    }
    const max = nivel === 0 ? 10 : 5;
    const partes = elementos.slice(0, max).map((e) => texto(e, nivel + 1));
    if (elementos.length > max) partes.push("…");
    return "[" + partes.join(", ") + "]";
  }
  if (t.type === "class") return "{…}";
  if (t.type === "pointer") return "(puntero)";
  return "?";
}

// Una referencia (int &a, char &c : s) es otra variable con otro nombre: ¿cuál?
// Se busca la misma variable en los ámbitos vivos: x, a[2], s[0], p.first.
function aQuienSeRefiere(rt, objetivo, propio) {
  let funcion = "globales";
  for (const ambito of rt.scope) {
    if (ambito.$name.startsWith("function ")) funcion = ambito.$name.slice(9);
    for (const [nombre, v] of Object.entries(ambito.variables)) {
      if (ambito === propio.ambito && nombre === propio.nombre) continue;
      let r = null;
      if (v === objetivo) r = nombre;
      else if (v.t.type === "pointer" && v.t.ptrType === "array") {
        const i = v.v.target.indexOf(objetivo);
        if (i >= 0) r = `${nombre}[${i}]`;
      } else if (v.t.type === "class" && v.v.chars) {
        const i = v.v.chars.indexOf(objetivo);
        if (i >= 0) r = `${nombre}[${i}]`;
      } else if (v.t.type === "class" && v.v.members) {
        const m = Object.keys(v.v.members).find((k) => v.v.members[k] === objetivo);
        if (m) r = `${nombre}.${m}`;
      }
      if (r) return funcion === propio.funcion ? r : `${r} de ${funcion === "globales" ? "las globales" : funcion}`;
    }
  }
  return null;
}

// Las variables vivas, agrupadas por llamada: globales, main, y cada función llamada.
// ocultar: nombres que no se muestran del ámbito más interno (los de una declaración que apenas empieza)
function capturar(dbg, ocultar) {
  const rt = dbg.rt;
  const marcos = [];
  const globales = [];
  for (const [nombre, v] of Object.entries(rt.scope[0].variables)) {
    if (dbg.libraryGlobals.has(nombre) || v.t.type === "function") continue;
    globales.push({ nombre, valor: texto(v), ref: null });
  }
  if (globales.length) marcos.push({ funcion: "globales", vars: globales });
  let enFuncion = false;
  for (const ambito of rt.scope.slice(1)) {
    if (ambito.$name.startsWith("function ")) {
      marcos.push({ funcion: ambito.$name.slice(9), vars: [] });
      enFuncion = true;
    }
    if (!enFuncion) continue;
    const marco = marcos[marcos.length - 1];
    for (const [nombre, v] of Object.entries(ambito.variables)) {
      if (ocultar && ambito === rt.scope[rt.scope.length - 1] && ocultar.includes(nombre)) continue;
      const ref = ambito.references && ambito.references[nombre]
        ? aQuienSeRefiere(rt, v, { ambito, nombre, funcion: marco.funcion }) : null;
      marco.vars.push({ nombre, valor: texto(v), ref });
    }
  }
  return marcos;
}

// ---------- Correr el programa y guardar cada paso ----------

// Las declaraciones sueltas de un bloque (int n, ant = 0, racha = 0;). Cada una cuenta como un solo
// paso: si no, habría un clic por variable sin salir de la línea. Las de un for se quedan como están.
function declaraciones(ast) {
  const r = [];
  const recorrer = (nodo) => {
    if (!nodo || typeof nodo !== "object") return;
    if (Array.isArray(nodo)) { nodo.forEach(recorrer); return; }
    if (nodo.type === "CompoundStatement") {
      for (const d of nodo.Statements) if (d && d.type === "Declaration") r.push(d);
    }
    for (const v of Object.values(nodo)) if (v && typeof v === "object") recorrer(v);
  };
  recorrer(ast);
  return r;
}

// int n, ant = 0 -> ["n", "ant"]
function nombresDeclarados(declaracion) {
  return declaracion.InitDeclaratorList.map((d) => {
    let x = d.Declarator;
    while (x && x.left && x.left.type !== "Identifier") x = x.left;
    return x && x.left ? x.left.Identifier : null;
  });
}

function calcularPasos(codigo, entrada, limites = {}) {
  const { maxPasos, maxOperaciones } = { ...LIMITES, ...limites };
  let salida = "";
  let dbg;
  try {
    dbg = JSCPP.run(codigo, entrada, { debug: true, stdio: { write: (s) => { salida += s; } } });
  } catch (e) {
    // el programa no se pudo leer (error de sintaxis o biblioteca que falta)
    return { tipo: "error", ...explicarError(e.message || e, codigo) };
  }
  // detenerse por instrucción; los pasos sin cambios en la misma línea se juntan abajo
  dbg.setStopConditions({ isStatement: true, positionChanged: true, lineChanged: false });
  // cuánto de la entrada ya leyó cin: lo que le queda está en su buffer
  const leido = () => {
    const cin = dbg.rt.scope[0].variables.cin;
    return cin && typeof cin.v.buf === "string" ? entrada.length - cin.v.buf.length : 0;
  };

  const bloques = declaraciones(dbg.ast);
  const enDeclaracion = (nodo) => bloques.find((d) => nodo.sOffset >= d.sOffset && nodo.eOffset <= d.eOffset) || null;
  const pasos = [];
  let anterior = "";
  let declaracionAnterior = null;
  let profundidadAnterior = 0;
  let operaciones = 0;
  const final = { linea: null, fin: false, error: null, cortado: false };
  try {
    while (true) {
      const nodo = dbg.nextNode();
      const declaracion = nodo && enDeclaracion(nodo);
      // dentro de la misma declaración no hay paso nuevo: el siguiente ya muestra todas sus variables
      if (nodo && !(declaracion && declaracion === declaracionAnterior)) {
        const profundidad = dbg.rt.scope.length;
        // al empezar una declaración aún no se muestran sus variables (int n sin valor ya existe aquí);
        // al regresar de una función llamada en ella (int a = doble(3)), sí
        const empieza = declaracion && profundidad >= profundidadAnterior;
        const marcos = capturar(dbg, empieza ? nombresDeclarados(declaracion) : null);
        const clave = nodo.sLine + "|" + JSON.stringify(marcos);
        if (clave !== anterior) {
          if (pasos.length >= maxPasos) { final.cortado = true; break; }
          pasos.push({ linea: nodo.sLine, marcos, salida, leido: leido() });
          anterior = clave;
        }
        declaracionAnterior = declaracion;
        profundidadAnterior = profundidad;
      }
      const r = dbg.next();
      if (r !== false) { final.fin = true; final.codigoSalida = r.v; break; }
      if (++operaciones > maxOperaciones) { final.cortado = true; break; }
    }
  } catch (e) {
    const { linea, texto } = explicarError(e.message || e, codigo);
    final.error = texto;
    final.linea = linea;
  }
  // el último paso dice cómo terminó: fin (con su return), error o cortado
  const ultimo = pasos[pasos.length - 1];
  pasos.push({ ...final, marcos: ultimo ? ultimo.marcos : [], salida, leido: leido() });
  return { tipo: "pasos", pasos };
}

module.exports = { calcularPasos, explicarError, LIMITES };
