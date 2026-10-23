#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    double x;
    cin >> x;
    cout << fixed << setprecision(2) << x * 3 << endl;
    cout << setprecision(4) << 1.0 / 3 << endl;
    return 0;
}
