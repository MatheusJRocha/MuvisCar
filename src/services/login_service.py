from typing import List, Optional
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from src.models.rental import User

# Contexto para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data) -> User:
        """Criar um novo usuário"""
        # Hash da senha
        hashed_password = pwd_context.hash(user_data.password)
        
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            role=user_data.role
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
    
    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Listar usuários"""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Buscar usuário por ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Buscar usuário por username"""
        return self.db.query(User).filter(User.username == username).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Buscar usuário por email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar senha"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def authenticate_user(self, username: str, password: str | int) -> Optional[User]:
        """Autenticar usuário"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        
        # Converte a senha para string antes de verificar
        if not self.verify_password(str(password), user.password_hash):
            return None
        
        return user

    def update_user_password(self, user_id: int, new_password: str) -> Optional[User]:
        """Atualizar senha do usuário"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        user.password_hash = pwd_context.hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """Deletar usuário"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        return True