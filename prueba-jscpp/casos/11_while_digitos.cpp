#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int suma = 0, cifras = 0;
    while (n > 0) {
        suma += n % 10;
        n /= 10;
        cifras++;
    }
    cout << suma << " " << cifras << endl;
    return 0;
}
