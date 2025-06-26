from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from .transaction import Transaction

class CaseBase(BaseModel):
    """
    案件的基本資料結構
    """
    title: str = Field(..., min_length=3, max_length=100, description="案件標題")
    description: Optional[str] = Field(None, max_length=500, description="案件詳細描述")

class CaseCreate(CaseBase):
    """
    用於建立新案件的資料結構
    """
    pass

class CaseUpdate(CaseBase):
    """
    用於更新現有案件的資料結構
    """
    pass

class Case(CaseBase):
    """
    從資料庫讀取或返回給客戶端的完整案件資料結構
    """
    id: int = Field(..., description="案件的唯一識別碼")
    status: str
    created_at: datetime
    updated_at: datetime
    transactions: List[Transaction] = []

    class Config:
        # Pydantic V2 uses `from_attributes` instead of `orm_mode`
        from_attributes = True