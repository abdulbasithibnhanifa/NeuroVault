# NeuroVault: Frontend UI 🎨⚛️

This is the UI layer of the NeuroVault platform. It is a high-performance, accessible, and responsive user interface built with the latest Next.js 14 features.

## 🚀 Key Frontend Features

### ⚡ Next.js 14 App Router
- **Server Components**: Leveraged for initial page loads to reduce hydration overhead and improve SEO.
- **Optimistic UI**: Implemented for seamless user experience during CRUD operations.
- **Client-Side Proxies**: Dynamically routes API requests to the external Render backend via `next.config.js` rewrites.

### 🎭 Modern UX & Styling
- **Framer Motion**: Custom micro-animations and page transitions to make the interface feel fluid and premium.
- **Tailwind CSS Engine**: Utility-first design system with integrated **Dark Mode** support.
- **Glassmorphism UI**: High-end aesthetic with frosted-glass effects and vibrant gradients.

### 🔐 Secure Intelligence
- **NextAuth integration**: Robust JWT-based authentication supporting Google and GitHub OAuth.
- **Semantic Components**: Custom-built search bars, citation lists, and knowledge graph visualizations.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Auth**: NextAuth.js
- **State Management**: React Hooks + Context API

---

## 📥 Local Development

1. Ensure you are in the project root.
2. Run `npm run dev` to start both frontend and backend.
3. Access the frontend at `http://localhost:3000`.

## 📦 Build for Production
This package is optimized for Vercel. It supports **Standalone Output** via `output: 'standalone'` in `next.config.js`, ensuring minimal Docker image sizes (~100MB).

```bash
# To build locally
npm run build -w @neurovault/frontend
```

---

## 👨‍💻 Key Skills Demonstrated
- Complex data visualization (Knowledge Graphs).
- Advanced CSS/Flexbox/Grid layouts.
- Cross-application token management and security.
- Responsive design for mobile and desktop.
