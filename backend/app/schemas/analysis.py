from pydantic import BaseModel
from .transaction import Transaction

class AnomalousTransaction(Transaction):
    """
    用於表示異常交易及其原因的資料結構
    """
    reason: str