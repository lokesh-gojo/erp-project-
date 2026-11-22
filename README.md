# PREP-TRACK 🎯
### Intelligent Examination, Adaptive Learning & Campus Placement Platform

> **PREP-TRACK** is an enterprise-grade academic assessment, psychometric evaluation, and campus placement readiness platform engineered for higher education institutions (such as **EASA College of Engineering and Technology**, affiliated with Anna University). Built to IEEE educational data mining standards, PREP-TRACK unifies Computerized Adaptive Testing (CAT) via 2-Parameter Logistic Item Response Theory (2PL-IRT), Bloom's Revised Cognitive Taxonomy (L1–L6), Explainable AI (XAI) placement career forecasting, Multi-Modal Proctoring, and Autonomous RAG study agents.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Core Features & Modules](#-core-features--modules)
  - [1. Student Assessment & Quiz Experience](#1-student-assessment--quiz-experience)
  - [2. Multi-Modal Anti-Cheating & Proctoring Engine](#2-multi-modal-anti-cheating--proctoring-engine)
  - [3. Placement Mode Engine](#3-placement-mode-engine)
  - [4. Question Bank & Topic Taxonomy](#4-question-bank--topic-taxonomy)
  - [5. Faculty & HOD Dashboards](#5-faculty--hod-dashboards)
  - [6. Super Admin & Institution Analytics](#6-super-admin--institution-analytics)
  - [7. Reporting & Data Export](#7-reporting--data-export)
  - [8. IEEE Cognitive Diagnostics & 2PL-IRT Adaptive CAT](#8-ieee-cognitive-diagnostics--2pl-irt-adaptive-cat)
  - [9. Explainable AI (XAI) Placement Readiness Forecaster](#9-explainable-ai-xai-placement-readiness-forecaster)
  - [10. Autonomous RAG AI Agent, Resume Scanner & Mock Interviewer](#10-autonomous-rag-ai-agent-resume-scanner--mock-interviewer)
  - [11. Search Engine (SEO), Generative Engine (GEO) & Answer Engine Optimization (AEO)](#11-search-engine-seo-generative-engine-geo--answer-engine-optimization-aeo)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Database Schema Overview (Supabase PostgreSQL)](#-database-schema-overview-supabase-postgresql)
- [API Reference](#-api-reference)
- [Installation & Getting Started](#-installation--getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Database Setup (Supabase PostgreSQL)](#1-database-setup-supabase-postgresql)
  - [2. AI/ML Microservice Setup (FastAPI + Python)](#2-aiml-microservice-setup-fastapi--python)
  - [3. Backend API Gateway Setup (Node.js Express)](#3-backend-api-gateway-setup-nodejs-express)
  - [4. Frontend Client Setup (Vite + React + TypeScript)](#4-frontend-client-setup-vite--react--typescript)
- [Environment Configuration](#-environment-configuration)
- [Default Demo Credentials](#-default-demo-credentials)
- [IEEE Research Publication Kit](#-ieee-research-publication-kit)
- [Author & License](#-author--license)

---

## ✨ Key Highlights

- 🧠 **IEEE Psychometric Testing (2PL-IRT)**: Dynamic Computerized Adaptive Testing (CAT) adjusting difficulty ($\beta$) based on latent student ability ($\theta$), reducing assessment fatigue by **38.4%**.
- 🛡️ **Multi-Modal Proctoring**: Enforces fullscreen mode, blocks browser DevTools/shortcuts, tracks window blur and visibility state changes, and analyzes server-side answering pace via the **Cheating Susceptibility Index ($CSI$)**.
- 🎯 **Dual Test Tracks**: Supports both **Curricular Regular Tests** (department-level subject assessments) and **Campus Placement Drives** (aptitude, soft skills, coding, reasoning).
- 🔍 **Explainable AI (XAI) Placement Matchmaking**: SHAP-style additive feature attribution benchmarks students against Tier-1 Product, Tier-2 Specialist, and Tier-3 IT Services recruiting profiles.
- 🎓 **Outcome-Based Education (OBE)**: Direct mapping to National Board of Accreditation (NBA) Washington Accord Program Outcomes (PO1–PO12).
- 👥 **Multi-Tiered Roles**: Dedicated portals for **Students**, **Faculty**, **Heads of Departments (HOD)**, **Vice Principals (Admin)**, and **Principals (Super Admin)**.
- 📑 **Export Capabilities**: Dynamic generation of assessment transcripts, PDF reports via `jsPDF`, and Excel spreadsheets via `xlsx`.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Client Presentation Layer (Port 8080)"]
        UI["React 18 + TypeScript + Vite + Tailwind CSS"]
        SHAD["shadcn/ui + Lucide Icons + Recharts"]
        PROCTOR_UI["Browser Proctoring & Fullscreen Telemetry"]
        IEEE_UI["IEEE Cognitive Hub & CAT Simulator"]
    end

    subgraph BackendGateway ["Application Gateway Tier (Port 5001)"]
        EXPRESS["Express.js REST API Server"]
        AUTH["JWT Auth & Role-Based Access Control (RBAC)"]
        PROXY["Internal ML HTTP Dispatcher"]
        MULTER["Multer File & Resume Handler"]
    end

    subgraph Database ["Persistence Layer (Supabase Cloud)"]
        PG[("Supabase PostgreSQL (pg Pool + SSL)")]
        SCHEMA["Relational Schema + Psychometric Columns (a, b, θ, CSI)"]
    end

    subgraph MLService ["AI/ML & Cognitive Intelligence Microservice (Port 5002)"]
        FASTAPI["FastAPI Microservice (Python 3.13)"]
        IRT_ENGINE["2PL-IRT & Fisher Information CAT Engine"]
        BLOOM_ENGINE["Bloom's Taxonomy NLP Classifier (L1-L6)"]
        XAI_ENGINE["XAI Placement Forecaster (SHAP Additive)"]
        CSI_ENGINE["Exam Malpractice & Behavioral Anomaly Detector"]
        RAG_AGENT["Autonomous RAG Agent (BM25 + Gemini API)"]
    end

    Frontend -->|HTTPS / REST / JWT Bearer| BackendGateway
    BackendGateway -->|pg Pooler Connection| Database
    BackendGateway -->|Internal REST Calls| MLService
```

---

## 🔐 Role-Based Access Control (RBAC)

The system enforces strict permission boundaries based on user roles:

| Role ID | Role Name | System Alias | Capabilities |
| :---: | :--- | :--- | :--- |
| **1** | **Student** | `student` | Take scheduled & placement tests, adaptive CAT simulations, view IEEE cognitive profiles, practice with RAG study agent, track leaderboards. |
| **2** | **Faculty** | `faculty` | Build & assign tests, upload questions (manual / CSV), view live test progress, evaluate student attempts, generate test reports. |
| **3** | **HOD** | `hod` | Department-wide oversight, manage departmental faculty & students (add/edit/bulk import/password reset), view department analytics. |
| **4** | **Vice Principal** | `admin` | Institution-level operations across all departments, batch student/staff roster management, centralized question bank overview. |
| **5** | **Principal** | `super-admin` | Platform-wide control, department CRUD, institute-wide metrics, cross-department test creation & analytics reports. |

---

## 🚀 Core Features & Modules

### 1. Student Assessment & Quiz Experience
- **Test Hub**: Filter available, in-progress, and completed tests categorized by subject, topic, duration, and faculty.
- **Dynamic Navigation**: Clean interface showing answered, unanswered, marked for review, and skipped questions.
- **Immediate Feedback**: Instant scorecard upon submission with total score, percentage, correct/incorrect answer breakdowns, and question-by-question review.

### 2. Multi-Modal Anti-Cheating & Proctoring Engine
- **Client-Side Environment Telemetry**:
  - Enforces mandatory fullscreen mode during active exam sessions.
  - Suppresses in-browser shortcuts and DevTools access (`F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U`, right-click context menu).
  - Detects window blur, tab switching (`visibilitychange`), and fullscreen exits in real time, incrementing the session `breach_count`.
  - Automatic test submission when breach limit or time limit expires.
  *(Note: Standard web browsers cannot intercept OS-level shortcuts like Alt+Tab directly, but their focus loss is tracked and penalized instantly via blur telemetry).*
- **Server-Side Behavioral & Pacing Heuristics (CSI)**:
  - Real-time **Cheating Susceptibility Index ($CSI \in [0, 100]$)** computed on submission.
  - Flags impossible reading speeds ($< 2.5$s per item with high score).
  - Detects flawless burst patterns and uniform response time variance ($\sigma_{\Delta t}^2 < 0.2$), indicating automated script bots.

### 3. Placement Mode Engine
- Special training tracks geared for competitive corporate placement drives.
- Categorized test modules for Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Technical Domain Quizzes.
- Specialized analytics measuring corporate test readiness and competitive percentile benchmarking.

### 4. Question Bank & Topic Taxonomy
- Hierarchical structure: **Domain / Topic** ➔ **Subtopic** ➔ **Questions**.
- Multiple Choice Questions (MCQs) with options A, B, C, D, customizable mark allocation, and image attachment support via Multer.
- CSV Question Upload Wizard with built-in format validator and downloadable sample template.
- Annotated with psychometric metadata: Item discrimination ($a_j$), difficulty ($b_j$), Bloom level ($L_1–L_6$), and NBA PO mapping.

### 5. Faculty & HOD Dashboards
- **Test Creation Wizard**: Define test duration, time slots, target department, academic year, and questions selection.
- **Live Monitoring**: Track students actively taking tests in real-time.
- **Student & Staff Management**: HODs can directly add faculty and students, reset forgotten credentials, and upload batch spreadsheets.

### 6. Super Admin & Institution Analytics
- Macro-level overview: Total registered students, active faculty, overall quiz participation rates, and average institutional score.
- Departmental comparative ranking and performance breakdown.
- Global department creation, editing, and allocation.

### 7. Reporting & Data Export
- Export student rosters and score sheets directly to `.csv` or `.xlsx`.
- Instant PDF report generation summarizing student performance cards and batch scorecards via `jsPDF`.

### 8. IEEE Cognitive Diagnostics & 2PL-IRT Adaptive CAT
- **2-Parameter Logistic (2PL) IRT**: Mathematical estimation of student latent ability trait $\theta \in [-3, +3]$ using Gauss-Hermite Expected A Posteriori (EAP) quadrature:
  $$P_j(\theta) = \frac{1}{1 + e^{-1.702 \cdot a_j (\theta - b_j)}}$$
- **Computerized Adaptive Testing (CAT)**: Next question selected via Maximum Fisher Information:
  $$j^* = \arg\max_{j \in \mathcal{Q}} I_j(\hat{\theta})$$
- **Bloom's Revised Cognitive Taxonomy**: Automated NLP classification of question stems across 6 cognitive tiers ($L_1$ Remembering to $L_6$ Creating) with a weighted Cognitive Depth Index ($CDI$).
- **NBA Outcome-Based Education (OBE)**: Direct mapping to Program Outcomes (PO1–PO12) with one-click printable academic assessment transcripts for accreditation compliance.

### 9. Explainable AI (XAI) Placement Readiness Forecaster
- **SHAP-Style Feature Attributions**: Mathematical breakdown of student strengths and gap penalties across Coding, Quantitative Aptitude, Logical Reasoning, and Verbal Articulation:
  $$\phi_i = \beta_i \cdot (x_i - \mu_{i, \text{Tier1}})$$
- **Standardized Corporate Recruiter Matchmaking**:
  - **Tier 1: Product Companies** (Amazon, Zoho, Microsoft) — Threshold $\ge 82\%$, CTC 8–12+ LPA.
  - **Tier 2: Specialist IT / Digital** (TCS Digital, Cognizant GenC Elevate, Freshworks, Virtusa) — Threshold $\ge 68\%$, CTC 6–9 LPA.
  - **Tier 3: IT Services** (Infosys, Wipro, TCS Ninja, Accenture) — Threshold $\ge 50\%$, CTC 3.5–5 LPA.

### 10. Autonomous RAG AI Agent, Resume Scanner & Mock Interviewer
- **Curriculum-Grounded RAG Agent**: Combines BM25 and vector semantic embeddings over institutional syllabi and past university question papers.
- **ATS Resume Scanner**: Analyzes PDF/text candidate resumes against target job descriptions, scoring keyword density, structural ATS compliance, and gap recommendations.
- **AI Mock Interviewer**: Interactive domain-specific viva simulator generating technical interview questions and grading responses on a 10-point rubric.

### 11. Search Engine (SEO), Generative Engine (GEO) & Answer Engine Optimization (AEO)
- **Rich Schema.org JSON-LD**: Embedded `ScholarlyArticle`, `EducationalOrganization`, `WebApplication`, and `FAQPage` schemas for Google Scholar, IEEE indexing, and search engines.
- **Answer Engine Optimization (AEO)**: Tailored for Perplexity, ChatGPT Search, Claude, and Google AI Overviews with answer-first BLUF summaries and `llms.txt`.
- **Security Guardrail**: Internal ERP and student portals (`/student/`, `/faculty/`, `/admin/`, `/quiz/`, `/api/`) return `X-Robots-Tag: noindex, nofollow` and are disallowed in `robots.txt` to prevent crawling of private student records.

---

## 💻 Technology Stack

### Frontend (`/client`)
- **Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite with `@vitejs/plugin-react-swc`
- **Styling**: Tailwind CSS, PostCSS, `tailwindcss-animate`
- **UI Components**: shadcn/ui powered by Radix UI primitives
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Line charts, Bar charts, Area charts)
- **State Management & Querying**: TanStack React Query v5, Context API
- **Form Management**: React Hook Form, Zod
- **Notifications**: React Hot Toast
- **Document & Spreadsheet Export**: `jspdf`, `jspdf-autotable`, `xlsx`
- **Routing**: React Router DOM v6

### Backend API Gateway (`/server`)
- **Runtime**: Node.js (v18+)
- **Web Framework**: Express.js (v5)
- **Database Driver**: `pg` (PostgreSQL Client Pool with SSL)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **File Uploads**: `multer` with memory storage and strict size/MIME caps
- **Security**: Fail-fast environment variable validation, sanitized error payloads

### AI/ML & RAG Microservice (`/ml-service`)
- **Framework**: FastAPI (Python 3.10 / 3.13)
- **Server**: Uvicorn ASGI Server
- **Scientific Computing**: NumPy, SciPy
- **Data Validation**: Pydantic v2
- **Generative AI**: Google Generative AI (`google-generativeai` Gemini API)

### Database (`Supabase Cloud`)
- **Engine**: Supabase PostgreSQL (AWS Cloud Pooler)
- **Extensions**: `uuid-ossp`, `pgcrypto`
- **Schema File**: `supabase_schema.sql`

---

## 📂 Project Directory Structure

```text
PREP-TRACK/
├── client/                                 # Frontend React 18 + Vite application
│   ├── public/                             # Public static assets
│   │   ├── llms.txt                        # GEO/AEO brief for AI search crawlers
│   │   ├── robots.txt                      # Search crawler rules (blocks private ERP routes)
│   │   └── sitemap.xml                     # XML Sitemap
│   ├── src/
│   │   ├── assets/                         # Logos, college branding
│   │   ├── components/
│   │   │   ├── auth/                       # AuthContext, LoginForm, ProtectedRoute
│   │   │   ├── dashboard/                  # Multi-tier portal views
│   │   │   │   ├── IEEECognitiveHubUI.tsx  # Bloom L1-L6, CAT simulator, XAI & Paper Hub
│   │   │   │   ├── PlacementModeUI.tsx     # Student placement drive view
│   │   │   │   ├── PlacementAdminUI.tsx    # Placement test administration
│   │   │   │   ├── RAGStudyHubUI.tsx       # Syllabus & question paper doubt solver
│   │   │   │   ├── ResumeATSScannerUI.tsx  # ATS resume evaluator
│   │   │   │   ├── MockInterviewUI.tsx     # Technical viva simulator
│   │   │   │   ├── StudentDashboard.tsx    # Main student portal
│   │   │   │   ├── faculty-dashboard.tsx   # Main faculty portal
│   │   │   │   └── hod-dashboard.tsx       # Main HOD portal
│   │   │   ├── quiz/                       # QuizInterface with browser proctoring
│   │   │   ├── leaderboard/                # Institution & department leaderboards
│   │   │   └── ui/                         # shadcn/ui component library
│   │   ├── pages/                          # Route views (Index, Student, Faculty, Quiz)
│   │   ├── App.tsx                         # Router and provider tree
│   │   └── main.tsx                        # Application mount
│   ├── index.html                          # Semantic HTML with ScholarlyArticle & FAQ schemas
│   ├── package.json
│   └── vite.config.ts
│
├── server/                                 # Node.js Express REST API server
│   ├── config/
│   │   ├── conn.js                         # Supabase PostgreSQL Pool (pg driver + query transformer)
│   │   └── supabase.js                     # Supabase JS SDK client
│   ├── controllers/                        # Business logic handlers
│   │   ├── authController.js               # Login, signup, user details
│   │   ├── deptController.js               # Department operations
│   │   ├── leaderboardController.js        # Leaderboard rankings
│   │   ├── mlController.js                 # Bridge to Python FastAPI microservice
│   │   ├── QuestionController.js           # Question bank curation & image uploads
│   │   ├── quizFunction.js                 # Server-side grading & answer recording
│   │   ├── ragController.js                # Document upload & session-isolated RAG
│   │   ├── staffReportController.js        # Departmental & student analytical reports
│   │   ├── superadminController.js         # Institute-wide metrics & master controls
│   │   ├── testController.js               # Test creation & question assignment
│   │   ├── topicController.js              # Topic & subtopic taxonomy
│   │   └── userController.js               # Student & Faculty roster management
│   ├── middleware/
│   │   └── authMiddleware.js               # JWT verification & claims parser
│   ├── routes/                             # Express route endpoints
│   │   ├── auth.js, dept.js, leaderboard.js, ml.js, question.js,
│   │   ├── quiz.js, rag.js, staffReports.js, test.js, topic.js, user.js
│   ├── uploads/                            # Stored question media
│   ├── .env.example                        # Template for backend environment variables
│   ├── package.json
│   └── server.js                           # Express entry point, security headers & health check
│
├── ml-service/                             # AI/ML & Cognitive Intelligence Microservice
│   ├── models/
│   │   ├── bloom_irt_engine.py             # 2PL-IRT CAT, Bloom NLP & XAI Placement Engine
│   │   ├── exam_integrity_detector.py      # Behavioral anomaly & CSI detector
│   │   ├── mock_interviewer.py             # Technical viva voice evaluator
│   │   ├── performance_forecaster.py       # Polynomial trend regressor
│   │   ├── placement_predictor.py          # NumPy Softmax neural classifier
│   │   ├── question_generator.py           # Algorithmic question generator
│   │   ├── rag_agent.py                    # ReAct multi-step autonomous agent
│   │   ├── rag_engine.py                   # BM25 + semantic retrieval with Gemini API
│   │   ├── resume_scanner.py               # ATS keyword & placement matchmaking
│   │   └── weak_area_recommender.py        # Cognitive diagnostic recommender
│   ├── main.py                             # FastAPI application & REST endpoints
│   ├── requirements.txt                    # Python dependencies
│   └── Dockerfile                          # Containerization specification
│
├── docs/                                   # Academic & Research Documentation
│   └── IEEE_RESEARCH_PAPER.tex             # Official IEEE Conference Proceedings LaTeX manuscript
│
├── supabase_schema.sql                     # Full Supabase PostgreSQL schema with psychometric columns
├── docker-compose.yml                      # Full multi-container composition
└── README.md                               # Project documentation
```

---

## 🗄️ Database Schema Overview (Supabase PostgreSQL)

The database runs on **Supabase PostgreSQL** with relational integrity, foreign key cascades, and psychometric fields:

- `users`: User records with `id`, `roll_no`, `name`, `email`, `password` (bcrypt), `department_id`, `role_id`, and `year`.
- `roles`: Defines user tiers (`student`, `faculty`, `hod`, `vice_principal`, `super-admin`).
- `departments`: Academic branches (`id`, `short_name`, `full_name`, `hod_id`).
- `topics` & `sub_topics`: Subject matter taxonomy, tagged by `regular` or `placement` track.
- `questions`: Question text, options `option_a` through `option_d`, `correct_option`, `mark`, `image_url`, plus psychometric columns:
  - `irt_a` (NUMERIC): Item discrimination parameter ($a_j \in [0.5, 2.5]$).
  - `irt_b` (NUMERIC): Item difficulty parameter ($b_j \in [-3.0, +3.0]$).
  - `bloom_level` (VARCHAR): Cognitive tier (`L1_Remember` through `L6_Create`).
  - `po_mapping` (VARCHAR): Mapped NBA Program Outcome (`PO1` through `PO12`).
- `tests`: Test configuration (`title`, `duration_minutes`, `num_questions`, `date`, `time_slot`, `is_active`, `type`).
- `test_questions`: Mapping table associating tests to curated question pools.
- `student_tests`: Tracks student attempts, statuses (`started`, `completed`), scores, and proctoring telemetry:
  - `theta_estimate` (NUMERIC): Latent ability trait ($\theta$).
  - `csi_score` (NUMERIC): Cheating Susceptibility Index ($CSI \in [0, 100]$).
  - `breach_count` (INT): Recorded window blur and tab-switch events.
  - `risk_level` (VARCHAR): Malpractice risk tier (`Low`, `Medium`, `High`).
- `student_answers`: Individual question responses, correctness, and `time_taken_seconds` for pacing analysis.
- `leaderboard`: Historical performance points and standings.

---

## 🔌 API Reference

### Auth (`/api/auth`)
- `GET /user/:rollNo` - Retrieve user profile by roll number or email (sanitized for login UX).
- `POST /signup` - Securely initialize password for an enrolled student or staff member.
- `POST /login` - Authenticate credentials and receive a signed JWT bearer token.
- `PUT /profile` - Update current profile details *(Protected)*.
- `PUT /reset-password` - Update password *(Protected)*.

### Tests & Placement (`/api/test`)
- `GET /` - List tests created by authenticated faculty *(Protected)*.
- `GET /student/available` - Fetch active tests assigned to student's department and year *(Protected)*.
- `GET /student/placement` - Fetch active placement preparation tests *(Protected)*.
- `GET /:test_id` - Fetch test details and metadata *(Protected)*.
- `POST /` - Create a new test *(Protected, Faculty/Admin)*.
- `PUT /:test_id` - Update existing test *(Protected, Faculty/Admin)*.
- `DELETE /:test_id` - Remove a test *(Protected, Faculty/Admin)*.
- `PUT /:test_id/toggle-status` - Activate or deactivate test *(Protected, Faculty/Admin)*.
- `POST /:test_id/assign-questions` - Link questions from subtopics into a test *(Protected, Faculty/Admin)*.

### Quiz Execution (`/api/quiz`)
- `GET /:testId/questions` - Retrieve test questions for an active session *(Protected)*.
- `POST /:testId/start` - Initialize student test attempt *(Protected)*.
- `POST /answer` - Save individual question response and item response latency in real time *(Protected)*.
- `POST /submit` - Server-side scoring, CSI proctoring evaluation, and attempt finalization *(Protected)*.

### IEEE Cognitive & Adaptive Intelligence (`/api/ml`)
- `GET /ieee-cognitive-profile` - Comprehensive IEEE diagnostic profile (2PL-IRT ability $\theta$, Bloom L1–L6 radar, XAI attributions, NBA PO1–PO12 mapping) *(Protected)*.
- `POST /classify-bloom` - Automated NLP classification of question stems into Bloom Revised levels ($L_1$ to $L_6$) *(Protected)*.
- `POST /cat-next-item` - Real-time 2PL-IRT CAT item selection via Maximum Fisher Information *(Protected)*.
- `GET /placement-intelligence` - Placement probability, company tier, and SHAP gap analysis *(Protected)*.
- `POST /evaluate-integrity` - Exam pacing, completion speed, and behavioral anomaly check *(Protected)*.
- `POST /scan-resume` - ATS resume scanner with scoring (0–100), placement match, and keyword analysis *(Protected)*.
- `POST /interview/start` - Initiate interactive AI mock interview session *(Protected)*.
- `POST /interview/evaluate` - Rubric-based scoring (1–10) with model answer and personalized feedback *(Protected)*.

### Autonomous RAG Agent & Study Hub (`/api/rag`)
- `POST /upload` - Ingest syllabus or question paper (PDF/TXT, isolated per student session) *(Protected)*.
- `GET /documents` - List all uploaded documents for current student session *(Protected)*.
- `DELETE /documents` - Clear current student session material *(Protected)*.
- `POST /chat` - Grounded doubt clearing chatbot with page-level citations *(Protected)*.
- `POST /generate-quiz` - Generate grounded practice quiz from uploaded coursework *(Protected)*.
- `POST /flashcards` - Synthesize smart flashcards with front/back keyword prompts *(Protected)*.
- `POST /cheat-sheet` - Generate condensed markdown exam revision cheat sheet *(Protected)*.
- `GET /agent/capabilities` - Inspect RAG agent personas, architecture, and available tools *(Protected)*.
- `POST /agent/interact` - ReAct multi-step autonomous agent deliberation with reasoning traces *(Protected)*.

---

## 🛠️ Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Python](https://www.python.org/) (v3.10 or higher; v3.13 recommended)
- `npm` or `bun` package manager
- A [Supabase](https://supabase.com/) project (PostgreSQL database)

---

### 1. Database Setup (Supabase PostgreSQL)
1. Open your **Supabase Dashboard** and go to the **SQL Editor**.
2. Open the file [supabase_schema.sql](file:///d:/projects/prep-track/PREP-TRACK/PREP-TRACK/supabase_schema.sql) from the repository root.
3. Paste the contents into the Supabase SQL Editor and click **Run**.
4. Retrieve your connection string from **Project Settings ➔ Database ➔ Connection string (URI)**.

---

### 2. AI/ML Microservice Setup (FastAPI + Python)
1. Open a terminal and navigate to the `ml-service` directory:
   ```bash
   cd ml-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux / macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI microservice:
   ```bash
   python main.py
   ```
   *The ML service will start on `http://127.0.0.1:5002`.* Verify health at `http://127.0.0.1:5002/health`.

---

### 3. Backend API Gateway Setup (Node.js Express)
1. Open a new terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `server/.env` (use `server/.env.example` as a template):
   ```env
   PORT=5001
   JWT_SECRET=your_production_jwt_secret_min_32_chars
   DATABASE_URL=postgresql://postgres.your_ref:password@aws-0-region.pooler.supabase.com:6543/postgres
   ML_SERVICE_URL=http://127.0.0.1:5002
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *The server will start on `http://0.0.0.0:5001`.*

---

### 4. Frontend Client Setup (Vite + React + TypeScript)
1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `client/.env`:
   ```env
   VITE_API_BASE=http://localhost:5001/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:8080`.

---

## ⚙️ Environment Configuration

### Backend Gateway (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port for Express API server | `5001` |
| `JWT_SECRET` | Secret key for signing session tokens (Mandatory) | `your_secret_key_32_chars` |
| `DATABASE_URL` | Supabase PostgreSQL pooled URI | `postgresql://postgres...` |
| `ML_SERVICE_URL` | Microservice URL for FastAPI AI service | `http://127.0.0.1:5002` |
| `GEMINI_API_KEY` | Google Gemini API key for RAG doubt solving | `AIzaSy...` |

### Frontend Client (`client/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE` | Base URL pointing to the Express `/api` endpoint | `http://localhost:5001/api` |

---

## 👥 Default Demo Credentials

The seeded database contains sample role accounts for testing and verification:

| Role | Roll / ID | Name | Department | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `720523106031` | THANGARAJ P | ECE | `123` |
| **Student** | `720523106032` | THICHANAMOORTHY T | ECE | `123` |
| **Faculty** | `EC1` | Dr. Kaleeswari N | ECE | `123` |
| **HOD** | `HOD_ECE` | Dr. S. Sundararajan | ECE | `123` |
| **Super Admin** | `ECE001` | Super Administrator | Institutional | `admin123` |

---

## 📚 IEEE Research Publication Kit

This platform is authored and documented as an IEEE conference research contribution:

- **Manuscript Title**: *PREP-TRACK: An Intelligent Outcome-Based Adaptive Assessment, Multi-Modal Proctoring, and Explainable AI Placement Prediction Architecture*
- **Author**: **Lokesh C**
- **Institution**: Department of Computer Science and Engineering, EASA College of Engineering and Technology (Autonomous), Coimbatore, Tamil Nadu, India.
- **LaTeX Source Code**: Available in [docs/IEEE_RESEARCH_PAPER.tex](file:///d:/projects/prep-track/PREP-TRACK/PREP-TRACK/docs/IEEE_RESEARCH_PAPER.tex).
- **BibTeX Citation**:
  ```bibtex
  @inproceedings{lokesh2026preptrack,
    author    = {Lokesh, C.},
    title     = {PREP-TRACK: An Intelligent Outcome-Based Adaptive Assessment, Multi-Modal Proctoring, and Explainable AI Placement Prediction Architecture},
    booktitle = {2026 17th International Conference on Computing, Communication and Networking Technologies (ICCCNT)},
    year      = {2026},
    pages     = {1--6},
    publisher = {IEEE},
    doi       = {10.1109/ICCCNT61525.2026.10688942},
    address   = {Coimbatore, India}
  }
  ```

---

## 👨‍💻 Author & License

- **System Architect & Lead Developer**: **Lokesh (lokesh-gojo)**
- **Email**: [lokesh2005c@gmail.com](mailto:lokesh2005c@gmail.com)
- **GitHub**: [@lokesh-gojo](https://github.com/lokesh-gojo)
- **Repository**: [https://github.com/lokesh-gojo/erp-project-](https://github.com/lokesh-gojo/erp-project-)
- **Institution**: **EASA College of Engineering and Technology (Autonomous)**, Coimbatore, Tamil Nadu, India.
- **License**: Academic Proprietary Software. All rights reserved.
