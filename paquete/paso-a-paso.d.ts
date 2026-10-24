// Paso a paso C++: corre un programa y regresa cada paso, para mostrarlo como Karel.
// Basado en JSCPP (licencia MIT, ver LICENSE-JSCPP.txt), con correcciones para que dé lo mismo que g++.
//
//     const { prepararPasos } = await import("@/lib/paso-a-paso/paso-a-paso.js");
//     const calculo = prepararPasos(codigo, entrada);
//     const r = await calculo.resultado;   // calculo.cancelar() lo detiene
//     if (r.tipo === "pasos") mostrar(r.pasos);

/** Una variable como la ve el alumno: el valor ya viene escrito ("5", "'a'", "\"hola\"", "[1, 2, 3]"). */
export interface Variable {
  nombre: string;
  valor: string;
  /** Si es una referencia (int &a), a quién se refiere: "x", "a[2]", "x de main". Si no, null. */
  ref: string | null;
}

/** Las variables de una llamada. funcion es "globales", "main" o el nombre de la función. */
export interface Marco {
  funcion: string;
  vars: Variable[];
}

export interface Paso {
  /** La siguiente línea que se va a ejecutar (empieza en 1). En el último paso, la del error o null. */
  linea: number | null;
  /** Las llamadas vivas, de la más vieja a la más nueva; en la recursión hay varias de la misma función. */
  marcos: Marco[];
  /** Todo lo escrito con cout hasta este paso. */
  salida: string;
  /** Cuántos caracteres de la entrada ya leyó cin. */
  leido: number;
  /** Solo en el último paso: el programa terminó, con el valor de su return. */
  fin?: boolean;
  codigoSalida?: number;
  /** Solo en el último paso: el error explicado en español. Puede traer la línea citada tras "\n\n    ". */
  error?: string | null;
  /** Solo en el último paso: se alcanzó el límite de pasos u operaciones (¿ciclo infinito?). */
  cortado?: boolean;
}

export type Resultado =
  /** El último paso dice cómo terminó: fin, error o cortado. */
  | { tipo: "pasos"; pasos: Paso[] }
  /** El programa no se pudo leer: error de sintaxis o una biblioteca que no conoce. */
  | { tipo: "error"; linea: number | null; texto: string }
  | { tipo: "cancelado" };

export interface Limites {
  /** Pasos que se guardan para mostrar. 3000 si no se dice. */
  maxPasos?: number;
  /** Freno para ciclos infinitos, unos 3 segundos. 300000 si no se dice. */
  maxOperaciones?: number;
}

/** Calcula todos los pasos en un Worker, sin congelar la página. */
export function prepararPasos(codigo: string, entrada: string, limites?: Limites): {
  resultado: Promise<Resultado>;
  cancelar(): void;
};
