#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    v.push_back(99);
    cout << v.size() << " " << v.back() << "\n";
    return 0;
}
