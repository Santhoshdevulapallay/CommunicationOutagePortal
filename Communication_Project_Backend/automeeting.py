import pymongo
from datetime import datetime, timedelta
from bson.objectid import ObjectId

# Assuming you have already established the MongoDB connection and have the Meetings collection.

myclient = pymongo.MongoClient("mongodb://MongoAdmin:123456@localhost:27017/")
mydb = myclient["communication_outage"]


Meetings = mydb["meetings"]


# Get the last COMSRNumber
last_COMSRNumber_doc = Meetings.find_one(sort=[('COMSRNumber', pymongo.DESCENDING)])
if last_COMSRNumber_doc:
    last_COMSRNumber = last_COMSRNumber_doc['COMSRNumber']
else:
    last_COMSRNumber = 0

# Calculate new meeting details
now = datetime.now()
new_meeting_year = now.year if now.month != 12 else now.year + 1
new_meeting_month = now.month + 1 if now.month != 12 else 1
new_meeting_date = datetime(new_meeting_year, new_meeting_month, 28)

req_opening_date = datetime(new_meeting_year, new_meeting_month, 1)
req_closing_date = datetime(new_meeting_year, new_meeting_month, 13)

# Calculate next to next month's dates
next_to_next_month = new_meeting_date + timedelta(days=30)
days_in_next_to_next_month = (next_to_next_month.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
shutdown_min_date = next_to_next_month.replace(day=1)
shutdown_max_date = next_to_next_month.replace(day=days_in_next_to_next_month.day)

# Create a new meeting document
new_meeting = {
    "_id": ObjectId(),
    "COMSRNumber": last_COMSRNumber + 1,
    "COMSRDate": new_meeting_date,
    "reqOpeningDate": req_opening_date,
    "reqClosingDate": req_closing_date,
    "shutdownMinDate": shutdown_min_date,
    "shutdownMaxDate": shutdown_max_date,
    "__v": 0
}

print(new_meeting)

# # Insert the new meeting document into the Meetings collection
Meetings.insert_one(new_meeting)
print("New meeting created successfully.")