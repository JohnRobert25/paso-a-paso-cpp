#include <iostream>
using namespace std;
typedef long long ll;
#define FOR(i, n) for (int i = 0; i < (n); i++)
int main() {
    ll s = 0;
    FOR(i, 5) s += i;
    cout << s << "\n";
    return 0;
}
