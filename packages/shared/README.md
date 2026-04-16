# NeuroVault: Shared Logic Hub 🧩🏛️

The `packages/shared` workspace is the "source of truth" for the entire NeuroVault monorepo. It houses the critical business logic, domain models, and infrastructure adapters that power both the Frontend and the Backend.

## 🚀 Key Engineering Highlights

### 🏛 Domain-Driven Design
- **Unified Models**: Centralized Mongoose schemas for `Document`, `User`, `Chat`, and `Usage` ensure data consistency across the entire stack.
- **Type-Driven Contract**: High-fidelity TypeScript interfaces that define the strict contract between the API and the UI.

### 🧩 Infrastructure Adapters
- **Redis Resilience**: High-performance **role-based client factory** with dedicated instances for `default` (app/rate-limiting), `producer` (queueing), and `worker` (blocking tasks). Features hardened `idle-reconnect` logic optimized for Upstash/Cloud environments.
- **Intelligence Adapters**: Modular **OpenRouter** and **HuggingFace** service layers for seamless AI orchestration and usage tracking.
- **Supabase Vector Store**: Encapsulated logic for semantic indexing and retrieval using `pgvector`.

### 📊 Observability & Validation
- **Structured JSON Logging**: Centralized logging configuration used by both the API server and the background workers for consistent traceability.
- **Environment Safety**: Zod-powered validation ensures that missing configuration keys are caught at startup, not at runtime.

---

## 🛠 Tech Stack

- **Language**: TypeScript (v5+)
- **ORM/ODM**: Mongoose
- **Validation**: Zod
- **Infrastructure**: AWS SDK, Supabase JS, ioredis (BullMQ optimized)
- **Logging**: Custom Structured JSON Logger

---

## 🏗 Architecture Benefit
This package demonstrates an advanced understanding of **Software Design Patterns**:
- **DRY (Don't Repeat Yourself)**: Zero code duplication for core logic across the mono-repo.
- **Separation of Concerns**: Infrastructure logic is decoupled from application logic, allowing for modular cloud provider swapping.
- **Maintainability**: Centralized updates to a schema or an API adapter automatically propagate to both the client and the worker.

---

*Ensuring architectural integrity across the NeuroVault ecosystem.*
