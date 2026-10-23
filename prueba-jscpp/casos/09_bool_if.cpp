#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    bool par = (n % 2 == 0);
    cout << par << "\n";
    if (par) {
        cout << "par\n";
    } else if (n > 0) {
        cout << "impar positivo\n";
    } else {
        cout << "impar negativo\n";
    }
    if (!par || n > 100) cout << "x\n";
    cout << (n > 5 ? "grande" : "chico") << "\n";
    return 0;
}
