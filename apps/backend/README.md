# NeuroVault: Backend Engine ⚙️🏗️

The Backend of NeuroVault is a robust, high-performance Node.js environment responsible for API serving, metadata orchestration, and heavy-duty AI processing.

## 🚀 Key Systems Engineering Features

### 🔄 Asynchronous Worker Loop (BullMQ)
- **Background Processing**: Heavy tasks like PDF text extraction, YouTube transcript fetching, and Vector indexing are delegated to an isolated worker process.
- **Reliability**: Integrated **Redis** as a job broker to ensure zero data loss during network or processing spikes.
- **Scalability**: Decoupled worker architecture allows infrastructure to scale the pool of processing workers independently of the API server.

### 🧠 Intelligent Retrieval & Search
- **Similarity Search Implementation**: Native integration with **Supabase pgvector** for cosine similarity search.
- **Semantic Indexing**: Seamless orchestration between S3 storage, HuggingFace embeddings, and the vector store.
- **Metadata Management**: Optimized MongoDB schema designs for high-speed retrieval of document relationship graphs.

### 📦 Modern Node.js Tooling
- **tsup Bundling**: Used to package the entire backend into a single self-contained execution unit for production, reducing Docker startup overhead.
- **Type Safety**: strict TypeScript configuration for end-to-end reliability.
- **Logging & Monitoring**: Structured JSON logging for production observability.

---

## 🛠 Tech Stack

- **Framework**: Express.js
- **Orchestration**: BullMQ + Upstash Redis
- **Bundler**: tsup
- **Storage**: AWS S3 + MongoDB + Supabase
- **Security**: jose (JWT verification), Multer (Input constraints)

---

## 📥 Development & Execution

1. Root Directory: `npm run dev` starts the API on port 3001.
2. Worker Deployment: The background processing loop is executed via:
   ```bash
   npm run worker -w @neurovault/backend
   ```

## 📦 Production Deployment
The backend is bundled into `dist/` before deployment:
```bash
npm run build -w @neurovault/backend
```

---

## 👨+💻 Backend Engineering Skills Demonstrated
- Large-scale job queue architecture.
- Complex database orchestration (SQL-as-Vector + NoSQL).
- Production-grade bundling and Docker optimization.
- Robust error handling and logging standards.
