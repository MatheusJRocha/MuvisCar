from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.models.rental import Rental, RentalCreate, FinishRentalRequest, RentalStatus, RentalUpdate
from src.models.car import CarStatus
from src.services.car_service import CarService
from src.services.cliente_service import ClienteService
from datetime import date

class RentalService:
    def __init__(self, db: Session):
        self.db = db
        self.car_service = CarService(db)
        self.cliente_service = ClienteService(db)
    
    def create_rental(self, rental_data: RentalCreate) -> Rental:
        """Criar uma nova locação"""
        # Verificar se o cliente existe
        cliente = self.cliente_service.get_cliente_by_id(rental_data.cliente_id)
        if not cliente:
            raise ValueError("Cliente não encontrado")
        
        # Verificar se o carro existe e está disponível
        car = self.car_service.get_car_by_id(rental_data.car_id)
        if not car:
            raise ValueError("Carro não encontrado")
        
        if car.status != CarStatus.DISPONIVEL:
            raise ValueError("Carro não está disponível")
        
        # O Pydantic model 'RentalCreate' pode ter campos que não existem no ORM 'Rental'.
        # Removemos o campo 'cnh_photo_path' antes de criar a locação no banco.
        rental_data_dict = rental_data.dict()
        rental_data_dict.pop('cnh_photo_path', None)
        
        db_rental = Rental(**rental_data_dict)
        
        self.db.add(db_rental)
        
        # Atualizar status do carro para alugado
        self.car_service.update_car_status(rental_data.car_id, CarStatus.ALUGADO)
        
        self.db.commit()
        self.db.refresh(db_rental)
        return db_rental
    
    def get_rentals(self, skip: int = 0, limit: int = 100, status_filter: Optional[RentalStatus] = None) -> List[Rental]:
        """Listar locações"""
        query = self.db.query(Rental).options(
            joinedload(Rental.cliente),
            joinedload(Rental.carro)
        )
        
        if status_filter:
            query = query.filter(Rental.status == status_filter)
        
        return query.offset(skip).limit(limit).all()
    
    def get_rental_by_id(self, rental_id: int) -> Optional[Rental]:
        """Buscar locação por ID"""
        return self.db.query(Rental).options(
            joinedload(Rental.cliente),
            joinedload(Rental.carro)
        ).filter(Rental.id == rental_id).first()
    
    def update_rental(self, rental_id: int, rental_data: RentalUpdate) -> Optional[Rental]:
        """Atualizar locação"""
        db_rental = self.get_rental_by_id(rental_id)
        if not db_rental:
            return None
        
        # Usar exclude_unset=True para atualizar apenas os campos fornecidos na requisição
        update_data = rental_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rental, key, value)
        
        self.db.commit()
        self.db.refresh(db_rental)
        return db_rental
    
    def delete_rental(self, rental_id: int) -> bool:
        """Deletar locação"""
        db_rental = self.get_rental_by_id(rental_id)
        if not db_rental:
            return False
        
        # Se a locação estiver ativa, liberar o carro
        if db_rental.status == RentalStatus.ATIVA:
            self.car_service.update_car_status(db_rental.car_id, CarStatus.DISPONIVEL)
        
        self.db.delete(db_rental)
        self.db.commit()
        return True
    
    def finish_rental(self, rental_id: int, rental_data: FinishRentalRequest) -> Optional[Rental]:
   
        db_rental = self.get_rental_by_id(rental_id)
        if not db_rental:
            return None

        # Verificação de estado: a locação deve estar ATIVA para ser finalizada.
        if db_rental.status != RentalStatus.ATIVA:
            # Aumentar a clareza do erro para o cliente da API.
            raise ValueError(f"A locação com ID {rental_id} não está ativa. Status atual: {db_rental.status}")
        
        # Validação de milhagem final: não pode ser menor que a inicial.
        if rental_data.final_mileage < db_rental.mileage_start:
            raise ValueError("A quilometragem final não pode ser menor que a quilometragem inicial.")
        
        # Atualizar a locação com os dados do frontend
        db_rental.status = RentalStatus.FINALIZADA
        db_rental.actual_end_date = rental_data.return_date
        db_rental.mileage_end = rental_data.final_mileage
        db_rental.fuel_level = rental_data.fuel_level
        db_rental.late_fee = rental_data.late_fee
        db_rental.return_notes = rental_data.return_notes
        
        # Atualizar o carro em uma única operação para manter a atomicidade.
        car = self.car_service.get_car_by_id(db_rental.car_id)
        if car:
            car.mileage = rental_data.final_mileage
            car.status = CarStatus.DISPONIVEL
        else:
            # Lançar um erro se o carro não for encontrado, pois é uma dependência crucial.
            raise ValueError(f"Carro com ID {db_rental.car_id} não encontrado.")

        # Commit da transação para salvar todas as alterações (locação e carro)
        self.db.commit()
        self.db.refresh(db_rental)
        
        return db_rental
    
    def get_rentals_by_cliente(self, cliente_id: int) -> List[Rental]:
        """Listar locações por cliente"""
        return self.db.query(Rental).options(
            joinedload(Rental.carro)
        ).filter(Rental.cliente_id == cliente_id).all()
    
    def get_rentals_by_car(self, car_id: str) -> List[Rental]:
        """Listar locações por carro"""
        return self.db.query(Rental).options(
            joinedload(Rental.cliente)
        ).filter(Rental.car_id == car_id).all()
    
    def get_active_rentals(self) -> List[Rental]:
        """Listar locações ativas"""
        return self.db.query(Rental).options(
            joinedload(Rental.cliente),
            joinedload(Rental.carro)
        ).filter(Rental.status == RentalStatus.ATIVA).all()
    
    def get_overdue_rentals(self) -> List[Rental]:
        """Listar locações em atraso"""
        today = date.today()
        return self.db.query(Rental).options(
            joinedload(Rental.cliente),
            joinedload(Rental.carro)
        ).filter(
            Rental.status == RentalStatus.ATIVA,
            Rental.end_date < today
        ).all()
