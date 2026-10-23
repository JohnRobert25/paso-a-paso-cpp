#include <iostream>
using namespace std;
long long fact(int n) {
    if (n == 0) return 1;
    return n * fact(n - 1);
}
int fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
int main() {
    cout << fact(15) << " " << fib(15) << "\n";
    return 0;
}
