from itertools import count
import pandas as pd
import numpy as np
import pymongo
import datetime
from bson.objectid import ObjectId



myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]
Links = mydb["links"]

count = 0

for x in Links.find():
  
  if('may be affected during failure' in x['description']):
    #   print(x['description'],'---', x['description'].replace('may be affected during failure', ''), x)
    query = {'_id': x['_id']}
    newvalues = { "$set": { "description": x['description'].replace('may be affected during failure', '') } }
    print(x['_id'])
    Links.update_one(query, newvalues)
    count = count+1
  else:
    print("not updating as not matching")

print(count)

    