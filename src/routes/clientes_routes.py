from typing import List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.controllers.clientes import ClienteController
from src.config.database import SessionLocal, get_db
from src.models.clientes import (
    Cliente, ClienteCreate, ClienteOut, ClienteUpdate, 
    ClienteList, ClienteComLocacoes
)
from src.services.cliente_service import ClienteService

backend = APIRouter()

db = SessionLocal()
# cliente_controller = ClienteController(db)




@backend.post("/", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Criar um novo cliente"""
    service = ClienteService(db)
    return service.create_cliente(cliente)


@backend.get("/", response_model=List[ClienteList])
def get_clientes(
    skip: int = 0,
    limit: int = 100,
    ativo: bool = None,
    db: Session = Depends(get_db)
):
    """Listar clientes"""
    service = ClienteService(db)
    return service.get_clientes(skip=skip, limit=limit, ativo=ativo)


@backend.get("/search/cpf/{cpf}")
def search_by_cpf(cpf: str, db: Session = Depends(get_db)):
    """Buscar cliente por CPF"""
    service = ClienteService(db)
    cliente = service.get_cliente_by_cpf(cpf)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente


@backend.get("/{cliente_id}/locacoesx", response_model=ClienteComLocacoes)
def get_cliente_com_locacoes(cliente_id: int, db: Session = Depends(get_db)):
    """Buscar cliente com suas locações"""
    service = ClienteService(db)
    cliente = service.get_cliente_with_locacoes(cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente


@backend.get("/{cliente_id}", response_model=ClienteOut)
def get_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Buscar cliente por ID"""
    service = ClienteService(db)
    cliente = service.get_cliente_by_id(cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente


@backend.put("/{cliente_id}", response_model=ClienteOut)
def update_cliente(
    cliente_id: int, 
    cliente_update: ClienteUpdate, 
    db: Session = Depends(get_db)
):
    """Atualizar cliente"""
    service = ClienteService(db)
    cliente = service.update_cliente(cliente_id, cliente_update)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado"
        )
    return cliente

@backend.delete("/{cliente_id}") # Sua rota atual
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Deletar cliente"""
    service = ClienteService(db)
    try:
        success = service.delete_cliente(cliente_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )
        return {"message": "Cliente deletado com sucesso"}
    except ValueError as e:
        # Captura a exceção levantada pelo serviço e retorna um erro 409 Conflict
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # 409 Conflict é mais apropriado para conflitos de dados
            detail=str(e) # A mensagem de erro do ValueError será o detalhe
        )