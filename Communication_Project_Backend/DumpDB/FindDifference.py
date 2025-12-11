import pandas as pd
import numpy as np
import pymongo
import datetime
import math
from bson.objectid import ObjectId


myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Links = mydb["links"]
LinkOutage = mydb["linkoutages"]


df= pd.read_excel('cod3n4_Oct21.xlsx')

tempdf= df

df_website = pd.read_excel('COD3_WebsiteOct21.xlsx')





Monthcols=[ 'Nov, 2020', 'Dec, 2020', 'Jan, 2021', 'Feb, 2021', 'Mar, 2021', 'Apr, 2021', 'May, 2021', 'Jun, 2021', 'Jul, 2021', 'Aug, 2021', 'Sep, 2021', 'Oct, 2021']
monthList =[ 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
yearList = [ 2020, 2020, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021, 2021]


def InsertOutage(eachMcol, link, comsrwebHourMin, srpcHourMin):

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



	if(outageStartDate==outageEndDate):
		return
	
	linkOutage={}
	linkOutage['Approvalstatus']='Pending'
	linkOutage['d3mailStatus']=False
	linkOutage['deleteStatus']=0
	linkOutage['availedStatus']=1
	linkOutage['link'] = link['_id']
	linkOutage['outageType']='Forced'
	linkOutage['reasonPrecautions']='Migrating to Web Based, Inserted difference previous outages by Script'
	linkOutage['alternateChannelStatus']='NA'
	linkOutage['outageStartDate']=outageStartDate
	linkOutage['outageEndDate']=outageEndDate
	linkOutage['requestingAgency'] =ObjectId('5fed626e398e7129248eb600')
	linkOutage['requestSubmittedDate']=datetime.datetime.now()
	
	# import pdb
	# pdb.set_trace()

	linkoutageinserted=LinkOutage.insert_one(linkOutage)

	print(linkoutageinserted)



df['Channel Routing'] = df['Channel Routing'].fillna('')

df_website['Channel Routing'] = df_website['Channel Routing'].fillna('')


df['Description'] = df['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)']
df_website['Description']= df_website['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)']

for index, row in df.iterrows():
	if(np.isnan(row['SL'])):		
		continue
	flag=1
	try:
		if(row['Ownership'] ):		
			print(row['SL'], row['Ownership'])
			link = {}
			
			
			df.at[index+3, 'Source Station'] = row['Source Station'].strip()
			df.at[index+3, 'Destination Station'] = row['Destination Station'].strip()
			df.at[index+3, 'Channel Routing'] = row['Channel Routing'].strip()
			df.at[index+3, 'Description'] = row['Description'].strip()		

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
			
			
			df_website.at[index+3, 'Source Station'] = row['Source Station'].strip()
			df_website.at[index+3, 'Destination Station'] = row['Destination Station'].strip()
			df_website.at[index+3, 'Channel Routing'] = row['Channel Routing'].strip()
			df_website.at[index+3, 'Description'] = row['Description'].strip()	

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

df = df[df['Nature of outage (Forced (F) / Planned (P)']=='Total']

df['Source Station'] = df['Source Station'].fillna('')

### Src Dest Desc Chann 


DescripList = []
DuplicateList = []
NotFoundList = []


########element found list in website
# 'Source Station', 'Destination Station', 'Description','Channel Routing'
for index, row in df.iterrows():
	temp_df=df_website[((df_website['Source Station']==row['Source Station']) & (df_website['Destination Station']==row['Destination Station'])
			& (df_website['Description']==row['Description']) & (df_website['Channel Routing']==row['Channel Routing']))]
	
	if(len(temp_df)==1 ):
		for eachMonth in Monthcols:
			DictItem = {'Source Station': row['Source Station'], 'Destination Station': row['Destination Station'],
				'Description': row['Description'], 'Channel Routing': row['Channel Routing']
				}
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
			if(not temp_df[eachMonth].iloc[0]==hourminute):
				DictItem['Month'] = eachMonth
				DictItem['SRPC_Reported'] = hourminute
				DictItem['Website_Reported'] = temp_df[eachMonth].iloc[0]
				DescripList.append(DictItem)
				linko = Links.find_one({'description': DictItem['Description'].strip(), 'source': DictItem['Source Station'].strip(), 'destination': DictItem['Destination Station'].strip(), 'channelRouting': DictItem['Channel Routing'] })
				# InsertOutage(eachMonth, linko, temp_df[eachMonth].iloc[0], hourminute)
	elif(len(temp_df)>1):
		DictItem = {'Source Station': row['Source Station'], 'Destination Station': row['Destination Station'],
				'Description': row['Description'], 'Channel Routing': row['Channel Routing']
				}		
		DuplicateList.append(DictItem)
	else:
		DictItem = {'Source Station': row['Source Station'], 'Destination Station': row['Destination Station'],
				'Description': row['Description'], 'Channel Routing': row['Channel Routing']
				}
		if(DictItem['Source Station']):
			NotFoundList.append(DictItem)

pd.DataFrame().from_dict(DescripList).to_excel('COD3DescrepancyList.xlsx')
pd.DataFrame().from_dict(DuplicateList).to_excel('COD3DuplicateList.xlsx')
pd.DataFrame().from_dict(NotFoundList).to_excel('COD3NotFoundList.xlsx')

	# else:
	# 	print("Not found in DataBase")
	# print(temp_df)


###element not found list in website





import pdb
pdb.set_trace()


print()


# df_website['Source Station'] = df_website['Source Station'].fillna('')
# # df_website['Destination Station'] = df_website['Destination Station'].fillna('')
# # df_website['Description'] = df_website['Description'].fillna('')
# # df_website['Channel Routing'] = df_website['Channel Routing'].fillna('')
# # df_website['Source Station'] = df_website['Source Station'].str.upper()
# # df_website['Destination Station'] = df_website['Destination Station'].str.upper()
# # df_website['Description'] = df_website['Description'].str.upper()
# # df_website['Channel Routing'] = df_website['Channel Routing'].str.upper()

# # df['Source Station'] = df['Source Station'].fillna('')
# # df['Destination Station'] = df['Destination Station'].fillna('')
# # df['Description'] = df['Description'].fillna('')
# # df['Channel Routing'] = df['Channel Routing'].fillna('')


# 	temp_df=df_website[((df_website['Source Station']==row['Source Station'].upper()) & (df_website['Destination Station']==row['Destination Station'].upper())
# 			& (df_website['Description']==row['Description'].upper()) & (df_website['Channel Routing']==row['Channel Routing'].upper()))]
