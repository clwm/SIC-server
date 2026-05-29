from app.database import Base, engine
from app import models  # 반드시 모델 import 되어 있어야 함

Base.metadata.create_all(bind=engine)