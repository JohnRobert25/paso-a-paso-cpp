import { CRuntime, Variable } from "../../rt";

// std::swap(a, b). Native functions get the caller's variables themselves (lvalues),
// so exchanging their values is enough. With g++ it comes with <iostream>, <utility> and <algorithm>.
export = function (rt: CRuntime) {
    if (rt.scope[0].variables["swap"]) {
        return;
    }
    const _swap = function (rt: CRuntime, _this: Variable, a: Variable, b: Variable) {
        if (!a || !b || !a.left || !b.left) {
            rt.raiseException("swap needs two variables");
        }
        if (!rt.isTypeEqualTo(a.t, b.t)) {
            rt.raiseException("swap needs two variables of the same type, not " + rt.makeTypeString(a.t) + " and " + rt.makeTypeString(b.t));
        }
        const v = a.v;
        a.v = b.v;
        b.v = v;
    };
    rt.regFunc(_swap, "global", "swap", ["?"], rt.voidTypeLiteral);
};
