# 🧠 NeuroVault: The Intelligent Personal Knowledge Engine

NeuroVault is a high-performance **Knowledge Management & RAG (Retrieval-Augmented Generation) Platform** designed to transform static documents, YouTube transcripts, and notes into an interactive, AI-powered neural network.

![NeuroVault Banner](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

*   **⚡ Neural Knowledge Graph**: Visualize your entire knowledge base as an interactive, force-directed graph. Discover hidden connections between your PDFs, notes, and videos.
*   **🤖 AI-Powered RAG Pipeline**: Chat with your documents using advanced semantic retrieval. NeuroVault understands context across multiple data sources.
*   **📂 Multi-Source Ingestion**:
    *   **PDFs**: Automatic text extraction and vectorization.
    *   **YouTube**: Instant transcript retrieval with multi-language fallback.
    *   **Notes**: Structured markdown and text entry.
*   **🏷️ Automatic Metadata**: Every ingested item is automatically tagged (3-5 tags) and summarized by Gemini 2.0 Flash / Llama 3.1.
*   **🌓 Premium UI**: A boutique designer experience with full Dark/Light mode support, blurred glassmorphism, and staggered animations.

---

## 🛠️ Technology Stack

### Core Framework & Language
*   **Next.js 14 (App Router)**: High-performance SSR and Client-side rendering.
*   **TypeScript**: Robust type-safety across the full stack.
*   **Tailwind CSS**: Utility-first styling with custom glassmorphic tokens.

### Data & Storage
*   **MongoDB (Mongoose)**: Primary document store for metadata, usage tracking, and chat history.
*   **Supabase (pgvector)**: High-performance vector database for semantic similarity search.
*   **AWS S3**: Cloud-scale storage for physical document assets.
*   **Redis (ioredis)**: High-speed messaging layer for background task orchestration.

### AI & Intelligence
*   **OpenRouter**: Multi-model LLM access (Gemini 2.0, Llama 3.1, Claude 3.5).
*   **HuggingFace**: Local-first embedding generation for text vectorization.
*   **BullMQ**: Robust background processing worker for document indexing.

---

## 📦 Getting Started

### Prerequisites

*   **Node.js**: v18.x or higher
*   **MongoDB**: Connection URI
*   **Redis**: Local or cloud instance
*   **Supabase**: Project URL and Service Key

### 1. Installation

```bash
git clone https://github.com/your-repo/neurovault.git
cd neurovault
npm install --legacy-peer-deps
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory and populate it based on the `.env.example` template:

```ini
MONGODB_URI=mongodb+srv://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
OPENROUTER_API_KEY=...
REDIS_URL=redis://...
```

### 3. Running the Platform

To start both the Next.js development server and the background document worker:

```bash
npm run dev
```

---

## 🧪 Testing & Verification

NeuroVault uses **Playwright** for end-to-end reliability verification of the ingestion pipeline.

```bash
# Run all E2E tests
npx playwright test

# Launch Playwright UI
npm run test:ui
```

---

## 🛡️ License

Built with ❤️ for the Advanced Agentic Coding community. Licensed under the **MIT License**.
