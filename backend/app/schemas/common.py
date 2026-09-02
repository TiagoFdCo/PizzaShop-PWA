from pydantic import BaseModel, ConfigDict


def to_camel(snake_str: str) -> str:
    first, *rest = snake_str.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    """
    Base para todo schema de request/response.

    O front (types/*.ts) já fala camelCase (logoUrl, deliveryFee, cookId...).
    Em vez de forçar P2/P3/P5 a re-mapear campo por campo na integração,
    a API já devolve/aceita camelCase — só o código Python interno fica em
    snake_case (padrão PEP 8). `populate_by_name` permite construir o schema
    também a partir do nome Python nos testes/seed script.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
