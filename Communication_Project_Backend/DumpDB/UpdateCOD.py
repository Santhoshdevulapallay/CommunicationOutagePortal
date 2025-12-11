import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Links = mydb["links"]
LinkOutage = mydb["linkoutages"]


df= pd.read_excel('comcod3n4_dec.xlsx')



userList=['PGCIL', 'PGCIL SR 1', 'PGCIL SR 2', 'APTRANSCO', 'KPTCL', 'KSEBL', 'TANTRANSCO', 'TSTRANSCO', 'PED, Puducherry', 'SRLDC']

Monthcols=['Aug, 2019', 'Sep, 2019', 'Oct, 2019', 'Nov, 2019', 'Dec, 2019', 'Jan, 2020', 'Feb, 2020', 'Mar, 2020', 'Apr, 2020', 'May, 2020', 'Jun, 2020', 'Jul, 2020', 'Aug, 2020', 'Sep, 2020', 'Oct, 2020', 'Nov,2020', 'Dec, 2020']

monthList =[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
yearList = [2019, 2019, 2019, 2019, 2019, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020, 2020]


def InsertOutage(df, index, eachMcol, link):

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

	print(outageStartDate, outageEndDate)
	if(outageStartDate==outageEndDate):
		return
	
	linkOutage={}
	linkOutage['Approvalstatus']='Pending'
	linkOutage['d3mailStatus']=False
	linkOutage['deleteStatus']=0
	linkOutage['availedStatus']=1
	linkOutage['link'] = link['_id']
	linkOutage['outageType']='Forced'
	linkOutage['reasonPrecautions']='Migrating to Web Based, Inserted previous outages by Script'
	linkOutage['alternateChannelStatus']='NA'
	linkOutage['outageStartDate']=outageStartDate
	linkOutage['outageEndDate']=outageEndDate
	linkOutage['requestingAgency'] =ObjectId('5fed626e398e7129248eb600')
	linkOutage['requestSubmittedDate']=datetime.datetime.now()
	linkoutageinserted=LinkOutage.insert_one(linkOutage)

	print(linkoutageinserted)
	


for index, row in df.iterrows():
	if(np.isnan(row['SL'])):

		continue
	flag=1
	try:
		link = {}


		link['source'] = row['Source Station'].strip()
		link['destination'] = row['Destination Station'].strip()
		link['description'] = row['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)'].strip()
		
		try:
			link['channelRouting'] = row['Channel Routing'].strip()
		except Exception as e:
			link['channelRouting']=''
		

		linko = Links.find_one({'description': row['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)'].strip(), 'source': row['Source Station'].strip(), 'destination': row['Destination Station'].strip(), 'channelRouting': link['channelRouting'] })

		# for x in linko:
		# 			print(x['source'])
		if( linko):
			# print(row['SL'], row['Source Station'].strip(), row['Name of the owner / User'].strip())
			for eachMcol in Monthcols:
				InsertOutage(df, index, eachMcol, linko)
				InsertOutage(df, index+1, eachMcol, linko)
				InsertOutage(df, index+2, eachMcol, linko)

	

	except Exception as e:
		import pdb
		pdb.set_trace()
	else:
		pass
	finally:
		pass





