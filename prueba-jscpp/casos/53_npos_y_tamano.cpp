#include <iostream>
#include <string>
using namespace std;
int main() {
    string s = "banana";
    int pos = s.find('z');
    cout << pos << "\n";
    cout << (int)s.find("na") << " " << s.find("na", 3) << "\n";
    cout << s.size() - 2 << "\n";
    int vocales = 0;
    for (int i = 0; i < (int)s.size(); i++) if (s[i] == 'a') vocales++;
    cout << s.size() - vocales << "\n";
    return 0;
}
