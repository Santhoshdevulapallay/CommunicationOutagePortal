import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Equipments = mydb["equipment"]
EquipmentOutage = mydb["equipmentoutages"]


df= pd.read_excel('comcod3n4_dec.xlsx', sheet_name='Equipment')



userList=['PGCIL', 'PGCIL SR 1', 'PGCIL SR 2', 'APTRANSCO', 'KPTCL', 'KSEBL', 'TANTRANSCO', 'TSTRANSCO', 'PED, Puducherry', 'SRLDC']

Monthcols=['Aug, 2019', 'Sep, 2019', 'Oct, 2019', 'Nov, 2019', 'Dec, 2019', 'Jan, 2020', 'Feb, 2020', 'Mar, 2020', 'Apr, 2020', 'May, 2020', 'Jun, 2020', 'Jul, 2020', 'Aug, 2020', 'Sep, 2020', 'Oct, 2020', 'Nov, 2020', 'Dec, 2020']

monthList =[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
yearList = [2019, 2019, 2019, 2019, 2019, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020]


def InsertOutage(df, index, eachMcol, equipment):

	indexDate = Monthcols.index(eachMcol)
	year = yearList[indexDate]
	month = monthList[indexDate]
	outageStartDate=datetime.datetime(year, month, 1, 0, 0)
	try:
		if(isinstance(df[eachMcol].iloc[index], datetime.time)):
			outageEndDate=(datetime.datetime.combine(datetime.date(year, month, 1), df[eachMcol].iloc[index]))
		elif(isinstance(df[eachMcol].iloc[index], datetime.datetime)):
			outageEndDate = df[eachMcol].iloc[index].replace(year=year, month=month)
		else:
			return
	except Exception as e:
		print(str(e))
		import pdb
		pdb.set_trace()
	else:
		pass
	finally:
		pass

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
	equipmentOutage['reasonPrecautions']='Migrating to Web Based, Inserted previous outages by Script'
	equipmentOutage['alternateChannelStatus']='NA'
	equipmentOutage['outageStartDate']=outageStartDate
	equipmentOutage['outageEndDate']=outageEndDate
	equipmentOutage['requestingAgency'] =ObjectId('5fed626e398e7129248eb600')
	equipmentOutage['requestSubmittedDate']=datetime.datetime.now()
	equipmentOutageinserted=EquipmentOutage.insert_one(equipmentOutage)

	print(equipmentOutageinserted)
	


for index, row in df.iterrows():
	if(np.isnan(row['SL'])):

		continue
	flag=1
	try:
		equipment = {}


		equipment['description'] = row['Name of the communication equipments'].strip()
		equipment['location'] = row['Location of the Equipment / Name of Station'].strip()
		
		

		equipmento = Equipments.find_one({'description': equipment['description'], 'location': equipment['location'].strip() })

		
		if( equipmento):
			for eachMcol in Monthcols:
				InsertOutage(df, index, eachMcol, equipmento)
				InsertOutage(df, index+1, eachMcol, equipmento)
				InsertOutage(df, index+2, eachMcol, equipmento)
			
			
		
	

	except Exception as e:
		import pdb
		pdb.set_trace()
	else:
		pass
	finally:
		pass





