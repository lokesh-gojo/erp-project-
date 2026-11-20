"""
PREP-TRACK Machine Learning & AI Intelligence Service
FastAPI Microservice hosting specialized AI/ML & RAG models:
1. Placement Readiness & Company Tier Predictor (Supervised Softmax)
2. Weak Area & Adaptive Remedial Quiz Recommender (Cognitive Diagnostic Engine)
3. Exam Malpractice & Behavioral Anomaly Detector (Integrity Analysis)
4. Score Trajectory & Performance Forecaster (Linear/Polynomial Trend Regressor)
5. AI Question & Distractor Generator (Algorithmic Question Engine)
6. RAG Engine: Syllabus & Question Paper Doubt Clearing Chatbot & Quiz Generator
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import os
import base64

from models.placement_predictor import PlacementPredictor
from models.weak_area_recommender import WeakAreaRecommender
from models.exam_integrity_detector import ExamIntegrityDetector
from models.performance_forecaster import PerformanceForecaster
from models.question_generator import QuestionGenerator
from models.rag_engine import RAGEngine
from models.resume_scanner import ResumeScanner
from models.mock_interviewer import MockInterviewer
from models.rag_agent import RAGAgent
from models.bloom_irt_engine import BloomIRTEngine

app = FastAPI(
    title="PREP-TRACK ML & RAG Intelligence Service",
    description="Campus Recruitment & Assessment Intelligence System",
    version="2.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Models in memory
placement_model = PlacementPredictor()
weak_area_model = WeakAreaRecommender()
integrity_model = ExamIntegrityDetector()
forecaster_model = PerformanceForecaster()
question_gen_model = QuestionGenerator()
rag_engine = RAGEngine()
resume_scanner = ResumeScanner()
mock_interviewer = MockInterviewer()
rag_agent = RAGAgent(rag_engine)
bloom_irt_engine = BloomIRTEngine()


# --- REQUEST & RESPONSE SCHEMAS ---

class PlacementPredictRequest(BaseModel):
    quant_score: float = Field(..., ge=0, le=100)
    reasoning_score: float = Field(..., ge=0, le=100)
    verbal_score: float = Field(..., ge=0, le=100)
    tech_score: float = Field(..., ge=0, le=100)
    avg_time_sec_per_q: Optional[float] = 60.0
    tests_completed: Optional[int] = 1

class WeakAreaDiagnoseRequest(BaseModel):
    answers: List[Dict[str, Any]]

class IntegrityDetectRequest(BaseModel):
    total_questions: int
    duration_seconds: int
    score_pct: float
    answers: Optional[List[Dict[str, Any]]] = None

class ForecastRequest(BaseModel):
    test_history: List[Dict[str, Any]]

class QuestionGenRequest(BaseModel):
    domain: str = "quant"
    count: int = 5

class RAGUploadRequest(BaseModel):
    session_id: str
    file_name: str
    doc_type: str = "syllabus"  # 'syllabus' or 'question_paper'
    file_base64: Optional[str] = None
    text_content: Optional[str] = None

class RAGChatRequest(BaseModel):
    session_id: str
    query: str

class RAGQuizGenRequest(BaseModel):
    session_id: str
    num_questions: Optional[int] = 5
    focus: Optional[str] = "hybrid"  # 'syllabus', 'question_paper', 'hybrid'
    difficulty: Optional[str] = "medium"

class RAGFlashcardRequest(BaseModel):
    session_id: str
    count: Optional[int] = 8

class RAGCheatSheetRequest(BaseModel):
    session_id: str

class ResumeScanRequest(BaseModel):
    file_name: str
    file_base64: Optional[str] = None
    text_content: Optional[str] = None
    target_role: Optional[str] = "Full Stack / Software Engineer"

class InterviewStartRequest(BaseModel):
    domain: Optional[str] = "tech_cs"
    role_title: Optional[str] = "Software Engineer"

class InterviewEvalRequest(BaseModel):
    domain: Optional[str] = "tech_cs"
    question_id: str
    student_answer: str
    question_index: Optional[int] = 1

class RAGAgentInteractRequest(BaseModel):
    session_id: str
    message: str
    persona: Optional[str] = "strategy"
    days_left: Optional[int] = 5

class BloomClassifyRequest(BaseModel):
    text: str

class IRTAbilityRequest(BaseModel):
    responses: List[Dict[str, Any]]
    prior_mean: Optional[float] = 0.0
    prior_sd: Optional[float] = 1.0

class CATNextItemRequest(BaseModel):
    current_theta: float
    candidate_pool: List[Dict[str, Any]]
    administered_ids: List[Any]

class XAIExplainRequest(BaseModel):
    quant: float
    reasoning: float
    verbal: float
    tech: float
    time_sec_per_q: Optional[float] = 50.0
    test_count: Optional[int] = 1


# --- API ENDPOINTS ---

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PREP-TRACK ML & RAG Intelligence Service",
        "models_loaded": [
            "PlacementPredictor (Softmax)",
            "WeakAreaRecommender",
            "ExamIntegrityDetector",
            "PerformanceForecaster",
            "QuestionGenerator",
            "RAGEngine (BM25 + Semantic Search)"
        ]
    }

@app.post("/predict/placement-fit")
def predict_placement_fit(req: PlacementPredictRequest):
    try:
        result = placement_model.predict(
            quant_score=req.quant_score,
            reasoning_score=req.reasoning_score,
            verbal_score=req.verbal_score,
            tech_score=req.tech_score,
            avg_time_sec_per_q=req.avg_time_sec_per_q,
            tests_completed=req.tests_completed
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/weak-areas")
def diagnose_weak_areas(req: WeakAreaDiagnoseRequest):
    try:
        result = weak_area_model.diagnose(req.answers)
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/exam-integrity")
def detect_exam_integrity(req: IntegrityDetectRequest):
    try:
        result = integrity_model.analyze_session(
            total_questions=req.total_questions,
            duration_seconds=req.duration_seconds,
            score_pct=req.score_pct,
            answers=req.answers
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast/performance")
def forecast_performance(req: ForecastRequest):
    try:
        result = forecaster_model.forecast(req.test_history)
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/questions")
def generate_questions(req: QuestionGenRequest):
    try:
        result = question_gen_model.generate(domain=req.domain, count=req.count)
        return { "success": True, "questions": result, "count": len(result) }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- RAG SYSTEM ENDPOINTS ---

@app.post("/rag/upload")
def upload_rag_document(req: RAGUploadRequest):
    try:
        file_bytes = b""
        if req.file_base64:
            file_bytes = base64.b64decode(req.file_base64)
        
        result = rag_engine.ingest_document(
            session_id=req.session_id,
            file_name=req.file_name,
            doc_type=req.doc_type,
            file_bytes=file_bytes,
            text_override=req.text_content
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/session/{session_id}")
def get_rag_session(session_id: str):
    return rag_engine.get_session_info(session_id)

@app.delete("/rag/session/{session_id}")
def clear_rag_session(session_id: str):
    rag_engine.clear_session(session_id)
    return { "success": True, "message": "Session documents cleared." }

@app.post("/rag/chat")
def rag_chat(req: RAGChatRequest):
    try:
        res = rag_engine.answer_doubt(session_id=req.session_id, query=req.query)
        return { "success": True, "data": res }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/generate-quiz")
def rag_generate_quiz(req: RAGQuizGenRequest):
    try:
        res = rag_engine.generate_rag_quiz(
            session_id=req.session_id,
            num_questions=req.num_questions or 5,
            focus=req.focus or "hybrid",
            difficulty=req.difficulty or "medium"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/generate-flashcards")
def rag_generate_flashcards(req: RAGFlashcardRequest):
    try:
        res = rag_engine.generate_flashcards(
            session_id=req.session_id,
            count=req.count or 8
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/generate-cheat-sheet")
def rag_generate_cheat_sheet(req: RAGCheatSheetRequest):
    try:
        res = rag_engine.generate_cheat_sheet(session_id=req.session_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/placement/scan-resume")
def scan_candidate_resume(req: ResumeScanRequest):
    try:
        file_bytes = b""
        if req.file_base64:
            file_bytes = base64.b64decode(req.file_base64)

        result = resume_scanner.analyze_resume(
            file_name=req.file_name,
            file_bytes=file_bytes,
            text_override=req.text_content,
            target_role=req.target_role or "Software Engineer"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interview/start")
def start_mock_interview(req: InterviewStartRequest):
    try:
        result = mock_interviewer.start_interview(
            domain=req.domain or "tech_cs",
            role_title=req.role_title or "Software Engineer"
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interview/evaluate-response")
def evaluate_interview_response(req: InterviewEvalRequest):
    try:
        result = mock_interviewer.evaluate_response(
            domain=req.domain or "tech_cs",
            question_id=req.question_id,
            student_answer=req.student_answer,
            question_index=req.question_index or 1
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AUTONOMOUS RAG AI AGENT ENDPOINTS ---

@app.get("/rag/agent/capabilities")
def get_rag_agent_capabilities():
    return rag_agent.get_capabilities()

@app.post("/rag/agent/interact")
def interact_with_rag_agent(req: RAGAgentInteractRequest):
    try:
        result = rag_agent.interact(
            session_id=req.session_id,
            message=req.message,
            persona=req.persona or "strategy",
            days_left=req.days_left or 5
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- IEEE COGNITIVE & ADAPTIVE INTELLIGENCE ENDPOINTS ---

@app.post("/cognitive/classify-bloom")
def classify_bloom(req: BloomClassifyRequest):
    try:
        return { "success": True, "data": bloom_irt_engine.classify_bloom_level(req.text) }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cognitive/estimate-ability-irt")
def estimate_ability_irt(req: IRTAbilityRequest):
    try:
        result = bloom_irt_engine.estimate_ability_eap(
            responses=req.responses,
            prior_mean=req.prior_mean or 0.0,
            prior_sd=req.prior_sd or 1.0
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cognitive/cat-next-item")
def get_cat_next_item(req: CATNextItemRequest):
    try:
        result = bloom_irt_engine.select_next_cat_question(
            current_theta=req.current_theta,
            candidate_pool=req.candidate_pool,
            administered_ids=req.administered_ids
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cognitive/xai-explain-placement")
def xai_explain_placement(req: XAIExplainRequest):
    try:
        result = bloom_irt_engine.explain_placement_prediction(
            quant=req.quant,
            reasoning=req.reasoning,
            verbal=req.verbal,
            tech=req.tech,
            time_sec_per_q=req.time_sec_per_q or 50.0,
            test_count=req.test_count or 1
        )
        return { "success": True, "data": result }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5002))
    print(f"🚀 Launching PREP-TRACK ML & RAG Service on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
