# 🧪 AI-Powered Customer Complaint Management System

An AI-assisted Customer Complaint intake and triage module built for the pharmaceutical **API & FDF (Finished Dosage Form) manufacturing** industry, as part of a Quality Management System (QMS).

Upload or paste a customer complaint (email, PDF, DOCX) and a **LangGraph-orchestrated AI agent pipeline** automatically extracts structured fields, checks completeness, classifies patient-safety risk, flags potential duplicates, suggests a root cause, drafts a CAPA recommendation, and summarizes the complaint — all populated live into the intake form alongside an interactive AI chat copilot.

---

## 🎥 Demo

- **Demo Video 1 — Product Walkthrough:** [link here]
- **Demo Video 2 — Code Walkthrough:** [link here]

---

## 🏗️ Tech Stack

| Layer                | Technology                                                        |
|-----------------------|--------------------------------------------------------------------|
| Frontend              | React + Redux Toolkit + Tailwind CSS (Google Inter font)          |
| Backend               | Python + FastAPI                                                  |
| AI Agent Framework    | LangGraph (StateGraph with parallel node execution)               |
| LLMs                  | Groq — `llama-3.3-70b-versatile` (extraction & reasoning)         |
| Database              | PostgreSQL (SQLAlchemy ORM)                                       |
| Document Parsing      | pypdf, python-docx, Python `email` module                         |

---

## ✨ Features

### Core Workflow
- 📤 Upload complaint documents (**PDF, DOCX, TXT, EML**) or paste raw text/email
- 🤖 AI-powered field extraction with **per-field confidence scoring**
- 📝 Auto-populates a structured 4-section complaint intake form:
  1. Origin & Customer Details
  2. Product & Batch Identification
  3. Complaint Details
  4. Initial Assessment & Priority
- ✅ Manual edits are preserved — AI never overwrites a field the reviewer has already touched
- 💬 Real-time streaming extraction progress with staged status messages

### AI Bonus Features (via LangGraph)
- **Completeness Checker** — weighted rule-based scoring of required fields
- **AI Risk Classification** — ICH Q9-informed risk assessment, with a deterministic keyword safety floor (e.g. "adverse event," "contamination" always trigger a minimum risk level, regardless of what the LLM returns)
- **Duplicate Complaint Detection** — weighted field comparison (batch number match weighted highest) against recently logged complaints
- **Root Cause Recommendation** — preliminary hypothesis across standard pharma root-cause categories
- **CAPA Recommendation** — draft Corrective & Preventive Action, clearly flagged for human QA review
- **Complaint Summary** — concise executive summary for dashboards
- **AI Chat Assistant** — ask contextual questions about the currently loaded complaint

### Engineering Details
- LangGraph pipeline runs independent nodes (completeness check, risk classification, duplicate detection) **in parallel** for lower latency
- Automatic retry with exponential backoff on transient Groq API failures
- Full audit trail — every extraction attempt (success or failure) is logged to a `ComplaintDocument` table, independent of whether the complaint is ever saved
- File validation & sanitization (blocks path traversal, disallowed extensions, oversized uploads)
- Structured JSON logging in production for traceability


complaint-management-system/
├── frontend/ # React + Redux
│ └── src/
│ ├── components/
│ │ ├── ComplaintForm/ # 4-section intake form
│ │ ├── AICopilot/ # Upload, progress, risk panel, chat
│ │ └── common/ # Button, Modal, Badge, Input, etc.
│ ├── features/ # Redux slices (complaint, ai, ui)
│ ├── services/ # Axios API layer
│ ├── store/ # Redux store config
│ ├── hooks/ # useComplaintForm
│ └── pages/ # ComplaintIntakePage
│
├── backend/ # FastAPI + LangGraph
│ └── app/
│ ├── api/v1/ # REST routes (complaints, AI)
│ ├── ai/
│ │ ├── langgraph_workflow/ # StateGraph, nodes, prompts
│ │ ├── llm_client.py # Groq wrapper
│ │ └── document_utils.py # PDF/DOCX/EML/TXT extraction
│ ├── models/ # SQLAlchemy models
│ ├── schemas/ # Pydantic schemas
│ ├── crud/ # DB operations
│ ├── core/ # Config, logging
│ └── utils/ # File validation, hashing
│
├── sample_data/ # Synthetic pharma complaint documents for demo
├── docs/ # Architecture diagrams, research notes
└── docker-compose.yml

---

## 🧠 LangGraph Workflow

document_parser → extraction → ┬─ completeness_checker ─┐
├─ risk_classification ├─→ summary → END
└─ duplicate_detection ─┘
│
▼
root_cause → capa_recommendation

Each node uses the model best suited to its task:
- **`llama-3.3-70b-versatile`** for structured extraction and all reasoning-heavy steps (risk classification, root cause, CAPA, summary, chat)

> Note: originally used `gemma2-9b-it` for fast extraction per the assignment's suggested stack; it was decommissioned by Groq mid-project, so extraction now also runs on `llama-3.3-70b-versatile` for reliability.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 16
- A free [Groq API key](https://console.groq.com/keys)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/complaint-management-system.git
cd complaint-management-system
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env          # then fill in GROQ_API_KEY and DATABASE_URL
```

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE complaint_db;"
```

Run the server:
```bash
uvicorn app.main:app --reload
```
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- App: http://localhost:5173

### 4. Or run everything with Docker Compose
```bash
cp backend/.env.example backend/.env   # add your GROQ_API_KEY
docker-compose up --build
```

---

## 🧪 Testing the AI Pipeline

Sample complaint documents are provided in `sample_data/` for demo purposes:
- `complaint_email_1.eml` — batch-wide discoloration complaint
- `complaint_text_2.txt` — packaging defect complaint

Paste or upload either into the AI Complaint Intake Assistant panel to see the full extraction → risk assessment pipeline run end-to-end.

---

## 📡 API Reference

| Method | Endpoint                          | Description                              |
|--------|-------------------------------------|--------------------------------------------|
| POST   | `/api/v1/ai/extract/file`           | Upload a document, run the full AI pipeline |
| POST   | `/api/v1/ai/extract/text`           | Paste raw text, run the full AI pipeline    |
| POST   | `/api/v1/ai/chat`                    | Ask the AI assistant about a complaint     |
| POST   | `/api/v1/complaints`                 | Save a new complaint                       |
| GET    | `/api/v1/complaints`                 | List complaints (filterable, paginated)    |
| GET    | `/api/v1/complaints/{id}`            | Get a single complaint                     |
| PUT    | `/api/v1/complaints/{id}`            | Update a complaint                         |
| DELETE | `/api/v1/complaints/{id}`            | Delete a complaint                         |
| GET    | `/api/v1/complaints/stats/summary`   | Dashboard stats (by status, by risk level) |

---

## ⚠️ Scope Notes

Per the assignment's stated scope, this project intentionally uses:
- **Lightweight text extraction** (pypdf / python-docx / email parser) rather than production-grade OCR
- **Lexical/weighted-field similarity** for duplicate detection rather than a vector database (swap point clearly marked in code for embeddings + pgvector in production)

---

## 📄 License

Built as a technical assignment. Not intended for production pharmaceutical use without further validation and regulatory review.

---

## 📂 Project Structure
