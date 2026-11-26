"""Independent Decimal arithmetic oracle for the non-legal land efficiency model.

Only arithmetic is modelled here. Zoning, statutory FAR, incentive eligibility,
stacking and approvals are intentionally excluded and must come from Layer 3.
"""
from decimal import Decimal, ROUND_HALF_UP, localcontext

SQM_PER_PING = Decimal("3.305785")


def calculate(area: Decimal, unit: str, statutory_far_percent: Decimal,
              assumed_bonus_percent: Decimal, saleable_factor: Decimal,
              land_total_wan: Decimal | None = None,
              sale_price_wan_per_ping: Decimal | None = None):
    if area <= 0:
        raise ValueError("area must be positive")
    if unit not in {"ping", "sqm"}:
        raise ValueError("unit must be ping or sqm")
    if statutory_far_percent < 0 or assumed_bonus_percent < 0:
        raise ValueError("FAR and scenario bonus cannot be negative")
    if saleable_factor <= 0:
        raise ValueError("saleable factor must be positive")
    if land_total_wan is not None and land_total_wan < 0:
        raise ValueError("land price cannot be negative")
    if sale_price_wan_per_ping is not None and sale_price_wan_per_ping < 0:
        raise ValueError("sale price cannot be negative")
    with localcontext() as ctx:
        ctx.prec = 40
        area_ping = area if unit == "ping" else area / SQM_PER_PING
        base_floor_area = area_ping * statutory_far_percent / Decimal("100")
        total_floor_area = base_floor_area * (Decimal("1") + assumed_bonus_percent / Decimal("100"))
        saleable_area = total_floor_area * saleable_factor
        revenue_wan = None if sale_price_wan_per_ping is None else saleable_area * sale_price_wan_per_ping
        land_cost_per_saleable_ping = None if land_total_wan is None else land_total_wan / saleable_area
        land_cost_per_site_ping = None if land_total_wan is None else land_total_wan / area_ping
        return {
            "area_ping": area_ping,
            "base_floor_area": base_floor_area,
            "total_floor_area": total_floor_area,
            "saleable_area": saleable_area,
            "revenue_wan": revenue_wan,
            "land_cost_per_saleable_ping_wan": land_cost_per_saleable_ping,
            "land_cost_per_site_ping_wan": land_cost_per_site_ping,
        }


def display(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
