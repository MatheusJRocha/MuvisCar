import datetime
import enum
from datetime import date
from typing import Optional, TYPE_CHECKING
import uuid # You'll need this for Pydantic UUID types

from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Date, Numeric, Text, ForeignKey, Enum as SQLEnum
# Import PG_UUID for SQLAlchemy's UUID type
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

# Assuming Base is correctly imported from src.config.database
from src.config.database import Base

# TYPE_CHECKING imports should reflect your actual file structure
# Assuming 'clientes' is now 'customer' and 'car' is 'car' in your models folder
if TYPE_CHECKING:
    from src.models.clientes import Cliente # Assuming Cliente is now Customer
    from src.models.car import Car

# --- Enums (Good place for these if they are specific to Rentals or common) ---
class RentalStatus(str, enum.Enum):
    ATIVA = "ATIVA"
    FINALIZADA = "FINALIZADA"
    CANCELADA = "CANCELADA"

class PaymentStatus(str, enum.Enum):
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"
    ATRASADO = "ATRASADO"

class PaymentMethod(str, enum.Enum):
    DINHEIRO = "DINHEIRO"
    CARTAO_CREDITO = "CARTAO_CREDITO"
    CARTAO_DEBITO = "CARTAO_DEBITO"
    PIX = "PIX"
    TRANSFERENCIA = "TRANSFERENCIA"

# --- SQLAlchemy Models ---

# User model (moved to a more logical place if it's in the same file)
# Ideally, this would be in src/models/user.py
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default='customer')

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

class Rental(Base):
    __tablename__ = "locacoes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    
    # FIX: Corrigido para usar o tipo UUID para a chave estrangeira do carro
    car_id = Column(PG_UUID(as_uuid=True), ForeignKey("cars.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    actual_end_date = Column(Date, nullable=True)

    total_days = Column(Integer, nullable=False)
    daily_rate = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    additional_fees = Column(Numeric(10, 2), default=0)

    mileage_start = Column(Integer, nullable=False)
    mileage_end = Column(Integer, nullable=True)

    observations = Column(Text, nullable=True)

    status = Column(SQLEnum(RentalStatus, name='rentalstatus'), default=RentalStatus.ATIVA, nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus, name='paymentstatus'), default=PaymentStatus.PENDENTE, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod, name='paymentmethod'), nullable=False)

    cliente = relationship("Cliente", back_populates="locacoes")
    carro = relationship("Car", back_populates="locacoes")

    def __repr__(self):
        return f"<Rental(id={self.id}, cliente_id={self.cliente_id}, car_id={self.car_id})>"

# --- Pydantic Schema (Corrigido) ---
class RentalCreate(BaseModel):
    # Removido 'Optional' pois os campos são obrigatórios no modelo
    cliente_id: int
    car_id: uuid.UUID
    start_date: date
    end_date: date
    total_days: int
    daily_rate: Optional[float] = None
    total_amount: float
    additional_fees: float = 0
    mileage_start: int
    observations: Optional[str] = None
    status: RentalStatus = RentalStatus.ATIVA
    payment_method: PaymentMethod
    cnh_photo_path: Optional[str] = None # << Corrigido para 'cnh_photo_path'



class RentalOut(BaseModel):
    id: int
    cliente_id: Optional[int] = None
    car_id: Optional[uuid.UUID] = None
    start_date: date
    end_date: date
    actual_end_date: Optional[date] = None
    total_days: int
    daily_rate: Optional[float] = None
    total_amount: float
    additional_fees: Optional[float] = 0
    mileage_start: int
    mileage_end: Optional[int] = None
    observations: Optional[str] = None
    status: RentalStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod


class RentalUpdate(BaseModel):
    cliente_id: Optional[int] = None
    car_id: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    total_days: Optional[int] = None
    daily_rate: Optional[float] = None
    total_amount: Optional[float] = None
    additional_fees: Optional[float] = None
    mileage_start: Optional[int] = None
    mileage_end: Optional[int] = None
    observations: Optional[str] = None
    status: Optional[RentalStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    
    cnh_photo_path: Optional[str] = None





class FinishRentalRequest(BaseModel):
    return_date: datetime.date
    final_mileage: int
    fuel_level: int
    late_fee: float
    return_notes: Optional[str] = None


    class Config:
        from_attributes = True


