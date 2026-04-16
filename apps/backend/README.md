# NeuroVault: Backend Engine ⚙️🏗️

The Backend of NeuroVault is a robust, high-performance Node.js environment responsible for API serving, metadata orchestration, and heavy-duty AI processing.

## 🚀 Key Systems Engineering Features

### 🔄 Asynchronous Worker Loop (BullMQ)
- **Background Processing**: Heavy tasks like PDF text extraction, YouTube transcript fetching, and Vector indexing are delegated to an isolated worker process.
- **Redis Resilience**: Integrated **Upstash Redis** as a job broker with custom logic to handle cloud-provider idle timeouts (`ECONNRESET`) through automated reconnection.
- **Scalability**: Decoupled worker architecture allows infrastructure to scale the pool of processing workers independently of the API server.

### 🔐 JWT Auth Bridge
- **Secure Communication**: Implements a zero-trust middleware using `jose` to verify NextAuth JWT tokens between the decoupled frontend (Vercel) and backend (Render).
- **Session Continuity**: Ensures seamless user identification across different cloud provider domains.

### 🧠 Intelligent Retrieval & Search
- **Similarity Search**: Native integration with **Supabase pgvector** for high-speed cosine similarity search.
- **AI Processing**: Orchestrates 3-5 automated topic tags and 3-sentence summaries for every document using LLMs.

### 📊 Observability: Structured Logging
- **Structured JSON Logs**: Uses a centralized logging wrapper to produce machine-readable JSON logs for production-grade observability.
- **Context-Aware Tracing**: Every error is logged with associated document IDs and job metadata for rapid incident resolution.

---

## 🛠 Tech Stack

- **Framework**: Express.js
- **Orchestration**: BullMQ + Redis (Upstash)
- **State/Auth**: NextAuth + `jose` (JWT)
- **Database**: MongoDB (Metadata) + Supabase pgvector (Vector Store)
- **Logging**: Custom Structured JSON Logger

---

## 📥 Development & Execution

1. Root Directory: `npm run dev` starts the API, Worker, and Frontend.
2. Independent Worker: To scale the processing layer:
   ```bash
   npm run worker -w @neurovault/backend
   ```

## 📦 Production Deployment
The backend is bundled into `dist/` using `tsup` for a minimal, high-performance runtime:
```bash
npm run build -w @neurovault/backend
```

---

## 👨‍💻 Backend Engineering Standards
- **Middleware Validation**: Strict MongoDB ObjectId validation on all incoming resource identifiers.
- **Resource Constraints**: Rigid Multer and payload limits to prevent memory exhaustion.
- **Standardized Errors**: High-quality HTTP status codes and detailed error payloads.
