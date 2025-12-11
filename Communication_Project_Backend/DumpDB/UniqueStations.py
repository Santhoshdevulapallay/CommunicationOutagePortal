import pandas as pd
import numpy as np
import pymongo
import datetime
import csv


myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Links = mydb["links"]
Equipments = mydb["equipment"]
Equipments = mydb["equipment"]
Users = mydb["users"]
AllStations = []

cursor = Links.find({})
for document in cursor:
	AllStations.append(document['source'])
	AllStations.append(document['destination'])
	split = document['channelRouting'].split('-')
	for each in split:
		each=each.strip(' ')
		if(each):
			if(',' in each):
				commasplit = each.split(',')
				for eachcomma in commasplit:
					eachcomma = eachcomma.strip(' ')
					if(eachcomma):
						AllStations.append(eachcomma)
			else:
				AllStations.append(each)
	


print("AllStations",  len(AllStations))
AllStationsSet = set(AllStations)
print("AllStationsSet", len(AllStationsSet))
AllStationsSetList = list(AllStationsSet)

# dictionary of lists   
dict = {'UniqueStations': AllStationsSetList}   
       
df = pd.DataFrame(dict)  
    
# saving the dataframe  
df.to_csv('UniqueStations.csv')  


locations=[]
cursor = Equipments.find({})
for document in cursor:
	locations.append(document['location'])

print("locations", len(locations))
locationset = set(locations)
print("locationset", len(locationset))
locationsList = list(locationset)

print(len(AllStationsSet - locationset))


dict = {'UniqueLocations': locationsList}   
       
df = pd.DataFrame(dict)  
    
# saving the dataframe  
df.to_csv('UniqueLocations.csv')  

LocationListNotFound = list(AllStationsSet - locationset)

dict = {'LocationListNotFound': LocationListNotFound}   
       
df = pd.DataFrame(dict)  
    
# saving the dataframe  
df.to_csv('LocationListNotFound.csv')  

# df= pd.read_excel('comcod3n4_dec.xlsx')


# userList=['PGCIL', 'PGCIL SR 1', 'PGCIL SR 2', 'APTRANSCO', 'KPTCL', 'KSEBL', 'TANTRANSCO', 'TSTRANSCO', 'PED, Puducherry', 'SRLDC']

# Monthcols=['Aug, 2019', 'Sep, 2019', 'Oct, 2019', 'Nov, 2019', 'Dec, 2019', 'Jan, 2020', 'Feb, 2020', 'Mar, 2020', 'Apr, 2020', 'May, 2020', 'Jun, 2020', 'Jul, 2020', 'Aug, 2020', 'Sep, 2020', 'Oct, 2020', 'Nov,2020', 'Dec, 2020']


# linksSegregated=[]

# for index, row in df.iterrows():
# 	if(np.isnan(row['SL'])):		
# 		continue
# 	flag=1
# 	try:
# 		if(row['Ownership']):
# 			Ownership=row['Ownership'].replace("&", ",")
# 			Ownership=Ownership.replace("/",",")
# 			Ownership=Ownership.replace("and", ",")
# 			Ownership=Ownership.replace("PED, Puducherry","PED_Puducherry")

# 			OwnershipArr = Ownership.strip().split(',')


# 			for i in range(len(OwnershipArr)):
# 				if(OwnershipArr[i]=="PED_Puducherry"):
# 					OwnershipArr[i]="PED, Puducherry"
# 				OwnershipArr[i]=OwnershipArr[i].strip()

# 				if(OwnershipArr[i]=="PGCIL"):
# 					OwnershipArr.append("PGCIL SR 1")
# 					OwnershipArr.append("PGCIL SR 2")

# 				OwnershipArr[i]=OwnershipArr[i].strip()
# 				if(OwnershipArr[i] not in userList):
# 					raise
# 			OwnershipArr=list(set(OwnershipArr))

# 			link = {}
# 			if(row['Name of the owner / User'].strip() in userList):
# 				link['user'] = row['Name of the owner / User'].strip()
# 			else:
# 				raise
			
# 			link['source'] = row['Source Station'].strip()
# 			link['destination'] = row['Destination Station'].strip()
# 			link['description'] = row['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)'].strip()
# 			link['ownership']= OwnershipArr

# 			segregateNodes=[]

# 			AllStations.append(link['source'])
# 			AllStations.append(link['destination'])

# 			try:
# 				link['channelRouting'] = row['Channel Routing'].strip(' ')
# 				link['channelRouting']=link['channelRouting'].replace('–', '-')
# 				split=link['channelRouting'].split('-')

# 				temp_dict=({'source': link['source'], 'destination': link['destination']})
# 				i=0
# 				for each in split:
# 					each=each.strip(' ')
# 					if(each):
# 						temp_dict[str(i)]=each
# 						i+=1
# 						AllStations.append(each)
				
# 				linksSegregated.append(temp_dict)
# 			except Exception as e:
# 				link['channelRouting']=''
			
# 			# print(link)
# 			# linkinserted=Links.insert_one(link)
		

# 	except Exception as e:
# 		import pdb
# 		pdb.set_trace()
# 	else:
# 		pass
# 	finally:
# 		pass

# import pdb
# pdb.set_trace()

# df= pd.DataFrame(linksSegregated)
# df.to_csv('abc.csv', index=False)