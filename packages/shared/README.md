# NeuroVault: Shared Logic Hub 🧩🏛️

The `packages/shared` workspace is the "source of truth" for the entire NeuroVault monorepo. It houses the critical business logic, domain models, and infrastructure adapters that power both the Frontend and the Backend.

## 🚀 Key Engineering Highlights

### 🏛 Domain-Driven Design
- **Unified Models**: Centralized Mongoose schemas for `Document`, `User`, `Chat`, and `Usage` ensures data consistency across the stack.
- **Type-Driven Development**: High-fidelity TypeScript interfaces that define the contract between the API and the UI.

### 🧩 Infrastructure Adapters
- **Storage Strategy**: Abstracted **S3** and **Supabase** services that allow for easy swapping of underlying cloud providers.
- **Intelligence Adapters**: Decoupled **HuggingFace** and **OpenRouter** service layers for modular LLM orchestration.
- **Database Library**: Centralized connection management with refined retry logic and connection pooling.

### 🛡️ Common Utilities
- **Rate Limiting**: Custom implementation of token-bucket rate limiting to protect the AI pipeline.
- **Structured Logging**: Standardized pino-based logger used throughout the monorepo for production-grade traceability.

---

## 🛠 Tech Stack

- **Language**: TypeScript (v5+)
- **ORM/ODM**: Mongoose
- **Validation**: Zod (Environment variables and payload validation)
- **Infrastructure**: AWS SDK, Supabase JS, Redis (BullMQ types)

---

## 🏗 Why This Matters (For Recruiters)
This package demonstrates an advanced understanding of **Software Design Patterns**:
- **DRY (Don't Repeat Yourself)**: Zero code duplication across the mono-repo.
- **Separation of Concerns**: Infrastructure logic is decoupled from application logic.
- **Maintainability**: Centralized updates to a schema or an API adapter automatically propagate to both the client and the worker.
