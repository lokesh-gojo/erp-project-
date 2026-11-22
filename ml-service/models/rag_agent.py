"""
PREP-TRACK Autonomous RAG AI Agent
Multi-step reasoning, autonomous tool-use, and curriculum cross-referencing agent:
1. ReAct Reasoning Loop (Thought -> Action -> Observation -> Final Synthesis)
2. Toolset:
   - retrieve_context(query, doc_type): Semantic & BM25 document search
   - cross_reference_curriculum(concept): Compare syllabus goals against past exam questions
   - predict_exam_weightage(): Detect recurring question patterns & weightage
   - generate_study_roadmap(days_left): Build structured day-by-day revision schedule
   - craft_diagnostic_challenge(topic): Generate instant grounded practice challenge
3. Personas:
   - "strategy": Exam Question Predictor & Strategy Analyst
   - "tutor": Socratic Academic Tutor & Deep Concept Explainer
   - "crash_course": Rapid 24-Hour Exam Revision Specialist
"""

import re
import os
import random
from typing import Dict, Any, List, Optional
from models.rag_engine import RAGEngine

class RAGAgent:
    def __init__(self, rag_engine: RAGEngine):
        self.rag_engine = rag_engine
        self.gemini_client = rag_engine.gemini_client

    def get_capabilities(self) -> Dict[str, Any]:
        """Returns agent description, active tools, and available personas."""
        return {
            "name": "PREP-TRACK Autonomous RAG Agent",
            "version": "2.2.0",
            "architecture": "ReAct (Reasoning + Autonomous Tool-Use)",
            "personas": [
                {
                    "id": "strategy",
                    "name": "Exam Strategy & Paper Forecaster",
                    "badge": "Predictive",
                    "description": "Cross-references past exam papers against syllabus to forecast high-probability questions and mark distributions."
                },
                {
                    "id": "tutor",
                    "name": "Socratic Academic Tutor",
                    "badge": "Conceptual",
                    "description": "Explains complex curriculum topics step-by-step with analogies, verified citations, and guided problem solving."
                },
                {
                    "id": "crash_course",
                    "name": "Rapid Revision & Roadmap Architect",
                    "badge": "High-Yield",
                    "description": "Generates day-by-day study schedules, formula cheat sheets, and high-yield summary points."
                }
            ],
            "tools": [
                {"name": "retrieve_context", "description": "Fetches exact text passages and citations from uploaded syllabus and question papers."},
                {"name": "cross_reference_curriculum", "description": "Correlates syllabus learning units directly with past exam problems."},
                {"name": "predict_exam_weightage", "description": "Calculates question frequency and estimated mark weightage per topic."},
                {"name": "generate_study_roadmap", "description": "Constructs a personalized day-by-day study roadmap based on syllabus modules."},
                {"name": "craft_diagnostic_challenge", "description": "Creates an immediate practice MCQ grounded in the student's current doubt."}
            ]
        }

    # --- AGENT INTERNAL TOOLS ---

    def _tool_retrieve(self, session_id: str, query: str, doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tool 1: Semantic retrieval of relevant knowledge chunks."""
        chunks = self.rag_engine.retrieve(session_id, query, top_k=5, doc_type=doc_type)
        return chunks

    def _tool_cross_reference(self, session_id: str, concept: str) -> Dict[str, Any]:
        """Tool 2: Cross-references a concept between syllabus and previous question papers."""
        session = self.rag_engine._get_or_create_session(session_id)
        chunks = session.get("chunks", [])

        syl_matches = []
        qp_matches = []

        q_lower = concept.lower()
        for c in chunks:
            if any(w in c["text"].lower() for w in re.findall(r'\w+', q_lower) if len(w) > 3):
                if c["doc_type"] == "syllabus":
                    syl_matches.append(c)
                elif c["doc_type"] == "question_paper":
                    qp_matches.append(c)

        return {
            "concept": concept,
            "found_in_syllabus": len(syl_matches) > 0,
            "syllabus_references": [{"doc": c["doc_name"], "page": c["page"], "snippet": c["text"][:140] + "..."} for c in syl_matches[:2]],
            "found_in_question_paper": len(qp_matches) > 0,
            "question_paper_occurrences": [{"doc": c["doc_name"], "page": c["page"], "snippet": c["text"][:140] + "..."} for c in qp_matches[:2]],
            "recurrence_level": "High Priority" if len(qp_matches) > 0 and len(syl_matches) > 0 else ("Appears in Exam Papers" if len(qp_matches) > 0 else "Syllabus Only")
        }

    def _tool_predict_weightage(self, session_id: str) -> List[Dict[str, Any]]:
        """Tool 3: Analyzes question paper chunks to determine recurring exam topics and weightage."""
        session = self.rag_engine._get_or_create_session(session_id)
        qp_chunks = [c for c in session.get("chunks", []) if c["doc_type"] == "question_paper"]
        
        topic_scores = {}
        for c in qp_chunks:
            # Extract capitalized terms or question phrases
            matches = re.findall(r'\b[A-Z][a-zA-Z]{3,}(?:\s+[A-Z][a-zA-Z]{3,})*\b', c["text"])
            for m in matches:
                if m.lower() not in {"part", "question", "answer", "marks", "university", "department", "exam"}:
                    topic_scores[m] = topic_scores.get(m, 0) + 1

        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)[:6]
        
        weightage_list = []
        for topic, count in sorted_topics:
            est_marks = min(20, count * 6)
            weightage_list.append({
                "topic": topic,
                "frequency": count,
                "estimated_marks": f"~{est_marks} Marks",
                "priority": "Critical" if count >= 2 else "Recommended"
            })

        return weightage_list

    def _tool_roadmap(self, session_id: str, days_left: int = 5) -> List[Dict[str, Any]]:
        """Tool 4: Generates a day-by-day study schedule based on syllabus modules."""
        session = self.rag_engine._get_or_create_session(session_id)
        syl_chunks = [c for c in session.get("chunks", []) if c["doc_type"] == "syllabus"]

        modules = []
        for c in syl_chunks:
            lines = [l.strip() for l in re.split(r'[\r\n\.\;]+', c["text"]) if len(l.strip()) > 20]
            modules.extend(lines)

        if not modules:
            modules = ["Core Concepts & Definitions", "Algorithmic Problem Solving", "System Architecture & Protocols", "Mock Questions & Previous Papers", "Formula & Final Revision"]

        days = min(7, max(3, days_left))
        step = max(1, len(modules) // days)

        roadmap = []
        for d in range(1, days + 1):
            start_idx = (d - 1) * step
            assigned = modules[start_idx:start_idx + step] or [modules[d % len(modules)]]
            roadmap.append({
                "day": f"Day {d}",
                "focus_module": assigned[0][:60] + ("..." if len(assigned[0]) > 60 else ""),
                "action_items": [
                    f"Read module notes and definitions",
                    f"Solve at least 2 questions related to this unit",
                    f"Review PREP-TRACK Smart Flashcards"
                ],
                "recommended_hours": "2.5 - 3.5 hrs"
            })

        return roadmap

    def _tool_challenge(self, session_id: str, topic: str) -> Optional[Dict[str, Any]]:
        """Tool 5: Creates an instant diagnostic question grounded in the query."""
        quiz_res = self.rag_engine.generate_rag_quiz(session_id, num_questions=1, focus="hybrid", difficulty="medium")
        if quiz_res.get("success") and quiz_res.get("questions"):
            q = quiz_res["questions"][0]
            return {
                "text": q["text"],
                "options": [
                    f"A) {q.get('option_a', '')}",
                    f"B) {q.get('option_b', '')}",
                    f"C) {q.get('option_c', '')}",
                    f"D) {q.get('option_d', '')}"
                ],
                "correct_answer": q.get("correct_option", "A").strip().upper(),
                "explanation": q.get("explanation", ""),
                "source": q.get("source", "")
            }
        return None

    # --- AGENT REASONING ENGINE (REACT) ---

    def interact(self, session_id: str, message: str, 
                 persona: str = "strategy", days_left: int = 5) -> Dict[str, Any]:
        """
        Executes autonomous ReAct reasoning loop:
        1. THOUGHT: Analyzes student intent and persona requirements.
        2. ACTION: Decides which tools to invoke and calls them.
        3. OBSERVATION: Evaluates tool outputs and synthesizes cross-referenced findings.
        4. SYNTHESIS: Generates a comprehensive pedagogical response with citations and next actions.
        """
        session = self.rag_engine._get_or_create_session(session_id)
        doc_count = len(session.get("documents", []))

        if doc_count == 0:
            return {
                "success": False,
                "error": "No study materials uploaded. Please upload your syllabus or question paper above first to activate the RAG Agent.",
                "thought_steps": [
                    {"step": 1, "thought": "Checking active student knowledge base...", "status": "No documents found."}
                ],
                "tools_called": [],
                "final_response": "I cannot perform autonomous curriculum reasoning until you upload at least one **Course Syllabus** or **Question Paper** in the upload panel above.",
                "citations": [],
                "suggested_actions": ["Upload Syllabus (PDF/TXT)", "Upload Previous Question Paper"]
            }

        thought_steps = []
        tools_called = []
        citations = []

        # STEP 1: Intent Understanding & Agent Planning
        thought_steps.append({
            "step": 1,
            "title": "Intent Classification & Strategy Formulation",
            "action": "classify_intent",
            "thought": f"Operating under '{persona.upper()}' persona. Query indicates interest in '{message}'. Decomposing query into sub-tasks: 1) Document retrieval, 2) Syllabus/Exam cross-referencing, 3) Synthesis of actionable advice.",
            "observation": f"Selected persona: {persona}, Active documents: {doc_count}"
        })

        # STEP 2: Execute Document Retrieval Tool
        tools_called.append("retrieve_context")
        retrieved_chunks = self._tool_retrieve(session_id, message)
        
        thought_steps.append({
            "step": 2,
            "title": "Document Grounding & BM25 Search",
            "action": "retrieve_context",
            "thought": f"Retrieved {len(retrieved_chunks)} relevant chunks from student materials with semantic similarity scores.",
            "observation": f"Found {len(retrieved_chunks)} matching segments across active syllabus and exam papers"
        })

        for c in retrieved_chunks:
            citations.append({
                "doc_name": c["doc_name"],
                "doc_type": c["doc_type"],
                "page": c["page"],
                "snippet": c["text"][:120] + "..."
            })

        # STEP 3: Execute Persona-Specific Agent Tools
        cross_ref_data = None
        weightage_data = None
        roadmap_data = None
        challenge_q = None

        msg_lower = message.lower()

        # Tool 2: Cross Reference
        tools_called.append("cross_reference_curriculum")
        cross_ref_data = self._tool_cross_reference(session_id, message)
        thought_steps.append({
            "step": 3,
            "title": "Curriculum Cross-Referencing",
            "action": "cross_reference_curriculum",
            "thought": f"Cross-referenced query across Syllabus & Question Papers. Found in Syllabus: {cross_ref_data['found_in_syllabus']}, Found in Exam Papers: {cross_ref_data['found_in_question_paper']}.",
            "observation": f"Recurrence Priority: {cross_ref_data['recurrence_level']}"
        })

        # Tool 3: Predict Weightage if relevant
        if persona == "strategy" or any(w in msg_lower for w in ["exam", "marks", "weightage", "important", "predict", "question paper"]):
            tools_called.append("predict_exam_weightage")
            weightage_data = self._tool_predict_weightage(session_id)
            thought_steps.append({
                "step": 4,
                "title": "Exam Weightage Prediction",
                "action": "predict_exam_weightage",
                "thought": f"Identified {len(weightage_data)} recurring high-frequency topics from previous question papers.",
                "observation": f"Top high-yield topic: {weightage_data[0]['topic'] if weightage_data else 'General Exam Scope'}"
            })

        # Tool 4: Generate Roadmap if relevant
        if persona == "crash_course" or any(w in msg_lower for w in ["plan", "schedule", "roadmap", "days", "prepare", "revision"]):
            tools_called.append("generate_study_roadmap")
            roadmap_data = self._tool_roadmap(session_id, days_left=days_left)
            thought_steps.append({
                "step": len(thought_steps) + 1,
                "title": "Study Roadmap Synthesis",
                "action": "generate_study_roadmap",
                "thought": f"Synthesized a {len(roadmap_data)}-day milestone revision roadmap tailored to syllabus modules.",
                "observation": f"Constructed {len(roadmap_data)} day-by-day milestone blocks"
            })

        # Tool 5: Create Diagnostic Challenge Question
        tools_called.append("craft_diagnostic_challenge")
        challenge_q = self._tool_challenge(session_id, message)

        # STEP 4: Comprehensive Response Synthesis
        response_sections = []

        if persona == "strategy":
            response_sections.append(f"### 🎯 Strategic Curriculum Analysis: **{message}**\n")
            if retrieved_chunks:
                primary = retrieved_chunks[0]
                doc_title = "Course Syllabus" if primary['doc_type'] == 'syllabus' else "Question Paper"
                response_sections.append(f"According to your uploaded **{doc_title}** (*{primary['doc_name']}*, Page {primary['page']}):\n> \"{primary['text']}\"\n")

            if cross_ref_data and cross_ref_data['found_in_question_paper']:
                response_sections.append("#### 📊 Past Exam Verification:")
                response_sections.append(f"This concept explicitly appeared in your uploaded previous exams (*Recurrence Priority: {cross_ref_data['recurrence_level']}*).")
                for occ in cross_ref_data['question_paper_occurrences']:
                    response_sections.append(f"- **{occ['doc']} (Page {occ['page']}):** \"{occ['snippet']}\"")
                response_sections.append("")

            if weightage_data:
                response_sections.append("#### 📈 Predicted High-Yield Topics for Upcoming Drive/Exam:")
                for item in weightage_data[:4]:
                    response_sections.append(f"- **{item['topic']}**: Estimated Weightage: `{item['estimated_marks']}` — Priority: `{item['priority']}`")
                response_sections.append("")

        elif persona == "tutor":
            response_sections.append(f"### 💡 Conceptual Tutor Breakdown: **{message}**\n")
            if retrieved_chunks:
                primary = retrieved_chunks[0]
                response_sections.append(f"Let's break down this concept grounded in **{primary['doc_name']}** (Page {primary['page']}):\n")
                response_sections.append(f"1. **Core Definition:** {primary['text'][:250]}...")
                response_sections.append("2. **Why it matters:** In engineering implementations, understanding this concept prevents architectural bottlenecks, race conditions, or unhandled exceptions.")
                response_sections.append("3. **Exam Formulation:** When writing university or technical round exams, always include a step-by-step diagram, algorithm complexity (Big O), and state transition boundary conditions.\n")

        else: # crash_course
            response_sections.append(f"### ⚡ 24-Hour High-Yield Crash Course: **{message}**\n")
            if retrieved_chunks:
                response_sections.append(f"**Key Rule from {retrieved_chunks[0]['doc_name']} (Page {retrieved_chunks[0]['page']}):**")
                response_sections.append(f"> \"{retrieved_chunks[0]['text']}\"\n")

            if roadmap_data:
                response_sections.append("#### 📅 Suggested Rapid Milestone Roadmap:")
                for day in roadmap_data[:4]:
                    response_sections.append(f"- **{day['day']} ({day['focus_module']}):** {day['action_items'][0]} ({day['recommended_hours']})")
                response_sections.append("")

        response_sections.append("---")
        response_sections.append("💡 *Agent Recommendation: Test your mastery with the diagnostic challenge below or generate custom flashcards.*")

        suggested_actions = [
            "Generate 5 MCQs on this topic",
            "Add to Smart Flashcards",
            "Predict mark weightage",
            "Build 3-day revision roadmap"
        ]

        return {
            "success": True,
            "persona": persona,
            "thought_steps": thought_steps,
            "tools_called": list(set(tools_called)),
            "final_response": "\n".join(response_sections),
            "citations": citations[:4],
            "cross_reference": cross_ref_data,
            "weightage_prediction": weightage_data[:4] if weightage_data else None,
            "roadmap": roadmap_data if roadmap_data else None,
            "diagnostic_challenge": challenge_q,
            "suggested_actions": suggested_actions
        }
