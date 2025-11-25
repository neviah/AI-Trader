from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

@app.get("/")
async def root():
    return {"message": "AI-Trader Backend is working!"}

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    # Simple validation
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    return {
        "access_token": "fake_token_123",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "is_active": True
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    # Simple login check
    if user_data.username_or_email == "test@test.com" and user_data.password == "password":
        return {
            "access_token": "fake_token_123",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": "test@test.com",
                "full_name": "Test User",
                "is_active": True
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)