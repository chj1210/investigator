from fastapi import FastAPI

from app.api.v1 import cases, transactions
from . import models
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="警政單位應用人工智慧偵查金融經濟犯罪平台 API",
    description="本 API 提供金融犯罪偵查所需的核心功能，包括案件管理、金流分析與 AI 模型服務。",
    version="1.0.0",
)

app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(transactions.router, prefix="/api/v1", tags=["Transactions"])

@app.get("/")
async def root():
    """
    API 根節點，用於確認服務是否正常運行。
    """
    return {"message": "AI Financial Crime Investigation Platform API is running."}
