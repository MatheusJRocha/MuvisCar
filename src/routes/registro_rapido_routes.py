from sqlite3 import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.clientes import ClienteCreate, ClienteOut
from src.services.cliente_service import ClienteService

# backend = APIRouter()

backend = APIRouter(prefix="/clientes", tags=["Clientes"])

@backend.post("/registro_rapido", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """
    Cria um novo cliente a partir dos dados do formulário de registro rápido.
    A senha é criptografada automaticamente antes de ser salva.
    """
    try:
        service = ClienteService(db)
        return service.registro_rapido_cliente(cliente)
    except IntegrityError as e:
        # A API retorna um 409 Conflict se o CPF ou e-mail já existe
        error_str = str(e)
        if "ix_clientes_cpf_cnpj" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CPF já registrado. Por favor, use outro CPF ou faça login."
            )
        elif "ix_clientes_email" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já registrado. Por favor, use outro e-mail ou faça login."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ocorreu um erro interno ao registrar o cliente: {e}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro interno ao registrar o cliente: {e}"
        )