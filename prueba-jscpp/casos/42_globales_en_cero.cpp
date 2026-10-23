#include <iostream>
using namespace std;
int cuenta[10];
int total;
long long suma;
double promedio;
bool visto[5];
int m[3][3];
int main() {
    int x;
    while (cin >> x) { cuenta[x]++; total++; suma += x; }
    promedio = (double)suma / total;
    cout << cuenta[3] << " " << cuenta[0] << " " << total << " " << suma << " " << promedio << " " << visto[2] << " " << m[1][2] << "\n";
    return 0;
}
