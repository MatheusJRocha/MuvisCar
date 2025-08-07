from typing import Union
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.clientes import ClienteCreate, ClienteOut
from src.services.cliente_service import ClienteService

backend = APIRouter()
from typing import Union
from fastapi import APIRouter, Body, Depends, HTTPException, status, Response # Importe Response
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.models.clientes import ClienteOut
from src.services.cliente_service import ClienteService

backend = APIRouter()

@backend.post("/user/login", response_model=ClienteOut, summary="Autenticar Usuario")
def login_cliente(
    # Adicione `response: Response` para poder definir o cookie
    response: Response,
    cpf_cnpj: str = Body(..., alias="cpf_cnpj", description="CPF ou CNPJ do cliente"), 
    senha: Union[str, int] = Body(..., description="Senha do Usuario"),
    db: Session = Depends(get_db)
):
    """
    Autentica um cliente com CPF/CNPJ e senha.
    Retorna os dados do cliente autenticado e define o cookie de acesso.
    """
    service = ClienteService(db)
    cliente = service.autenticar_cliente(cpf_cnpj, str(senha))
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha inválidos"
        )
    
    # Gere um token de acesso aqui. O exemplo usa um valor fictício.
    # Em uma aplicação real, você deve usar um JWT (JSON Web Token) seguro.
    access_token = "token_de_acesso_ficticio_123"

    # Define o cookie `access_token` na resposta
    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="strict", secure=False)
    
    return cliente

from fastapi import Response

@backend.post("/user/logout", summary="Logout do usuário (cliente)")
def logout_cliente(response: Response):
    """
    Realiza o logout do usuário cliente, removendo o cookie de acesso.
    """
    response.delete_cookie(key="access_token")
    return {"message": "Logout realizado com sucesso"}
    