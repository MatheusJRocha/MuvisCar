from sqlalchemy.orm import Session
from src.models.clientes import Cliente, ClienteCreate, ClienteUpdate
from fastapi import HTTPException

class ClienteController:
    def __init__(self, db: Session):
        self.db = db
    
    def criar_cliente(self, cliente_data: ClienteCreate):
        # Verificar se email já existe
        if self.db.query(Cliente).filter(Cliente.email == cliente_data.email).first():
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Verificar se CPF já existe
        if self.db.query(Cliente).filter(Cliente.cpf == cliente_data.cpf).first():
            raise HTTPException(status_code=400, detail="CPF já cadastrado")
        
        cliente = Cliente(**cliente_data.dict())
        self.db.add(cliente)
        self.db.commit()
        self.db.refresh(cliente)
        return cliente
    
    def obter_cliente(self, cliente_id: int):
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        return cliente
    
    def listar_clientes(self, skip: int = 0, limit: int = 100):
        return self.db.query(Cliente).offset(skip).limit(limit).all()
    
    def atualizar_cliente(self, cliente_id: int, cliente_data: ClienteUpdate):
        cliente = self.obter_cliente(cliente_id)
        
        for campo, valor in cliente_data.dict(exclude_unset=True).items():
            setattr(cliente, campo, valor)
        
        self.db.commit()
        self.db.refresh(cliente)
        return cliente
    
    def deletar_cliente(self, cliente_id: int):
        cliente = self.obter_cliente(cliente_id)
        self.db.delete(cliente)
        self.db.commit()
        return {"message": "Cliente deletado com sucesso"}