"""
PREP-TRACK ML Service: Student Score Trajectory & Performance Forecaster
Fits linear and polynomial trend lines on sequential test sessions
to estimate score velocity and predict upcoming placement drive performance.
"""

import numpy as np
from typing import List, Dict, Any

class PerformanceForecaster:
    def forecast(self, test_history: List[Dict[str, Any]]):
        """
        Input: list of completed test objects with { test_id, score, date/created_at }
        Output: Forecasted next score, velocity slope, momentum status.
        """
        if not test_history or len(test_history) == 0:
            return {
                "has_data": False,
                "momentum": "New Student",
                "momentum_badge": "Getting Started",
                "projected_score": 50.0,
                "trend_slope": 0.0,
                "forecast_summary": "Complete your first few tests to unlock performance forecasting."
            }

        scores = [float(t.get("score", 0)) for t in test_history if t.get("score") is not None]
        if not scores:
            scores = [0.0]

        n = len(scores)
        if n == 1:
            current = scores[0]
            projected = min(100.0, max(0.0, current + 5.0))
            return {
                "has_data": True,
                "tests_count": 1,
                "current_average": round(current, 1),
                "momentum": "Steady",
                "momentum_badge": "Initial Baseline",
                "trend_slope": 0.0,
                "projected_score": round(projected, 1),
                "forecast_summary": f"Baseline established at {current:.1f}%. Take more practice modules to track trajectory."
            }

        # Linear regression over sequential attempts: y = slope * x + intercept
        x = np.arange(n)
        y = np.array(scores)

        slope, intercept = np.polyfit(x, y, 1)

        # Predict next test score (x = n)
        projected = float(slope * n + intercept)
        # Cap projected score realistically
        projected = min(100.0, max(0.0, projected))

        current_avg = float(np.mean(scores))
        latest_score = scores[-1]

        # Determine momentum category
        if slope >= 3.0:
            momentum = "Accelerating"
            momentum_badge = "🚀 High Growth"
            summary = f"Strong upward velocity (+{slope:.1f}% per test). Projected to hit {projected:.1f}% in upcoming drive."
        elif slope > 0.5:
            momentum = "Consistent Progress"
            momentum_badge = "📈 Improving"
            summary = f"Steady positive gains (+{slope:.1f}% per test). Maintaining solid placement readiness."
        elif slope >= -1.0:
            momentum = "Plateau"
            momentum_badge = "⚖️ Stable"
            summary = f"Performance is stable around {current_avg:.1f}%. Tackle higher difficulty tests to break the plateau."
        else:
            momentum = "Declining / Fatigue Risk"
            momentum_badge = "⚠️ Needs Support"
            summary = f"Scores have dipped recently (Slope: {slope:.1f}%). Focus on foundational review and pacing."

        return {
            "has_data": True,
            "tests_count": n,
            "current_average": round(current_avg, 1),
            "latest_score": round(latest_score, 1),
            "momentum": momentum,
            "momentum_badge": momentum_badge,
            "trend_slope": round(float(slope), 2),
            "projected_score": round(projected, 1),
            "forecast_summary": summary
        }

