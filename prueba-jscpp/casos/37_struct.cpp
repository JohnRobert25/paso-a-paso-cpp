#include <iostream>
using namespace std;
struct Punto { int x, y; };
int main() {
    Punto p;
    p.x = 3; p.y = 4;
    cout << p.x * p.x + p.y * p.y << "\n";
    return 0;
}
