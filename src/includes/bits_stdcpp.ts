import { CRuntime } from "../rt";

// #include <bits/stdc++.h>, common in contests: loads every standard library this interpreter has
const STANDARD = ["iostream", "iomanip", "cmath", "cstdio", "cstdlib", "cstring", "cctype", "ctime", "climits", "string", "algorithm", "vector", "utility"];

export = {
    load(rt: CRuntime) {
        for (const name of STANDARD) {
            if (name in rt.config.includes) {
                rt.include(name);
            }
        }
    }
};
