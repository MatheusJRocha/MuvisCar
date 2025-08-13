import uuid
import traceback
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, status, Form, HTTPException
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.models.rental import RentalCreate, RentalOut
from src.services.rental_service import RentalService

# Importe os modelos e serviços necessários
# from .database import get_db
# from .services.rental_service import RentalService
# from .schemas.rental_schema import RentalOut, RentalCreate

backend = APIRouter()

@backend.post("/reserva_rapida", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
async def create_quick_rental_route(
    cliente_id: int = Form(...),
    car_id: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    total_days: int = Form(...),
    daily_rate: float = Form(...),
    total_amount: float = Form(...),
    payment_method: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova locação a partir do formulário de reserva rápida.
    Esta rota é mais simples e exige menos campos do que a rota de locação completa.
    Define o status inicial como 'PENDENTE'.
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
            # Campos opcionais ou com valores padrão para reserva rápida
            additional_fees=0.0,
            mileage_start=0, # Assume 0 ou um valor padrão para a reserva rápida
            observations="Reserva rápida via formulário.",
            status="PENDENTE",
            payment_method=payment_method,
            cnh_photo_path=None
        )
        created_rental = service.create_rental(rental_data)
        return created_rental

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        print("--- ERRO INTERNO DURANTE A CRIAÇÃO DA RESERVA RÁPIDA ---")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor ao criar a reserva rápida."
        )

# Exemplo de uso da rota (mantido para fins de demonstração, não é necessário para o backend em si)
# @backend.post("/locacoes", response_model=RentalOut, status_code=status.HTTP_201_CREATED)
# async def create_rental_route_full( ... ):
#     # ... código da rota de locação completa
#     pass
