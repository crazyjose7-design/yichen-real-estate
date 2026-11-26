import unittest
from decimal import Decimal

from decimal_oracle import amortization_schedule, mortgage_payment, money


class DecimalOracleTests(unittest.TestCase):
    def test_money_uses_explicit_half_up_rounding(self):
        self.assertEqual(money(Decimal("1.005")), Decimal("1.01"))
        self.assertEqual(money(Decimal("1.004")), Decimal("1.00"))

    def test_zero_interest_payment(self):
        self.assertEqual(
            mortgage_payment(Decimal("1200000"), Decimal("0"), 120),
            Decimal("10000.00"),
        )

    def test_known_mortgage_reference(self):
        # Independent benchmark: 1,000,000 at 2.4% nominal annual rate for 240 months.
        self.assertEqual(
            mortgage_payment(Decimal("1000000"), Decimal("2.4"), 240),
            Decimal("5250.45"),
        )

    def test_schedule_conserves_principal_and_ends_at_zero(self):
        rows = amortization_schedule(Decimal("1200000"), Decimal("0"), 120)
        self.assertEqual(len(rows), 120)
        self.assertEqual(sum((r["principal"] for r in rows), Decimal("0")), Decimal("1200000.00"))
        self.assertEqual(rows[-1]["balance"], Decimal("0.00"))

    def test_rejects_invalid_inputs(self):
        for args in [
            (Decimal("0"), Decimal("2"), 12),
            (Decimal("100"), Decimal("-1"), 12),
            (Decimal("100"), Decimal("2"), 0),
        ]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                mortgage_payment(*args)
        with self.assertRaises(TypeError):
            mortgage_payment(100, Decimal("2"), 12)


if __name__ == "__main__":
    unittest.main()
