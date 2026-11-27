"""Independent mortgage matrix oracle using Decimal only.

Matches the site's documented monthly convention for positive TWD amounts:
monthly interest and payments are rounded to whole dollars, half up.
Does not import or call production JavaScript.
"""
from decimal import Decimal, ROUND_HALF_UP, localcontext


def whole_twd(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def annuity_payment(balance: Decimal, annual_rate_percent: Decimal, remaining: int) -> int:
    if remaining <= 0:
        raise ValueError("remaining months must be positive")
    rate = annual_rate_percent / Decimal("1200")
    if rate == 0:
        return whole_twd(balance / remaining)
    factor = (Decimal("1") + rate) ** remaining
    return whole_twd(balance * rate * factor / (factor - Decimal("1")))


def calculate_schedule(principal: Decimal, annual_rate_percent: Decimal,
                       months: int, method: str = "annuity",
                       grace_months: int = 0,
                       rate_change_month: int | None = None,
                       rate_after_change_percent: Decimal | None = None):
    """Return rows and totals for the exact inputs and explicit rounding policy."""
    if principal <= 0:
        raise ValueError("principal must be positive")
    if annual_rate_percent < 0 or annual_rate_percent > 30:
        raise ValueError("annual rate must be between 0 and 30 percent")
    if not isinstance(months, int) or isinstance(months, bool) or months <= 0:
        raise ValueError("months must be a positive integer")
    if method not in {"annuity", "principal"}:
        raise ValueError("unsupported repayment method")
    if not isinstance(grace_months, int) or grace_months < 0 or grace_months >= months:
        raise ValueError("grace months must be nonnegative and shorter than loan term")
    if rate_change_month is None:
        if rate_after_change_percent is not None:
            raise ValueError("new rate requires a change month")
    else:
        if not isinstance(rate_change_month, int) or not 1 <= rate_change_month <= months:
            raise ValueError("rate change month must be within the loan term")
        if rate_after_change_percent is None or not Decimal("0") <= rate_after_change_percent <= Decimal("30"):
            raise ValueError("new annual rate must be between 0 and 30 percent")

    rows = []
    balance = principal
    total_interest = 0
    total_paid = 0
    first_amortizing_payment = 0
    grace_payment = 0
    with localcontext() as ctx:
        ctx.prec = 48
        fixed_principal = principal / Decimal(months - grace_months)
        for period in range(1, months + 1):
            annual_rate = annual_rate_percent
            if rate_change_month is not None and period >= rate_change_month:
                annual_rate = rate_after_change_percent
            monthly_rate = annual_rate / Decimal("1200")
            interest = whole_twd(balance * monthly_rate)
            if period <= grace_months:
                payment = interest
                principal_paid = 0
                grace_payment = whole_twd(principal * monthly_rate)
            elif method == "annuity":
                remaining = months - period + 1
                payment = annuity_payment(balance, annual_rate, remaining)
                if period == months:
                    payment = whole_twd(balance) + interest
                principal_paid = min(whole_twd(balance), max(0, payment - interest))
            else:
                principal_paid = whole_twd(fixed_principal)
                if period == months:
                    principal_paid = whole_twd(balance)
                else:
                    principal_paid = min(whole_twd(balance), principal_paid)
                payment = principal_paid + interest
            if period == grace_months + 1:
                first_amortizing_payment = payment
            balance = max(Decimal("0"), balance - Decimal(principal_paid))
            total_interest += interest
            total_paid += payment
            rows.append({
                "period": period, "payment": payment,
                "principal": principal_paid, "interest": interest,
                "balance": balance,
            })
    return {
        "rows": rows,
        "first_amortizing_payment": first_amortizing_payment,
        "grace_payment": grace_payment,
        "total_interest": total_interest,
        "total_paid": total_paid,
        "ending_balance": balance,
    }
