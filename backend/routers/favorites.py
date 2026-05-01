from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import Favorite, Item
from backend.schemas import FavoriteCreate, FavoriteOut

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
def get_favorites(db: Session = Depends(get_db)):
    return db.query(Favorite).options(joinedload(Favorite.item)).order_by(Favorite.noted_at.desc()).all()


@router.post("", response_model=FavoriteOut, status_code=201)
def add_favorite(payload: FavoriteCreate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(Favorite).filter(Favorite.item_id == payload.item_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already in favorites")

    fav = Favorite(item_id=payload.item_id, note=payload.note)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{fav_id}", status_code=204)
def remove_favorite(fav_id: int, db: Session = Depends(get_db)):
    fav = db.query(Favorite).filter(Favorite.id == fav_id).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
