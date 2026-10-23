#include <iostream>
using namespace std;
const int MAXN = 100005;
int a[MAXN];
int main() {
    int n;
    cin >> n;
    long long suma = 0;
    for (int i = 0; i < n; i++) { cin >> a[i]; suma += a[i]; }
    cout << suma << "\n";
    return 0;
}
