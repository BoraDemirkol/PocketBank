import sklearn
import pandas as pd
import numpy as np
df=pd.read_csv('trafikverisi_yeni.csv')
j=0
for i in range(0, len(df)):
    if df['Driver_Alcohol'][i] == 1:

        j+=1
print(j)