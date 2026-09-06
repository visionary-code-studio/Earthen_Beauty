import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_db

SECRET_KEY = os.getenv("JWT_SECRET", "earthen_beauty_super_secure_jwt_secret_2026_luxury")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer(auto_error=False)


def create_token(payload: dict, expires_days: int = ACCESS_TOKEN_EXPIRE_DAYS) -> str:
    """Create a signed JWT token."""
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired. Please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authenticate a customer from Bearer token."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user session")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return dict(user)


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authenticate an admin from Bearer token."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    payload = decode_token(credentials.credentials)
    admin_id = payload.get("admin_id")
    if not admin_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin session")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role FROM admins WHERE id = ?", (admin_id,))
    admin = cursor.fetchone()
    conn.close()

    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin account not found")

    return dict(admin)
