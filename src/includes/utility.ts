/* eslint-disable no-shadow */
import { ClassType, CRuntime, ObjectValue, ObjectVariable, Variable, VariableType } from "../rt";
import loadSwap = require("./shared/swap");
import { isLess } from "./shared/compare";

// <utility> and <functional>: pair, make_pair, min, max, swap, greater, less.
// With g++ all of them also come with <iostream>.

function zero(rt: CRuntime, t: VariableType): Variable {
    // pair<int, int> p; starts at {0, 0}
    const v = rt.isPrimitiveType(t) ? rt.val(t, 0, true) : rt.defaultValue(t, true);
    v.left = true;
    return v;
}

function member(rt: CRuntime, t: VariableType, v: Variable) {
    const r = rt.clone(rt.cast(t, v));
    r.left = true;
    return r;
}

export = {
    load(rt: CRuntime) {
        rt.templates["pair"] = (rt, name, args) => {
            if (args.length !== 2) {
                rt.raiseException("pair needs two types: pair<int, int>");
            }
            const [A, B] = args;
            const type = rt.newClass(name, [
                { name: "first", type: A, initialize: (rt) => zero(rt, A) },
                { name: "second", type: B, initialize: (rt) => zero(rt, B) },
            ]) as ClassType;
            const handlers = rt.types[rt.getTypeSignature(type)];
            const make = (first: Variable, second: Variable): ObjectVariable => ({
                t: type,
                v: { members: { first: member(rt, A, first), second: member(rt, B, second) } },
                left: false
            });
            handlers.copy = (rt, v: ObjectValue) => make(v.members.first, v.members.second).v;
            handlers.convert = (rt, value) => {
                if (rt.isClassType(value) && value.t.name.startsWith("pair<")) {
                    return make(value.v.members.first, value.v.members.second);
                }
                return undefined;
            };
            handlers.accepts = (rt, t) => t.type === "class" && t.name.startsWith("pair<");
            handlers.construct = (rt, values) => {
                if (values.length !== 2) {
                    rt.raiseException(`a pair has two values, not ${values.length}`);
                }
                return make(values[0], values[1]);
            };
            handlers.display = (rt, l) => `{${rt.makeValueString(l.v.members.first)}, ${rt.makeValueString(l.v.members.second)}}`;
            handlers.handlers["o(=)"] = {
                default(rt, l: ObjectVariable, r: Variable) {
                    if (!l.left) {
                        rt.raiseException(rt.makeValString(l) + " is not a left value");
                    }
                    l.v = rt.clone(rt.cast(type, r)).v as ObjectValue;
                    return l;
                }
            };
            // first decides; if the firsts are equal, second
            const order = (l: ObjectVariable, r: Variable) => {
                const o = rt.cast(type, r) as ObjectVariable;
                const [a, b] = [l.v.members, o.v.members];
                if (isLess(rt, a.first, b.first)) { return -1; }
                if (isLess(rt, b.first, a.first)) { return 1; }
                if (isLess(rt, a.second, b.second)) { return -1; }
                if (isLess(rt, b.second, a.second)) { return 1; }
                return 0;
            };
            const tests: [string, (c: number) => boolean][] = [
                ["==", (c) => c === 0], ["!=", (c) => c !== 0], ["<", (c) => c < 0],
                [">", (c) => c > 0], ["<=", (c) => c <= 0], [">=", (c) => c >= 0],
            ];
            for (const [op, test] of tests) {
                handlers.handlers[rt.makeOperatorFuncName(op)] = {
                    default: (rt: CRuntime, l: ObjectVariable, r: Variable) => rt.val(rt.boolTypeLiteral, test(order(l, r)))
                };
            }
        };

        // make_pair(1, "Luis"): a literal becomes a string
        rt.regFunc((rt: CRuntime, _this: Variable, a: Variable, b: Variable) => {
            if (!a || !b) {
                rt.raiseException("make_pair needs two values");
            }
            const typeName = (v: Variable) => rt.isStringType(v) ? "string" : rt.makeTypeString(v.t);
            const type = rt.simpleType(`pair<${typeName(a)},${typeName(b)}>`);
            return rt.types[rt.getTypeSignature(type)].construct(rt, [a, b]);
        }, "global", "make_pair", ["?"], rt.voidTypeLiteral);

        // min(a, b) and max(a, b) take two values of the same type, as with g++
        const pick = (name: string, second: (a: Variable, b: Variable) => boolean) => {
            rt.regFunc((rt: CRuntime, _this: Variable, a: Variable, b: Variable, ...rest: Variable[]) => {
                if (!a || !b || rest.length > 0) {
                    rt.raiseException(`${name} takes two values: ${name}(a, b)`);
                }
                if (!rt.isTypeEqualTo(a.t, b.t)) {
                    rt.raiseException(`${name} needs two values of the same type, not ${rt.makeTypeString(a.t)} and ${rt.makeTypeString(b.t)}`);
                }
                return rt.clone(second(a, b) ? b : a);
            }, "global", name, ["?"], rt.voidTypeLiteral);
        };
        pick("min", (a, b) => isLess(rt, b, a));
        pick("max", (a, b) => isLess(rt, a, b));

        loadSwap(rt);

        // greater<int>() for sort from largest to smallest; less<int>() is the usual order
        const functor = (name: string, test: (rt: CRuntime, a: Variable, b: Variable) => boolean) => {
            rt.templates[name] = (rt, typeName) => {
                const type = rt.newClass(typeName, []) as ClassType;
                rt.types[rt.getTypeSignature(type)].handlers["o(())"] = {
                    default: (rt: CRuntime, l: Variable, bindThis: Variable, a: Variable, b: Variable) =>
                        rt.val(rt.boolTypeLiteral, test(rt, a, b))
                };
            };
        };
        functor("greater", (rt, a, b) => isLess(rt, b, a));
        functor("less", (rt, a, b) => isLess(rt, a, b));
    }
};
