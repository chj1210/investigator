from sqlalchemy import Column, Integer, String, ForeignKey, Date, Numeric
from sqlalchemy.orm import relationship
from .database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)

    transactions = relationship("Transaction", back_populates="case")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String, index=True)
    transaction_date = Column(Date, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"))

    case = relationship("Case", back_populates="transactions")