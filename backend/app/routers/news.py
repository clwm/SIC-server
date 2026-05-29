from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NewsItem
from app.schemas import NewsResponse

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=list[NewsResponse])
def get_news(db: Session = Depends(get_db)):
    return db.query(NewsItem).order_by(NewsItem.timestamp.desc()).limit(100).all()