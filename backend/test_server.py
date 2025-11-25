#!/usr/bin/env python3
"""
Simple test server for validating frontend registration form
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

app = FastAPI(title="AI-Trader Test Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    errors = []
    
    # Username validation
    if len(user_data.username) < 3:
        errors.append("Username must be at least 3 characters long")
    elif len(user_data.username) > 50:
        errors.append("Username must be less than 50 characters")
    elif not re.match(r"^[a-zA-Z0-9_-]+$", user_data.username):
        errors.append("Username can only contain letters, numbers, underscores, and hyphens")
    
    # Password validation
    if len(user_data.password) < 8:
        errors.append("Password must be at least 8 characters long")
    elif not re.search(r"[A-Z]", user_data.password):
        errors.append("Password must contain at least one uppercase letter")
    elif not re.search(r"[a-z]", user_data.password):
        errors.append("Password must contain at least one lowercase letter")
    elif not re.search(r"\d", user_data.password):
        errors.append("Password must contain at least one number")
    elif not re.search(r"[!@#$%^&*(),.?\":{}|<>]", user_data.password):
        errors.append("Password must contain at least one special character")
    
    # Email validation (basic)
    if "@" not in user_data.email:
        errors.append("Invalid email format")
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Validation failed",
                "message": "; ".join(errors),
                "fields": errors
            }
        )
    
    return {
        "success": True, 
        "message": "Registration successful!", 
        "data": {
            "user": {
                "email": user_data.email,
                "username": user_data.username,
                "full_name": user_data.full_name
            }
        }
    }

@app.get("/")
async def health_check():
    return {"status": "OK", "message": "AI-Trader Test Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)