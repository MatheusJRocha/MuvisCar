# src/routes/social_auth.py

import os
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from src.config.database import SessionLocal, get_db
from sqlalchemy.orm import Session
from src.models.clientes import ClienteCreate
from src.services.cliente_service import ClienteService


backend = APIRouter()
oauth = OAuth()

# Configure o Google OAuth
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@backend.get('/login/google')
async def login_google(request: Request):
    redirect_uri = request.url_for('auth_google')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@backend.get('/auth/google')
async def auth_google(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)

        # Procura ou cria o cliente no seu banco de dados
        service = ClienteService(db)
        cliente = service.get_cliente_by_email(user_info['email'])
        if not cliente:
            new_cliente = ClienteCreate(
                nome=user_info.get('name'),
                email=user_info.get('email'),
                # Outros campos necessários...
            )
            cliente = service.registro_rapido_cliente(new_cliente)

        # Cria a sessão do usuário (como o token JWT, por exemplo) e redireciona
        response = RedirectResponse(url="/home", status_code=status.HTTP_302_FOUND)
        # Aqui, você geraria um token JWT e o adicionaria como cookie na response
        # Ex: token = create_access_token(data={"sub": cliente.email})
        # response.set_cookie(key="access_token", value=token, httponly=True)
        return response

    except Exception as e:
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

# Repita o mesmo processo para a Microsoft