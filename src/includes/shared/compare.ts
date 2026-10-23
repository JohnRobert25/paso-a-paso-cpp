import { CRuntime, Variable } from "../../rt";

// a < b and a == b with the operators of their type: numbers, strings, pairs
export function isLess(rt: CRuntime, a: Variable, b: Variable): boolean {
    const r = rt.getFunc(a.t, rt.makeOperatorFuncName("<"), [b.t])(rt, a, b);
    return !!rt.cast(rt.boolTypeLiteral, r).v;
}

export function isEqual(rt: CRuntime, a: Variable, b: Variable): boolean {
    const r = rt.getFunc(a.t, rt.makeOperatorFuncName("=="), [b.t])(rt, a, b);
    return !!rt.cast(rt.boolTypeLiteral, r).v;
}

const isGenerator = (r: any) => r != null && typeof r.next === "function" && typeof r[Symbol.iterator] === "function";

// comp(a, b) as sort uses it: the usual <, a function of the program (bool antes(int x, int y))
// or an object such as greater<int>(). A function of the program runs step by step.
export function* compareWith(rt: CRuntime, comp: Variable | undefined, a: Variable, b: Variable): Generator<any, boolean, any> {
    if (!comp) {
        return isLess(rt, a, b);
    }
    const r = rt.getFunc(comp.t, rt.makeOperatorFuncName("()"), [a.t, b.t])(rt, comp, comp, a, b);
    const v = isGenerator(r) ? yield* r : r;
    if (v == null) {
        rt.raiseException("the comparison function must return true or false");
    }
    return !!rt.cast(rt.boolTypeLiteral, v).v;
}
