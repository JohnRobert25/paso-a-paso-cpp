#include <iostream>
using namespace std;
int m[10][10];
int main() {
    int r, c;
    cin >> r >> c;
    for (int i = 0; i < r; i++)
        for (int j = 0; j < c; j++)
            cin >> m[i][j];
    for (int j = 0; j < c; j++) {
        for (int i = 0; i < r; i++) cout << m[i][j] << " ";
        cout << "\n";
    }
    return 0;
}
