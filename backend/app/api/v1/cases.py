from fastapi import APIRouter, HTTPException, status, Depends
import math
from typing import List
from sqlalchemy.orm import Session
from app.schemas.case import Case, CaseCreate, CaseUpdate
from app.schemas.analysis import AnomalousTransaction
from app import models
from app.database import SessionLocal

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=Case, status_code=status.HTTP_201_CREATED)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    """
    建立一個新的案件。
    """
    db_case = models.Case(**case.model_dump())
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

@router.get("/", response_model=List[Case])
def read_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    讀取所有案件的列表。
    """
    cases = db.query(models.Case).offset(skip).limit(limit).all()
    return cases

@router.post("/{case_id}/analyze", response_model=List[AnomalousTransaction])
def analyze_transactions(case_id: int, db: Session = Depends(get_db)):
    """
    分析指定案件的交易，找出高額異常交易。
    """
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    transactions = db_case.transactions
    if not transactions:
        return []

    amounts = [float(t.amount) for t in transactions]
    n = len(amounts)
    avg_amount = sum(amounts) / n
    if n > 1:
        variance = sum([(x - avg_amount) ** 2 for x in amounts]) / n
        std_dev = math.sqrt(variance)
    else:
        std_dev = 0 # 如果只有一筆交易，標準差為 0
    
    anomalous_transactions = []
    for t in transactions:
        if float(t.amount) > avg_amount + 2 * std_dev:
            anomalous_transaction = AnomalousTransaction(
                **t.__dict__,
                reason="高額異常"
            )
            anomalous_transactions.append(anomalous_transaction)
            
    return anomalous_transactions

@router.put("/{case_id}", response_model=Case)
def update_case(case_id: int, case: CaseUpdate, db: Session = Depends(get_db)):
    """
    更新指定的案件。
    """
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    
    update_data = case.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_case, key, value)
        
    db.commit()
    db.refresh(db_case)
    return db_case

@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
def delete_case(case_id: int, db: Session = Depends(get_db)):
    """
    刪除指定的案件。
    """
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if db_case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    db.delete(db_case)
    db.commit()
    return {"ok": True}