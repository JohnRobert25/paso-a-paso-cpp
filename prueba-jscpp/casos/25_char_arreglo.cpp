#include <iostream>
#include <cstring>
using namespace std;
int main() {
    char s[100];
    cin >> s;
    int n = strlen(s);
    cout << n << "\n";
    for (int i = 0; i < n; i++) if (s[i] == 'a') s[i] = '4';
    cout << s << "\n";
    return 0;
}
