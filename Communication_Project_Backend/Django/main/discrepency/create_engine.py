from sqlalchemy import create_engine
from urllib.parse import quote
import os


username=os.environ.get('DB_USER')
password=os.environ.get('DB_PASS')

host=os.environ.get('DB_HOST')
db_name=os.environ.get('DB_NAME')

engine = create_engine(f'postgresql://{quote(username)}:{quote(password)}@{host}:5432/{db_name}')


host1=os.environ.get('DB_HOST1')
db_name1=os.environ.get('DB_NAME1')

engine1 = create_engine(f'postgresql://{quote(username)}:{quote(password)}@{host1}:5432/{db_name1}')


