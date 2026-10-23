#include <iostream>
using namespace std;
int main() {
    int a = 5;
    a += 3; a -= 1; a *= 2; a /= 3; a %= 3;
    cout << a << "\n";
    int i = 0;
    i++;
    ++i;
    cout << i << "\n";
    int x = 10, y = 3;
    cout << (x > y && y > 0) << " " << (x == y || false) << "\n";
    cout << (x & y) << " " << (x | y) << " " << (x ^ y) << " " << (x << 2) << "\n";
    return 0;
}
