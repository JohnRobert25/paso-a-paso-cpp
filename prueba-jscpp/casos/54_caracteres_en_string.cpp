#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main() {
    string s;
    cin >> s;
    int veces[26] = {0};
    string mayus = "";
    for (int i = 0; i < (int)s.size(); i++) {
        veces[s[i] - 'a']++;
        mayus += (char)toupper(s[i]);
        mayus += s[i] - 32;
    }
    cout << mayus << "\n";
    for (int k = 0; k < 26; k++) if (veces[k]) cout << (char)('a' + k) << veces[k];
    cout << "\n";
    s[0] = s[0] + 1;
    cout << s << " " << s[0] << s[s.size() - 1] << "\n";
    return 0;
}
