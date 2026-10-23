#include <iostream>
#include <string>
using namespace std;
int main() {
    string s = "programacion";
    cout << s.substr(3) << " " << s.substr(0, 4) << " " << s.substr(8, 100) << "\n";
    cout << s.find("gra") << " " << s.find('a') << " " << s.find('a', 6) << " " << s.rfind('a') << "\n";
    if (s.find("xyz") == string::npos) cout << "no esta\n";
    s.insert(0, "la ");
    s.erase(3, 4);
    s.replace(0, 2, "LA");
    s.append("!");
    s.push_back('?');
    cout << s << " " << s.size() << " " << s.length() << " " << s.back() << s.front() << "\n";
    s.pop_back();
    string t = "abc";
    cout << (t < "abd") << (t == "abc") << ("abc" == t) << (t != s) << (t > "ab") << "\n";
    string u = "x" + t + 'y' + "z";
    cout << u << " " << u.at(1) << " " << u.empty() << "\n";
    u.clear();
    cout << u.empty() << "[" << u << "]\n";
    cout << to_string(42) + "-" + to_string(-7) << " " << stoi("  123abc") + 1 << "\n";
    string v(3, 'k');
    cout << v << "\n";
    return 0;
}
