import re

_NON_DIGITS = re.compile(r"\D")


def normalize_cpf(raw: str) -> str:
    """Remove tudo que não for dígito (pontos, traço, espaços)."""
    return _NON_DIGITS.sub("", raw or "")


def is_valid_cpf(raw: str) -> bool:
    """
    Valida CPF pelo algoritmo padrão (mod 11) sobre os dois dígitos
    verificadores. Aceita o CPF com ou sem máscara — normaliza primeiro.
    Rejeita sequências de dígito repetido (ex. "111.111.111-11"), que
    passariam no cálculo mas nunca são CPFs válidos emitidos.
    """
    digits = normalize_cpf(raw)

    if len(digits) != 11 or digits == digits[0] * 11:
        return False

    for check_index in (9, 10):
        total = sum(int(digits[i]) * ((check_index + 1) - i) for i in range(check_index))
        expected = ((total * 10) % 11) % 10
        if expected != int(digits[check_index]):
            return False

    return True
