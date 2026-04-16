# NeuroVault: Frontend UI 🎨⚛️

This is the UI layer of the NeuroVault platform. It is a high-performance, accessible, and responsive user interface built with the latest Next.js 14 features.

## 🚀 Key Frontend Features

### ⚡ Next.js 14 App Router
- **Server Components**: Leveraged for initial page loads to reduce hydration overhead and improve SEO.
- **Optimistic UI**: Implemented for seamless user experience during CRUD operations.
- **Client-Side Proxies**: Dynamically routes API requests to the external Render backend via `next.config.js` rewrites.

### 🧠 State Management: Redux Toolkit
- **Centralized Store**: Manages application-wide states like UI layout, user settings, and global notifications. 
- **Modular Slices**: Uses `appSlice.ts` for clean, predictable state transitions across complex components.
- **Type-Safe Hooks**: Custom `useAppDispatch` and `useAppSelector` for full TypeScript coverage.

### 🎭 Modern UX & Styling
- **Framer Motion**: Custom micro-animations and page transitions for a fluid, premium feel.
- **Tailwind CSS**: Utility-first design with integrated **Dark Mode** support and Glassmorphism effects.

### 🧪 Quality Assurance: Playwright
- **E2E Testing**: Full end-to-end coverage for document uploads, YouTube indexing, and search functionality.
- **CI Integration**: Automated test runs on every push via GitHub Actions.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **State**: **Redux Toolkit**
- **Testing**: **Playwright**
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Auth**: NextAuth.js

---

## 📥 Local Development

1. Ensure you are in the project root.
2. Run `npm run dev` to start the frontend, backend, and shared libraries.
3. Access the frontend at `http://localhost:3000`.

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e
```

## 📦 Build for Production
This package is optimized for Vercel. It supports **Standalone Output** via `output: 'standalone'` in `next.config.js`, ensuring minimal Docker image sizes (~100MB).

```bash
# To build locally
npm run build -w @neurovault/frontend
```

---

## 👨‍💻 Engineering Standards
- **Component Atomic Design**: Reusable UI primitives located in `/components/ui`.
- **Responsive Layouts**: Fully adaptive design for mobile, tablet, and desktop.
- **Secure Auth Bridge**: JWT-based communication with the backend.
