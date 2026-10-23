// Formats a floating point number like C++ ostream does by default
// (printf "%g"): `precision` significant digits, trailing zeros removed,
// scientific notation when the exponent is < -4 or >= precision.
// e.g. 0.1 + 0.2 -> "0.3", 1.0 / 3 -> "0.333333", 1e8 -> "1e+08"
export = function (x: number, precision = 6): string {
    if (Number.isNaN(x)) {
        return x < 0 ? "-nan" : "nan";
    }
    if (!Number.isFinite(x)) {
        return x < 0 ? "-inf" : "inf";
    }
    const p = precision === 0 ? 1 : precision;
    if (x === 0) {
        return Object.is(x, -0) ? "-0" : "0";
    }
    // the exponent after rounding to p significant digits (9.9999999 -> 1e+01)
    const [mantissa, expStr] = x.toExponential(p - 1).split("e");
    const exp = Number(expStr);
    const stripZeros = (s: string) => s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
    if (exp < -4 || exp >= p) {
        const sign = exp < 0 ? "-" : "+";
        const digits = String(Math.abs(exp)).padStart(2, "0");
        return stripZeros(mantissa) + "e" + sign + digits;
    }
    return stripZeros(x.toFixed(p - 1 - exp));
};
