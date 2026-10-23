#include <iostream>
using namespace std;
int main() {
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0) continue;
        if (i > 8) break;
        cout << i << " ";
    }
    cout << "\n";
    return 0;
}
