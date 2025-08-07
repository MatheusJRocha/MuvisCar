from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# Ajuste conforme o caminho real da sua sessão de banco de dados 
# Ajuste conforme o caminho real do seu CarController
from src.controllers.car_controller import CarController 
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from src.models.car import CarCreate
from src.config.database import SessionLocal, get_db
from src.controllers.car_controller import CarController


backend = APIRouter(tags=["Carros"])

# @backend.get("/by-plate/{plate}")
# def get_car_by_plate(plate: str):
#     car = car_controller.get_by_plate(plate)
#     if not car:
#         raise HTTPException(status_code=404, detail="Veículo não encontrado")
#     return car

@backend.get("/carros")
def list_cars(
    status: str | None = Query(None),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db) # <-- Adicione aqui
):
    controller = CarController(db) # <-- Instancie aqui
    return controller.get_all(status, category, page, limit)

@backend.post("/carros")
def create_car(data: CarCreate = Body(...), db: Session = Depends(get_db)): # <-- Adicione aqui
    controller = CarController(db) # <-- Instancie aqui
    return controller.create(data)

@backend.put("/carros/{plate}") # <-- Corrigido: falta a barra '/' antes do '{plate}'
def update_car(plate: str, data: dict = Body(...), db: Session = Depends(get_db)): # <-- Adicione aqui
    controller = CarController(db) # <-- Instancie aqui
    return controller.update_by_plate(plate, data)

# A rota de DELETE já está correta!
@backend.delete("/carros/{plate}", status_code=status.HTTP_200_OK)
async def delete_car_route(
    plate: str,
    db: Session = Depends(get_db)
):
    controller = CarController(db)
    return controller.delete_by_plate(plate)

@backend.patch("/carros/{plate}/status") # <-- Corrigido o caminho para ser consistente
def change_status(plate: str, status: str = Body(...), db: Session = Depends(get_db)): # <-- Adicione aqui
    controller = CarController(db) # <-- Instancie aqui
    return controller.update_status_by_plate(plate, status)