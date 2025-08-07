import os
import sys
from logging.config import fileConfig

# Importe dotenv para carregar variáveis de ambiente do arquivo .env
from dotenv import load_dotenv

# Carregue as variáveis de ambiente do arquivo .env o mais cedo possível
# Certifique-se de que o arquivo .env está na raiz do seu projeto backend
load_dotenv()

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Adiciona a pasta raiz do projeto ao sys.path para que o Alembic possa encontrar seus módulos
# Isso é importante para que as importações como 'src.config.database' funcionem.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Importe APENAS a sua Base declarativa. O engine será construído aqui no env.py
from src.models.clientes import Cliente # Importe um modelo para garantir que a Base seja carregada
from src.config.database import Base as ModelBase # Certifique-se de que esta é a Base correta

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = ModelBase.metadata # Aponta para os metadados da sua Base

# --- INÍCIO DA CONFIGURAÇÃO ESPECÍFICA PARA POSTGRESQL ---
# Construa a URL do banco de dados usando as variáveis de ambiente carregadas
# Isso garante que o Alembic use a URL do PostgreSQL do seu .env
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432") # Padrão para 5432 se não especificado
DB_NAME = os.getenv("DB_NAME")

# Verifique se as variáveis essenciais para PostgreSQL estão presentes
if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_NAME]):
    raise ValueError("Variáveis de ambiente do PostgreSQL (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME) não estão configuradas. Verifique seu arquivo .env.")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Define a URL do banco de dados no objeto de configuração do Alembic
# Isso sobrescreve qualquer coisa que esteja no alembic.ini para sqlalchemy.url
config.set_main_option("sqlalchemy.url", DATABASE_URL)
# --- FIM DA CONFIGURAÇÃO ESPECÍFICA PARA POSTGRESQL ---


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # A URL agora vem do que foi definido explicitamente acima (PostgreSQL)
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Usa engine_from_config para construir o engine a partir da URL que definimos
    # no config.set_main_option, que agora é garantidamente PostgreSQL
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
