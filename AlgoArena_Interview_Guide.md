# AlgoArena Coding Platform - Project Architecture & Interview Guide

This document serves as a comprehensive guide to understanding the AlgoArena Coding Platform. It explains the tech stack, file structure, component connections, and core workflows to help you confidently explain the project to an interviewer.

## 1. Tech Stack Overview

The project is built using a modern, full-stack JavaScript ecosystem:

- **Framework**: Next.js 15 (App Router) - Provides server-side rendering, static site generation, and API routes.
- **Frontend**: React 19, Tailwind CSS (for styling), Shadcn UI / Radix UI (for accessible, unstyled components).
- **Backend**: Next.js Server Actions and API Routes.
- **Database Engine**: Prisma ORM with SQLite (currently configured for local use; easily swappable to PostgreSQL).
- **Authentication**: Clerk (with a custom local fallback mechanism for development).
- **Code Execution**: Judge0 API (an open-source robust code execution engine).
- **Code Editor**: Monaco Editor (`@monaco-editor/react`), the same editor that powers VS Code.

## 2. Core Project Structure

The codebase follows a feature-driven architecture combined with Next.js App Router conventions:

- **/app**: The core routing mechanism.
  - `(auth)/`: Contains Clerk sign-in and sign-up pages.
  - `(root)/`: The main layout wrapper for authenticated/public users.
  - `api/`: Backend API routes (e.g., `/api/create-problem` for admin problem creation).
  - `problem/[id]/`: The dynamic route for the coding workspace (where users read problem descriptions and write code).
  - `problems/`: The problem directory/table view.
- **/modules**: Contains feature-specific logic, cleanly separated from routing.
  - `auth/`: Authentication actions and onboarding logic.
  - `home/`: Homepage UI components like the `Navbar`.
  - `problems/`: Contains the complex `create-problem-form`, `problem-table`, and backend actions for fetching and validating problems.
- **/components/ui**: Reusable, atomic UI components (Buttons, Dialogs, Selects) generated via Shadcn UI.
- **/lib**: Core utilities and integrations.
  - `db.js`: Initializes the Prisma Client singleton to prevent connection leaks.
  - `auth.js`: Handles Clerk session checking and the fallback developer login.
  - `judge0.js`: Manages the communication with the external Judge0 code execution engine.
- **/prisma**: Database schema (`schema.prisma`) and seeding logic (`seed.js`).

## 3. Database Architecture

The Prisma schema defines the following core models:

1. **User**: Stores user details (clerkId, email, role).
2. **Problem**: Stores coding challenges (title, description, testCases, difficulty, tags). Tags and testCases are stored as `Json` objects.
3. **Submission**: Logs every time a user submits code. Links to the User and Problem, and stores the source code, language, memory/time usage, and overall status.
4. **TestCaseResult**: Links to a Submission. Stores the specific pass/fail state of individual test cases.
5. **Playlist / ProblemSolved**: Handles user curation and tracking of solved problems.

## 4. How the Files Connect (Core Workflows)

### A. Authentication Flow
1. User visits the app. `middleware.js` intercepts the request.
2. If Clerk is configured, it protects the routes. If missing, `middleware.js` allows the local fallback.
3. On first load, `app/(root)/layout.jsx` calls `onBoardUser()` (from `modules/auth/actions/index.js`), which upserts the user into the Prisma database based on their Clerk ID or the local fallback ID.

### B. Viewing Problems
1. The user navigates to `/problems`.
2. The page fetches problems via `getAllProblems()` (from `modules/problems/actions/index.js`), which queries the Prisma database (`db.problem.findMany`).
3. The data is passed to the `ProblemTable` component, allowing users to filter by difficulty and tags on the frontend.

### C. Solving a Problem & Code Execution
1. The user clicks a problem and navigates to `/problem/[id]`.
2. The page fetches the specific problem data from the database.
3. The user types code into the `<MonacoEditor>` component.
4. When they click "Run" or "Submit", the frontend sends the code, language, and the problem's hidden test cases to a backend API route or Server Action.
5. The backend utilizes `lib/judge0.js` to send a "batch submission" to the Judge0 API.
6. `lib/judge0.js` polls the Judge0 API until execution completes, then returns the stdout/stderr, execution time, and memory usage.
7. The backend compares the Judge0 output against the expected `testCases` and saves a `Submission` record to the database via Prisma.

## 5. Potential Interview Questions & Answers

**Q: Why use Next.js App Router instead of traditional React (Create React App)?**
*A: App Router allows us to mix Server Components and Client Components. Server Components fetch data directly from the database (Prisma) without exposing an API endpoint, improving performance and security. It also handles SEO and layout persistence beautifully.*

**Q: How does the code execution work securely?**
*A: We do not execute user code on our own Node.js servers (which would be a massive security risk). Instead, we send the code to Judge0, an isolated, sandboxed execution environment. We send the code and test cases, and Judge0 returns the sanitized output.*

**Q: How did you handle the database in different environments?**
*A: We use Prisma ORM. For local development where Docker isn't available, we use SQLite because it runs from a local file (`dev.db`). For production (like Vercel), we change the Prisma provider to PostgreSQL.*

**Q: Why did you separate `/modules` from `/app`?**
*A: The `/app` directory is strictly for Next.js routing and layouts. By placing business logic, server actions, and complex feature-components in `/modules`, the codebase remains highly modular, testable, and prevents the routing directory from becoming cluttered.*
