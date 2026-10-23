#include <iostream>
#include <string>
using namespace std;
int main() {
    int n;
    cin >> n;
    cin.ignore();
    string linea;
    getline(cin, linea);
    cout << n << ":" << linea << "\n";
    string nombre, ciudad;
    getline(cin, nombre, ',');
    getline(cin, ciudad);
    cout << nombre << "|" << ciudad << "\n";
    string palabra;
    int k = 0;
    while (cin >> palabra) k++;
    cout << k << " palabras\n";
    return 0;
}
