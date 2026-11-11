import importlib.util
from datetime import date
from pathlib import Path
import unittest


MODULE_PATH = Path(__file__).resolve().parents[1] / "api" / "ntes_train.py"
SPEC = importlib.util.spec_from_file_location("ntes_train_adapter", MODULE_PATH)
NTES_ADAPTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(NTES_ADAPTER)


class NtesAdapterTests(unittest.TestCase):
    def setUp(self):
        self.raw = {
            "TN": "18403",
            "TNM": "BBS DHN EXPRESS",
            "STD": "12-Nov-2026",
            "SRC": "BBS",
            "SRCN": "BHUBANESWAR",
            "DSTN": "DHN",
            "DSTNN": "DHANBAD JN",
            "CPOS": "Yet to start from its source",
            "LSTNSR": 0,
            "LDEL": "0",
            "STNS": [
                {"SC": "BBS", "SN": "BHUBANESWAR", "STA": "--", "STD": "20:25 12-Nov", "DIST": "0", "PF": "1"},
                {"SC": "MCS", "SN": "MANCHESWAR", "STA": "20:32 12-Nov", "STD": "20:32 12-Nov", "DIST": "7", "PF": "1"},
                {"SC": "DHN", "SN": "DHANBAD JN", "STA": "08:00 13-Nov", "STD": "--", "DIST": "775", "PF": "2"},
            ],
        }

    def test_not_started_status_never_fabricates_speed_or_actual_station_times(self):
        result = NTES_ADAPTER.normalize_ntes_response(self.raw, "18403", date(2026, 11, 12))
        self.assertEqual(result["status"]["status"], "NOT_STARTED")
        self.assertIsNone(result["status"]["speedKmph"])
        self.assertEqual(result["status"]["routeProgress"]["completedStops"], 0)
        self.assertIsNone(result["route"]["stations"][0]["actualDeparture"])

    def test_schedule_preserves_midnight_day_and_provider_distance(self):
        result = NTES_ADAPTER.normalize_ntes_response(self.raw, "18403", date(2026, 11, 12))
        self.assertEqual(result["schedule"]["distance"], 775)
        self.assertEqual(result["schedule"]["stations"][1]["arrivalTime"], "20:32")
        self.assertEqual(result["schedule"]["stations"][2]["day"], 2)

    def test_rejects_mismatched_train_and_unverified_stations(self):
        self.assertIsNone(NTES_ADAPTER.normalize_ntes_response(self.raw, "12301", date(2026, 11, 12)))
        invalid = dict(self.raw, STNS=[{"SC": "?", "SN": "X"}])
        self.assertIsNone(NTES_ADAPTER.normalize_ntes_response(invalid, "18403", date(2026, 11, 12)))


if __name__ == "__main__":
    unittest.main()
