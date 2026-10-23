#include <iostream>
using namespace std;
void f(int& x){ x*=2; }
int main(){ int a=3; f(a); cout<<a; return 0; }
