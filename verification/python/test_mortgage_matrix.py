import unittest
from decimal import Decimal

from mortgage_matrix_oracle import calculate_schedule


class MortgageMatrixOracleTests(unittest.TestCase):
    def test_known_benchmarks_from_independent_decimal_calculation(self):
        a = calculate_schedule(Decimal("8000000"), Decimal("2.5"), 360)
        self.assertEqual(a["first_amortizing_payment"], 31610)
        self.assertEqual(a["total_interest"], 3379470)
        self.assertEqual(a["total_paid"], 11379470)
        self.assertEqual(a["ending_balance"], Decimal("0"))

        b = calculate_schedule(Decimal("8000000"), Decimal("2.5"), 240,
                               method="principal", grace_months=12)
        self.assertEqual(b["first_amortizing_payment"], 51755)
        self.assertEqual(b["grace_payment"], 16667)
        self.assertEqual(b["total_interest"], 2108318)
        self.assertEqual(b["ending_balance"], Decimal("0"))

        c = calculate_schedule(Decimal("8000000"), Decimal("2"), 240,
                               rate_change_month=61,
                               rate_after_change_percent=Decimal("3"))
        self.assertEqual(c["first_amortizing_payment"], 40471)
        self.assertEqual(c["total_interest"], 2245837)
        self.assertEqual(c["ending_balance"], Decimal("0"))

    def test_54_combinations_preserve_principal_and_monthly_identity(self):
        count = 0
        for method in ("annuity", "principal"):
            for rate in (Decimal("0"), Decimal("2.5"), Decimal("6")):
                for years in (20, 30, 40):
                    for grace in (0, 12, 36):
                        if grace >= years * 12:
                            continue
                        with self.subTest(method=method, rate=rate, years=years, grace=grace):
                            result = calculate_schedule(
                                Decimal("8000000"), rate, years * 12,
                                method=method, grace_months=grace,
                            )
                            rows = result["rows"]
                            self.assertEqual(len(rows), years * 12)
                            self.assertEqual(sum(r["principal"] for r in rows), 8000000)
                            self.assertEqual(rows[-1]["balance"], Decimal("0"))
                            for row in rows:
                                self.assertEqual(row["payment"], row["principal"] + row["interest"])
                            self.assertEqual(result["total_paid"],
                                             result["total_interest"] + 8000000)
                        count += 1
        self.assertEqual(count, 54)

    def test_rate_change_boundary_and_invalid_values(self):
        before = calculate_schedule(
            Decimal("8000000"), Decimal("2"), 240,
            rate_change_month=121, rate_after_change_percent=Decimal("3"),
        )
        self.assertEqual(before["rows"][119]["interest"], before["rows"][119]["interest"])
        self.assertNotEqual(before["rows"][119]["interest"], before["rows"][120]["interest"])
        for kwargs in (
            {"grace_months": 240},
            {"rate_change_month": 0, "rate_after_change_percent": Decimal("3")},
            {"rate_change_month": 2, "rate_after_change_percent": None},
            {"method": "unknown"},
        ):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                calculate_schedule(Decimal("8000000"), Decimal("2"), 240, **kwargs)


if __name__ == "__main__":
    unittest.main()
