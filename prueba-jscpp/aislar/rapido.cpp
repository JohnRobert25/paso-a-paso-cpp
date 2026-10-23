#include <iostream>
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::cin.tie(0);
    std::ios_base::sync_with_stdio(0);
    int n;
    std::cin >> n;
    std::cout << n * 2 << std::endl;
    int *p = nullptr;
    std::cout << (p == nullptr) << "\n";
    return 0;
}
