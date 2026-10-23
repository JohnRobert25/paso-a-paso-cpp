#include <iostream>
using namespace std;
int main() {
    char c;
    cin >> c;
    cout << c << " " << (int)c << "\n";
    char d = c + 1;
    cout << d << "\n";
    if (c >= 'a' && c <= 'z') cout << (char)(c - 'a' + 'A') << "\n";
    return 0;
}
