#include <iostream>
using namespace std;
int main() {
    int x = -5;
    char c = 'A';
    long long big = 3000000000;
    cout << -x << " " << -c << " " << c + 1 << " " << big * 2 << "\n";
    cout << 0x10 << " " << 017 << " " << 0b101 << " " << 10U << " " << 5LL * 3 << "\n";
    long long m = 1LL << 40;
    cout << m << " " << (1 << 20) << " " << 2147483647LL + 1 << "\n";
    unsigned int u = 7;
    cout << u * 2 << " " << u / 2 << " " << -1000000000LL * 3 << "\n";
    int a = 7, b = -3;
    cout << a / b << " " << a % b << " " << -a / 2 << "\n";
    return 0;
}
