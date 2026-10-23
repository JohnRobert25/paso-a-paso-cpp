#include <iostream>
using namespace std;
int main() {
    long long mask = (1LL << 40) | 5;
    cout << mask << " " << (mask & (1LL << 40)) << " " << (mask ^ 1) << " " << (mask >> 38) << "\n";
    int x = 12, y = 10;
    cout << (x & y) << " " << (x | y) << " " << (x ^ y) << " " << (~x) << " " << (x << 3) << " " << (x >> 2) << "\n";
    cout << (-12 >> 1) << " " << (-12 & 7) << " " << (-1 ^ 5) << " " << (~0LL) << "\n";
    unsigned int u = 5;
    cout << (~u) << " " << (u << 3) << "\n";
    for (int s = 0; s < (1 << 3); s++) cout << ((s >> 1) & 1);
    cout << "\n";
    return 0;
}
