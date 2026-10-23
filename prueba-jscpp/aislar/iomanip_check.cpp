#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    cout << setprecision(3) << 100.0 << " " << 0.5 << " " << 1e10 << "\n";
    cout << setw(8) << 0.1 + 0.2 << "|" << setfill('0') << setw(5) << 42 << "\n";
    cout << fixed << setprecision(2) << 3.14159 << " " << 2.0 << "\n";
    return 0;
}
