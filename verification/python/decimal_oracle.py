"""Independent Decimal reference calculations.

This module must never import website/frontend calculation code. It is a
reference oracle, not a statement that any legal/tax rule has been verified.
"""
from decimal import Decimal, ROUND_HALF_UP, localcontext

CENT = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    """Round a monetary amount to cents using explicit half-up rounding."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def mortgage_payment(principal: Decimal, annual_rate_percent: Decimal,
                     months: int) -> Decimal:
    """Level-payment monthly mortgage installment, no grace period."""
    if not isinstance(principal, Decimal) or not isinstance(annual_rate_percent, Decimal):
        raise TypeError("principal and annual_rate_percent must be Decimal")
    if principal <= 0:
        raise ValueError("principal must be greater than zero")
    if annual_rate_percent < 0:
        raise ValueError("annual rate cannot be negative")
    if not isinstance(months, int) or isinstance(months, bool) or months <= 0:
        raise ValueError("months must be a positive integer")
    with localcontext() as ctx:
        ctx.prec = 40
        monthly_rate = annual_rate_percent / Decimal("100") / Decimal("12")
        if monthly_rate == 0:
            return money(principal / Decimal(months))
        factor = (Decimal("1") + monthly_rate) ** months
        return money(principal * monthly_rate * factor / (factor - Decimal("1")))


def amortization_schedule(principal: Decimal, annual_rate_percent: Decimal,
                          months: int):
    """Return independently calculated monthly rows; final balance is adjusted to zero."""
    payment = mortgage_payment(principal, annual_rate_percent, months)
    balance = principal
    rows = []
    with localcontext() as ctx:
        ctx.prec = 40
        monthly_rate = annual_rate_percent / Decimal("100") / Decimal("12")
        for period in range(1, months + 1):
            interest = money(balance * monthly_rate)
            principal_paid = money(payment - interest)
            if period == months or principal_paid > balance:
                principal_paid = balance
            balance = money(balance - principal_paid)
            rows.append({
                "period": period,
                "payment": money(principal_paid + interest),
                "principal": money(principal_paid),
                "interest": interest,
                "balance": balance,
            })
    return rows
