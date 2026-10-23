#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    double v[] = {0.1 + 0.2, 1.0 / 3, 100000000.0, 123456.0, 1234567.0, 0.0001, 0.00001234, -2.5, 5, 9.9999999, 1e-10, 0.5, 2.0 / 3 * 3};
    for (int i = 0; i < 13; i++) cout << v[i] << " ";
    cout << "\n";
    cout << setprecision(3) << 3.14159 << " " << 100.0 << " " << 1234.5 << "\n";
    cout << setprecision(10) << 1.0 / 7 << "\n";
    cout << fixed << setprecision(3) << 2.0 / 3 << " " << 5.0 << "\n";
    return 0;
}
