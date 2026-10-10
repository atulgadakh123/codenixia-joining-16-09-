
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.route.auth_route import router as auth_routes
from app.route.quiz_route import router as quize_routes

from app.querydatabase.database import create_users_table
from app.querydatabase.quiz_database import create_quize_table
from app.querydatabase.resultquery import create_result


app = FastAPI(title="Quize Application")


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codenixia-joining-16-09-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Connect Authentication Routes
app.include_router(auth_routes)

# Connect Quiz Routes
app.include_router(quize_routes)


# Create Database Tables
create_users_table()
create_quize_table()
create_result()


@app.get("/")
def home():
    return {
        "message": "Quize Application"
    }
