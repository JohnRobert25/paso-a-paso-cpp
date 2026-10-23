#include <iostream>
#include <string>
using namespace std;
int main() {
    int a[5] = {1, 2, 3, 4, 5};
    int suma = 0;
    for (int x : a) suma += x;
    for (int &x : a) x *= 2;
    for (auto x : a) cout << x << " ";
    cout << suma << "\n";
    string s = "abc";
    for (auto c : s) cout << (int)c << " ";
    cout << "\n";
    for (char c : s) {
        if (c == 'b') continue;
        cout << c;
    }
    cout << "\n";
    return 0;
}
