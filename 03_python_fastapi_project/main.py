from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import CartItem, Product, create_tables, get_db


class ProductCreateDto(BaseModel):
    name: str
    price: float
    description: str | None = None
    stock: int

class ProductUpdateDto(BaseModel):
    name: str | None = None
    price: float | None = None
    description: str | None = None
    stock: int | None = None

class ProductResponseDto(BaseModel):
    id: int
    name: str
    price: float
    description: str | None = None
    stock: int

    class Config:
        from_attributes = True

class ProductListDto(BaseModel):
    id: int
    name: str
    price: float
    stock: int

    class Config:
        from_attributes = True

class CartItemDto(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    quantity: int

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template"}


@app.post("/products/", response_model=ProductResponseDto)
async def create_product(product: ProductCreateDto, db: AsyncSession = Depends(get_db)):
    db_product = Product(name=product.name, price=product.price, description=product.description, stock=product.stock);
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@app.get("/products/", response_model=List[ProductListDto])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    products = result.scalars().all()
    return products


@app.get("/products/{product_id}", response_model=ProductResponseDto)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found!")

    return product


@app.put("/products/{product_id}", response_model=ProductResponseDto)
async def update_product(product_id: int, product_update: ProductUpdateDto, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    db_product = result.scalar_one_or_none()

    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found!")

    for field, value in product_update.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)

    await db.commit()
    await db.refresh(db_product)
    return db_product


@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    db_product = result.scalar_one_or_none()

    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found!!")

    await db.delete(db_product)
    await db.commit()
    return {"message": "Product deleted successfully!"}


@app.get("/cart/", response_model=List[CartItemDto])
async def get_cart(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CartItem, Product).join(Product, CartItem.product_id == Product.id)
    )
    rows = result.all()
    return [
        CartItemDto(
            id=cart_item.id,
            product_id=cart_item.product_id,
            product_name=product.name,
            product_price=product.price,
            quantity=cart_item.quantity,
        )
        for cart_item, product in rows
    ]


@app.post("/cart/{product_id}", response_model=CartItemDto)
async def add_to_cart(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found!")
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="Product out of stock!")

    product.stock -= 1

    cart_result = await db.execute(select(CartItem).where(CartItem.product_id == product_id))
    cart_item = cart_result.scalar_one_or_none()

    if cart_item is None:
        cart_item = CartItem(product_id=product_id, quantity=1)
        db.add(cart_item)
    else:
        cart_item.quantity += 1

    await db.commit()
    await db.refresh(cart_item)

    return CartItemDto(
        id=cart_item.id,
        product_id=cart_item.product_id,
        product_name=product.name,
        product_price=product.price,
        quantity=cart_item.quantity,
    )


@app.delete("/cart/{product_id}")
async def remove_from_cart(product_id: int, db: AsyncSession = Depends(get_db)):
    cart_result = await db.execute(select(CartItem).where(CartItem.product_id == product_id))
    cart_item = cart_result.scalar_one_or_none()

    if cart_item is None:
        raise HTTPException(status_code=404, detail="Cart item not found!")

    product_result = await db.execute(select(Product).where(Product.id == product_id))
    product = product_result.scalar_one_or_none()

    if product is not None:
        product.stock += cart_item.quantity

    await db.delete(cart_item)
    await db.commit()
    return {"message": "Item removed from cart!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
