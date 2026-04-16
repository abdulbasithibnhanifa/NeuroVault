# NeuroVault: Intelligent RAG Knowledge Base 🧠🚀

**NeuroVault** is a sophisticated, full-stack monorepo application designed to solve the "context window" limitation in modern AI. By leveraging a high-performance **Retrieval-Augmented Generation (RAG)** pipeline, it allows users to upload, index, and chat with their PDF documents and YouTube transcripts in real-time.

[![Deployment Status](https://img.shields.io/badge/Deployment-Vercel_%2B_Render-blue?style=for-the-badge)](./DEPLOYMENT.md)
[![Tech Stack](https://img.shields.io/badge/Tech_Stack-Next.js_%7C_Redux_%7C_Express_%7C_BullMQ-green?style=for-the-badge)](#tech-stack)

---

## 🏛 Technical Architecture

The project is structured as a **Decoupled Monorepo** using **npm Workspaces**. This architecture allows for independent scaling of the UI and the heavy-duty processing backend.

```mermaid
graph TD
    User((User))
    
    subgraph "Frontend Layer (Vercel)"
        NextJS["Next.js 14 App Router"]
        Redux["Redux Toolkit (State)"]
        Auth["NextAuth.js (JWT)"]
    end
    
    subgraph "Backend Layer (Render)"
        Express["Express.js API"]
        Worker["BullMQ Worker (Document Processor)"]
        Logger["Unified Winston Logger"]
    end
    
    subgraph "Storage & Intelligence"
        MongoDB[("MongoDB Atlas (Metadata)")]
        Supabase[("Supabase pgvector (Embeddings)")]
        Redis[("Upstash Redis (Job Queue)")]
        S3[("AWS S3 (Blob Storage)")]
    end

    User -->|Interaction| NextJS
    NextJS -->|State Mgmt| Redux
    NextJS -->|Proxied API Calls| Express
    Express -->|Queue Jobs| Redis
    Redis -->|Process| Worker
    Worker -->|Vector Indexing| Supabase
    Worker -->|Metadata Update| MongoDB
    Express -->|Query Context| Supabase
```

---

## 🌟 Key Technical Features

### 📡 Advanced RAG Pipeline
- **Semantic Search**: Implemented using **HuggingFace** embeddings and **pgvector** similarity search (`cosine_distance`).
- **Contextual Chunking**: Smart text splitting with overlap to preserve semantic context during retrieval.
- **AI Processing**: Automated metadata extraction, topic tagging (3-5 tags), and 3-sentence summaries for every document.

### ⚙️ Asynchronous Task Management
- **BullMQ Orchestration**: Document processing is handled by an isolated background worker, ensuring the main API remains responsive even during heavy file indexing.
- **Redis Resilience**: Custom logic to handle cloud-provider idle timeouts (`ECONNRESET`) with automated, silent reconnection.

### 🛡️ Enterprise-Grade Security
- **JWT Auth Bridge**: Custom middleware to verify NextAuth sessions between the decoupled frontend and backend.
- **Rate Limiting**: Strict checking on sensitive AI routes to protect against resource abuse.
- **Input Validation**: Centralized environment validation and strict MongoDB ID checks.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14, **Redux Toolkit**, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express.js, tsup (Production Bundling).
- **Automation**: BullMQ, Redis.
- **Database**: MongoDB (Metadata), Supabase pgvector (Vector Store).
- **Testing**: **Playwright** (End-to-End Testing).
- **DevOps**: GitHub Actions CI/CD.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB, Redis (Upstash), and Supabase instances.

### Installation
```bash
npm install
```

### Development
```bash
# Run Frontend, Backend, and Shared in parallel
npm run dev
```

### Testing
```bash
# Run Playwright E2E Tests
npm run test:e2e -w @neurovault/frontend
```

---

## 🌍 Scalable Deployment

NeuroVault is "Deployment Ready" for any cloud provider. We recommend:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend/Worker**: [Render](https://render.com)

See the **[Full Deployment Guide](./DEPLOYMENT.md)** for step-by-step setup instructions.

---

## 👨‍💻 Engineering Standards
- **Monorepo Structure**: Shared logic, types, and services reside in `packages/shared`.
- **Type Safety**: End-to-end TypeScript coverage from database models to React components.
- **Observability**: Centralized logging system with context-aware error tracking.

---

*Built with passion for building future-proof AI applications.*
