"""
PREP-TRACK ML Service: Weak Area Diagnosis & Adaptive Remedial Recommender
Analyzes question-level responses from student_answers to diagnose cognitive gaps
and generate customized remedial test recommendations.
"""

from typing import List, Dict, Any

class WeakAreaRecommender:
    def diagnose(self, answers_history: List[Dict[str, Any]]):
        """
        Input: list of answers with { question_id, sub_topic_title, topic_title, is_correct, mark }
        Output: Ranked weak areas with failure rates and tailored remedial curriculum.
        """
        if not answers_history:
            return {
                "has_data": False,
                "message": "No test response data available yet. Complete a placement test to unlock AI diagnosis.",
                "weak_areas": [],
                "recommended_quiz": None
            }

        topic_stats = {}
        for ans in answers_history:
            sub = ans.get("sub_topic_title") or ans.get("topic_title") or "General Aptitude"
            if sub not in topic_stats:
                topic_stats[sub] = {
                    "sub_topic": sub,
                    "parent_topic": ans.get("topic_title", "Placement Prep"),
                    "total_attempted": 0,
                    "incorrect_count": 0,
                    "total_marks_lost": 0
                }
            
            topic_stats[sub]["total_attempted"] += 1
            if not ans.get("is_correct", False):
                topic_stats[sub]["incorrect_count"] += 1
                topic_stats[sub]["total_marks_lost"] += ans.get("mark", 1)

        diagnosed = []
        for sub, data in topic_stats.items():
            tot = data["total_attempted"]
            err = data["incorrect_count"]
            error_rate = (err / tot) * 100.0 if tot > 0 else 0.0
            
            # Severity index accounts for error rate weighted by volume
            severity_index = (error_rate * 0.7) + (min(tot, 10) * 3.0)

            if error_rate >= 30.0 or err >= 2:
                status = "Critical Bottleneck" if error_rate >= 60.0 else "Needs Practice"
                diagnosed.append({
                    "sub_topic": sub,
                    "parent_topic": data["parent_topic"],
                    "attempted": tot,
                    "incorrect": err,
                    "error_rate": round(error_rate, 1),
                    "mastery_level": round(100.0 - error_rate, 1),
                    "status": status,
                    "severity": round(severity_index, 1)
                })

        # Sort by severity descending
        diagnosed.sort(key=lambda x: x["severity"], reverse=True)

        top_weak = diagnosed[:3]

        # Formulate customized remedial test recommendation
        recommended_quiz = None
        if top_weak:
            primary_weakness = top_weak[0]
            recommended_quiz = {
                "title": f"AI Remedial Sprint: {primary_weakness['sub_topic']}",
                "focus_area": primary_weakness['sub_topic'],
                "target_skills": [w["sub_topic"] for w in top_weak],
                "recommended_questions_count": 15,
                "estimated_minutes": 20,
                "expected_score_improvement": f"+{min(25, int(primary_weakness['error_rate'] * 0.4))}%",
                "reasoning": f"You made mistakes in {primary_weakness['incorrect']} out of {primary_weakness['attempted']} questions in {primary_weakness['sub_topic']}."
            }

        return {
            "has_data": True,
            "total_answers_analyzed": len(answers_history),
            "weak_areas": top_weak,
            "recommended_quiz": recommended_quiz
        }

