import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Equipments = mydb["equipment"]
EquipmentOutage = mydb["equipmentoutages"]






df= pd.read_excel('cod3n4_Sep21.xlsx', sheet_name='Equipment')

tempdf= df

df_website = pd.read_excel('COD4_WebsiteSep21.xlsx')





Monthcols=['Oct, 2020', 'Nov, 2020', 'Dec, 2020', 'Jan, 2021', 'Feb, 2021', 'Mar, 2021', 'Apr, 2021', 'May, 2021', 'Jun, 2021', 'Jul, 2021', 'Aug, 2021', 'Sep, 2021']

monthList =[10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
yearList = [2020, 2020, 2020, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021]



def InsertOutage(eachMcol, equipment, comsrwebHourMin, srpcHourMin):
	

	indexDate = Monthcols.index(eachMcol)
	year = yearList[indexDate]
	month = monthList[indexDate]
	outageStartDate=datetime.datetime(year, month, 1, 0, 0)

	Hour = int(comsrwebHourMin.split(':')[0])
	Minute = int(comsrwebHourMin.split(':')[1])
	
	comsrwebDt = datetime.datetime(year, month, 1, 0, 0) + datetime.timedelta(hours = Hour, minutes = Minute)

	Hour = int(srpcHourMin.split(':')[0])
	Minute = int(srpcHourMin.split(':')[1])

	srpcDt = datetime.datetime(year, month, 1, 0, 0) + datetime.timedelta(hours = Hour, minutes = Minute)

	if(comsrwebDt>srpcDt):
		return

	diff = srpcDt - comsrwebDt

	outageEndDate = outageStartDate + diff

	# print(outageStartDate, outageEndDate)
	if(outageStartDate==outageEndDate):
		return
	
	equipmentOutage={}
	equipmentOutage['linksAffected']=[]
	equipmentOutage['Approvalstatus']='Pending'
	equipmentOutage['d3mailStatus']=False
	equipmentOutage['deleteStatus']=0
	equipmentOutage['availedStatus']=1
	equipmentOutage['equipment'] = equipment['_id']
	equipmentOutage['outageType']='Forced'
	equipmentOutage['reasonPrecautions']='Migrating to Web Based, Inserted difference previous outages by Script'
	equipmentOutage['alternateChannelStatus']='NA'
	equipmentOutage['outageStartDate']=outageStartDate
	equipmentOutage['outageEndDate']=outageEndDate
	equipmentOutage['requestingAgency'] =ObjectId('5fed626e398e7129248eb600')
	equipmentOutage['requestSubmittedDate']=datetime.datetime.now()

	


	equipmentOutageinserted=EquipmentOutage.insert_one(equipmentOutage)

	print(equipmentOutageinserted)




# df['Location'] = df['Channel Routing'].fillna('')

# df_website['Channel Routing'] = df_website['Channel Routing'].fillna('')

df['Ownership'] = df['Ownership'].fillna('')

df['Location of the Equipment / Name of Station'] = df['Location of the Equipment / Name of Station'].fillna('')

df_website['Location of the Equipment / Name of Station'] = df_website['Location of the Equipment / Name of Station'].fillna('')


df['Location'] = df['Location of the Equipment / Name of Station']
df['Name'] = df['Name of the communication equipment']

df_website['Location'] = df_website['Location of the Equipment / Name of Station'].fillna('')
df_website['Name'] = df_website['Name of the communication equipments'].fillna('')



for index, row in df.iterrows():
	if(np.isnan(row['SL'])):		
		continue
	flag=1
	try:
		if(row['Ownership'] ):		
			# print(row['SL'], row['Ownership'])
			link = {}
			
			
			df.at[index+3, 'Location'] = row['Location'].strip()
			df.at[index+3, 'Name'] = row['Name'].strip()
		

	except Exception as e:
		import pdb
		pdb.set_trace()
		print(e)
	else:
		pass
	finally:
		pass


for index, row in df_website.iterrows():
	if(np.isnan(row['SL'])):		
		continue
	flag=1
	try:
		if(row['Ownership'] ):		
			print(row['SL'], row['Ownership'])
			link = {}
			
			
			df_website.at[index+3, 'Location'] = row['Location'].strip()
			df_website.at[index+3, 'Name'] = row['Name'].strip()

	except Exception as e:
		import pdb
		pdb.set_trace()
		print(e)
	else:
		pass
	finally:
		pass


# df= pd.DataFrame(linksSegregated)
# df.to_csv('abc.csv', index=False)

df_website = df_website[df_website['Nature of outage (Forced (F) / Planned (P)']=='Total']

# import pdb
# pdb.set_trace()
df = df[df['Nature of outage (Forced (F) / Planned (P)']=='Total']
df.reset_index(inplace=True)
# import pdb
# pdb.set_trace()

### Src Dest Desc Chann 
df_website['Location'] = df_website['Location'].fillna('')
df_website['Location'] = df_website['Location'].str.upper()
df_website['Name'] = df_website['Name'].fillna('')
df_website['Name'] = df_website['Name'].str.upper()

df['Name'] = df['Name'].fillna('')


DescripList = []
DuplicateList = []
NotFoundList = []

import math

########element found list in website
# 'Source Station', 'Destination Station', 'Description','Channel Routing'

# import pdb
# pdb.set_trace()a

for index, row in df.iterrows():
	print(index)
	temp_df=df_website[((df_website['Location']==row['Location'].upper()) & (df_website['Name']==row['Name'].upper()))]
	
	print(index)
	if(len(temp_df)==1 ):
		
		for eachMonth in Monthcols:
			DictItem = {'Name of Equipment': row['Name'], 'Location': row['Location']}
			hourminute = ''
			if(isinstance(row[eachMonth], datetime.datetime)):
				if(row[eachMonth]<datetime.datetime(1900, 1, 1, 0, 0)):
					hourminute='00:00'
				else:
					row[eachMonth] = row[eachMonth].replace(year=1900, month=1)
					diff = row[eachMonth] - datetime.datetime(1900, 1, 1, 0, 0)
					hourminute = str(diff.days * 24 + math.floor((diff.seconds/(60*60))) + 24)
					
					hourminute+=':'+ str(int(int(diff.seconds-math.floor((diff.seconds/(60*60)))*60*60)/60)).zfill(2)
			else:
				hourminute = row[eachMonth].strftime("%H:%M")
			
			if(not (temp_df[eachMonth].iloc[0]==hourminute)):
				
				DictItem['Month'] = eachMonth
				DictItem['SRPC_Reported'] = hourminute
				DictItem['Website_Reported'] = temp_df[eachMonth].iloc[0]
				# print(eachMonth, hourminute, row['Location'], temp_df[eachMonth].iloc[0])
				DescripList.append(DictItem)

				equipmento = Equipments.find_one({'description': DictItem['Name of Equipment'], 'location': DictItem['Location'].strip()})
				# InsertOutage(eachMonth, equipmento, temp_df[eachMonth].iloc[0], hourminute)

	elif(len(temp_df)>1):
		DictItem = {'Name of Equipment': row['Name'], 'Location': row['Location']}		
		DuplicateList.append(DictItem)
	else:
		DictItem = {'Name of Equipment': row['Name'], 'Location': row['Location']}
		if(DictItem['Location']):
			NotFoundList.append(DictItem)

pd.DataFrame().from_dict(DescripList).to_excel('COD4DescrepancyList.xlsx')
pd.DataFrame().from_dict(DuplicateList).to_excel('COD4DuplicateList.xlsx')
pd.DataFrame().from_dict(NotFoundList).to_excel('COD4NotFoundList.xlsx')

	# else:
	# 	print("Not found in DataBase")
	# print(temp_df)


###element not found list in website





import pdb
pdb.set_trace()


print()