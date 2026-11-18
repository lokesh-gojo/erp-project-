"""
PREP-TRACK ML Service: AI Question & Distractor Generator
Generates high-yield placement MCQs with realistic distractors, explanations, and mark weightage.
Supports Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Technical CS.
"""

import random
from typing import List, Dict, Any

class QuestionGenerator:
    def __init__(self):
        # Curated repository of algorithmic templates and question patterns across placement domains
        self.question_templates = {
            "quant": [
                {
                    "template": "A train {speed} km/hr crosses a stationary pole in {time} seconds. What is the length of the train in metres?",
                    "generator": self._gen_train_problem
                },
                {
                    "template": "Person A finishes a project in {days_a} days and Person B finishes the same project in {days_b} days. In how many days can both complete it together?",
                    "generator": self._gen_work_problem
                },
                {
                    "template": "A trader marks goods {markup}% above cost price and allows a discount of {discount}%. What is the overall profit or loss percentage?",
                    "generator": self._gen_profit_loss_problem
                },
                {
                    "template": "The ratio of two numbers is {r1} : {r2}. If {diff} is added to each, the new ratio becomes {r3} : {r4}. What is the larger number?",
                    "generator": self._gen_ratio_problem
                },
                {
                    "template": "Calculate the compound interest on ${principal:,} for 2 years at {rate}% per annum compounded annually.",
                    "generator": self._gen_compound_interest_problem
                }
            ],
            "reasoning": [
                {
                    "template": "Complete the number sequence: {series}, ...",
                    "generator": self._gen_series_problem
                },
                {
                    "template": "In a secret coding algorithm, {word} is coded as {coded}. How will {target_word} be coded?",
                    "generator": self._gen_coding_problem
                },
                {
                    "template": "Pointing to a portrait, Person X states: 'The individual is the son of the only daughter of my father.' How is Person X related to the individual?",
                    "generator": lambda: {
                        "text": "Pointing to a portrait, Person X states: 'The individual is the son of the only daughter of my father.' If Person X is female, how is Person X related to the individual?",
                        "a": "Mother", "b": "Aunt", "c": "Sister", "d": "Grandmother",
                        "correct": "A",
                        "explanation": "Father's only daughter is Person X herself. Therefore the individual is her son."
                    }
                },
                {
                    "template": "Statements: All routers are gateways. Some gateways are firewalls. Conclusions: I. Some firewalls are routers. II. All routers are firewalls.",
                    "generator": lambda: {
                        "text": "Statements: All routers are gateways. Some gateways are firewalls. Conclusions: I. Some firewalls are routers. II. All routers are firewalls.",
                        "a": "Only conclusion I follows", "b": "Only conclusion II follows", "c": "Either I or II follows", "d": "Neither conclusion follows",
                        "correct": "D",
                        "explanation": "Gateways is an undistributed middle term; no definite relationship between routers and firewalls can be deduced."
                    }
                }
            ],
            "verbal": [
                {
                    "generator": lambda: {
                        "text": "Select the exact synonym for the word: EPHEMERAL",
                        "a": "Perpetual", "b": "Transient and short-lived", "c": "Gigantic", "d": "Substantial",
                        "correct": "B",
                        "explanation": "Ephemeral refers to something lasting for a very short time."
                    }
                },
                {
                    "generator": lambda: {
                        "text": "Identify the grammatically correct sentence:",
                        "a": "Each of the participants have been awarded a certificate.",
                        "b": "Each of the participants has been awarded a certificate.",
                        "c": "Each of the participant have been awarded certificates.",
                        "d": "Each participants has been awarded a certificate.",
                        "correct": "B",
                        "explanation": "'Each of the' takes a plural noun but a singular verb ('has been')."
                    }
                },
                {
                    "generator": lambda: {
                        "text": "Choose the precise meaning of the business idiom: 'Touch base'",
                        "a": "To conclude a legal negotiation",
                        "b": "To briefly make contact or update someone",
                        "c": "To score a touchdown in a contest",
                        "d": "To reset organizational hierarchies",
                        "correct": "B",
                        "explanation": "'Touch base' means to briefly connect or check in with someone."
                    }
                }
            ],
            "technical": [
                {
                    "generator": lambda: {
                        "text": "Which asymptotic notation represents the tight bound (both upper and lower bound) of an algorithm's complexity?",
                        "a": "Big-O notation", "b": "Big-Omega (Ω) notation", "c": "Theta (Θ) notation", "d": "Little-o notation",
                        "correct": "C",
                        "explanation": "Theta (Θ) notation denotes a tight bound bounding the function from above and below."
                    }
                },
                {
                    "generator": lambda: {
                        "text": "In relational database design, which normal form eliminates transitive dependencies?",
                        "a": "First Normal Form (1NF)", "b": "Second Normal Form (2NF)", "c": "Third Normal Form (3NF)", "d": "Boyce-Codd Normal Form (BCNF)",
                        "correct": "C",
                        "explanation": "3NF requires a relation to be in 2NF and have no transitive functional dependencies of non-prime attributes on candidate keys."
                    }
                },
                {
                    "generator": lambda: {
                        "text": "What is the time complexity to search for a key in a balanced Red-Black Tree containing N elements?",
                        "a": "O(1)", "b": "O(log N)", "c": "O(N)", "d": "O(N log N)",
                        "correct": "B",
                        "explanation": "Red-Black Trees maintain a maximum height of 2 * log2(N + 1), providing O(log N) worst-case search time."
                    }
                },
                {
                    "generator": lambda: {
                        "text": "Which CPU scheduling algorithm gives minimal average waiting time for a given set of processes with known burst times?",
                        "a": "First-Come First-Served (FCFS)", "b": "Round Robin (RR)", "c": "Shortest Job First (SJF)", "d": "Priority Scheduling",
                        "correct": "C",
                        "explanation": "SJF is provably optimal in minimizing the average waiting time for independent static processes."
                    }
                }
            ]
        }

    def _gen_train_problem(self):
        speed = random.choice([36, 54, 72, 90, 108])  # km/h
        time = random.choice([6, 8, 10, 12, 15])      # seconds
        # length = speed * (5/18) * time
        length = int(speed * (5 / 18) * time)
        distractors = [length + 30, max(20, length - 40), length + 60]
        random.shuffle(distractors)
        opts = [f"{length} m", f"{distractors[0]} m", f"{distractors[1]} m", f"{distractors[2]} m"]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(f"{length} m")]
        return {
            "text": f"A train running at {speed} km/hr crosses a stationary pole in {time} seconds. What is the length of the train in metres?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"Speed in m/s = {speed} * (5/18) = {int(speed * 5 / 18)} m/s. Length = Speed * Time = {int(speed * 5 / 18)} * {time} = {length} metres."
        }

    def _gen_work_problem(self):
        # Pick numbers with nice LCM
        pairs = [(10, 15, 6), (12, 24, 8), (20, 30, 12), (15, 30, 10), (6, 12, 4)]
        a, b, combined = random.choice(pairs)
        opts = [f"{combined} days", f"{combined + 2} days", f"{max(2, combined - 2)} days", f"{combined * 2} days"]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(f"{combined} days")]
        return {
            "text": f"Worker A can finish a job in {a} days and Worker B can finish it in {b} days. In how many days will they finish the job working together?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"Combined rate = (1/{a}) + (1/{b}) = ({a+b})/({a*b}) = 1/{combined}. Time taken = {combined} days."
        }

    def _gen_profit_loss_problem(self):
        markup = random.choice([20, 25, 40, 50])
        discount = random.choice([10, 15, 20])
        # SP = (100 + markup) * (100 - discount) / 100
        sp = (100 + markup) * (100 - discount) / 100
        net = round(sp - 100, 1)
        res_str = f"{abs(net)}% profit" if net >= 0 else f"{abs(net)}% loss"
        opts = [res_str, f"{abs(net) + 4}% profit", f"{abs(net) + 2}% loss", f"{abs(net) + 6}% profit"]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(res_str)]
        return {
            "text": f"A merchant marks goods {markup}% above cost price and provides a discount of {discount}%. What is the net profit or loss percentage?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"Let CP = 100. MP = {100+markup}. SP = {100+markup} * {100-discount}/100 = {sp}. Net = {net}%."
        }

    def _gen_ratio_problem(self):
        x = random.choice([5, 8, 11, 14])
        num1 = 3 * x
        num2 = 5 * x
        opts = [str(num2), str(num1), str(num2 + 10), str(num1 + 15)]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(str(num2))]
        return {
            "text": f"Two positive integers are in the ratio 3 : 5. If their difference is {num2 - num1}, what is the larger integer?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"Let numbers be 3x and 5x. Difference = 2x = {num2 - num1} => x = {x}. Larger number = 5 * {x} = {num2}."
        }

    def _gen_compound_interest_problem(self):
        p = random.choice([5000, 8000, 10000, 12000])
        r = random.choice([10, 5, 20])
        ci = int(p * ((1 + r / 100) ** 2) - p)
        opts = [f"${ci:,}", f"${ci + 120:,}", f"${ci - 100:,}", f"${ci * 2:,}"]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(f"${ci:,}")]
        return {
            "text": f"What is the compound interest accrued on a sum of ${p:,} over 2 years at an annual interest rate of {r}% compounded annually?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"Amount = {p} * (1 + {r}/100)^2 = {p + ci}. Compound Interest = {p + ci} - {p} = ${ci:,}."
        }

    def _gen_series_problem(self):
        start = random.choice([3, 5, 7])
        diff = random.choice([3, 4, 6])
        series = [start + i * diff for i in range(5)]
        nxt = series[-1] + diff
        opts = [str(nxt), str(nxt + 2), str(nxt - 3), str(nxt + diff)]
        random.shuffle(opts)
        correct_letter = ['A', 'B', 'C', 'D'][opts.index(str(nxt))]
        return {
            "text": f"Find the missing term in the arithmetic sequence: {', '.join(map(str, series))}, ?",
            "a": opts[0], "b": opts[1], "c": opts[2], "d": opts[3],
            "correct": correct_letter,
            "explanation": f"The constant difference between terms is {diff}. Next term = {series[-1]} + {diff} = {nxt}."
        }

    def _gen_coding_problem(self):
        return {
            "text": "If 'SYSTEM' is encoded as 'SYSMET' by reversing the last three letters, how will 'PYTHON' be encoded?",
            "a": "PYTNOH", "b": "PYTHNO", "c": "PYTOHN", "d": "NOHYTP",
            "correct": "A",
            "explanation": "First 3 letters ('PYT') remain unchanged; last 3 letters ('HON') reversed to 'NOH' => 'PYTNOH'."
        }

    def generate(self, domain: str = "quant", count: int = 5) -> List[Dict[str, Any]]:
        domain_key = domain.lower()
        if "reason" in domain_key or "logic" in domain_key:
            selected_key = "reasoning"
        elif "verb" in domain_key or "eng" in domain_key:
            selected_key = "verbal"
        elif "tech" in domain_key or "code" in domain_key or "cs" in domain_key:
            selected_key = "technical"
        else:
            selected_key = "quant"

        templates = self.question_templates.get(selected_key, self.question_templates["quant"])
        results = []
        for i in range(count):
            tpl = random.choice(templates)
            q = tpl["generator"]()
            results.append({
                "id": i + 1,
                "domain": selected_key,
                "text": q["text"],
                "option_a": q["a"],
                "option_b": q["b"],
                "option_c": q["c"],
                "option_d": q["d"],
                "correct_option": q["correct"],
                "explanation": q.get("explanation", ""),
                "mark": 1
            })

        return results

