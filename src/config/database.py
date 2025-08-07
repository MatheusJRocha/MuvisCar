import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# Configuração básica de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

ENV = os.getenv("NODE_ENV", "development").lower()

def get_database_url():
    """Retorna a URL do banco baseada no ambiente"""
    if ENV == "production":
        # Validação das variáveis obrigatórias
        required_vars = ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_NAME"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            raise ValueError(f"Variáveis obrigatórias não encontradas: {missing_vars}")
        
        DB_USER = os.getenv("DB_USER")
        DB_PASSWORD = os.getenv("DB_PASSWORD")
        DB_HOST = os.getenv("DB_HOST")
        DB_PORT = os.getenv("DB_PORT", "5432")
        DB_NAME = os.getenv("DB_NAME")
        return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    elif ENV == "test":
        return "sqlite:///:memory:"
    
    else:  # development
        os.makedirs(os.path.join(os.getcwd(), "database"), exist_ok=True)
        return f"sqlite:///{os.path.join(os.getcwd(), 'database', 'locacar.db')}"

# Criar engine com configurações seguras
DATABASE_URL = get_database_url()

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        echo=(ENV == "development"),
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=(ENV == "development"),
        pool_pre_ping=True,
        pool_recycle=3600
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency para injeção de dependência do FastAPI"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Erro na sessão do banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def import_models():
    """Importa todos os modelos de forma segura"""
    try:
        # Importar na ordem correta para evitar problemas de dependência
        from src.models.clientes import Cliente
        from src.models.car import Car
        from src.models.rental import Rental
        
        logger.info("Modelos importados com sucesso")
        return True
    except Exception as e:
        logger.error(f"Erro ao importar modelos: {e}")
        # Log mais detalhado para debug
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        return False

def connect_db():
    """Conecta ao banco e cria tabelas se necessário"""
    try:
        # Testar conexão
        with engine.connect() as conn:
            logger.info(f"Banco conectado ({engine.url.drivername})")

        # Criar tabelas apenas em development e test
        if ENV in ["development", "test"]:
            try:
                # Importar modelos de forma segura
                if not import_models():
                    raise Exception("Falha ao importar modelos")
                
                # Criar tabelas
                Base.metadata.create_all(bind=engine)
                logger.info("Tabelas sincronizadas")
                
            except Exception as table_error:
                logger.error(f"Erro ao criar tabelas: {table_error}")
                
                # Tentar recriar o banco limpo apenas para SQLite
                if DATABASE_URL.startswith("sqlite"):
                    logger.info("Recriando banco SQLite...")
                    try:
                        # Remover arquivo do banco se existir
                        if os.path.exists("database/locacar.db"):
                            os.remove("database/locacar.db")
                        
                        # Reimportar modelos
                        if import_models():
                            Base.metadata.create_all(bind=engine)
                            logger.info("Banco recriado com sucesso")
                        else:
                            raise Exception("Falha ao reimportar modelos")
                    except Exception as recreate_error:
                        logger.error(f"Erro ao recriar banco: {recreate_error}")
                        raise
                else:
                    raise

    except SQLAlchemyError as e:
        logger.error(f"Erro ao conectar com o banco: {e}")
        raise
    except Exception as e:
        logger.error(f"Erro inesperado: {e}")
        raise