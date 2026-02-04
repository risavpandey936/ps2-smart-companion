# 🧠 Smart Companion  
Bridging the Executive Function Gap with Neuro-Inclusive AI

## 🚀 Overview

Smart Companion is an AI-powered assistant designed to help neurodivergent individuals (ADHD, Autism, Dyslexia) break overwhelming tasks into small, manageable micro-steps.

The system reduces cognitive overload by decomposing high-level tasks into actionable steps using LLM-based planning.

---

## 🎯 Features

- 🔐 User Registration & Login (JWT Authentication)
- 🧠 AI Task Decomposition (LLM-based)
- 📊 Micro-step Progress Tracking
- 💾 User-specific Task Storage (SQLite/PostgreSQL)
- 🐳 Dockerized Backend (Isolated & Portable)
- 🌐 Production Deployment (Render)

---

## 🛠 Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- SQLite / PostgreSQL
- JWT Authentication
- Groq LLM API

### Frontend
- React (Vite)
- TailwindCSS
- Framer Motion

### DevOps
- Docker
- Render Deployment

---

## 🐳 Docker Setup (Mandatory for Evaluation)

### 🔧 Build Docker Image

```bash
docker build -t smart-companion .
