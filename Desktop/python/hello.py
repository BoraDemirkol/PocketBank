a=1
b=1
i=0
n=int(input("ilk n değerini giriniz "))
fibonacci=[a,b]
while i<n-2:
    a,b=b,a+b
    fibonacci.append(b)
    i+=1
print(fibonacci)