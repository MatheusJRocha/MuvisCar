from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from src.models.clientes import Cliente, ClienteCreate, ClienteUpdate
from passlib.context import CryptContext # Importar o contexto de hashing

# Configuração do contexto de hashing de senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ClienteService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_cliente_by_cpf_cnpj(self, cpf_cnpj: str) -> Cliente | None:
        """Busca um cliente pelo CPF ou CNPJ."""
        return self.db.query(Cliente).filter(Cliente.cpf_cnpj == cpf_cnpj).first()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica se a senha em texto claro corresponde ao hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def autenticar_cliente(self, cpf_cnpj: str, senha: str) -> Cliente | None:
        """
        Autentica um cliente verificando o CPF/CNPJ e a senha.
        Retorna o objeto Cliente se a autenticação for bem-sucedida, caso contrário, None.
        """
        cliente = self.get_cliente_by_cpf_cnpj(cpf_cnpj)
        if not cliente:
            return None
        if not self.verify_password(senha, cliente.password_hash):
            return None
        return cliente

    def create_cliente(self, cliente_data: ClienteCreate) -> Cliente:
        """Criar um novo cliente, fazendo o hash da senha antes de salvar."""
        # Faz o hash da senha antes de criar o objeto Cliente
        hashed_password = cliente_data.hash_password()
        
        # Cria um dicionário com os dados do cliente, excluindo a senha em texto claro
        cliente_dict = cliente_data.dict(exclude={'senha'})
        cliente_dict['password_hash'] = hashed_password # Adiciona o hash da senha
        
        db_cliente = Cliente(**cliente_dict)
        self.db.add(db_cliente)
        self.db.commit()
        self.db.refresh(db_cliente)
        return db_cliente
    
    def get_clientes(self, skip: int = 0, limit: int = 100, ativo: Optional[bool] = None) -> List[Cliente]:
        """Listar clientes"""
        query = self.db.query(Cliente)
        
        if ativo is not None:
            query = query.filter(Cliente.ativo == ativo)
        
        return query.offset(skip).limit(limit).all()
    
    def get_cliente_by_id(self, cliente_id: int) -> Optional[Cliente]:
        """Buscar cliente por ID"""
        return self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    def get_cliente_by_cpf_cnpj(self, cpf_cnpj: str) -> Optional[Cliente]: # Renomeado de get_cliente_by_cpf
        """Buscar cliente por CPF ou CNPJ"""
        # Remove caracteres especiais do CPF/CNPJ
        cpf_cnpj_clean = ''.join(filter(str.isdigit, cpf_cnpj))
        return self.db.query(Cliente).filter(Cliente.cpf_cnpj == cpf_cnpj_clean).first()
    
    def get_cliente_by_email(self, email: str) -> Optional[Cliente]:
        """Buscar cliente por email"""
        return self.db.query(Cliente).filter(Cliente.email == email).first()
    
    def update_cliente(self, cliente_id: int, cliente_data: ClienteUpdate) -> Optional[Cliente]:
        """Atualizar cliente"""
        db_cliente = self.get_cliente_by_id(cliente_id)
        if not db_cliente:
            return None
        
        # Atualizar apenas os campos fornecidos
        for key, value in cliente_data.dict(exclude_unset=True).items():
            setattr(db_cliente, key, value)
        
        self.db.commit()
        self.db.refresh(db_cliente)
        return db_cliente
    
    def delete_cliente(self, cliente_id: int) -> bool:
        """Deletar cliente (hard delete)"""
        db_cliente = self.get_cliente_by_id(cliente_id)
        if not db_cliente:
            return False
        
        # **MUDANÇA AQUI:** Deleta o objeto do banco de dados
        self.db.delete(db_cliente) 
        self.db.commit()
        return True
    
    def get_cliente_with_locacoes(self, cliente_id: int) -> Optional[Cliente]:
        """Buscar cliente com suas locações"""
        return self.db.query(Cliente).options(
            joinedload(Cliente.locacoes)
        ).filter(Cliente.id == cliente_id).first()
    
    def search_clientes(self, search_term: str) -> List[Cliente]:
        """Buscar clientes por nome ou email"""
        return self.db.query(Cliente).filter(
            (Cliente.nome.ilike(f"%{search_term}%")) |
            (Cliente.email.ilike(f"%{search_term}%"))
        ).all()
