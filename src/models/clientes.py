from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, validator, Field
from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from src.config.database import Base
from src.models.rental import RentalOut # Certifique-se de que este import está correto

# Importar o PasswordContext para hashing de senha
from passlib.context import CryptContext

# Configuração do contexto de hashing de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# if TYPE_CHECKING:
#     from src.models.rental import RentalOut

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    telefone = Column(String(20), nullable=True)
    cpf_cnpj = Column(String(14), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False) # Novo campo para o hash da senha
    data_nascimento = Column(DateTime, nullable=True)
    endereco = Column(String(200), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True)
    cep = Column(String(8), nullable=True)
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, server_default=func.now(), nullable=False)
    data_atualizacao = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamento com locações
    locacoes = relationship("Rental", back_populates="cliente")

class ClienteCreate(BaseModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    cpf_cnpj: str
    senha: str = Field(..., min_length=6) # Campo para a senha em texto claro
    data_nascimento: Optional[datetime] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    
    @validator('cpf_cnpj')
    def validar_cpf_cnpj_field(cls, v):
        # Lógica de validação de CPF ou CNPJ (simplificada aqui)
        valor_limpo = ''.join(filter(str.isdigit, v))
        if len(valor_limpo) == 11 or len(valor_limpo) == 14:
            return valor_limpo
        raise ValueError('CPF deve ter 11 dígitos ou CNPJ 14 dígitos')
    
    @validator('cep')
    def validar_cep(cls, v):
        if v is not None:
            cep = ''.join(filter(str.isdigit, v))
            if len(cep) != 8:
                raise ValueError('CEP deve ter 8 dígitos')
            return cep
        return v
    
    @validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            if len(v) != 2:
                raise ValueError('Estado deve ter 2 caracteres')
            return v.upper()
        return v
    
    @validator('telefone')
    def validar_telefone(cls, v):
        if v is not None:
            telefone = ''.join(filter(str.isdigit, v))
            if len(telefone) < 10 or len(telefone) > 11:
                raise ValueError('Telefone deve ter entre 10 e 11 dígitos')
            return telefone
        return v

    # Método para fazer o hash da senha antes de criar o cliente
    def hash_password(self) -> str:
        return pwd_context.hash(self.senha)

class ClienteOut(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    cpf_cnpj: str
    password_hash: str = Field(exclude=True) # Excluir o hash da senha da saída da API
    data_nascimento: Optional[datetime]
    endereco: Optional[str]
    cidade: Optional[str]
    estado: Optional[str]
    cep: Optional[str]
    ativo: bool
    data_criacao: datetime
    data_atualizacao: datetime
    
    class Config:
        from_attributes = True

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    ativo: Optional[bool] = None
    # Não inclua senha aqui, use uma rota separada para mudança de senha
    
    @validator('cep')
    def validar_cep(cls, v):
        if v is not None:
            cep = ''.join(filter(str.isdigit, v))
            if len(cep) != 8:
                raise ValueError('CEP deve ter 8 dígitos')
            return cep
        return v
    
    @validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            if len(v) != 2:
                raise ValueError('Estado deve ter 2 caracteres')
            return v.upper()
        return v
    
    @validator('telefone')
    def validar_telefone(cls, v):
        if v is not None:
            telefone = ''.join(filter(str.isdigit, v))
            if len(telefone) < 10 or len(telefone) > 11:
                raise ValueError('Telefone deve ter entre 10 e 11 dígitos')
            return telefone
        return v

class ClienteList(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str]
    cidade: Optional[str]
    ativo: bool
    data_criacao: datetime
    
    class Config:
        from_attributes = True

class ClienteComLocacoes(ClienteOut):
    locacoes: List[RentalOut] = []
    
    class Config:
        from_attributes = True
