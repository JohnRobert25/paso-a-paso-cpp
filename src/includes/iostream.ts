/* eslint-disable no-shadow */
import { ArrayVariable, CRuntime, IntVariable, Variable, VariableType } from "../rt";
import { Cin, Cout } from "./shared/iomanip_types";
import formatFloat = require("./shared/format_float");
import { cells, isString, stringText, StringVariable } from "./shared/string_value";

const _skipSpace = function (s: string) {
    const r = /^\s*/.exec(s);
    if (r && (r.length > 0)) {
        return s.substring(r[0].length);
    } else {
        return s;
    }
};

const _read = function (rt: CRuntime, reg: RegExp, buf: string, type: VariableType) {
    const r = reg.exec(buf);
    if ((r == null) || (r.length === 0)) {
        rt.raiseException("input format mismatch " + rt.makeTypeString(type) + " with buffer=" + buf);
    } else {
        return r;
    }
};

export = {
    load(rt: CRuntime) {
        const {
            stdio
        } = rt.config;
        // with g++, <iostream> also brings string, pair, min, max, swap and greater
        rt.include("string");
        rt.include("utility");
        const cinType = rt.newClass("istream", []);

        const cin = {
            t: cinType,
            v: {
                buf: stdio.drain(),
                istream: stdio,
                members: {}
            },
            left: false
        };
        rt.scope[0].variables["cin"] = cin;
        const pchar = rt.normalPointerType(rt.charTypeLiteral);

        rt.types[rt.getTypeSignature(cinType)] = {
            father: "object",
            handlers: {
                "o(>>)": {
                    default(rt, _cin: Cin, t: any) {
                        if (!t.left) {
                            rt.raiseException("only left value can be used as storage");
                        }
                        if (!rt.isPrimitiveType(t.t)) {
                            rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
                        }
                        let b = _cin.v.buf;
                        _cin.v.eofbit = b.length === 0;
                        let r
                        let v;
                        switch (t.t.name) {
                            case "char": case "signed char": case "unsigned char":
                                b = _skipSpace(b);
                                r = _read(rt, /^./, b, t.t);
                                v = r[0].charCodeAt(0);
                                break;
                            case "short": case "short int": case "signed short": case "signed short int": case "unsigned short": case "unsigned short int": case "int": case "signed int": case "unsigned": case "unsigned int": case "long": case "long int": case "signed long": case "signed long int": case "unsigned long": case "unsigned long int": case "long long": case "long long int": case "signed long long": case "signed long long int": case "unsigned long long": case "unsigned long long int":
                                b = _skipSpace(b);
                                // digits with an optional sign; an empty match sets failbit (end of input, a letter...)
                                r = _read(rt, /^[-+]?[0-9]+|^/, b, t.t);
                                v = parseInt(r[0], 10);
                                const token: string = r[0];
                                if (/^[-+]?[0-9]+$/.test(token)) {
                                    rt.checkExactInteger(v, () => BigInt(token));
                                }
                                break;
                            case "float": case "double":
                                b = _skipSpace(b);
                                // 0, -3, 2.5, .5, 1e-3; anchored as a whole (the old pattern found numbers further ahead)
                                r = _read(rt, /^[-+]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?|^/, b, t.t);
                                v = parseFloat(r[0]);
                                break;
                            case "bool":
                                b = _skipSpace(b);
                                r = _read(rt, /^(true|false)/, b, t.t);
                                v = r[0] === "true";
                                break;
                            default:
                                rt.raiseException(">> operator in istream cannot accept " + rt.makeTypeString(t.t));
                        }
                        const len = r[0].length;
                        _cin.v.failbit = len === 0;
                        if (!_cin.v.failbit) {
                            t.v = rt.val(t.t, v).v;
                            _cin.v.buf = b.substring(len);
                        }
                        return _cin;
                    }
                }
            }
        };

        const _cinString = function (rt: CRuntime, _cin: Cin, t: ArrayVariable) {
            if (!rt.isStringType(t.t)) {
                rt.raiseException("only a pointer to string can be used as storage");
            }

            let b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            b = _skipSpace(b);
            const r = _read(rt, /^\S*/, b, t.t)[0];
            _cin.v.failbit = r.length === 0;
            _cin.v.buf = b.substring(r.length);

            const initialPos = t.v.position;
            const tar = t.v.target;
            if ((tar.length - initialPos) <= r.length) {
                rt.raiseException(`target string buffer is ${r.length - (tar.length - initialPos)} too short`);
            }

            for (let i = 0, end = r.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                tar[i + initialPos].v = rt.val(rt.charTypeLiteral, r.charCodeAt(i)).v;
            }
            tar[r.length + initialPos].v = rt.val(rt.charTypeLiteral, 0).v;
            return _cin;
        };
        rt.regOperator(_cinString, cin.t, ">>", [pchar], cin.t);

        const _getline = function (rt: CRuntime, _cin: Cin, t: ArrayVariable, limitV: IntVariable, delimV: IntVariable) {
            let removeDelim;
            if (!rt.isStringType(t.t)) {
                rt.raiseException("only a pointer to string can be used as storage");
            }
            const limit = limitV.v;
            const delim =
                (delimV != null) ?
                    String.fromCharCode(delimV.v)
                    :
                    '\n';
            const b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            let r = _read(rt, new RegExp(`^[^${delim}]*`), b, t.t)[0];
            if ((r.length + 1) > limit) {
                r = r.substring(0, limit - 1);
            }
            if (b.charAt(r.length) === delim.charAt(0)) {
                removeDelim = true;
                _cin.v.failbit = false;
            } else {
                _cin.v.failbit = r.length === 0;
            }
            _cin.v.buf = b.substring(r.length + (removeDelim ? 1 : 0));

            const initialPos = t.v.position;
            const tar = t.v.target;
            if ((tar.length - initialPos) <= r.length) {
                rt.raiseException(`target string buffer is ${r.length - (tar.length - initialPos)} too short`);
            }

            for (let i = 0, end = r.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                tar[i + initialPos].v = rt.val(rt.charTypeLiteral, r.charCodeAt(i)).v;
            }
            tar[r.length + initialPos].v = rt.val(rt.charTypeLiteral, 0).v;
            return _cin;
        };

        rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral, rt.charTypeLiteral], cin.t);
        rt.regFunc(_getline, cin.t, "getline", [pchar, rt.intTypeLiteral], cin.t);

        const _get = function (rt: CRuntime, _cin: Cin) {
            const b = _cin.v.buf;
            _cin.v.eofbit = b.length === 0;

            if (_cin.v.eofbit) {
                return rt.val(rt.intTypeLiteral, -1);
            } else {
                const r = _read(rt, /^.|[\r\n]/, b, rt.charTypeLiteral);
                _cin.v.buf = b.substring(r.length);
                const v = r[0].charCodeAt(0);
                return rt.val(rt.intTypeLiteral, v);
            }
        };

        rt.regFunc(_get, cin.t, "get", [], rt.intTypeLiteral);

        // cin >> s: one word, up to a space or the end of the line
        const stringType = rt.simpleType("string");
        const _cinStdString = function (rt: CRuntime, _cin: Cin, s: StringVariable) {
            if (!s.left) {
                rt.raiseException("only left value can be used as storage");
            }
            const b = _skipSpace(_cin.v.buf);
            _cin.v.eofbit = b.length === 0;
            const word = /^\S*/.exec(b)[0];
            _cin.v.failbit = word.length === 0;
            if (!_cin.v.failbit) {
                s.v.chars = cells(rt, word);
            }
            _cin.v.buf = b.substring(word.length);
            return _cin;
        };
        rt.regOperator(_cinStdString, cin.t, ">>", [stringType], cin.t);

        // getline(cin, s): the rest of the line, without the line break
        const _getlineString = function (rt: CRuntime, _this: Variable, _cin: Cin, s: StringVariable, delimV?: IntVariable) {
            if (!s.left) {
                rt.raiseException("only left value can be used as storage");
            }
            const delim = delimV ? String.fromCharCode(delimV.v) : "\n";
            const b = _cin.v.buf;
            const end = b.indexOf(delim);
            const line = end < 0 ? b : b.substring(0, end);
            s.v.chars = cells(rt, line);
            _cin.v.eofbit = end < 0;
            _cin.v.failbit = b.length === 0;
            _cin.v.buf = end < 0 ? "" : b.substring(end + 1);
            return _cin;
        };
        rt.regFunc(_getlineString, "global", "getline", [cin.t, stringType], cin.t);
        rt.regFunc(_getlineString, "global", "getline", [cin.t, stringType, rt.charTypeLiteral], cin.t);

        // cin.ignore(): skips one character (the line break left by cin >> n), or up to n until delim
        const _ignore = function (rt: CRuntime, _cin: Cin, nV?: IntVariable, delimV?: IntVariable) {
            const b = _cin.v.buf;
            const n = nV ? nV.v : 1;
            let i = 0;
            while (i < b.length && i < n) {
                i++;
                if (delimV && b.charCodeAt(i - 1) === delimV.v) {
                    break;
                }
            }
            _cin.v.buf = b.substring(i);
            return _cin;
        };
        rt.regFunc(_ignore, cin.t, "ignore", [], cin.t);
        rt.regFunc(_ignore, cin.t, "ignore", [rt.primitiveType("long long")], cin.t);
        rt.regFunc(_ignore, cin.t, "ignore", [rt.primitiveType("long long"), rt.intTypeLiteral], cin.t);

        // Fast input in contests: ios::sync_with_stdio(false); cin.tie(nullptr / 0 / NULL).
        // There is nothing to speed up in the interpreter, so they do nothing.
        rt.regFunc((rt: CRuntime) => rt.val(rt.boolTypeLiteral, true), "global", "sync_with_stdio", ["?"], rt.boolTypeLiteral);
        rt.regFunc((rt: CRuntime) => rt.nullPointer, cin.t, "tie", ["?"], rt.voidPointerType);

        const _bool = (rt: CRuntime, _cin: Cin) => rt.val(rt.boolTypeLiteral, !_cin.v.failbit);

        rt.regOperator(_bool, cin.t, "bool", [], rt.boolTypeLiteral);

        // ######################### cout
        const coutType = rt.newClass("ostream", []);
        const cout: Cout = {
            t: coutType,
            v: {
                ostream: stdio,
                members: {}
            },
            left: false
        };
        rt.scope[0].variables["cout"] = cout;

        rt.types[rt.getTypeSignature(cout.t)] = {
            father: "object",
            handlers: {
                "o(<<)": {
                    default(rt, _cout: Cout, t: Variable) {
                        let r;
                        if (isString(t)) {
                            const text = stringText(t);
                            t = rt.makeCharArrayFromString(text, /[^\x00-\x7f]/.test(text) ? "wchar_t" : "char");
                        }
                        if (_cout.manipulators != null) {
                            t = _cout.manipulators.use(t);
                        }
                        if (rt.isPrimitiveType(t.t)) {
                            if (t.t.name.indexOf("char") >= 0) {
                                r = String.fromCharCode(t.v as number);
                            } else if (t.t.name === "bool") {
                                r = t.v ? "1" : "0";
                            } else if (rt.isFloatType(t)) {
                                r = formatFloat(t.v);
                            } else {
                                r = rt.formatInteger(t.t, t.v as number);
                            }
                        } else if (rt.isStringType(t)) {
                            r = rt.getStringFromCharArray(t);
                        } else {
                            rt.raiseException("<< operator in ostream cannot accept " + rt.makeTypeString(t.t));
                        }
                        _cout.v.ostream.write(r);
                        return _cout;
                    }
                }
            }
        };

        const endl = rt.val(rt.charTypeLiteral, "\n".charCodeAt(0));
        rt.scope[0].variables["endl"] = endl;
    }
};