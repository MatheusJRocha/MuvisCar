from sqlalchemy.orm import Session
from uuid import uuid4
from fastapi import HTTPException
from datetime import date
from src.models.rental import Rental, RentalStatus, PaymentStatus, RentalCreate
from src.models.car import Car

# class RentalController

def criar_locacao(db: Session, dados: RentalCreate):
    if dados.end_date <= dados.start_date:
        raise HTTPException(status_code=400, detail="Data de fim deve ser após a data de início.")

    conflito = db.query(Rental).filter(
        Rental.car_id == dados.car_id,
        Rental.status == RentalStatus.ATIVA,
        Rental.start_date <= dados.end_date,
        Rental.end_date >= dados.start_date
    ).first()

    if conflito:
        raise HTTPException(status_code=400, detail="Carro já reservado nesse período.")

    carro = db.query(Car).filter(Car.id == dados.car_id).first()
    if not carro:
        raise HTTPException(status_code=404, detail="Carro não encontrado.")

    dias = (dados.end_date - dados.start_date).days or 1
    total = dias * carro.daily_rate

    locacao = Rental(
        id=uuid4(),
        customer_id=dados.customer_id,
        car_id=dados.car_id,
        start_date=dados.start_date,
        end_date=dados.end_date,
        actual_end_date=None,
        total_days=dias,
        daily_rate=carro.daily_rate,
        total_amount=total,
        additional_fees=0.0,
        mileage_start=dados.mileage_start,
        mileage_end=None,
        observations=dados.observations,
        status=RentalStatus.ATIVA,
        payment_status=PaymentStatus.PENDENTE,
        payment_method=dados.payment_method
    )

    db.add(locacao)
    db.commit()
    db.refresh(locacao)
    return locacao
