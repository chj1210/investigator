from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from decimal import Decimal

class TransactionBase(BaseModel):
    """
    交易的基本資料結構
    """
    amount: Decimal = Field(..., gt=0, description="交易金額")
    description: Optional[str] = Field(None, max_length=500, description="交易描述")
    transaction_date: date = Field(..., description="交易日期")

class TransactionCreate(TransactionBase):
    """
    用於建立新交易的資料結構
    """
    pass

class Transaction(TransactionBase):
    """
    從資料庫讀取或返回給客戶端的完整交易資料結構
    """
    id: int = Field(..., description="交易的唯一識別碼")
    case_id: int = Field(..., description="關聯案件的ID")

    class Config:
        from_attributes = True