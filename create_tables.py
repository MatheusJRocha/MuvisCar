# create_tables.py
from src.config.database import Base, engine
from src.models import car  # importe todas as models aqui
from src.models import rental  # importe todas as models aqui
from src.models import clientes
from src.models import customer
from models import login

Base.metadata.create_all(bind=engine)
print("Tabelas criadas.")


