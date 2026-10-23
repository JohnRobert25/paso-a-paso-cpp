#include <iostream>
#include <algorithm>
#include <string>
using namespace std;
bool porCalificacion(pair<int, string> a, pair<int, string> b) {
    return a.first > b.first;
}
int main() {
    pair<int, string> p[20];
    string nombres[5] = {"Ana", "Beto", "Caro", "Dani", "Eva"};
    for (int i = 0; i < 20; i++) {
        p[i].first = (i * 7) % 4;
        p[i].second = nombres[i % 5] + to_string(i);
    }
    sort(p, p + 20, porCalificacion);
    for (int i = 0; i < 20; i++) cout << p[i].first << p[i].second << " ";
    cout << "\n";
    sort(p, p + 20);
    for (int i = 0; i < 20; i++) cout << p[i].first << p[i].second << " ";
    cout << "\n";
    pair<int, int> q = make_pair(3, 4);
    pair<int, int> w = {3, 2};
    cout << (w < q) << " " << q.first + q.second << "\n";
    int a[6] = {4, 1, 6, 2, 9, 3};
    sort(a, a + 6, greater<int>());
    for (int i = 0; i < 6; i++) cout << a[i] << " ";
    cout << "\n";
    string s = "murcielago";
    sort(s.begin(), s.end());
    cout << s << "\n";
    return 0;
}
