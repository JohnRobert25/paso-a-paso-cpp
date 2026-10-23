#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int mayor = -1000000000, menor = 1000000000;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        if (x > mayor) mayor = x;
        if (x < menor) menor = x;
    }
    cout << mayor << " " << menor << "\n";
    return 0;
}
