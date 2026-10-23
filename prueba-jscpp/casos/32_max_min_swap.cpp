#include <iostream>
#include <algorithm>
#include <cmath>
using namespace std;
int main() {
    int a = 3, b = 8;
    cout << max(a, b) << " " << min(a, b) << "\n";
    swap(a, b);
    cout << a << " " << b << "\n";
    cout << abs(-5) << " " << sqrt(16.0) << " " << pow(2, 10) << "\n";
    return 0;
}
