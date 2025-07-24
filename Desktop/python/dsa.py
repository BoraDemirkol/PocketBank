class Araba():
    def __init__(self,marka,model,yil,km,fiyat,renk):
        self.marka=marka
        self.model=model
        self.yil=yil
        self.km=km
        self.fiyat=fiyat
        self.renk=renk
    def renk_degistir(self,yenirenk):
        self.renk=yenirenk
    def fiyat_artısı(self,artıs):
        self.fiyat+=artıs
    def bilgilerigoster(self):
        print(f"""
        Marka:{self.marka}
        Model:{self.model}
        Yıl:{self.yil}
        Kilometresi:{self.km}
        Fiyatı:{self.fiyat}
        Rengi:{self.renk}
        """)

class Motor(Araba):
    def __init__(self,marka,model,yil,km,fiyat,renk,teker):
        super().__init__(marka,model,yil,km,fiyat,renk)
        self.teker=teker
    def bilgilerigoster(self):
        print(f"""
        Marka:{self.marka}
        Model:{self.model}
        Yıl:{self.yil}
        Kilometresi:{self.km}
        Fiyatı:{self.fiyat}
        Rengi:{self.renk}
        Teker sayisi:{self.teker}
        """)

motor1=Motor("Honda","Dio",2022,0,100000,"Siyah",2)
motor1.fiyat_artısı(20000)
motor1.bilgilerigoster
