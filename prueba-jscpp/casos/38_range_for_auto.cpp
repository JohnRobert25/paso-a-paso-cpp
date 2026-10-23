#include <iostream>
using namespace std;
int main() {
    int a[3] = {1, 2, 3};
    for (int x : a) cout << x << " ";
    auto y = 5;
    cout << y << "\n";
    return 0;
}
