"""
PREP-TRACK ML Service: Exam Malpractice & Behavioral Anomaly Detector
Evaluates test attempt pacing, reading speeds, and answering distributions using
unsupervised anomaly heuristics and statistical variance analysis.
"""

import numpy as np
from typing import List, Dict, Any

class ExamIntegrityDetector:
    def analyze_session(self, total_questions: int, duration_seconds: int, 
                        score_pct: float, answers: List[Dict[str, Any]] = None):
        """
        Evaluate student test attempt for anomalous behavioral signatures.
        """
        flags = []
        integrity_score = 100.0

        if total_questions <= 0:
            return {
                "integrity_score": 100.0,
                "risk_level": "Low",
                "is_anomalous": False,
                "flags": []
            }

        avg_sec_per_q = duration_seconds / total_questions if total_questions > 0 else 60.0

        # Anomaly Rule 1: Superhuman answering speed on high score
        # e.g., answering 25 questions in under 45 seconds and getting > 70%
        if avg_sec_per_q < 2.5 and score_pct >= 60.0:
            integrity_score -= 55.0
            flags.append({
                "type": "IMPOSSIBLE_SPEED",
                "severity": "High",
                "description": f"Attempt completed at {avg_sec_per_q:.1f}s per question with high score ({score_pct}%). Insufficient time to read questions."
            })
        elif avg_sec_per_q < 4.0 and score_pct >= 80.0:
            integrity_score -= 35.0
            flags.append({
                "type": "SUSPICIOUS_SPEED",
                "severity": "Medium",
                "description": f"Unusually fast completion time ({avg_sec_per_q:.1f}s/q) with {score_pct}% accuracy."
            })

        # Anomaly Rule 2: Perfect score with zero review time
        if score_pct == 100.0 and duration_seconds < (total_questions * 5):
            integrity_score -= 25.0
            flags.append({
                "type": "FLAWLESS_BURST",
                "severity": "Medium",
                "description": "Perfect 100% score recorded in minimal elapsed time."
            })

        # Anomaly Rule 3: Uniform intervals (bot signature) if answers list has individual timestamps
        if answers and len(answers) >= 5:
            deltas = [a.get("time_taken_seconds", 0) for a in answers if a.get("time_taken_seconds") is not None]
            if len(deltas) >= 5:
                variance = float(np.var(deltas))
                if variance < 0.2:
                    integrity_score -= 30.0
                    flags.append({
                        "type": "SYNTHETIC_PACING",
                        "severity": "High",
                        "description": "Zero variance detected in question answer intervals (potential automation script)."
                    })

        integrity_score = max(5.0, min(100.0, integrity_score))
        risk_level = "High" if integrity_score < 60.0 else ("Medium" if integrity_score < 80.0 else "Low")

        return {
            "integrity_score": round(integrity_score, 1),
            "risk_level": risk_level,
            "is_anomalous": len(flags) > 0,
            "average_seconds_per_question": round(avg_sec_per_q, 1),
            "flags": flags
        }

