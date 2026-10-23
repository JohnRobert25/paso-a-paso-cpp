#include <iostream>
#include <climits>
using namespace std;
const long long INF = 1e18;
int main() {
    long long a = 1000000000LL * 1000000000LL;
    long long best = LLONG_MAX;
    long long mod = 1000000007;
    long long p = (999999999LL * 999999999LL) % mod;
    cout << a << " " << (best > INF) << " " << INF << " " << p << "\n";
    return 0;
}
