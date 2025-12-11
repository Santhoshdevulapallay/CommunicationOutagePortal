import pandas as pd
import numpy as np
import pymongo
import datetime



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Links = mydb["links"]
Equipments = mydb["equipment"]
Equipments = mydb["equipment"]
Users = mydb["users"]

df= pd.read_excel('comcod3n4_dec.xlsx')


# x = Links.delete_many({})

# print(x.deleted_count)
# x = Equipments.delete_many({})

# print(x.deleted_count)

userList=['PGCIL', 'PGCIL SR 1', 'PGCIL SR 2', 'APTRANSCO', 'KPTCL', 'KSEBL', 'TANTRANSCO', 'TSTRANSCO', 'PED, Puducherry', 'SRLDC']

Monthcols=['Aug, 2019', 'Sep, 2019', 'Oct, 2019', 'Nov, 2019', 'Dec, 2019', 'Jan, 2020', 'Feb, 2020', 'Mar, 2020', 'Apr, 2020', 'May, 2020', 'Jun, 2020', 'Jul, 2020', 'Aug, 2020', 'Sep, 2020', 'Oct, 2020', 'Nov,2020', 'Dec, 2020']




for index, row in df.iterrows():
	if(np.isnan(row['SL'])):
		
		continue
	flag=1
	try:
		if(row['Ownership']):
			Ownership=row['Ownership'].replace("&", ",")
			Ownership=Ownership.replace("/",",")
			Ownership=Ownership.replace("and", ",")
			Ownership=Ownership.replace("PED, Puducherry","PED_Puducherry")

			OwnershipArr = Ownership.strip().split(',')


			for i in range(len(OwnershipArr)):
				if(OwnershipArr[i]=="PED_Puducherry"):
					OwnershipArr[i]="PED, Puducherry"
				OwnershipArr[i]=OwnershipArr[i].strip()

				if(OwnershipArr[i]=="PGCIL"):
					OwnershipArr.append("PGCIL SR 1")
					OwnershipArr.append("PGCIL SR 2")

				OwnershipArr[i]=OwnershipArr[i].strip()
				if(OwnershipArr[i] not in userList):
					raise
			OwnershipArr=list(set(OwnershipArr))
			# print(OwnershipArr)

			link = {}
			if(row['Name of the owner / User'].strip() in userList):
				link['user'] = row['Name of the owner / User'].strip()
			else:
				raise
			
			link['source'] = row['Source Station'].strip()
			link['destination'] = row['Destination Station'].strip()
			link['description'] = row['Description of  Link /Channel (64 kbps, 104, PMU, VC, 101) / Voice / Protection circuits / VSAT / Others)'].strip()
			link['ownership']= OwnershipArr
			try:
				link['channelRouting'] = row['Channel Routing'].strip()
			except Exception as e:
				link['channelRouting']=''
			
			# print(link)
			linkinserted=Links.insert_one(link)
				

	except Exception as e:
		import pdb
		pdb.set_trace()
	else:
		pass
	finally:
		pass
	

df= pd.read_excel('comcod3n4_dec.xlsx', sheet_name="Equipment")


for index, row in df.iterrows():
	if(np.isnan(row['SL'])):
		
		continue
	flag=1
	try:
		if(row['Ownership']):
			Ownership=row['Ownership'].replace("&", ",")
			Ownership=Ownership.replace("/",",")
			Ownership=Ownership.replace("and", ",")
			Ownership=Ownership.replace("PED, Puducherry","PED_Puducherry")

			OwnershipArr = Ownership.strip().split(',')


			for i in range(len(OwnershipArr)):
				if(OwnershipArr[i]=="PED_Puducherry"):
					OwnershipArr[i]="PED, Puducherry"
				OwnershipArr[i]=OwnershipArr[i].strip()

				if(OwnershipArr[i]=="PGCIL"):
					OwnershipArr.append("PGCIL SR 1")
					OwnershipArr.append("PGCIL SR 2")

				OwnershipArr[i]=OwnershipArr[i].strip()
				if(OwnershipArr[i] not in userList):
					raise
			OwnershipArr=list(set(OwnershipArr))
			print(OwnershipArr)

			equipment = {}
			if(row['Name of the owner / User'].strip() in userList):
				equipment['user'] = row['Name of the owner / User'].strip()
			else:
				raise
			
			equipment['description'] = row['Name of the communication equipments'].strip()
			equipment['location'] = row['Location of the Equipment / Name of Station'].strip()
			equipment['ownership']= OwnershipArr
			
			
			print(equipment)
			equipmentinserted=Equipments.insert_one(equipment)
		

	except Exception as e:
		import pdb
		pdb.set_trace()
	else:
		pass
	finally:
		pass


# userdf= pd.read_excel('Comm Audit nominations.xlsx')


# for each_user in Users.find():
# 	# import pdb
# 	# pdb.set_trace()
# 	temp_df=userdf[userdf['Organisation']==each_user['userName']]
# 	nominations=[]
# 	for index, row in temp_df.iterrows():
# 		nomination={}
# 		nomination['Name']=row['Nominated persons']
# 		nomination['Designation']=row['Designation']
# 		if(not np.isnan(row['Contact Number'])):
# 			nomination['Contact_Number']=row['Contact Number']
# 		if((row['Mail ID'])):
# 			nomination['Mail_Id']=row['Mail ID']
# 		nominations.append(nomination)
	
# 	if(nominations):


# 		myquery = { "userName": each_user['userName'] }
# 		newvalues = { "$set": { "nominations": nominations } }

# 		Users.update_one(myquery, newvalues)

# 	# print(each_user)
# 	pass





