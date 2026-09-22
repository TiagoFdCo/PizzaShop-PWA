from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.customer import Customer
from app.schemas.customer import CustomerRegister


def get_by_cpf(db: Session, cpf: str) -> Customer | None:
    """`cpf` já deve vir normalizado (só dígitos) — ver schemas/customer.py."""
    stmt = select(Customer).where(Customer.cpf == cpf)
    return db.scalar(stmt)


def create_customer(db: Session, data: CustomerRegister) -> Customer:
    # data.cpf já foi validado e normalizado pelo schema (CustomerRegister).
    if get_by_cpf(db, data.cpf) is not None:
        raise ValueError("Já existe um cliente cadastrado com este CPF.")

    customer = Customer(
        name=data.name,
        phone=data.phone,
        cpf=data.cpf,
        password_hash=hash_password(data.password),
        cep=data.cep,
        street=data.street,
        number=data.number,
        complement=data.complement,
        neighborhood=data.neighborhood,
        city=data.city,
        state=data.state,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
