from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_customer_token, verify_password
from app.crud.customer import create_customer, get_by_cpf
from app.db.session import get_db
from app.schemas.customer import CustomerLogin, CustomerLoginResponse, CustomerOut, CustomerRegister

router = APIRouter(prefix="/auth/customer", tags=["customer-auth"])


@router.post("/register", response_model=CustomerLoginResponse, status_code=status.HTTP_201_CREATED)
def register(data: CustomerRegister, db: Session = Depends(get_db)) -> CustomerLoginResponse:
    try:
        customer = create_customer(db, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    token = create_customer_token(customer_id=customer.id, name=customer.name)
    return CustomerLoginResponse(access_token=token, customer=CustomerOut.model_validate(customer))


@router.post("/login", response_model=CustomerLoginResponse)
def login(data: CustomerLogin, db: Session = Depends(get_db)) -> CustomerLoginResponse:
    customer = get_by_cpf(db, data.cpf)
    if customer is None or not verify_password(data.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha inválidos",
        )

    token = create_customer_token(customer_id=customer.id, name=customer.name)
    return CustomerLoginResponse(access_token=token, customer=CustomerOut.model_validate(customer))
