"""
PREP-TRACK Machine Learning Service: IEEE Cognitive & Adaptive Intelligence Engine
Grounding in IEEE Educational Data Mining & Learning Analytics Research:
1. Item Response Theory (2-Parameter Logistic IRT Model) for Computerized Adaptive Testing (CAT)
2. Bloom's Revised Cognitive Taxonomy (L1 Remembering -> L6 Creating) Classifier
3. Explainable AI (XAI) Placement Attribution Forecaster (SHAP-inspired Feature Weighting)
4. Outcome-Based Education (OBE) Course & Program Outcome (CO-PO) Alignment Index
"""

import numpy as np
import re
from typing import List, Dict, Any, Optional

class BloomIRTEngine:
    def __init__(self):
        # 6-Level Bloom's Revised Taxonomy Keywords & Cognitive Verbs
        self.bloom_verbs = {
            "L1_Remember": [
                "define", "list", "recall", "name", "state", "identify", "repeat", "record", 
                "label", "memorize", "select", "match", "what is", "which of the following"
            ],
            "L2_Understand": [
                "explain", "describe", "summarize", "paraphrase", "classify", "discuss", 
                "illustrate", "translate", "interpret", "outline", "convert", "predict", "meaning"
            ],
            "L3_Apply": [
                "calculate", "solve", "implement", "execute", "apply", "compute", "demonstrate", 
                "operate", "determine", "derive", "find output", "simulate", "utilize"
            ],
            "L4_Analyze": [
                "analyze", "compare", "contrast", "differentiate", "distinguish", "examine", 
                "investigate", "break down", "categorize", "debug", "trace", "time complexity", "worst case"
            ],
            "L5_Evaluate": [
                "evaluate", "judge", "assess", "critique", "justify", "recommend", "select optimal", 
                "verify", "prioritize", "measure", "trade-off", "validate", "rate"
            ],
            "L6_Create": [
                "design", "construct", "formulate", "architect", "synthesize", "generate", 
                "develop", "compose", "optimize system", "integrate", "reorganize", "devise"
            ]
        }

        # IRT Item Bank parameters for standard domains [alpha=discrimination, beta=difficulty, bloom_level]
        self.default_item_parameters = {
            "quant_basic": {"alpha": 1.2, "beta": -1.2, "bloom": "L1_Remember"},
            "quant_intermediate": {"alpha": 1.5, "beta": 0.0, "bloom": "L3_Apply"},
            "quant_advanced": {"alpha": 1.8, "beta": 1.4, "bloom": "L4_Analyze"},
            "reasoning_deductive": {"alpha": 1.4, "beta": 0.2, "bloom": "L4_Analyze"},
            "tech_data_structures": {"alpha": 1.7, "beta": 0.8, "bloom": "L4_Analyze"},
            "tech_system_design": {"alpha": 2.0, "beta": 1.8, "bloom": "L6_Create"},
            "verbal_comprehension": {"alpha": 1.3, "beta": -0.3, "bloom": "L2_Understand"},
        }

    # =========================================================================
    # 1. 2-PARAMETER LOGISTIC (2PL) ITEM RESPONSE THEORY (IRT)
    # =========================================================================
    def irt_probability(self, theta: float, alpha: float, beta: float, c: float = 0.0) -> float:
        """
        Calculates probability of correct response under 2PL IRT:
        P(X=1 | theta) = c + (1 - c) / (1 + exp(-alpha * (theta - beta)))
        """
        logit = -alpha * (theta - beta)
        logit = np.clip(logit, -15.0, 15.0)  # Numerical stability
        return float(c + (1.0 - c) / (1.0 + np.exp(logit)))

    def fisher_information(self, theta: float, alpha: float, beta: float, c: float = 0.0) -> float:
        """
        Item Information Function (IIF) for Computerized Adaptive Testing:
        I(theta) = alpha^2 * (P - c)^2 * (1 - P) / ((1 - c)^2 * P)
        When c=0 (2PL model): I(theta) = alpha^2 * P * (1 - P)
        """
        p = self.irt_probability(theta, alpha, beta, c)
        p = max(1e-5, min(1.0 - 1e-5, p))
        if c == 0.0:
            return float((alpha ** 2) * p * (1.0 - p))
        numerator = (alpha ** 2) * ((p - c) ** 2) * (1.0 - p)
        denominator = ((1.0 - c) ** 2) * p
        return float(numerator / max(1e-6, denominator))

    def estimate_ability_eap(self, responses: List[Dict[str, Any]], prior_mean: float = 0.0, prior_sd: float = 1.0) -> Dict[str, Any]:
        """
        Expected A Posteriori (EAP) Bayesian latent ability estimation (theta).
        Standard in IEEE computerized adaptive testing systems.
        """
        if not responses:
            return {
                "theta": 0.0,
                "standard_error": 1.0,
                "percentile": 50.0,
                "proficiency_band": "Proficient (Average)"
            }

        # Quadrature points across latent continuum [-3.5, +3.5]
        nodes = np.linspace(-3.5, 3.5, 71)
        # Prior distribution N(mu, sigma^2)
        prior = np.exp(-0.5 * ((nodes - prior_mean) / prior_sd) ** 2)
        prior /= np.sum(prior)

        # Log-Likelihood accumulator
        log_likelihood = np.zeros_like(nodes)

        for item in responses:
            is_correct = 1.0 if item.get("is_correct", False) else 0.0
            alpha = float(item.get("discrimination", item.get("alpha", 1.4)))
            beta = float(item.get("difficulty", item.get("beta", 0.0)))
            c = float(item.get("guessing", item.get("c", 0.25)))  # 4-option MCQ guessing = 0.25

            # Compute P for all quadrature nodes
            logits = np.clip(-alpha * (nodes - beta), -15.0, 15.0)
            p_nodes = c + (1.0 - c) / (1.0 + np.exp(logits))
            p_nodes = np.clip(p_nodes, 1e-6, 1.0 - 1e-6)

            if is_correct:
                log_likelihood += np.log(p_nodes)
            else:
                log_likelihood += np.log(1.0 - p_nodes)

        # Posterior = Likelihood * Prior
        max_ll = np.max(log_likelihood)
        likelihood = np.exp(log_likelihood - max_ll)
        posterior = likelihood * prior
        post_sum = np.sum(posterior)
        if post_sum <= 0:
            posterior = prior
        else:
            posterior /= post_sum

        # EAP Ability (mean of posterior)
        theta_est = float(np.sum(nodes * posterior))
        # Standard Error (standard deviation of posterior)
        variance = float(np.sum(((nodes - theta_est) ** 2) * posterior))
        std_err = float(np.sqrt(max(1e-4, variance)))

        # Convert theta [-3, +3] to institutional percentile [1%, 99%]
        from math import erf
        percentile = float(0.5 * (1.0 + erf(theta_est / (np.sqrt(2.0) * prior_sd))) * 100.0)
        percentile = round(min(99.4, max(1.0, percentile)), 1)

        # Proficiency classification
        if theta_est >= 1.6:
            band = "Mastery (Tier 1 Product Elite)"
        elif theta_est >= 0.8:
            band = "Advanced (High Employability)"
        elif theta_est >= -0.2:
            band = "Competent (Core Placement Ready)"
        elif theta_est >= -1.2:
            band = "Developing (Foundational Skills)"
        else:
            band = "Remedial (Needs Cognitive Support)"

        return {
            "theta": round(theta_est, 3),
            "standard_error": round(std_err, 3),
            "percentile": percentile,
            "proficiency_band": band
        }

    # =========================================================================
    # 2. COMPUTERIZED ADAPTIVE TESTING (CAT) ITEM SELECTION
    # =========================================================================
    def select_next_cat_question(self, current_theta: float, candidate_pool: List[Dict[str, Any]], 
                                 administered_ids: List[Any]) -> Dict[str, Any]:
        """
        Selects next optimal question via Maximum Fisher Information Criterion.
        Ensures rapid measurement convergence.
        """
        available = [q for q in candidate_pool if q.get("question_id") not in administered_ids]
        if not available:
            return {"status": "TEST_COMPLETE", "message": "No remaining questions in pool"}

        best_q = None
        max_info = -1.0

        for q in available:
            alpha = float(q.get("discrimination", 1.4))
            beta = float(q.get("difficulty", 0.0))
            info = self.fisher_information(current_theta, alpha, beta, c=0.25)
            if info > max_info:
                max_info = info
                best_q = q

        return {
            "selected_question": best_q,
            "fisher_information": round(max_info, 4),
            "target_difficulty_beta": round(float(best_q.get("difficulty", 0.0)), 2),
            "current_ability_theta": round(current_theta, 3),
            "remaining_pool_count": len(available) - 1
        }

    # =========================================================================
    # 3. BLOOM'S TAXONOMY COGNITIVE LEVEL CLASSIFIER
    # =========================================================================
    def classify_bloom_level(self, text: str) -> Dict[str, Any]:
        """
        Rule-based NLP + Cognitive heuristic mapping of assessment questions
        into Bloom's Revised Taxonomy (L1 through L6).
        """
        clean_text = text.lower()
        level_scores = {k: 0 for k in self.bloom_verbs.keys()}

        for level, verbs in self.bloom_verbs.items():
            for verb in verbs:
                # Word boundary match
                matches = len(re.findall(r'\b' + re.escape(verb) + r'\b', clean_text))
                level_scores[level] += matches

        # Code block, complexity, or mathematical notation heuristic boosts
        if any(term in clean_text for term in ["o(n)", "o(log n)", "time complexity", "space complexity", "runtime"]):
            level_scores["L4_Analyze"] += 3
        if any(term in clean_text for term in ["code", "function", "class", "output of", "pseudocode", "debug"]):
            level_scores["L3_Apply"] += 2
        if any(term in clean_text for term in ["design architecture", "microservice", "optimal pipeline", "schema design"]):
            level_scores["L6_Create"] += 3
        if any(term in clean_text for term in ["evaluate trade-off", "which is better", "best suited for high concurrency"]):
            level_scores["L5_Evaluate"] += 2

        sorted_levels = sorted(level_scores.items(), key=lambda x: x[1], reverse=True)
        top_level, top_score = sorted_levels[0]

        # Default fallback if no explicit keywords found based on length & structure
        if top_score == 0:
            if len(clean_text) > 220:
                top_level = "L4_Analyze"
            elif any(symbol in clean_text for symbol in ["=", "+", "-", "*", "/", "%", "if", "{", "}"]):
                top_level = "L3_Apply"
            else:
                top_level = "L2_Understand"

        level_metadata = {
            "L1_Remember": {"level": 1, "name": "Remembering", "cognitive_depth": "Surface", "color": "#3B82F6"},
            "L2_Understand": {"level": 2, "name": "Understanding", "cognitive_depth": "Comprehension", "color": "#06B6D4"},
            "L3_Apply": {"level": 3, "name": "Applying", "cognitive_depth": "Procedural", "color": "#10B981"},
            "L4_Analyze": {"level": 4, "name": "Analyzing", "cognitive_depth": "Analytical", "color": "#F59E0B"},
            "L5_Evaluate": {"level": 5, "name": "Evaluating", "cognitive_depth": "Critical Thinking", "color": "#8B5CF6"},
            "L6_Create": {"level": 6, "name": "Creating", "cognitive_depth": "Synthesizing", "color": "#EC4899"}
        }

        meta = level_metadata.get(top_level, level_metadata["L2_Understand"])
        return {
            "bloom_code": top_level,
            "bloom_level_number": meta["level"],
            "bloom_name": meta["name"],
            "cognitive_depth": meta["cognitive_depth"],
            "color": meta["color"],
            "matched_verb_confidence": min(1.0, 0.45 + 0.15 * top_score)
        }

    # =========================================================================
    # 4. EXPLAINABLE AI (XAI) PLACEMENT READINESS & ATTRIBUTION ENGINE
    # =========================================================================
    def explain_placement_prediction(self, quant: float, reasoning: float, verbal: float, 
                                     tech: float, time_sec_per_q: float, test_count: int,
                                     bloom_breakdown: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Generates SHAP-inspired feature attribution vectors and explainable
        placement trajectory recommendations aligned with IEEE XAI standards.
        """
        # Baseline benchmarks for tier 1 eligibility
        benchmarks = {
            "quant": 75.0,
            "reasoning": 75.0,
            "verbal": 70.0,
            "tech": 80.0,
            "time_eff": 50.0  # seconds per question
        }

        # Weights
        w = {"quant": 0.28, "reasoning": 0.22, "verbal": 0.18, "tech": 0.32}
        composite = (quant * w["quant"] + reasoning * w["reasoning"] + 
                     verbal * w["verbal"] + tech * w["tech"])

        # Speed bonus/penalty
        speed_factor = max(-10.0, min(10.0, (benchmarks["time_eff"] - time_sec_per_q) * 0.25))
        final_readiness = max(5.0, min(99.0, composite + speed_factor))

        # SHAP-Style Feature Attributions
        attributions = [
            {
                "feature": "Technical Problem Solving (Core Coding & DSA)",
                "student_score": round(tech, 1),
                "benchmark": benchmarks["tech"],
                "impact_pct": round((tech - benchmarks["tech"]) * w["tech"], 1),
                "direction": "positive" if tech >= benchmarks["tech"] else "negative",
                "recommendation": "Maintain consistency in dynamic programming and graph structures." if tech >= 75 
                                  else "Prioritize recursion, hash tables, and algorithm complexity."
            },
            {
                "feature": "Quantitative Aptitude & Numerical Reasoning",
                "student_score": round(quant, 1),
                "benchmark": benchmarks["quant"],
                "impact_pct": round((quant - benchmarks["quant"]) * w["quant"], 1),
                "direction": "positive" if quant >= benchmarks["quant"] else "negative",
                "recommendation": "Strong speed in arithmetic; target probability and combinatorics." if quant >= 70
                                  else "Practice speed-math shortcuts and percentage calculations."
            },
            {
                "feature": "Logical & Analytical Deduction",
                "student_score": round(reasoning, 1),
                "benchmark": benchmarks["reasoning"],
                "impact_pct": round((reasoning - benchmarks["reasoning"]) * w["reasoning"], 1),
                "direction": "positive" if reasoning >= benchmarks["reasoning"] else "negative",
                "recommendation": "High pattern recognition accuracy." if reasoning >= 70
                                  else "Strengthen syllogisms, blood relations, and seating arrangements."
            },
            {
                "feature": "Verbal Articulation & Technical Communication",
                "student_score": round(verbal, 1),
                "benchmark": benchmarks["verbal"],
                "impact_pct": round((verbal - benchmarks["verbal"]) * w["verbal"], 1),
                "direction": "positive" if verbal >= benchmarks["verbal"] else "negative",
                "recommendation": "Ready for executive round presentations." if verbal >= 70
                                  else "Focus on sentence correction, paragraph coherence, and vocabulary."
            },
            {
                "feature": "Exam Pacing & Time Agility",
                "student_score": round(time_sec_per_q, 1),
                "benchmark": benchmarks["time_eff"],
                "impact_pct": round(speed_factor, 1),
                "direction": "positive" if speed_factor >= 0 else "negative",
                "recommendation": f"Optimal answer pace ({time_sec_per_q:.1f}s/q)." if speed_factor >= 0
                                  else f"Answering pace ({time_sec_per_q:.1f}s/q) exceeds 50s benchmark. Practice timed sprints."
            }
        ]

        # Target Tier Alignment
        tiers = []
        tiers.append({
            "tier": "Tier-1 Super Dream (Product Companies)",
            "examples": "Amazon, Zoho, Microsoft, Cisco, Adobe",
            "probability": round(min(98.0, max(5.0, (final_readiness - 30.0) * 1.4)), 1) if final_readiness >= 65 else 15.0,
            "status": "Target Fit" if final_readiness >= 80 else "Reachable with Focused Sprint",
            "required_delta": max(0.0, round(82.0 - final_readiness, 1))
        })
        tiers.append({
            "tier": "Tier-2 Dream & Specialist IT",
            "examples": "Freshworks, Virtusa, Thoughtworks, Persistent",
            "probability": round(min(99.0, max(25.0, final_readiness * 1.1)), 1),
            "status": "High Likelihood" if final_readiness >= 65 else "Target Goal",
            "required_delta": max(0.0, round(65.0 - final_readiness, 1))
        })
        tiers.append({
            "tier": "Tier-3 Mass Recruiters",
            "examples": "TCS Digital/Ninja, Infosys, Cognizant, Wipro, Accenture",
            "probability": round(min(99.5, max(40.0, final_readiness * 1.35)), 1),
            "status": "Qualified / High Clearance" if final_readiness >= 50 else "Developing",
            "required_delta": max(0.0, round(50.0 - final_readiness, 1))
        })

        # Outcome-Based Education (OBE) Program Outcome (PO) mapping
        obe_po_mapping = {
            "PO1_Engineering_Knowledge": round(min(100.0, tech * 1.05), 1),
            "PO2_Problem_Analysis": round(min(100.0, (quant + reasoning) / 2.0 * 1.02), 1),
            "PO3_Design_Development": round(min(100.0, tech * 0.95), 1),
            "PO4_Complex_Investigation": round(min(100.0, reasoning * 0.98), 1),
            "PO10_Communication": round(min(100.0, verbal * 1.0), 1),
            "PO12_Life_Long_Learning": round(min(100.0, 50.0 + test_count * 5.0), 1)
        }

        return {
            "readiness_index": round(final_readiness, 1),
            "composite_score": round(composite, 1),
            "attributions": attributions,
            "company_tiers": tiers,
            "obe_po_mapping": obe_po_mapping,
            "academic_recommendations": [
                "Implement 30-minute daily timed quantitative drills to eliminate the speed penalty.",
                "Reinforce Level 4 (Analyzing) and Level 5 (Evaluating) algorithmic problems on LeetCode/HackerRank.",
                "Complete 2 full-length simulated mock interviews focusing on system design and behavioural STAR methodology."
            ]
        }
