import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Dict, Any

# Carrega as variáveis de ambiente, caso ainda não tenham sido carregadas
from dotenv import load_dotenv
load_dotenv()

# --- Configuração do JWT ---
# Pegamos a chave secreta das variáveis de ambiente.
# É crucial que essa chave seja mantida em segredo!
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("A variável de ambiente 'SECRET_KEY' não está definida.")
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Token expira em 30 minutos

ALGORITHM = "HS256"
# ---------------------------

def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    """
    Cria um token de acesso JWT com uma data de expiração.

    Args:
        data (Dict[str, Any]): Os dados que serão codificados no token. 
                               Deve conter um "sub" (subject), como o CPF/CNPJ do usuário.
        expires_delta (timedelta, optional): O tempo de expiração do token. 
                                             Se não fornecido, o padrão é 30 minutos.
    
    Returns:
        str: O token JWT codificado.
    """
    # Cria uma cópia dos dados para não modificar o dicionário original
    to_encode = data.copy()

    # Define a data de expiração do token
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    # Adiciona a data de expiração aos dados do token
    to_encode.update({"exp": expire})
    
    # Codifica os dados e a chave secreta em um JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_access_token(token: str, credentials_exception) -> str:
    """
    Verifica a validade de um token de acesso.

    Args:
        token (str): O token JWT a ser verificado.
        credentials_exception: A exceção a ser lançada se o token for inválido.
    
    Returns:
        str: O subject (sub) do token, que geralmente é o identificador do usuário.
    """
    try:
        # Decodifica o token usando a chave secreta
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Pega o subject do token
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        return username
    
    except JWTError:
        raise credentials_exception
