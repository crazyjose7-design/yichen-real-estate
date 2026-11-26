import unittest
from decimal import Decimal

from land_efficiency_oracle import calculate, display, SQM_PER_PING


class LandEfficiencyOracleTests(unittest.TestCase):
    def test_known_base_case(self):
        result = calculate(Decimal("100"), "ping", Decimal("200"),
                           Decimal("0"), Decimal("1.3"),
                           Decimal("8000"), Decimal("60"))
        self.assertEqual(result["base_floor_area"], Decimal("200"))
        self.assertEqual(result["total_floor_area"], Decimal("200"))
        self.assertEqual(result["saleable_area"], Decimal("260"))
        self.assertEqual(display(result["land_cost_per_saleable_ping_wan")), Decimal("30.77"))
        self.assertEqual(result["land_cost_per_site_ping_wan"], Decimal("80"))
        self.assertEqual(result["revenue_wan"], Decimal("15600"))

    def test_square_metre_conversion(self):
        result = calculate(Decimal("330.5785"), "sqm", Decimal("200"),
                           Decimal("0"), Decimal("1.3"))
        self.assertEqual(result["area_ping"], Decimal("100"))
        self.assertEqual(result["saleable_area"], Decimal("260"))

    def test_bonus_is_only_an_explicit_scenario_input(self):
        base = calculate(Decimal("100"), "ping", Decimal("200"),
                         Decimal("0"), Decimal("1.3"))
        scenario = calculate(Decimal("100"), "ping", Decimal("200"),
                             Decimal("20"), Decimal("1.3"))
        self.assertEqual(base["saleable_area"], Decimal("260"))
        self.assertEqual(scenario["saleable_area"], Decimal("312"))
        # This oracle never determines whether the bonus is legally eligible.
        self.assertNotIn("approved_bonus", scenario)

    def test_unit_conversion_round_trip(self):
        for ping in (Decimal("0.01"), Decimal("1"), Decimal("100"), Decimal("12345.678")):
            sqm = ping * SQM_PER_PING
            recovered = sqm / SQM_PER_PING
            self.assertLess(abs(recovered - ping), Decimal("1e-30"))

    def test_invalid_inputs_are_rejected(self):
        cases = [
            (Decimal("0"), "ping", Decimal("200"), Decimal("0"), Decimal("1.3")),
            (Decimal("100"), "unknown", Decimal("200"), Decimal("0"), Decimal("1.3")),
            (Decimal("100"), "ping", Decimal("-1"), Decimal("0"), Decimal("1.3")),
            (Decimal("100"), "ping", Decimal("200"), Decimal("-1"), Decimal("1.3")),
            (Decimal("100"), "ping", Decimal("200"), Decimal("0"), Decimal("0")),
        ]
        for args in cases:
            with self.subTest(args=args), self.assertRaises(ValueError):
                calculate(*args)


if __name__ == "__main__":
    unittest.main()
