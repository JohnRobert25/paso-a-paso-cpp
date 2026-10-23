#include <iostream>
#include <algorithm>
#include <string>
using namespace std;
int main() {
    int a[10] = {5, 3, 8, 3, 1, 8, 8, 2, 9, 3};
    cout << *max_element(a, a + 10) << " " << max_element(a, a + 10) - a << " " << min_element(a, a + 10) - a << "\n";
    cout << count(a, a + 10, 8) << " " << find(a, a + 10, 1) - a << "\n";
    reverse(a, a + 10);
    for (int i = 0; i < 10; i++) cout << a[i] << " ";
    cout << "\n";
    sort(a, a + 10);
    int n = unique(a, a + 10) - a;
    for (int i = 0; i < n; i++) cout << a[i] << " ";
    cout << "\n";
    cout << lower_bound(a, a + n, 4) - a << " " << upper_bound(a, a + n, 3) - a << " " << binary_search(a, a + n, 8) << binary_search(a, a + n, 7) << "\n";
    int p[3] = {1, 2, 3};
    do {
        cout << p[0] << p[1] << p[2] << " ";
    } while (next_permutation(p, p + 3));
    cout << "\n";
    cout << __gcd(12, 18) << " " << max(string("pera"), string("manzana")) << " " << min(7, -2) << "\n";
    fill(a, a + 3, 0);
    stable_sort(a, a + 10);
    for (int i = 0; i < 10; i++) cout << a[i] << " ";
    cout << "\n";
    return 0;
}
