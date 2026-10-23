#include <iostream>
#include <string>
#include <cctype>
using namespace std;
void incrementa(int &x) { x++; }
void ordena(int &a, int &b) {
    if (a > b) {
        int t = a;
        a = b;
        b = t;
    }
}
int largo(const string &s) { return s.size(); }
int main() {
    int a[3] = {5, 9, 1};
    incrementa(a[1]);
    ordena(a[0], a[2]);
    cout << a[0] << " " << a[1] << " " << a[2] << "\n";
    int &r = a[2];
    r = 100;
    cout << a[2] << " " << largo("cinco") << "\n";
    string s = "hola mundo";
    for (char &c : s) c = toupper(c);
    cout << s << "\n";
    return 0;
}
