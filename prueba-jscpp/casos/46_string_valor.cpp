#include <iostream>
#include <string>
using namespace std;
string duplica(string s) {
    s += s;
    return s;
}
void agrega(string &s) {
    s += "!";
}
int main() {
    string a = "hola";
    string b = a;
    b[0] = 'H';
    cout << a << " " << b << "\n";
    string c = duplica(a);
    cout << a << " " << c << "\n";
    agrega(a);
    cout << a << "\n";
    string nombres[3] = {"Ana", "Luis", "Eva"};
    swap(nombres[0], nombres[2]);
    for (int i = 0; i < 3; i++) cout << nombres[i] << " ";
    cout << "\n";
    string d;
    d = a;
    a[0] = 'X';
    cout << a << " " << d << "\n";
    return 0;
}
