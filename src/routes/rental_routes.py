import os
import shutil
import traceback
import uuid
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.rental import FinishRentalRequest, RentalCreate, RentalOut, RentalStatus, RentalUpdate, PaymentMethod
from src.services.rental_service import RentalService

backend = APIRouter()

UPLOAD_DIRECTORY = "uploads/cnh_images"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# 1. Rota para upload da CNH
@backend.post("/upload-cnh/", status_code=status.HTTP_201_CREATED)
async def upload_cnh_photo(cnh_file: UploadFile = File(...)):
    """
    Endpoint para fazer o upload da CNH e retornar o caminho de acesso.
    """
    try:
        cnh_filename = f"{uuid.uuid4()}_{cnh_file.filename}"
        file_path = os.path.join(UPLOAD_DIRECTORY, cnh_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cnh_file.file, buffer)
            
        return {"cnh_url": f"/cnh_images/{cnh_filename}"}
        
    except Exception as e:
        print("Erro ao salvar a foto da CNH:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar a foto da CNH."
        )

# --- Modelo para criação da locação (usado para requisições JSON) ---
# Se a sua aplicação cliente (front-end) envia dados JSON,
# esta é a maneira mais limpa de lidar com isso.
class RentalCreateRequest(BaseModel):
    cliente_id: int
    car_id: uuid.UUID
    start_date: date
    end_date: date
    total_days: int
    daily_rate: float
    total_amount: float
    additional_fees: float = 0
    mileage_start: int
    observations: str = ""
    payment_method: PaymentMethod
    status: RentalStatus = RentalStatus.ATIVA
    cnh_photo_path: Optional[str] = None

# 2. Rota de criação de locação (Corrigida para JSON)
# Esta é a sua rota de criação de locação, corrigida para
# esperar um corpo de requisição JSON.
@backend.post("/locacoes", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
async def create_rental_route(
    rental_data: RentalCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Cria uma nova locação a partir de um corpo de requisição JSON.
    A validação é feita automaticamente pelo FastAPI usando o modelo Pydantic.
    """
    try:
        service = RentalService(db)
        
        # O FastAPI já validou e converteu os tipos, basta passar para o serviço
        created_rental = service.create_rental(rental_data)
        
        return created_rental

    except Exception as e:
        print("--- ERRO INTERNO DURANTE A CRIAÇÃO DA LOCAÇÃO ---")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no servidor ao criar a locação: {e}"
        )

# -------------------------------------------------------------
# O restante das rotas permanece inalterado e está correto
# -------------------------------------------------------------
@backend.get("/locacoes", response_model=List[RentalOut])
def get_rentals(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[RentalStatus] = None,
    db: Session = Depends(get_db)
):
    """Listar locações"""
    service = RentalService(db)
    return service.get_rentals(skip=skip, limit=limit, status_filter=status_filter)

@backend.get("/locacoes/{rental_id}", response_model=RentalOut)
def get_rental(rental_id: int, db: Session = Depends(get_db)):
    """Buscar locação por ID"""
    service = RentalService(db)
    rental = service.get_rental_by_id(rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locação não encontrada"
        )
    return rental

@backend.put("/locacoes/{rental_id}", response_model=RentalOut)
def update_rental(
    rental_id: int, 
    rental_update: RentalUpdate, 
    db: Session = Depends(get_db)
):
    """Atualiza a locação, incluindo a quilometragem"""
    service = RentalService(db)
    
    rental = service.update_rental(rental_id, rental_update)
    
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locação não encontrada"
        )
    return rental

@backend.delete("/locacoes/{rental_id}")
def delete_rental(rental_id: int, db: Session = Depends(get_db)):
    """Deletar locação"""
    service = RentalService(db)
    success = service.delete_rental(rental_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locação não encontrada"
        )
    return {"message": "Locação deletada com sucesso"}

@backend.post("/locacoes/{rental_id}/finish")
def finish_rental(rental_id: int, rental_data: FinishRentalRequest, db: Session = Depends(get_db)):
    """Finalizar locação"""
    service = RentalService(db)
    rental = service.finish_rental(rental_id, rental_data)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Locação não encontrada"
        )
    return rental

@backend.patch("/locacoes/{rental_id}/finalizar", response_model=RentalOut)
def finalize_rental_endpoint(
    rental_id: int, 
    request_data: FinishRentalRequest, 
    db: Session = Depends(get_db)
):
    """Finaliza uma locação existente."""
    service = RentalService(db)
    
    try:
        updated_rental = service.finish_rental(rental_id, request_data)
        if not updated_rental:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Locação não encontrada"
            )
        return updated_rental
    except ValueError as e:
        # Tratar erros de lógica de negócio e convertê-los para HTTP 409 Conflict.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

@backend.get("/cliente/{cliente_id}", response_model=List[RentalOut])
def get_rentals_by_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Listar locações por cliente"""
    service = RentalService(db)
    return service.get_rentals_by_cliente(cliente_id)

@backend.get("/car/{car_id}", response_model=List[RentalOut])
def get_rentals_by_car(car_id: str, db: Session = Depends(get_db)):
    """Listar locações por carro"""
    service = RentalService(db)
    return service.get_rentals_by_car(car_id)