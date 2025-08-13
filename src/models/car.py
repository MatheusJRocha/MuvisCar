from typing import List, Optional
import uuid
from pydantic import BaseModel, Field, condecimal, conint, constr
from sqlalchemy import Column, String, Integer, Enum, DECIMAL, JSON, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from src.config.database import Base

class CarCategory(PyEnum):
    ECONOMICO = "ECONOMICO"
    INTERMEDIARIO = "INTERMEDIARIO"
    EXECUTIVO = "EXECUTIVO"
    LUXURY = "LUXURY"
    SUV = "SUV"

class CarStatus(PyEnum):
    DISPONIVEL = "DISPONIVEL"
    ALUGADO = "ALUGADO"
    MANUTENCAO = "MANUTENCAO"

# NOVOS ENUMS PARA OS NOVOS CAMPOS
class FuelType(PyEnum):
    GASOLINA = "GASOLINA"
    ETANOL = "ETANOL"
    FLEX = "FLEX"
    DIESEL = "DIESEL"
    ELETRICO = "ELETRICO"

class TransmissionType(PyEnum):
    AUTOMATICO = "AUTOMATICO"
    MANUAL = "MANUAL"

class Car(Base):
    __tablename__ = "cars"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30), nullable=False)
    license_plate = Column(String(10), unique=True, nullable=False, index=True)
    category = Column(Enum(CarCategory), nullable=False, default=CarCategory.ECONOMICO)
    daily_rate = Column(DECIMAL(10,2), nullable=False)
    mileage = Column(Integer, nullable=False)
    status = Column(Enum(CarStatus), nullable=False, default=CarStatus.DISPONIVEL)
    
    # NOVOS CAMPOS ADICIONADOS AQUI
    fuel_type = Column(Enum(FuelType), nullable=False, default=FuelType.FLEX)
    transmission_type = Column(Enum(TransmissionType), nullable=False, default=TransmissionType.MANUAL)
    passengers = Column(Integer, nullable=False, default=5)
    
    features = Column(JSON, nullable=True, default=list)
    images = Column(JSON, nullable=True, default=list)
    
    # Timestamps
    created_at = Column(String, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(String, server_default=text("CURRENT_TIMESTAMP"))
    
    # Relacionamento com locações
    locacoes = relationship("Rental", back_populates="carro")

# ---
    
class CarCreate(BaseModel):
    brand: constr(min_length=1, max_length=50) = Field(...) # type: ignore
    model: constr(min_length=1, max_length=50) = Field(...) # type: ignore
    year: conint(ge=1900, le=2100) = Field(...) # type: ignore
    color: constr(min_length=1, max_length=30) = Field(...) # type: ignore
    license_plate: constr(min_length=7, max_length=10) = Field(...) # type: ignore
    category: CarCategory = Field(...)
    daily_rate: condecimal(gt=0) = Field(...) # type: ignore
    mileage: conint(ge=0) = Field(...) # type: ignore
    status: Optional[CarStatus] = CarStatus.DISPONIVEL
    
    # NOVOS CAMPOS ADICIONADOS AQUI
    fuel_type: FuelType = Field(...)
    transmission_type: TransmissionType = Field(...)
    passengers: conint(ge=1, le=10) = Field(...) # type: ignore
    
    features: Optional[List[str]] = Field(default_factory=list)
    images: Optional[List[str]] = Field(default_factory=list)

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# ---
    
class CarOut(BaseModel):
    id: str
    brand: str
    model: str
    year: int
    color: str
    license_plate: str
    category: CarCategory
    daily_rate: float
    mileage: int
    status: CarStatus
    
    # NOVOS CAMPOS ADICIONADOS AQUI
    fuel_type: FuelType
    transmission_type: TransmissionType
    passengers: int
    
    features: Optional[List[str]] = []
    images: Optional[List[str]] = []
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True