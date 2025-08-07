# src/models/__init__.py
# Importe PRIMEIRO os modelos SQLAlchemy
from src.models.clientes import Cliente
from .rental import Rental

# Depois importe os modelos Pydantic
from src.models.clientes import ClienteCreate, ClienteOut, ClienteUpdate
from .rental import RentalCreate, RentalOut

__all__ = [
    "Cliente", "Rental",
    "ClienteCreate", "ClienteOut", "ClienteUpdate",
    "RentalCreate", "RentalOut"

    # Modelos SQLAlchemy
    'Cliente',
    'Car', 
    'Rental',
    
    # Modelos Pydantic para Cliente
    'ClienteCreate',
    'ClienteUpdate',
    'ClienteOut',
    'ClienteList',
    'ClienteComLocacoes',
    
    # Modelos Pydantic para Car
    'CarCreate',
    'CarUpdate',
    'CarOut',
    'CarWithRentals',
    
    # Modelos Pydantic para Rental
    'RentalCreate',
    'RentalUpdate',
    'RentalOut',
    'RentalWithDetails',
]