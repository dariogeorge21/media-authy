import uvicorn
from backend.config import settings

if __name__ == "__main__":
    print(f"Starting MediaAuth Forensic Agent Backend on {settings.HOST}:{settings.PORT}...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

