#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    cin >> s;
    cout << s.size() << " " << s[0] << "\n";
    string t = s + "!";
    cout << t << "\n";
    for (int i = s.size() - 1; i >= 0; i--) cout << s[i];
    cout << "\n";
    return 0;
}
