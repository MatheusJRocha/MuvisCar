from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.models.car import Car, CarCategory, CarStatus
from src.models.car import CarCreate
from typing import Optional


class CarController:

    def __init__(self, db: Session):
        self.db = db

    def get_all(self, status: Optional[str] = None, category: Optional[str] = None, page: int = 1, limit: int = 10):
        try:
            query = self.db.query(Car)

            if status:
                try:
                    status_enum = CarStatus(status)
                    query = query.filter(Car.status == status_enum)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Status inválido")
            if category:
                try:
                    category_enum = CarCategory(category)
                    query = query.filter(Car.category == category_enum)
                except ValueError:
                    raise HTTPException(status_code=400, detail="Categoria inválida")

            total = query.count()
            cars = query.offset((page - 1) * limit).limit(limit).all()

            return {
                "success": True,
                "data": cars,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "pages": (total // limit) + (1 if total % limit > 0 else 0)
                }
            }
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


    def get_by_id(self, car_id: int):
        car = self.db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(status_code=404, detail="Carro não encontrado")
        return car
    
    def get_by_plate(self, plate: str):
        car = self.db.query(Car).filter(Car.license_plate == plate).first()
        return car


    def create(self, data: CarCreate):
        try:
            car = Car(**data.dict())
            self.db.add(car)
            self.db.commit()
            self.db.refresh(car)
            return car
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Erro ao criar carro: {e}")


    def create_car(self, car_data: CarCreate) -> Car:
        """Criar um novo carro (mapeando 'km' para 'mileage')"""
        try:
            car_dict = car_data.dict()
            car_dict['mileage'] = car_dict.pop('km')
            db_car = Car(**car_dict)
            self.db.add(db_car)
            self.db.commit()
            self.db.refresh(db_car)
            return db_car
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Erro ao criar carro: {e}")


    def update_by_plate(self, plate: str, data: dict):
        car = self.db.query(Car).filter(Car.license_plate == plate).first()
        if not car:
            raise HTTPException(status_code=404, detail="Carro não encontrado")
        try:
            for key, value in data.items():
                if hasattr(car, key):
                    setattr(car, key, value)
            self.db.commit()
            self.db.refresh(car)
            return {
                "success": True,
                "message": "Carro atualizado com sucesso",
                "data": car
            }
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def delete_by_plate(self, plate: str): # <--- Esta função está correta
        car = self.db.query(Car).filter(Car.license_plate == plate).first()
        if not car:
            raise HTTPException(status_code=404, detail="Carro não encontrado")
        try:
            self.db.delete(car)
            self.db.commit()
            return {"success": True, "message": "Carro deletado com sucesso"}
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    def update_status_by_plate(self, plate: str, status: str):
        try:
            status_enum = CarStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Status inválido")

        car = self.db.query(Car).filter(Car.license_plate == plate).first()
        if not car:
            raise HTTPException(status_code=404, detail="Carro não encontrado")

        try:
            car.status = status_enum
            self.db.commit()
            self.db.refresh(car)
            return {"success": True, "message": "Status do carro atualizado com sucesso", "data": car}
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        
    def buscar_carros(self):
        try:
            carros = self.db.query(Car).all()
            return carros
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))