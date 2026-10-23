/* eslint-disable no-shadow */
import { ArrayVariable, CRuntime, Variable, VariableType } from "../rt";
import { compareWith, isEqual } from "./shared/compare";

// <algorithm> on ranges [first, last) of an array or a string: sort(a, a + n), sort(s.begin(), s.end()).
// sort follows libstdc++ step by step, so elements that the comparison considers equal
// end up in the same order as with g++.

type Comp = Variable | undefined;
type Gen<T> = Generator<any, T, any>;

interface Range {
    cells: Variable[];
    from: number;
    to: number;
    t: VariableType;
}

function range(rt: CRuntime, name: string, first: Variable, last: Variable): Range {
    if (!first || !last || !rt.isArrayType(first) || !rt.isArrayType(last)) {
        rt.raiseException(`${name} needs a range such as (a, a + n) or (s.begin(), s.end())`);
    }
    const [f, l] = [first as ArrayVariable, last as ArrayVariable];
    if (f.v.target !== l.v.target) {
        rt.raiseException(`${name}: the beginning and the end of the range are in different arrays`);
    }
    const cells = f.v.target;
    const [from, to] = [f.v.position, l.v.position];
    if (from < 0 || to > cells.length) {
        rt.raiseException(`${name}: the range [${from}, ${to}) goes outside the array of ${cells.length} elements`);
    }
    if (from > to) {
        rt.raiseException(`${name}: the range ends (${to}) before it begins (${from})`);
    }
    return { cells, from, to, t: f.t.eleType };
}

function pointer(rt: CRuntime, r: Range, position: number) {
    return rt.val(rt.arrayPointerType(r.t, r.cells.length), rt.makeArrayPointerValue(r.cells, position));
}

// The values are sorted apart and written back at the end
function* introsort(rt: CRuntime, vals: any[], t: VariableType, comp: Comp): Gen<void> {
    const n = vals.length;
    const THRESHOLD = 16;
    const cell = (v: any): Variable => ({ t, v, left: true } as Variable);
    function* less(i: any, j: any): Gen<boolean> {
        return yield* compareWith(rt, comp, cell(i), cell(j));
    }
    // with a comparison like <= the unguarded loops of libstdc++ leave the array (g++ may crash)
    const at = (i: number) => {
        if (i < 0 || i >= n) {
            rt.raiseException("sort: the comparison function is not valid for sort; it must be strict, like < (not <=)");
        }
        return vals[i];
    };
    const swap = (i: number, j: number) => { const x = vals[i]; vals[i] = vals[j]; vals[j] = x; };

    function* adjustHeap(first: number, hole: number, len: number, value: any): Gen<void> {
        const top = hole;
        let child = hole;
        while (child < Math.trunc((len - 1) / 2)) {
            child = 2 * (child + 1);
            if (yield* less(vals[first + child], vals[first + child - 1])) {
                child--;
            }
            vals[first + hole] = vals[first + child];
            hole = child;
        }
        if ((len & 1) === 0 && child === Math.trunc((len - 2) / 2)) {
            child = 2 * (child + 1);
            vals[first + hole] = vals[first + child - 1];
            hole = child - 1;
        }
        let parent = Math.trunc((hole - 1) / 2);
        while (hole > top && (yield* less(vals[first + parent], value))) {
            vals[first + hole] = vals[first + parent];
            hole = parent;
            parent = Math.trunc((hole - 1) / 2);
        }
        vals[first + hole] = value;
    }
    function* heapSort(first: number, last: number): Gen<void> {
        const len = last - first;
        if (len >= 2) {
            for (let parent = Math.trunc((len - 2) / 2); ; parent--) {
                yield* adjustHeap(first, parent, len, vals[first + parent]);
                if (parent === 0) { break; }
            }
        }
        while (last - first > 1) {
            last--;
            const value = vals[last];
            vals[last] = vals[first];
            yield* adjustHeap(first, 0, last - first, value);
        }
    }
    function* moveMedianToFirst(result: number, a: number, b: number, c: number): Gen<void> {
        if (yield* less(vals[a], vals[b])) {
            if (yield* less(vals[b], vals[c])) { swap(result, b); }
            else if (yield* less(vals[a], vals[c])) { swap(result, c); }
            else { swap(result, a); }
        } else if (yield* less(vals[a], vals[c])) { swap(result, a); }
        else if (yield* less(vals[b], vals[c])) { swap(result, c); }
        else { swap(result, b); }
    }
    function* unguardedPartition(first: number, last: number, pivot: number): Gen<number> {
        while (true) {
            while (yield* less(at(first), vals[pivot])) { first++; }
            last--;
            while (yield* less(vals[pivot], at(last))) { last--; }
            if (!(first < last)) { return first; }
            swap(first, last);
            first++;
        }
    }
    function* introsortLoop(first: number, last: number, depth: number): Gen<void> {
        while (last - first > THRESHOLD) {
            if (depth === 0) {
                yield* heapSort(first, last);
                return;
            }
            depth--;
            const mid = first + Math.trunc((last - first) / 2);
            yield* moveMedianToFirst(first, first + 1, mid, last - 1);
            const cut = yield* unguardedPartition(first + 1, last, first);
            yield* introsortLoop(cut, last, depth);
            last = cut;
        }
    }
    function* unguardedLinearInsert(last: number): Gen<void> {
        const value = vals[last];
        let next = last - 1;
        while (yield* less(value, at(next))) {
            vals[last] = vals[next];
            last = next;
            next--;
        }
        vals[last] = value;
    }
    function* insertionSort(first: number, last: number): Gen<void> {
        for (let i = first + 1; i < last; i++) {
            if (yield* less(vals[i], vals[first])) {
                const value = vals[i];
                vals.copyWithin(first + 1, first, i);
                vals[first] = value;
            } else {
                yield* unguardedLinearInsert(i);
            }
        }
    }

    if (n === 0) {
        return;
    }
    yield* introsortLoop(0, n, 2 * (31 - Math.clz32(n)));
    if (n > THRESHOLD) {
        yield* insertionSort(0, THRESHOLD);
        for (let i = THRESHOLD; i < n; i++) {
            yield* unguardedLinearInsert(i);
        }
    } else {
        yield* insertionSort(0, n);
    }
}

