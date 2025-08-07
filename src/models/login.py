# src/models/user.py
from sqlalchemy import Column, Integer, String
from src.config.database import Base

class User(Base):
    __tablename__ = 'user'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default='customer')

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"