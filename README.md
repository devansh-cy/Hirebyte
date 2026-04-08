# 🤖 HireByte

> **Your AI Interview Assistant** - Practice interviews with real-time vision analysis and comprehensive analytics.

## 🚀 Overview

**HireByte** is an advanced, interactive platform designed to simulate real-world technical interviews. By leveraging **Generative AI**, **Real-time Voice Processing**, **Semantic Scoring**, and **Computer Vision**, we provide candidates with immediate, actionable feedback on their answers, confidence, communication, and emotional engagement.

## ✨ Key Features

- **🎙️ Voice-First Interaction**: Natural, conversational interview flow using Speech-to-Text (Whisper) and Text-to-Speech (ElevenLabs)
- **👁️ Vision Analysis**: Real-time face tracking for eye contact, emotion, and steadiness detection
- **🧠 Semantic Scoring**: AI-powered answer evaluation using sentence embeddings
- **📊 Analytics Dashboard**: Radar charts, timeline graphs, sentiment analysis, and NLP metrics
- **📄 PDF Reports**: Export your interview results as a professional PDF
- **🎯 AI Feedback**: Personalized strengths and areas for improvement

## 🛠️ Tech Stack

| Layer           | Technologies                                                      |
| --------------- | ----------------------------------------------------------------- |
| **Frontend**    | React, TypeScript, Tailwind CSS, Vite, Recharts                   |
| **Backend**     | Python, FastAPI, WebSockets                                       |
| **AI Services** | OpenAI GPT-3.5 (LLM), ElevenLabs (Voice), Whisper (Transcription) |
| **Vision**      | OpenCV, Haar Cascades, Optical Flow                               |
| **Scoring**     | Sentence-Transformers, Scikit-learn                               |

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js & npm
- Python 3.8+
- API Keys for OpenAI & ElevenLabs

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# Create .env file:
# OPENAI_API_KEY=your_key
# ELEVENLABS_API_KEY=your_key
# VOICE_ID=pNInz6obpgDQGcFmaJgB

python main.py
```

> Server runs at http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> App runs at http://localhost:5173

## 📡 API Endpoints

| Endpoint                  | Method    | Description                           |
| ------------------------- | --------- | ------------------------------------- |
| `/upload-resume`          | POST      | Upload resume PDF and job description |
| `/transcribe`             | POST      | Transcribe audio to text              |
| `/ws/interview`           | WebSocket | Main interview conversation           |
| `/ws/metrics`             | WebSocket | Real-time vision metrics              |
| `/api/stream`             | GET       | MJPEG video stream                    |
| `/api/analytics`          | GET       | Full interview analytics              |
| `/api/analytics/feedback` | POST      | AI-generated feedback                 |
| `/health`                 | GET       | Health check                          |

## 🎨 Brand Colors

- **Tech Blue**: `#003366`
- **Mint Green**: `#2ECC71`


