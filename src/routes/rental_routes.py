import os
import shutil
import traceback
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.rental import FinishRentalRequest, RentalCreate, RentalOut, RentalStatus, RentalUpdate
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

# 2. Rota de criação de locação
@backend.post("/locacoes", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
async def create_rental_route(
    cliente_id: int = Form(...),
    car_id: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    total_days: int = Form(...),
    daily_rate: float = Form(...),
    total_amount: float = Form(...),
    additional_fees: float = Form(...),
    mileage_start: int = Form(...),
    observations: str = Form(""),
    status: str = Form("ATIVA"),
    payment_method: str = Form(...),
    cnh_url: Optional[str] = Form(None), # Recebe a URL, não o arquivo
    db: Session = Depends(get_db)
):
    """
    Criar uma nova locação. Agora recebe a URL da CNH, não o arquivo.
    """
    try:
        service = RentalService(db)
        
        rental_data = RentalCreate(
            cliente_id=cliente_id,
            car_id=uuid.UUID(car_id),
            start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
            end_date=datetime.strptime(end_date, '%Y-%m-%d').date(),
            total_days=total_days,
            daily_rate=daily_rate,
            total_amount=total_amount,
            additional_fees=additional_fees,
            mileage_start=mileage_start,
            observations=observations,
            status=status,
            payment_method=payment_method,
            cnh_photo_path=cnh_url # Salvar o caminho/URL
        )
        
        created_rental = service.create_rental(rental_data)

        return created_rental

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        print("--- ERRO INTERNO DURANTE A CRIAÇÃO DA LOCAÇÃO ---")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor ao criar a locação."
        )
# -------------------------------------------------------------
# Alteração na ordem das rotas GET para resolver o erro 422
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
# -------------------------------------------------------------
# O restante das rotas permanece inalterado.
# -------------------------------------------------------------
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