import unittest
import json
from services.research_exchange.convert import convert


class TestExchange(unittest.TestCase):
    def test_macm_csv_is_only_aggregate(self):
        text = "tick,user_id,action\n1,alice,post\n2,bob,share\n2,alice,reply\n"
        r = convert("macm", text, "dev")
        self.assertEqual(r["aggregates"], {"events": 3, "steps": 2})
        self.assertNotIn("alice", json.dumps(r))
        self.assertEqual(r["imported_status"], "UNVERIFIED_EXTERNAL_RESULT")

    def test_rhpc_and_dragonradio(self):
        self.assertEqual(convert("rhpc_smple", "action\npost\nlike\n", "v1")["aggregates"]["posts"], 2)
        self.assertEqual(convert("dragonradio", "rssi_dbm\n-65\n-75\n", "v1")["aggregates"],
                         {"frames": 2, "rssi_dbm": -70})

    def test_atlantis_sarif(self):
        result = convert("atlantis", json.dumps({"runs": [{"results": [{}, {}]}]}), "v1")
        self.assertEqual(result["aggregates"]["findings"], 2)

    def test_armory_and_quantum(self):
        data = {"samples": 2, "clean": {"accuracy": 1}, "perturbed": {"accuracy": .5}}
        self.assertEqual(convert("armory", json.dumps(data), "v1")["aggregates"]["clean_accuracy"], 1)
        self.assertEqual(convert("pyliqtr", json.dumps({"T": 12, "Clifford": 4, "LogicalQubits": 2}), "v1")["aggregates"]["t_count"], 12)

    def test_other_sources(self):
        self.assertEqual(convert("angr", '{"blocks":8,"functions":3}', "v1")["aggregates"]["blocks"], 8)
        self.assertEqual(convert("openroad", '{"design__instance__count":100}', "v1")["aggregates"]["cells"], 100)
        self.assertEqual(convert("benchq", '{"physical_qubits":1000}', "v1")["aggregates"]["physical_qubits"], 1000)

    def test_refuses_bad_data(self):
        with self.assertRaises(ValueError):
            convert("armory", '{"samples":2,"clean":{"accuracy":5},"perturbed":{"accuracy":1}}', "v1")
        with self.assertRaises(ValueError):
            convert("benchq", '{"result_repr":"unsafe to assume numeric outputs"}', "v1")
        with self.assertRaises(ValueError):
            convert("macm", "x\na\n", "v1", "not_authorized")


if __name__ == "__main__":
    unittest.main()
