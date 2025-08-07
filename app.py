# Seu código de imports e configurações...
import os
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

# Seus imports de rotas...
from src.config.database import Base, engine
from src.routes.car_routes import backend as car_router
from src.routes.rental_routes import UPLOAD_DIRECTORY, backend as rental_router # Importe UPLOAD_DIRECTORY
from src.routes.clientes_routes import backend as clientes_router
from src.routes.login_router import backend as login_router

load_dotenv()

# --- INÍCIO DA CONFIGURAÇÃO DO FRONTEND E PATHS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# Seus arquivos HTML devem estar na pasta 'templates'
TEMPLATES_DIR = BASE_DIR / "frontend" / "templates"
STATIC_DIR = BASE_DIR / "frontend" / "static"

templates = Jinja2Templates(directory=TEMPLATES_DIR)
# --- FIM DA CONFIGURAÇÃO DO FRONTEND E PATHS ---

BASE_URL_API = os.getenv("API_BASE_URL", "http://localhost:8000")

app = FastAPI(
    title="LOCACAR",
    description="API for Locacar, a car rental service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS...
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Arquivos estáticos
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
# A linha abaixo precisa ser adicionada para servir as imagens da CNH
app.mount("/cnh_images", StaticFiles(directory=UPLOAD_DIRECTORY), name="cnh_images")

# Cria tabelas
Base.metadata.create_all(bind=engine)

# ... (Rotas do Frontend - Sem alterações) ...
@app.get("/", response_class=HTMLResponse)
async def root():
    return RedirectResponse(url="/login")

@app.get("/home", response_class=HTMLResponse)
async def show_home_page(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return RedirectResponse(url="/login", status_code=302)
    return templates.TemplateResponse(
        "home.html", {"request": request, "title": "Página Inicial"}
    )


@app.get("/carros", response_class=HTMLResponse)
async def show_cars_page(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return RedirectResponse(url="/login", status_code=302)

    return templates.TemplateResponse(
        "carros.html", {"request": request, "title": "Lista de Carros"}
    )


@app.get("/clientes", response_class=HTMLResponse)
async def show_clientes_page(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return RedirectResponse(url="/login", status_code=302)

    return templates.TemplateResponse(
        "clientes.html", {"request": request, "title": "Lista de Clientes"}
    )


@app.get("/locacoes", response_class=HTMLResponse)
async def show_rentals_page(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return RedirectResponse(url="/login", status_code=302)

    return templates.TemplateResponse(
        "locacoes.html", {"request": request, "title": "Lista de Locações"}
    )


@app.get("/login", response_class=HTMLResponse)
async def show_login_page(request: Request):
    return templates.TemplateResponse(
        "login.html", {"request": request, "title": "Login"}
    )

@app.post("/user/logout")
async def logout(response: Response):
    """
    Remove o cookie de autenticação e redireciona para a página de login.
    """
    response = RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    response.delete_cookie(key="access_token")
    return response

# --- FIM DAS ROTAS DO FRONTEND ---

# Rotas da API
app.include_router(car_router, prefix="/cars", tags=["Carros"])
app.include_router(clientes_router, prefix="/clientes", tags=["Clientes"])
# A rota de upload da CNH deve ser incluída sem prefixo
app.include_router(rental_router, prefix="/rental", tags=["Locações"]) 
app.include_router(login_router, prefix="/login", tags=["Login"])


# Middleware global para exceções
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as err:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "Internal Server Error", "error": str(err)}
        )

# Handler 404 personalizado
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "message": "Rota não encontrada",
            "availableRoutes": [
                "GET /",
                "GET /login",
                "GET /carros",
                "GET /clientes",
                "GET /locacoes",
                "GET /cars",
                "POST /cars",
                "GET /cars/{car_id}",
                "PUT /cars/{car_id}",
                "DELETE /cars/{car_id}",
                "GET /clientes",
                "POST /clientes",
                "POST /login",
                "POST /logout",
                "GET /clientes/{client_id}",
                "PUT /clientes/{client_id}",
                "DELETE /clientes/{client_id}",
                "GET /rental/locacoes",
                "GET /rental/locacoes/{rental_id}",
                "POST /rental/locacoes",
                "DELETE /rental/locacoes/{rental_id}",
                "POST /rental/locacoes/locacoes/{rental_id}/finish",
            ]
        }
    )


# Execução com Python direto
if __name__ == "__main__":
    import uvicorn
    import webbrowser
    import os

    # Abrir navegador apenas se for ambiente com GUI
    if os.getenv("DISPLAY") or os.name == "nt":
        webbrowser.open("http://localhost:8000/login")

    # Sem reload aqui, apenas execução direta
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
