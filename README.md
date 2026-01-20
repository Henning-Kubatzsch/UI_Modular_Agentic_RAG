# UI_Modular_Agentic_RAG

![Project Preview](<hero-image.png>)

A user-friendly TypeScript/React interface for the [Modular-Agentic-RAG](https://github.com/Henning-Kubatzsch/Modular-Agentic-RAG) system. This UI enables users to submit queries, explore answers, provide feedback, and interact with the RAG pipeline.

---

## 📋 Overview

This frontend project complements the Python-based RAG backend with an intuitive user interface. It is designed to offer:

- **Query Interface**: Ask questions to the RAG system and receive context-based answers
- **Answer Exploration**: Transparent display of retrieved documents and generated responses
- **Feedback Mechanism**: Rate answers to continuously improve the system
- **Configuration Integration**: Direct connection to the backend project's YAML configuration

---

## 🚀 Setup

### Prerequisites

- **Node.js** (>= 20.x recommended, as Next.js 15 requires at least Node 18.18+)
- **pnpm** (or npm/yarn)
- Running [Modular-Agentic-RAG](https://github.com/Henning-Kubatzsch/Modular-Agentic-RAG) backend

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Henning-Kubatzsch/UI_Modular_Agentic_RAG.git
   cd UI_Modular_Agentic_RAG
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   CONFIG_PATH=/path/to/Modular-Agentic-RAG/rag.yaml
   ```

   Adjust `CONFIG_PATH` to point to your `rag.yaml` file from the backend project.

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

The application will now run by default on `http://localhost:3000`.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.5 (App Router)
- **Frontend**: React 19.1.0 with TypeScript
- **Data Fetching**: SWR
- **Styling**: Tailwind CSS 4
- **Configuration**: YAML parser (yaml), validation with Zod
- **Linting**: ESLint with Next.js config

## 📄 License

This is a private learning and portfolio project. All rights reserved.

**Usage Restrictions:**
- This code is provided for **viewing and evaluation purposes only** (e.g., for recruiters, potential employers, or educational review)
- **No permission is granted** to copy, modify, distribute, or use this code in any commercial or non-commercial projects without explicit written consent
- If you're interested in using parts of this project, please contact me directly

© 2026 Henning Kubatzsch. All rights reserved.
