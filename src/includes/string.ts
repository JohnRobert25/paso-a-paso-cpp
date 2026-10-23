/* eslint-disable no-shadow */
import { ClassType, CRuntime, Variable, VariableType } from "../rt";
import { charCell, cells, makeString, StringValue, StringVariable, stringText, textOf } from "./shared/string_value";

// Text of an argument that must be a string, a literal or a char
function textArg(rt: CRuntime, v: Variable, what: string) {
    const r = textOf(rt, v);
    if (r === undefined) {
        rt.raiseException(`${what} needs a string or a char, not ${rt.makeTypeString(v.t)}`);
    }
    return r;
}

// s += c + 1: in = and += an integer is a character code, as with g++
function textOrCode(rt: CRuntime, v: Variable, what: string) {
    if (rt.isPrimitiveType(v) && rt.isIntegerType(v) && !rt.isCharType(v.t)) {
        const code = rt.cast(rt.charTypeLiteral, v).v as number;
        return String.fromCharCode(code < 0 ? code + 256 : code);
    }
    return textArg(rt, v, what);
}

export = {
    load(rt: CRuntime) {
        const type = rt.newClass("string", []) as ClassType;
        const handlers = rt.types[rt.getTypeSignature(type)];
        const sizeType = rt.primitiveType("unsigned long long");
        const npos = Math.pow(2, 64); // stands for 18446744073709551615, which a double cannot hold
        const size = (n: number) => rt.val(sizeType, n);
        const index = (v: Variable, what: string) => {
            if (!rt.isIntegerType(v)) {
                rt.raiseException(`${what} needs an integer, not ${rt.makeTypeString(v.t)}`);
            }
            return v.v as number;
        };

        handlers.cConstructor = (rt, _this: StringVariable) => {
            _this.v.members = {};
            _this.v.chars = [];
        };
        handlers.copy = (rt, v: StringValue) => ({ members: {}, chars: v.chars.map((c) => charCell(rt, c.v as number)) } as StringValue);
        handlers.convert = (rt, value) => {
            const text = textOf(rt, value);
            return text === undefined ? undefined : makeString(rt, text);
        };
        // a string parameter takes a string or a literal; a char needs string(1, c)
        handlers.accepts = (rt, t: VariableType) => (t.type === "class" && t.name === "string")
            || (rt.isPointerType(t) && t.ptrType !== "function" && rt.isCharType(t.ptrType === "array" ? t.eleType : t.targetType));
        handlers.construct = (rt, args) => {
            if (args.length === 1) {
                return makeString(rt, textArg(rt, args[0], "string"));
            }
            if (args.length === 2 && rt.isIntegerType(args[0]) && rt.isCharType(args[1].t)) {
                // string(3, 'a') == "aaa"
                return makeString(rt, String.fromCharCode(args[1].v as number).repeat(Math.max(0, args[0].v as number)));
            }
            rt.raiseException("string cannot be built from " + args.map((a) => rt.makeTypeString(a.t)).join(", "));
        };
        handlers.display = (rt, l: StringVariable) => JSON.stringify(stringText(l));
        handlers.elements = (rt, l: StringVariable) => l.v.chars;

        const op = (name: string, f: (rt: CRuntime, l: StringVariable, r: Variable) => Variable) => {
            handlers.handlers[rt.makeOperatorFuncName(name)] = { default: f as any };
        };
        op("=", (rt, l, r) => {
            if (!l.left) {
                rt.raiseException(rt.makeValString(l) + " is not a left value");
            }
            l.v.chars = cells(rt, textOrCode(rt, r, "="));
            return l;
        });
        op("+=", (rt, l, r) => {
            if (!l.left) {
                rt.raiseException(rt.makeValString(l) + " is not a left value");
            }
            l.v.chars.push(...cells(rt, textOrCode(rt, r, "+=")));
            return l;
        });
        op("+", (rt, l, r) => makeString(rt, stringText(l) + textArg(rt, r, "+")));
        const compare = (name: string, test: (a: string, b: string) => boolean) => op(name, (rt, l, r) => {
            const b = textOf(rt, r);
            if (b === undefined || (rt.isPrimitiveType(r))) {
                rt.raiseException(`a string cannot be compared with ${name} to ${rt.makeTypeString(r.t)}`);
            }
            return rt.val(rt.boolTypeLiteral, test(stringText(l), b));
        });
        compare("==", (a, b) => a === b);
        compare("!=", (a, b) => a !== b);
        compare("<", (a, b) => a < b);
        compare(">", (a, b) => a > b);
        compare("<=", (a, b) => a <= b);
        compare(">=", (a, b) => a >= b);
        op("[]", (rt, l, r) => {
            const i = index(r, "[]");
            const chars = l.v.chars;
            if (i === chars.length) {
                return rt.val(rt.charTypeLiteral, 0);
            }
            if (i < 0 || i > chars.length) {
                rt.raiseException(`string index ${i} out of range: size ${chars.length}`);
            }
            const c = chars[i] as any;
            c.array = chars;
            c.arrayIndex = i;
            return c;
        });

        const method = (name: string, args: VariableType[], ret: VariableType, f: (rt: CRuntime, s: StringVariable, ...args: Variable[]) => Variable | void) => {
            rt.regFunc(f as any, type, name, args, ret);
        };
        const charT = rt.charTypeLiteral;
        method("size", [], sizeType, (rt, s) => size(s.v.chars.length));
        method("length", [], sizeType, (rt, s) => size(s.v.chars.length));
        method("empty", [], rt.boolTypeLiteral, (rt, s) => rt.val(rt.boolTypeLiteral, s.v.chars.length === 0));
        method("clear", [], rt.voidTypeLiteral, (rt, s) => { s.v.chars = []; });
        method("push_back", [charT], rt.voidTypeLiteral, (rt, s, c) => { s.v.chars.push(charCell(rt, c.v as number)); });
        method("pop_back", [], rt.voidTypeLiteral, (rt, s) => {
            if (s.v.chars.length === 0) {
                rt.raiseException("pop_back on an empty string");
            }
            s.v.chars.pop();
        });
        const end = (name: string, pick: (chars: Variable[]) => Variable) => method(name, [], charT, (rt, s) => {
            if (s.v.chars.length === 0) {
                rt.raiseException(name + " on an empty string");
            }
            return pick(s.v.chars);
        });
        end("back", (chars) => chars[chars.length - 1]);
        end("front", (chars) => chars[0]);
        method("at", [sizeType], charT, (rt, s, i) => {
            const n = index(i, "at");
            if (n < 0 || n >= s.v.chars.length) {
                rt.raiseException(`string index ${n} out of range: size ${s.v.chars.length}`);
            }
            return s.v.chars[n];
        });
        const substr = (rt: CRuntime, s: StringVariable, pos: Variable, len?: Variable) => {
            const text = stringText(s);
            const p = index(pos, "substr");
            if (p < 0 || p > text.length) {
                rt.raiseException(`substr: position ${p} is past the end of the string (size ${text.length})`);
            }
            const n = len === undefined ? text.length : index(len, "substr");
            return makeString(rt, text.substr(p, Math.max(0, Math.min(n, text.length - p))));
        };
        method("substr", [], type, (rt, s) => makeString(rt, stringText(s)));
        method("substr", [sizeType], type, substr);
        method("substr", [sizeType, sizeType], type, substr);
        const find = (last: boolean) => (rt: CRuntime, s: StringVariable, x: Variable, pos?: Variable) => {
            const text = stringText(s);
            const what = textArg(rt, x, last ? "rfind" : "find");
            const from = pos === undefined ? (last ? text.length : 0) : index(pos, "find");
            const r = last ? text.lastIndexOf(what, from) : text.indexOf(what, from);
            return size(r < 0 ? npos : r);
        };
        for (const name of ["find", "rfind"]) {
            for (const arg of [type, charT]) {
                method(name, [arg], sizeType, find(name === "rfind"));
                method(name, [arg, sizeType], sizeType, find(name === "rfind"));
            }
        }
        const edit = (rt: CRuntime, s: StringVariable, f: (text: string) => string) => {
            s.v.chars = cells(rt, f(stringText(s)));
            return s;
        };
        method("append", [type], type, (rt, s, x) => edit(rt, s, (t) => t + textArg(rt, x, "append")));
        method("insert", [sizeType, type], type, (rt, s, pos, x) => edit(rt, s, (t) => {
            const p = index(pos, "insert");
            if (p < 0 || p > t.length) {
                rt.raiseException(`insert: position ${p} is past the end of the string (size ${t.length})`);
            }
            return t.slice(0, p) + textArg(rt, x, "insert") + t.slice(p);
        }));
        const erase = (rt: CRuntime, s: StringVariable, pos?: Variable, len?: Variable) => edit(rt, s, (t) => {
            const p = pos === undefined ? 0 : index(pos, "erase");
            if (p < 0 || p > t.length) {
                rt.raiseException(`erase: position ${p} is past the end of the string (size ${t.length})`);
            }
            const n = len === undefined ? t.length : index(len, "erase");
            return t.slice(0, p) + t.slice(p + Math.max(0, n));
        });
        method("erase", [], type, erase);
        method("erase", [sizeType], type, erase);
        method("erase", [sizeType, sizeType], type, erase);
        method("replace", [sizeType, sizeType, type], type, (rt, s, pos, len, x) => edit(rt, s, (t) => {
            const p = index(pos, "replace");
            if (p < 0 || p > t.length) {
                rt.raiseException(`replace: position ${p} is past the end of the string (size ${t.length})`);
            }
            return t.slice(0, p) + textArg(rt, x, "replace") + t.slice(p + Math.max(0, index(len, "replace")));
        }));
        const pointer = (s: StringVariable, position: number) =>
            rt.val(rt.arrayPointerType(charT, s.v.chars.length), rt.makeArrayPointerValue(s.v.chars, position));
        method("begin", [], rt.arrayPointerType(charT, 0), (rt, s) => pointer(s, 0));
        method("end", [], rt.arrayPointerType(charT, 0), (rt, s) => pointer(s, s.v.chars.length));
        method("c_str", [], rt.normalPointerType(charT), (rt, s) => rt.makeCharArrayFromString(stringText(s)));

        rt.scope[0].variables["npos"] = rt.val(sizeType, npos);

        // to_string(42) == "42", to_string(2.5) == "2.500000"
        rt.regFunc((rt: CRuntime, _this: Variable, x: Variable) => {
            if (!x || !rt.isNumericType(x)) {
                rt.raiseException("to_string needs a number");
            }
            const v = x.v as number;
            return makeString(rt, rt.isFloatType(x) ? v.toFixed(6) : rt.formatInteger(x.t, v));
        }, "global", "to_string", ["?"], type);

        // stoi("42") == 42: spaces, a sign and digits, as many as there are
        const toInteger = (name: string, t: VariableType) => rt.regFunc((rt: CRuntime, _this: Variable, s: Variable) => {
            const text = textArg(rt, s, name);
            const m = /^\s*([-+]?[0-9]+)/.exec(text);
            if (!m) {
                rt.raiseException(`${name}: "${text}" does not start with a number`);
            }
            const v = parseInt(m[1], 10);
            rt.checkExactInteger(v, () => BigInt(m[1]));
            if (!rt.inrange(t, v)) {
                rt.raiseException(`${name}: ${m[1]} does not fit in ${rt.makeTypeString(t)}`);
            }
            return rt.val(t, v);
        }, "global", name, [type], t);
        toInteger("stoi", rt.intTypeLiteral);
        toInteger("stol", rt.longTypeLiteral);
        toInteger("stoll", rt.primitiveType("long long"));
        rt.regFunc((rt: CRuntime, _this: Variable, s: Variable) => {
            const text = textArg(rt, s, "stod");
            const m = /^\s*[-+]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?/.exec(text);
            if (!m) {
                rt.raiseException(`stod: "${text}" does not start with a number`);
            }
            return rt.val(rt.doubleTypeLiteral, parseFloat(m[0]));
        }, "global", "stod", [type], rt.doubleTypeLiteral);
    }
};
