import copy
import datetime
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("profile_check", Path(__file__).with_name("validate-profile.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
now = datetime.datetime(2026, 10, 29, tzinfo=datetime.timezone.utc)
profile = {"ExpirationDate": datetime.datetime(2027, 10, 29), "TeamIdentifier": ["TEAM123456"], "UUID": "synthetic", "Name": "Synthetic distribution", "DeveloperCertificates": [b"synthetic"], "Entitlements": {"application-identifier": "TEAM123456.com.werktag.assistant", "com.apple.developer.team-identifier": "TEAM123456", "com.apple.developer.healthkit": True, "get-task-allow": False}}


class SigningContract(unittest.TestCase):
    def test_distribution(self):
        self.assertEqual(module.validate(profile, "TEAM123456", "com.werktag.assistant", now), ("synthetic", "Synthetic distribution"))

    def test_invalid_scope_and_distribution(self):
        for field, value in [("ExpirationDate", datetime.datetime(2026, 1, 1)), ("TeamIdentifier", ["OTHER"]), ("ProvisionedDevices", ["device"]), ("ProvisionsAllDevices", True), ("DeveloperCertificates", [])]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                changed = copy.deepcopy(profile)
                changed[field] = value
                module.validate(changed, "TEAM123456", "com.werktag.assistant", now)

    def test_invalid_entitlements(self):
        for field, value in [("application-identifier", "TEAM123456.*"), ("get-task-allow", True), ("com.apple.developer.healthkit", False), ("com.apple.developer.team-identifier", "OTHER")]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                changed = copy.deepcopy(profile)
                changed["Entitlements"][field] = value
                module.validate(changed, "TEAM123456", "com.werktag.assistant", now)


if __name__ == "__main__":
    unittest.main()
