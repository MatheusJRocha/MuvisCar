from typing import List, Optional
from sqlalchemy.orm import Session
from src.models.car import Car, CarCreate, CarStatus
from datetime import datetime

class CarService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_car(self, car_data: CarCreate) -> Car:
        """Criar um novo carro"""
        # Mapear 'km' para 'mileage'
        car_dict = car_data.dict()
        car_dict['mileage'] = car_dict.pop('km')
        
        db_car = Car(**car_dict)
        self.db.add(db_car)
        self.db.commit()
        self.db.refresh(db_car)
        return db_car
    
    def get_cars(self, skip: int = 0, limit: int = 100, status_filter: Optional[CarStatus] = None) -> List[Car]:
        """Listar carros com filtros opcionais"""
        query = self.db.query(Car)
        
        if status_filter:
            query = query.filter(Car.status == status_filter)
        
        return query.offset(skip).limit(limit).all()
    
    def get_car_by_id(self, car_id: str) -> Optional[Car]:
        """Buscar carro por ID"""
        return self.db.query(Car).filter(Car.id == car_id).first()
    
    def get_car_by_license_plate(self, license_plate: str) -> Optional[Car]:
        """Buscar carro por placa"""
        return self.db.query(Car).filter(Car.license_plate == license_plate).first()
    
    def update_car(self, car_id: str, car_data: CarCreate) -> Optional[Car]:
        """Atualizar carro"""
        db_car = self.get_car_by_id(car_id)
        if not db_car:
            return None
        
        # Mapear 'km' para 'mileage'
        car_dict = car_data.dict()
        car_dict['mileage'] = car_dict.pop('km')
        
        for key, value in car_dict.items():
            setattr(db_car, key, value)
        
        db_car.updated_at = datetime.now().isoformat()
        self.db.commit()
        self.db.refresh(db_car)
        return db_car
    
    def delete_car(self, car_id: str) -> bool:
        """Deletar carro"""
        db_car = self.get_car_by_id(car_id)
        if not db_car:
            return False
        
        self.db.delete(db_car)
        self.db.commit()
        return True
    
    def get_available_cars(self) -> List[Car]:
        """Listar carros disponíveis"""
        return self.db.query(Car).filter(Car.status == CarStatus.DISPONIVEL).all()
    
    def update_car_status(self, car_id: str, status: CarStatus) -> Optional[Car]:
        """Atualizar status do carro"""
        db_car = self.get_car_by_id(car_id)
        if not db_car:
            return None
        
        db_car.status = status
        db_car.updated_at = datetime.now().isoformat()
        self.db.commit()
        self.db.refresh(db_car)
        return db_car