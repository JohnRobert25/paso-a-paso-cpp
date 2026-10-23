#include <iostream>
using namespace std;
int cuadrado(int x) { return x * x; }
void duplicar(int &x) { x *= 2; }
bool esPrimo(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;
    return true;
}
int main() {
    int a = 7;
    cout << cuadrado(a) << "\n";
    duplicar(a);
    cout << a << "\n";
    for (int i = 1; i <= 20; i++) if (esPrimo(i)) cout << i << " ";
    cout << "\n";
    return 0;
}
