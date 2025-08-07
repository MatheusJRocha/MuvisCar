from .car_routes import backend as car_routes
from .clientes_routes import backend as clientes_routes
from .rental_routes import backend as rental_routes
# from .users import router as users_router

__all__ = ["cars_router", "clientes_router", "rentals_router", "users_router"]
