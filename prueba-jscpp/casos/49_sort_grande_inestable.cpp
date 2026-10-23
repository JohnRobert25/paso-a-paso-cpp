#include <iostream>
#include <algorithm>
using namespace std;
int a[300];
bool porUltimaCifra(int x, int y) { return x % 10 < y % 10; }
int main() {
    unsigned int semilla = 12345;
    for (int i = 0; i < 300; i++) {
        semilla = semilla * 1103515245u + 12345u;
        a[i] = (semilla / 65536) % 1000;
    }
    sort(a, a + 300, porUltimaCifra);
    for (int i = 0; i < 300; i++) cout << a[i] << " ";
    cout << "\n";
    sort(a, a + 300);
    for (int i = 0; i < 300; i += 10) cout << a[i] << " ";
    cout << "\n";
    return 0;
}
