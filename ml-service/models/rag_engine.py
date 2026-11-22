"""
PREP-TRACK ML Service: RAG (Retrieval-Augmented Generation) Engine
Handles student uploaded Syllabus & Question Paper documents:
1. Ingestion & Semantic Chunking (PDF & Text via pypdf)
2. Hybrid BM25 & Keyword Relevance Indexing
3. Context-Aware Doubt Clearing Chatbot with Page-Level Source Citations
4. Document-Grounded RAG Quiz & MCQ Generator
"""

import io
import re
import os
import math
import random
from typing import List, Dict, Any, Optional
import pypdf
from rank_bm25 import BM25Okapi

class RAGEngine:
    def __init__(self):
        # In-memory session store: session_id -> { "documents": [...], "chunks": [...], "bm25": BM25Okapi }
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.gemini_client = None
        self._init_gemini()

    def _init_gemini(self):
        """Optional Gemini API client if API key is present."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=api_key)
                print("✨ Gemini API client initialized for RAG synthesis.")
            except Exception as e:
                print("Notice: Gemini client init skipped:", e)

    def _get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "documents": [],
                "chunks": [],
                "tokenized_corpus": [],
                "bm25": None
            }
        return self.sessions[session_id]

    def ingest_document(self, session_id: str, file_name: str, doc_type: str, 
                        file_bytes: bytes, text_override: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract text from PDF or raw string, chunk semantically, and rebuild BM25 index.
        doc_type: 'syllabus' | 'question_paper' | 'notes'
        """
        session = self._get_or_create_session(session_id)
        doc_id = f"doc_{len(session['documents']) + 1}_{int(random.random() * 10000)}"

        pages_text = []

        if text_override:
            pages_text.append({"page": 1, "text": text_override})
        elif file_name.lower().endswith(".pdf"):
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page_idx, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    if extracted.strip():
                        pages_text.append({"page": page_idx + 1, "text": extracted})
            except Exception as e:
                # Fallback to UTF-8 decoding if pdf extraction fails
                decoded = file_bytes.decode("utf-8", errors="ignore")
                pages_text.append({"page": 1, "text": decoded})
        elif file_name.lower().endswith(".docx"):
            try:
                import zipfile
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
                    xml_content = docx.read('word/document.xml')
                    tree = ET.fromstring(xml_content)
                    paragraphs = []
                    for elem in tree.iter():
                        if elem.tag.endswith('}p'):
                            text_runs = [t.text for t in elem.iter() if t.tag.endswith('}t') and t.text]
                            p_text = "".join(text_runs).strip()
                            if p_text:
                                paragraphs.append(p_text)
                    doc_text = "\n".join(paragraphs)
                    pages_text.append({"page": 1, "text": doc_text})
            except Exception as e:
                decoded = file_bytes.decode("utf-8", errors="ignore")
                pages_text.append({"page": 1, "text": decoded})
        else:
            decoded = file_bytes.decode("utf-8", errors="ignore")
            if not decoded.strip():
                try:
                    decoded = file_bytes.decode("latin-1", errors="ignore")
                except Exception:
                    pass
            pages_text.append({"page": 1, "text": decoded})

        if not pages_text or not any(p["text"].strip() for p in pages_text):
            pages_text.append({"page": 1, "text": f"Document {file_name} content."})

        # Semantic Chunking: ~400-600 characters per chunk with 80 character overlap
        new_chunks = []
        chunk_size = 500
        overlap = 100

        total_extracted_chars = 0

        for p_data in pages_text:
            text = p_data["text"]
            total_extracted_chars += len(text)
            clean_text = re.sub(r'\s+', ' ', text).strip()

            if len(clean_text) <= chunk_size:
                new_chunks.append({
                    "chunk_id": f"{doc_id}_c{len(new_chunks) + 1}",
                    "doc_id": doc_id,
                    "doc_name": file_name,
                    "doc_type": doc_type,
                    "page": p_data["page"],
                    "text": clean_text
                })
            else:
                start = 0
                while start < len(clean_text):
                    end = min(start + chunk_size, len(clean_text))
                    # Try to break at sentence or period boundary
                    if end < len(clean_text):
                        boundary = clean_text.rfind('. ', start + 200, end)
                        if boundary != -1:
                            end = boundary + 1

                    chunk_str = clean_text[start:end].strip()
                    if chunk_str:
                        new_chunks.append({
                            "chunk_id": f"{doc_id}_c{len(new_chunks) + 1}",
                            "doc_id": doc_id,
                            "doc_name": file_name,
                            "doc_type": doc_type,
                            "page": p_data["page"],
                            "text": chunk_str
                        })
                    start += (chunk_size - overlap)

        # Store document record
        doc_record = {
            "doc_id": doc_id,
            "file_name": file_name,
            "doc_type": doc_type,
            "page_count": len(pages_text),
            "chunk_count": len(new_chunks),
            "char_count": total_extracted_chars
        }
        session["documents"].append(doc_record)
        session["chunks"].extend(new_chunks)

        # Rebuild BM25 Index
        session["tokenized_corpus"] = [
            re.findall(r'\w+', c["text"].lower()) for c in session["chunks"]
        ]
        if session["tokenized_corpus"]:
            session["bm25"] = BM25Okapi(session["tokenized_corpus"])

        return {
            "success": True,
            "document": doc_record,
            "total_session_documents": len(session["documents"]),
            "total_session_chunks": len(session["chunks"])
        }

    def get_session_info(self, session_id: str) -> Dict[str, Any]:
        session = self._get_or_create_session(session_id)
        return {
            "session_id": session_id,
            "documents_count": len(session["documents"]),
            "chunks_count": len(session["chunks"]),
            "documents": session["documents"]
        }

    def clear_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
        return True

    def retrieve(self, session_id: str, query: str, top_k: int = 4, 
                 doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant context chunks using BM25 and keyword relevance scoring.
        """
        session = self._get_or_create_session(session_id)
        if not session["chunks"] or not session["bm25"]:
            return []

        query_tokens = re.findall(r'\w+', query.lower())
        if not query_tokens:
            query_tokens = ["syllabus", "exam", "question"]

        scores = session["bm25"].get_scores(query_tokens)
        
        # Rank by score
        scored_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

        results = []
        for idx in scored_indices:
            chunk = session["chunks"][idx]
            if doc_type and chunk["doc_type"] != doc_type:
                continue

            results.append({
                "chunk_id": chunk["chunk_id"],
                "doc_name": chunk["doc_name"],
                "doc_type": chunk["doc_type"],
                "page": chunk["page"],
                "text": chunk["text"],
                "relevance_score": round(float(scores[idx]), 3)
            })

            if len(results) >= top_k:
                break

        return results

    def answer_doubt(self, session_id: str, query: str) -> Dict[str, Any]:
        """
        Answer a student's doubt or conceptual inquiry grounded in their uploaded syllabus and question papers.
        """
        session = self._get_or_create_session(session_id)
        if not session["chunks"]:
            return {
                "answer": "No documents uploaded yet. Please upload your syllabus or question paper above so I can reference your exact coursework to resolve your doubts.",
                "sources": [],
                "has_context": False
            }

        # Retrieve top 4 relevant chunks
        retrieved_chunks = self.retrieve(session_id, query, top_k=4)

        if not retrieved_chunks:
            return {
                "answer": "I scanned your uploaded documents, but could not find a direct mention of this query. Please ensure your query relates to the uploaded syllabus or question paper.",
                "sources": [],
                "has_context": False
            }

        sources = [
            {
                "doc_name": c["doc_name"],
                "doc_type": c["doc_type"],
                "page": c["page"],
                "snippet": c["text"][:160] + "..."
            }
            for c in retrieved_chunks
        ]

        # Check if Gemini API is available for generation
        if self.gemini_client:
            try:
                context_block = "\n\n".join([
                    f"[Document: {c['doc_name']} ({c['doc_type']}) | Page {c['page']}]\n{c['text']}"
                    for c in retrieved_chunks
                ])

                prompt = f"""You are an expert academic and campus placement tutor assisting a university student.
Use ONLY the following retrieved excerpts from the student's uploaded Syllabus and Question Paper documents to answer their doubt thoroughly and clearly.

STUDENT'S UPLOADED CONTEXT:
{context_block}

STUDENT'S QUESTION / DOUBT:
{query}

INSTRUCTIONS:
1. Provide a direct, step-by-step conceptual answer to the student's doubt.
2. If the student asks about solving a question from the question paper, give the structured methodology or solution.
3. Explicitly cite where the concepts appear in their uploaded material (e.g. 'According to your Syllabus (Page X)...' or 'As seen in Question Paper...').
4. Keep the tone encouraging, structured, and pedagogical."""

                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    return {
                        "answer": response.text.strip(),
                        "sources": sources,
                        "has_context": True
                    }
            except Exception as e:
                print("Gemini API call failed, falling back to local synthesis:", e)

        # Robust Built-in Extractive RAG Synthesizer (Works 100% offline)
        best_chunk = retrieved_chunks[0]
        other_chunks = retrieved_chunks[1:]

        # Extract sentences directly answering the query
        doc_label = "Syllabus" if best_chunk['doc_type'] == 'syllabus' else "Question Paper"

        answer_paragraphs = [
            f"Based on your uploaded **{doc_label}** (*{best_chunk['doc_name']}*, Page {best_chunk['page']}):",
            f"> \"{best_chunk['text']}\""
        ]

        if other_chunks:
            sec_chunk = other_chunks[0]
            sec_label = "Syllabus" if sec_chunk['doc_type'] == 'syllabus' else "Question Paper"
            answer_paragraphs.append(
                f"\n**Additional Key Reference from {sec_label}** (*{sec_chunk['doc_name']}*, Page {sec_chunk['page']}):\n"
                f"- {sec_chunk['text'][:280]}..."
            )

        answer_paragraphs.append(
            "\n💡 **Key Takeaway & Exam Strategy**: Make sure to review the core formulas, definition boundaries, and step-by-step proofs associated with this topic as highlighted in your uploaded curriculum."
        )

        return {
            "answer": "\n\n".join(answer_paragraphs),
            "sources": sources,
            "has_context": True
        }

    def generate_rag_quiz(self, session_id: str, num_questions: int = 5, 
                          focus: str = "hybrid", difficulty: str = "medium") -> Dict[str, Any]:
        """
        Generate grounded MCQs directly extracted and synthesized from the uploaded syllabus & question paper.
        """
        session = self._get_or_create_session(session_id)
        if not session["chunks"]:
            return {
                "success": False,
                "error": "No documents uploaded. Please upload a syllabus or question paper first.",
                "questions": []
            }

        # Filter chunks by focus if requested
        target_chunks = session["chunks"]
        if focus == "syllabus":
            filtered = [c for c in target_chunks if c["doc_type"] == "syllabus"]
            if filtered: target_chunks = filtered
        elif focus == "question_paper":
            filtered = [c for c in target_chunks if c["doc_type"] == "question_paper"]
            if filtered: target_chunks = filtered

        # If Gemini is available, generate ultra-high-fidelity MCQs
        if self.gemini_client and len(target_chunks) > 0:
            try:
                sampled_chunks = random.sample(target_chunks, min(len(target_chunks), 8))
                context_str = "\n\n".join([f"[{c['doc_name']} Page {c['page']}]: {c['text']}" for c in sampled_chunks])

                prompt = f"""Generate {num_questions} multiple-choice questions (MCQs) of {difficulty} difficulty based STRICTLY on the following content extracted from the student's Syllabus and Question Paper.

DOCUMENT CONTENT:
{context_str}

Return JSON strictly in this format:
[
  {{
    "question": "Question text here",
    "option_a": "Option A text",
    "option_b": "Option B text",
    "option_c": "Option C text",
    "option_d": "Option D text",
    "correct_option": "A",
    "explanation": "Detailed explanation of why this answer is correct based on the syllabus/question paper",
    "source_reference": "Document Name Page X"
  }}
]
Do not wrap in markdown quotes if possible, return raw json array."""

                res = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if res and res.text:
                    import json
                    raw = res.text.strip()
                    if raw.startswith("```"):
                        raw = re.sub(r'^```json\s*|^```\s*|```$', '', raw, flags=re.MULTILINE).strip()
                    parsed = json.loads(raw)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        formatted = []
                        for i, q in enumerate(parsed[:num_questions]):
                            formatted.append({
                                "id": i + 1,
                                "text": q.get("question", ""),
                                "option_a": q.get("option_a", ""),
                                "option_b": q.get("option_b", ""),
                                "option_c": q.get("option_c", ""),
                                "option_d": q.get("option_d", ""),
                                "correct_option": q.get("correct_option", "A").upper(),
                                "explanation": q.get("explanation", ""),
                                "source": q.get("source_reference", "Uploaded Document")
                            })
                        return {
                            "success": True,
                            "questions": formatted,
                            "count": len(formatted),
                            "generated_by": "Gemini-RAG"
                        }
            except Exception as e:
                print("Gemini Quiz gen notice, using local RAG generator:", e)

        # Robust Offline-Safe RAG Quiz Generator
        # Extracts key terminology, statements, and topics directly from uploaded material
        questions = []
        statements = []

        # Parse every chunk into discrete concepts/lines
        for chunk in target_chunks:
            raw_lines = re.split(r'[\r\n\.\;\!\?]+|(?:\s*[\u2022\-\*]\s*)', chunk["text"])
            for line in raw_lines:
                clean_line = re.sub(r'^\s*[\d\.\-\)\(]+\s*', '', line).strip()
                if len(clean_line) >= 15:
                    statements.append({
                        "text": clean_line,
                        "doc_name": chunk["doc_name"],
                        "doc_type": chunk["doc_type"],
                        "page": chunk["page"]
                    })

        # Fallback if no lines split: use raw chunks
        if not statements:
            for chunk in target_chunks:
                statements.append({
                    "text": chunk["text"][:200],
                    "doc_name": chunk["doc_name"],
                    "doc_type": chunk["doc_type"],
                    "page": chunk["page"]
                })

        random.shuffle(statements)
        common_distractors = [
            "Inheritance", "Polymorphism", "Synchronization", "Deadlock", 
            "Bandwidth", "Throughput", "Latency", "Pagination", "Normalization",
            "Linear Search", "Binary Tree", "Dynamic Programming", "Greedy Approach"
        ]

        # Extract words from statements to form pool of terms
        all_pool_words = set()
        for stmt in statements:
            for w in re.findall(r'\b[A-Za-z]{4,}\b', stmt["text"]):
                if w.lower() not in {'this', 'that', 'with', 'from', 'have', 'which', 'their', 'there', 'about', 'explain', 'describe'}:
                    all_pool_words.add(w)

        all_pool_list = list(all_pool_words) if all_pool_words else common_distractors

        for stmt in statements:
            if len(questions) >= num_questions:
                break

            words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', stmt["text"]) 
                     if w.lower() not in {'this', 'that', 'with', 'from', 'have', 'which', 'their', 'there', 'about', 'explain', 'describe'}]
            
            if not words:
                continue

            keyword = random.choice(words)
            masked_question = stmt["text"].replace(keyword, "______", 1)
            
            # Select 3 distinct distractors
            other_candidates = [w for w in all_pool_list if w.lower() != keyword.lower()]
            random.shuffle(other_candidates)
            distractors = []
            for c in other_candidates:
                if c not in distractors and c.lower() != keyword.lower():
                    distractors.append(c)
                if len(distractors) == 3:
                    break

            while len(distractors) < 3:
                fallback = random.choice(common_distractors)
                if fallback not in distractors and fallback.lower() != keyword.lower():
                    distractors.append(fallback)

            opts = [keyword] + distractors[:3]
            random.shuffle(opts)
            correct_letter = ['A', 'B', 'C', 'D'][opts.index(keyword)]

            doc_label = "Syllabus" if stmt['doc_type'] == 'syllabus' else "Question Paper"
            questions.append({
                "id": len(questions) + 1,
                "text": f"According to your {doc_label} ({stmt['doc_name']}, Page {stmt['page']}), fill in the blank: \"{masked_question}\"",
                "option_a": opts[0],
                "option_b": opts[1],
                "option_c": opts[2],
                "option_d": opts[3],
                "correct_option": correct_letter,
                "explanation": f"From '{stmt['doc_name']}' (Page {stmt['page']}): \"{stmt['text']}\".",
                "source": f"{stmt['doc_name']} (Page {stmt['page']})"
            })

        return {
            "success": True,
            "questions": questions,
            "count": len(questions),
            "generated_by": "RAG-BM25-Engine"
        }

    def generate_flashcards(self, session_id: str, count: int = 8) -> Dict[str, Any]:
        """Generate interactive revision flashcards grounded in uploaded coursework."""
        session = self._get_or_create_session(session_id)
        if not session["chunks"]:
            return {
                "success": False,
                "error": "No documents uploaded. Please upload a syllabus or question paper first.",
                "flashcards": []
            }

        flashcards = []
        chunks = session["chunks"]
        random.shuffle(chunks)

        for chunk in chunks:
            if len(flashcards) >= count:
                break

            lines = [l.strip() for l in re.split(r'[\r\n\.\;\!\?]+', chunk["text"]) if len(l.strip()) >= 20]
            if not lines:
                continue

            target_line = random.choice(lines)
            words = [w for w in re.findall(r'\b[A-Za-z]{4,}\b', target_line) 
                     if w.lower() not in {'this', 'that', 'with', 'from', 'have', 'which', 'their', 'there', 'about', 'explain'}]

            if not words:
                continue

            concept = words[0].title() if len(words) == 1 else f"{words[0].title()} ({words[1].title() if len(words) > 1 else ''})".strip()
            
            doc_type_label = "Syllabus Core" if chunk["doc_type"] == "syllabus" else "Exam High-Yield"
            
            flashcards.append({
                "id": len(flashcards) + 1,
                "category": doc_type_label,
                "front": f"What is the key principle or definition of '{words[0].title()}' in {chunk['doc_name']}?",
                "back": f"{target_line}\n\n📌 Reference: {chunk['doc_name']} (Page {chunk['page']})",
                "keyword": words[0].title(),
                "source": f"{chunk['doc_name']} (Page {chunk['page']})"
            })

        return {
            "success": True,
            "flashcards": flashcards,
            "count": len(flashcards)
        }

    def generate_cheat_sheet(self, session_id: str) -> Dict[str, Any]:
        """Synthesize a structured Markdown revision cheat sheet from all active documents."""
        session = self._get_or_create_session(session_id)
        if not session["chunks"]:
            return {
                "success": False,
                "error": "No documents uploaded. Please upload a syllabus or question paper first.",
                "markdown": ""
            }

        syl_chunks = [c for c in session["chunks"] if c["doc_type"] == "syllabus"]
        qp_chunks = [c for c in session["chunks"] if c["doc_type"] == "question_paper"]

        lines = [
            "# 📘 PREP-TRACK Quick-Revision Smart Cheat Sheet",
            f"**Generated from:** {len(session['documents'])} uploaded documents | **Total Knowledge Chunks:** {len(session['chunks'])}\n",
            "---",
            "## 📌 Core Syllabus Modules & Key Definitions\n"
        ]

        if syl_chunks:
            for i, c in enumerate(syl_chunks[:6]):
                snippet = c['text'].strip()
                if len(snippet) > 180:
                    snippet = snippet[:180] + "..."
                lines.append(f"### Module {i+1}: {c['doc_name']} (Page {c['page']})")
                lines.append(f"> {snippet}\n")
        else:
            lines.append("*Upload course syllabus to auto-extract module outlines.*\n")

        lines.append("## 🎯 High-Yield Exam Topics & Problem Types\n")
        if qp_chunks:
            for i, c in enumerate(qp_chunks[:6]):
                snippet = c['text'].strip()
                if len(snippet) > 180:
                    snippet = snippet[:180] + "..."
                lines.append(f"- **Exam Problem {i+1}** (*{c['doc_name']}*, Page {c['page']}): {snippet}")
        else:
            lines.append("*Upload question paper to extract verified recurring exam questions.*\n")

        lines.append("\n---")
        lines.append("💡 *Tip: Practice active recall with PREP-TRACK Smart Flashcards before appearing for placement drives.*")

        markdown_content = "\n".join(lines)
        return {
            "success": True,
            "title": "Comprehensive Coursework Revision Sheet",
            "markdown": markdown_content,
            "documents_indexed": len(session["documents"])
        }

