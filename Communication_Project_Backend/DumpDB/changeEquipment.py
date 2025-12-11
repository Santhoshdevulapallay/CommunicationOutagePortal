import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Equipments = mydb["equipment"]
EquipmentOutage = mydb["equipmentoutages"]


equipmento = Equipments.find_one({'description': 'Tejas SDH TJ1400 STM16 Repeater Ichodda (Wardha-NZB)-1', 'location': 'Repeater Ichodda (Wardha-NZB)'})

import pdb
pdb.set_trace()


# equipmento.description = 

Equipments.find_one_and_update({'description': 'Tejas SDH TJ1400 STM16 Repeater Ichodda (Wardha-NZB)-1', 'location': 'Repeater Ichodda (Wardha-NZB)'}, {"$set": {"description": 'Tejas Networks - SDH\nTEJAS TJ1400 (Control, optical cards etc)'}})

Equipments.find_one_and_update({'description': 'Tejas SDH TJ1400 STM16 Repeater Shadnagar (NZB-MSWRM)-1', 'location': 'Repeater Shadnagar (NZB-MSWRM)'}, {"$set": {"description": 'Tejas Networks - SDH\nTEJAS TJ1400 (Control, optical cards etc)'}})


Equipments.find_one_and_update({'description': 'Tejas SDH TJ1400 STM16 Repeater 204 (RDM-Bhadrawati)-1', 'location': 'Repeater 204 (RDM-Bhadrawati)'}, {"$set": {"description": 'Tejas Networks - SDH\nTEJAS TJ1400 (Control, optical cards etc)'}})

Equipments.find_one_and_update({'description': 'Tejas SDH TJ1400 STM16 Repeater Vizinigiri (VMGR-SKLM)-1', 'location': 'Repeater Vizinigiri (VMGR-SKLM)'}, {"$set": {"description": 'Tejas Networks - SDH\nTEJAS TJ1400 (Control, optical cards etc)'}})


Equipments.find_one_and_update({'location': 'IL&FS'}, {"$set": {"description": 'Teja SDH,\nTJ 1400 STM 16'}})

Equipments.find_one_and_update({'description': 'Battery Charger - 3 (Waves Charger 48V/40A)'}, {"$set": {"description": 'Battery Charger - 3\n(Waves Charger 48V/40A)'}})



LinkOutage.update_many({'link': ObjectId('5ff3138d38a7600ca4d95e6a')}, {"$set": {"link": ObjectId('5ff219e97be82648171672e4')}})


Links.find_one_and_update({'source':'Edappon', 'destination':'Kolar'}, {"$set": {"description": 'Protection ABB NSD 70\n(64 kbps), SPS'}})


LinkOutage.update_many({'link': ObjectId('5ff313b238a7600ca4d95e6b')}, {"$set": {"link": ObjectId('5ff219e97be82648171672e5')}})


Links.find_one_and_update({'source':'Pallom', 'destination':'Kolar'}, {"$set": {"description": 'Protection ABB NSD 70\n(64 kbps), SPS'}})


Links.find_one_and_update({'source':'Kanhirode', 'destination':'Kolar'}, {"$set": {"description": 'Protection DIP 5000\n(64 kbps), SPS'}})


print("")

LinkOutage = mydb['linkoutages']

Links.find({'source': '220 KV Switchyard Srisailam right bank', 'destination':'Dindi'}).count()

LinkOutage.find({"link": ObjectId('5ff219e97be8264817167291')})

LinkOutage.update_many({'link': ObjectId('5ff219e97be8264817167293')}, {"$set": {"link": ObjectId('5ff219e97be826481716737b')}}).matched_count



Links.delete_many({"_id": ObjectId('5ff219e97be8264817167293')}).deleted_count

LinkOutage.delete_many({"_id": ObjectId('618bb61b8061c066449fe589')}).deleted_count

