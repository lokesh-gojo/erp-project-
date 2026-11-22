"""
PREP-TRACK ML Service: AI Mock Interview Simulator
Simulates realistic technical & behavioral campus placement interviews:
1. Question Delivery tailored to domain (Technical CS, Core Engineering, HR & Behavioral)
2. Semantic Evaluation of student responses (Technical Accuracy, Structure, Depth)
3. Instant Rubric Scoring (1-10) with Strengths & Constructive Improvements
4. Industry-Standard Model Answer Formulation
"""

import re
import random
from typing import Dict, Any, List, Optional

class MockInterviewer:
    def __init__(self):
        self.question_bank = {
            "tech_cs": [
                {
                    "id": "q_cs_1",
                    "topic": "Data Structures & Algorithms",
                    "question": "Explain how a Hash Map handles hash collisions, and compare Chaining versus Open Addressing in terms of time complexity and cache performance.",
                    "key_concepts": ["chaining", "open addressing", "linked list", "linear probing", "cache locality", "o(1)"],
                    "model_answer": "A Hash Map handles collisions when two distinct keys produce the identical bucket index. In Chaining (Separate Chaining), each bucket stores a linked list or balanced binary search tree of colliding entries. It degrades gracefully to O(n) or O(log n) when load factor is high. In Open Addressing (Linear/Quadratic Probing or Double Hashing), all entries stay within the primary array, looking for subsequent empty slots. Open addressing provides superior CPU cache locality but suffers from clustering and requires maintaining a load factor strictly below 0.7."
                },
                {
                    "id": "q_cs_2",
                    "topic": "Operating Systems",
                    "question": "What is the difference between a Process and a Thread? How does Context Switching overhead differ between the two?",
                    "key_concepts": ["address space", "memory", "virtual address", "context switch", "registers", "pcb", "tcb"],
                    "model_answer": "A Process is an independent execution unit with its own dedicated virtual address space, memory heap, and system resources represented by a Process Control Block (PCB). A Thread is a lightweight dispatchable sub-unit within a process sharing the same address space and global variables while possessing its own stack, registers, and Thread Control Block (TCB). Context switching between processes requires saving CPU registers, flushing Translation Lookaside Buffers (TLB), and switching page directories, incurring significant latency. Context switching between threads within the same process avoids memory map invalidation and TLB flushes, resulting in dramatically lower CPU overhead."
                },
                {
                    "id": "q_cs_3",
                    "topic": "Databases & SQL",
                    "question": "Explain the ACID properties of a Relational Database Management System and discuss why indexing improves query read speed but slows down insert operations.",
                    "key_concepts": ["atomicity", "consistency", "isolation", "durability", "b-tree", "write overhead", "index rebalancing"],
                    "model_answer": "ACID stands for Atomicity (all-or-nothing transactions), Consistency (state transitions respect all integrity constraints), Isolation (concurrent transactions execute without interference, managed via lock modes or MVCC), and Durability (committed transactions persist through power loss via write-ahead logging). B-Tree database indexes speed up read operations by reducing search complexity from a full table scan O(n) to logarithmic traversal O(log n). However, every INSERT, UPDATE, or DELETE requires updating and rebalancing both the table rows and all attached B-Tree index structures, thereby increasing write latency and I/O operations."
                },
                {
                    "id": "q_cs_4",
                    "topic": "Computer Networks & Protocols",
                    "question": "Describe the TCP 3-Way Handshake process for establishing a reliable connection, and explain why a 2-way handshake is insufficient.",
                    "key_concepts": ["syn", "syn-ack", "ack", "sequence number", "duplicate packets", "half-open connection"],
                    "model_answer": "In a TCP 3-Way Handshake: 1) Client sends SYN with an initial sequence number (ISN_C) requesting connection. 2) Server responds with SYN-ACK containing its own ISN_S and acknowledges ISN_C + 1. 3) Client sends ACK acknowledging ISN_S + 1, moving the socket into ESTABLISHED state. A 2-way handshake is insufficient because it cannot prevent delayed duplicate SYN packets from old, defunct sessions. Without the client's final ACK, the server would open a phantom half-open connection and allocate buffers for a connection the client already terminated."
                },
                {
                    "id": "q_cs_5",
                    "topic": "System Design & Architecture",
                    "question": "How would you design a scalable rate-limiting system for a high-traffic REST API to prevent denial-of-service and brute-force attacks?",
                    "key_concepts": ["token bucket", "leaky bucket", "redis", "sliding window", "distributed cache", "http 429"],
                    "model_answer": "A scalable rate limiter can be implemented at the API Gateway layer using an in-memory distributed cache like Redis and the Token Bucket or Sliding Window Log algorithm. Each client is identified by API key or IP address. In the Token Bucket algorithm, tokens are replenished at a constant rate up to capacity; each request consumes a token. If the bucket is exhausted, the gateway immediately returns HTTP 429 (Too Many Requests) with a 'Retry-After' header. Using Redis with atomic Lua scripts guarantees thread-safety and sub-millisecond decision latency across distributed microservice instances."
                }
            ],
            "hr_behavioral": [
                {
                    "id": "q_hr_1",
                    "topic": "Conflict Resolution & Teamwork",
                    "question": "Tell me about a time you experienced a technical disagreement with a teammate on a project. How did you resolve it?",
                    "key_concepts": ["communication", "listening", "compromise", "data", "objective", "team goals"],
                    "model_answer": "In our academic group project, my teammate and I disagreed on whether to use SQL or MongoDB for our data layer. I organized a quick 30-minute sync where we both listed our core query patterns and data schema relationships. By focusing objectively on the data structure rather than personal preferences, we discovered that our data had strict relational foreign keys and transaction requirements. We agreed on PostgreSQL, and our collaborative compromise allowed us to ship the project two days ahead of schedule."
                },
                {
                    "id": "q_hr_2",
                    "topic": "Adversity & Handling Deadlines",
                    "question": "Describe a challenging engineering bug or tight academic deadline you faced. How did you handle the pressure?",
                    "key_concepts": ["prioritization", "root cause", "debugging", "time management", "focus"],
                    "model_answer": "During semester finals, a critical memory leak surfaced 24 hours before our capstone demo. Instead of panicking, I systematically decomposed the codebase, wrote unit test harnesses for each controller, and utilized Chrome DevTools memory profiling to isolate uncollected event listeners. By prioritizing the root cause and maintaining a calm, iterative approach, I patched the leak within 4 hours, and our team achieved the top presentation grade."
                },
                {
                    "id": "q_hr_3",
                    "topic": "Career Ambition & Company Fit",
                    "question": "Why do you want to join our organization specifically, and where do you envision your technical journey in the next three years?",
                    "key_concepts": ["company mission", "learning", "growth", "mentorship", "value addition"],
                    "model_answer": "I admire your organization's engineering culture and dedication to building scalable, high-impact products. In my initial year, my objective is to deeply master your tech stack, contribute robust, test-covered code, and earn my team's trust. Over three years, I aspire to grow into an autonomous software engineer who leads feature architectures, mentors incoming recruits, and solves mission-critical scaling challenges."
                }
            ]
        }

    def start_interview(self, domain: str = "tech_cs", role_title: str = "Software Engineer") -> Dict[str, Any]:
        """Initiates an interactive mock interview session."""
        cat = "tech_cs" if "tech" in domain.lower() or "cs" in domain.lower() else "hr_behavioral"
        q_pool = self.question_bank.get(cat, self.question_bank["tech_cs"])
        first_q = q_pool[0]

        return {
            "session_id": f"interview_{int(random.random() * 100000)}",
            "domain": domain,
            "role_title": role_title,
            "total_questions": len(q_pool),
            "current_index": 1,
            "question": {
                "id": first_q["id"],
                "topic": first_q["topic"],
                "text": first_q["question"]
            },
            "welcome_message": f"Hello! Welcome to your AI Technical Mock Interview for the position of **{role_title}**. Take your time to structure your thoughts clearly. When you are ready, provide your response below."
        }

    def evaluate_response(self, domain: str, question_id: str, student_answer: str, question_index: int = 1) -> Dict[str, Any]:
        """Evaluates student's interview response with multi-dimensional scoring and feedback."""
        if not student_answer or len(student_answer.strip()) < 15:
            return {
                "score": 3,
                "technical_accuracy": 3,
                "communication_clarity": 3,
                "depth_of_knowledge": 2,
                "strengths": ["Answer submitted"],
                "improvements": ["Response was too brief. Elaborate with specific technical mechanics, examples, or architectural trade-offs."],
                "model_answer": "See recommended structured answer below.",
                "next_question": None,
                "is_complete": False
            }

        # Locate question in bank
        cat = "tech_cs" if "tech" in domain.lower() or "cs" in domain.lower() else "hr_behavioral"
        q_pool = self.question_bank.get(cat, self.question_bank["tech_cs"])
        
        target_q = next((q for q in q_pool if q["id"] == question_id), None)
        if not target_q:
            target_q = q_pool[(question_index - 1) % len(q_pool)]

        ans_lower = student_answer.lower()
        key_concepts = target_q.get("key_concepts", [])
        
        # Concept Matching
        matched_concepts = [c for c in key_concepts if c in ans_lower]
        coverage_ratio = len(matched_concepts) / max(1, len(key_concepts))

        # Length / Structure heuristic
        word_count = len(re.findall(r'\w+', ans_lower))
        structure_score = 9 if word_count >= 60 else (7 if word_count >= 30 else 5)
        accuracy_score = min(10, max(3, int(coverage_ratio * 10) + (2 if word_count > 40 else 0)))
        depth_score = min(10, max(3, int(coverage_ratio * 7) + (3 if any(w in ans_lower for w in ["because", "trade-off", "performance", "complexity", "result"]) else 1)))

        overall_score = round((accuracy_score * 0.45) + (structure_score * 0.25) + (depth_score * 0.30), 1)

        # Formulate Strengths
        strengths = []
        if matched_concepts:
            strengths.append(f"Properly identified core industry concepts: {', '.join([c.title() for c in matched_concepts[:3]])}.")
        if word_count >= 40:
            strengths.append("Provided a well-articulated, multi-sentence technical explanation.")
        if any(w in ans_lower for w in ["trade-off", "complexity", "performance", "overhead", "versus"]):
            strengths.append("Demonstrated senior engineering maturity by considering trade-offs and performance implications.")
        if not strengths:
            strengths.append("Attempted the question with direct relevance to the prompt.")

        # Formulate Improvements
        improvements = []
        missing_concepts = [c for c in key_concepts if c not in ans_lower]
        if missing_concepts:
            improvements.append(f"Consider touching upon **{missing_concepts[0].title()}** to make your technical justification bulletproof.")
        if word_count < 35:
            improvements.append("Use the **STAR method** (Situation, Task, Action, Result) or state technical tradeoffs to add depth.")
        if not any(w in ans_lower for w in ["example", "instance", "specifically"]):
            improvements.append("Ground your answer with a concrete engineering example or use case.")

        # Prepare next question
        next_idx = question_index + 1
        next_q = None
        is_complete = False

        if next_idx <= min(len(q_pool), 4):
            candidate_q = q_pool[next_idx - 1]
            next_q = {
                "id": candidate_q["id"],
                "topic": candidate_q["topic"],
                "text": candidate_q["question"],
                "question_number": next_idx
            }
        else:
            is_complete = True

        return {
            "success": True,
            "overall_score": overall_score,
            "rating": "Strong Hire" if overall_score >= 8.5 else ("Hire" if overall_score >= 7.0 else ("Borderline" if overall_score >= 5.0 else "Needs Practice")),
            "breakdown": {
                "technical_accuracy": accuracy_score,
                "communication_clarity": structure_score,
                "depth_of_knowledge": depth_score
            },
            "matched_keywords": matched_concepts,
            "strengths": strengths,
            "improvements": improvements,
            "model_answer": target_q.get("model_answer", ""),
            "next_question": next_q,
            "is_complete": is_complete
        }