// stable_sort: equal elements keep their order (merge sort)
function* mergeSort(rt: CRuntime, vals: any[], t: VariableType, comp: Comp): Gen<any[]> {
    if (vals.length < 2) {
        return vals;
    }
    const half = Math.trunc(vals.length / 2);
    const a = yield* mergeSort(rt, vals.slice(0, half), t, comp);
    const b = yield* mergeSort(rt, vals.slice(half), t, comp);
    const r = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (yield* compareWith(rt, comp, { t, v: b[j], left: true } as Variable, { t, v: a[i], left: true } as Variable)) {
            r.push(b[j++]);
        } else {
            r.push(a[i++]);
        }
    }
    return r.concat(a.slice(i), b.slice(j));
}

export = {
    load(rt: CRuntime) {
        rt.include("utility");
        const g = "global";
        const reg = (name: string, f: (rt: CRuntime, _this: Variable, ...args: Variable[]) => any) =>
            rt.regFunc(f, g, name, ["?"], rt.voidTypeLiteral);
        const values = (r: Range) => r.cells.slice(r.from, r.to).map((c) => c.v);
        const writeBack = (r: Range, vals: any[]) => vals.forEach((v, i) => { r.cells[r.from + i].v = v; });
        const comparator = (name: string, comp: Variable) => {
            if (comp && !rt.isFunctionType(comp) && !rt.isFunctionPointerType(comp) && !rt.isClassType(comp)) {
                rt.raiseException(`${name}: the third argument must be a comparison function`);
            }
            return comp;
        };

        reg("sort", function* (rt, _this, first, last, comp) {
            const r = range(rt, "sort", first, last);
            const vals = values(r);
            yield* introsort(rt, vals, r.t, comparator("sort", comp));
            writeBack(r, vals);
        });
        reg("stable_sort", function* (rt, _this, first, last, comp) {
            const r = range(rt, "stable_sort", first, last);
            writeBack(r, yield* mergeSort(rt, values(r), r.t, comparator("stable_sort", comp)));
        });
        reg("reverse", (rt, _this, first, last) => {
            const r = range(rt, "reverse", first, last);
            writeBack(r, values(r).reverse());
        });
        reg("fill", (rt, _this, first, last, value) => {
            const r = range(rt, "fill", first, last);
            for (let i = r.from; i < r.to; i++) {
                r.cells[i].v = rt.clone(rt.cast(r.t, value)).v;
            }
        });
        // the first largest / smallest, as with g++
        const extreme = (name: string, better: (rt: CRuntime, comp: Comp, x: Variable, best: Variable) => Gen<boolean>) =>
            reg(name, function* (rt, _this, first, last, comp) {
                const r = range(rt, name, first, last);
                comparator(name, comp);
                let best = r.from;
                for (let i = r.from + 1; i < r.to; i++) {
                    if (yield* better(rt, comp, r.cells[i], r.cells[best])) {
                        best = i;
                    }
                }
                return pointer(rt, r, best);
            });
        extreme("max_element", (rt, comp, x, best) => compareWith(rt, comp, best, x));
        extreme("min_element", (rt, comp, x, best) => compareWith(rt, comp, x, best));
        reg("count", (rt, _this, first, last, value) => {
            const r = range(rt, "count", first, last);
            let n = 0;
            for (let i = r.from; i < r.to; i++) {
                if (isEqual(rt, r.cells[i], value)) { n++; }
            }
            return rt.val(rt.primitiveType("long long"), n);
        });
        reg("find", (rt, _this, first, last, value) => {
            const r = range(rt, "find", first, last);
            let i = r.from;
            while (i < r.to && !isEqual(rt, r.cells[i], value)) { i++; }
            return pointer(rt, r, i);
        });
        // unique: leaves one of each run of equal elements and returns the new end
        reg("unique", (rt, _this, first, last) => {
            const r = range(rt, "unique", first, last);
            const vals = values(r);
            const kept: any[] = [];
            vals.forEach((v, i) => {
                if (i === 0 || !isEqual(rt, { t: r.t, v } as Variable, { t: r.t, v: kept[kept.length - 1] } as Variable)) {
                    kept.push(v);
                }
            });
            writeBack(r, kept);
            return pointer(rt, r, r.from + kept.length);
        });
        // binary search on a sorted range, as libstdc++ does it
        const bound = (name: string, goRight: (rt: CRuntime, comp: Comp, x: Variable, value: Variable) => Gen<boolean>) =>
            function* (rt: CRuntime, first: Variable, last: Variable, value: Variable, comp: Comp): Gen<number> {
                const r = range(rt, name, first, last);
                let lo = r.from;
                let len = r.to - r.from;
                while (len > 0) {
                    const half = len >> 1;
                    if (yield* goRight(rt, comp, r.cells[lo + half], value)) {
                        lo += half + 1;
                        len -= half + 1;
                    } else {
                        len = half;
                    }
                }
                return lo;
            };
        const lower = bound("lower_bound", (rt, comp, x, value) => compareWith(rt, comp, x, value));
        const upper = bound("upper_bound", function* (rt, comp, x, value) { return !(yield* compareWith(rt, comp, value, x)); });
        reg("lower_bound", function* (rt, _this, first, last, value, comp) {
            return pointer(rt, range(rt, "lower_bound", first, last), yield* lower(rt, first, last, value, comp));
        });
        reg("upper_bound", function* (rt, _this, first, last, value, comp) {
            return pointer(rt, range(rt, "upper_bound", first, last), yield* upper(rt, first, last, value, comp));
        });
        reg("binary_search", function* (rt, _this, first, last, value, comp) {
            const r = range(rt, "binary_search", first, last);
            const i = yield* lower(rt, first, last, value, comp);
            const found = i < r.to && !(yield* compareWith(rt, comp, value, r.cells[i]));
            return rt.val(rt.boolTypeLiteral, found);
        });
        // next_permutation / prev_permutation: the next arrangement in dictionary order
        const permutation = (name: string, next: boolean) => reg(name, function* (rt, _this, first, last, comp) {
            const r = range(rt, name, first, last);
            const vals = values(r);
            const cell = (v: any) => ({ t: r.t, v, left: true } as Variable);
            const before = (a: any, b: any) => next ? compareWith(rt, comp, cell(a), cell(b)) : compareWith(rt, comp, cell(b), cell(a));
            let i = vals.length - 1;
            while (i > 0 && !(yield* before(vals[i - 1], vals[i]))) { i--; }
            if (i <= 0) {
                writeBack(r, vals.reverse());
                return rt.val(rt.boolTypeLiteral, false);
            }
            let j = vals.length - 1;
            while (!(yield* before(vals[i - 1], vals[j]))) { j--; }
            [vals[i - 1], vals[j]] = [vals[j], vals[i - 1]];
            writeBack(r, vals.slice(0, i).concat(vals.slice(i).reverse()));
            return rt.val(rt.boolTypeLiteral, true);
        });
        permutation("next_permutation", true);
        permutation("prev_permutation", false);
        // __gcd(12, 18) == 6, as in libstdc++
        reg("__gcd", (rt, _this, a, b) => {
            if (!a || !b || !rt.isIntegerType(a) || !rt.isIntegerType(b)) {
                rt.raiseException("__gcd needs two integers");
            }
            let [x, y] = [a.v as number, b.v as number];
            while (y !== 0) {
                [x, y] = [y, x % y];
            }
            return rt.val(rt.promoteNumeric(a.t, b.t), x);
        });
    }
};
