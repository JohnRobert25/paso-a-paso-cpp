#include <iostream>
using namespace std;
int main() {
    int a = 2000000000, b = 2000000000;
    cout << a + b << "\n";
    int c = 2147483647;
    c++;
    cout << c << "\n";
    int d = 100000;
    cout << d * d << "\n";
    int e = 3000000000LL;
    cout << e << "\n";
    unsigned int u = 0;
    u--;
    cout << u << " " << u + 2 << "\n";
    char ch = 127;
    ch++;
    cout << (int)ch << "\n";
    int f = -2147483647 - 1;
    cout << f - 1 << "\n";
    return 0;
}
