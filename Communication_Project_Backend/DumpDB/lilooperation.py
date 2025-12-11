import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId


myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Equipments = mydb["equipment"]
EquipmentOutage = mydb["equipmentoutages"]
Links = mydb["links"]

LinkOutages = mydb["linkoutages"]





linkos = LinkOutages.find_one({'link':ObjectId('5ff219e97be826481716739f')})


import pdb
pdb.set_trace()

print()



