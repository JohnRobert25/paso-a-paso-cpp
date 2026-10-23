#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int a[5] = {5, 1, 4, 2, 3};
    sort(a, a + 5);
    for (int i = 0; i < 5; i++) cout << a[i] << " ";
    cout << "\n";
    return 0;
}
