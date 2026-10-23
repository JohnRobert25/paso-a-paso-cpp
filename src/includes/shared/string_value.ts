import { CRuntime, ObjectValue, ObjectVariable, Variable } from "../../rt";

// std::string. Its characters are char variables, as in a char array, so s[i] can be
// assigned and s.begin() / s.end() are pointers into them: sort, reverse and
// for (char c : s) work as they do with arrays.

export interface StringValue extends ObjectValue {
    chars: Variable[];
}

export interface StringVariable extends ObjectVariable {
    v: StringValue;
}

export function isString(v: Variable): v is StringVariable {
    return v.t.type === "class" && v.t.name === "string";
}

export function charCell(rt: CRuntime, code: number): Variable {
    // kept as is (not wrapped to -128..127) so that accented letters read with cin still print
    return { t: rt.charTypeLiteral, v: code, left: true };
}

export function cells(rt: CRuntime, text: string) {
    const r: Variable[] = [];
    for (let i = 0; i < text.length; i++) {
        r.push(charCell(rt, text.charCodeAt(i)));
    }
    return r;
}

export function stringText(s: StringVariable) {
    let r = "";
    for (const c of s.v.chars) {
        const code = c.v as number;
        r += String.fromCharCode(code < 0 ? code + 256 : code);
    }
    return r;
}

export function makeString(rt: CRuntime, text: string): StringVariable {
    return {
        t: { type: "class", name: "string" },
        v: { members: {}, chars: cells(rt, text) },
        left: false
    };
}

// The text of a string, a string literal / char array, or a single char; undefined otherwise
export function textOf(rt: CRuntime, v: Variable): string | undefined {
    if (isString(v)) {
        return stringText(v);
    }
    if (rt.isArrayType(v) && rt.isCharType(v.t.eleType)) {
        const target = v.v.target;
        let r = "";
        for (let i = v.v.position; i < target.length && target[i].v !== 0; i++) {
            r += String.fromCharCode(target[i].v as number);
        }
        return r;
    }
    if (rt.isPrimitiveType(v) && rt.isCharType(v.t)) {
        return String.fromCharCode(v.v as number);
    }
    return undefined;
}
