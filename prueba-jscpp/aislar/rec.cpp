#include <iostream>
using namespace std;
int fact(int n) {
    if (n == 0) return 1;
    int r = n * fact(n - 1);
    return r;
}
int main() {
    int x = fact(3);
    cout << x << endl;
    return 0;
}
