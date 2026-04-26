# 🚀 CodeArena - LeetCode Style Coding Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss)
![Judge0](https://img.shields.io/badge/Judge0-Code%20Execution-FF6B00)

> A full-stack coding platform where users can solve algorithmic problems, submit solutions, and get real-time feedback with code execution in multiple languages.

## ✨ Features

### 👤 User Features
- ✅ **Google/GitHub OAuth** - Quick and secure authentication via Clerk
- ✅ **Problem Solving** - 50+ curated DSA problems with difficulty levels
- ✅ **Code Editor** - Monaco Editor with syntax highlighting (VS Code style)
- ✅ **Multiple Languages** - JavaScript, Python, Java, C++, C, Go, Rust
- ✅ **Real-time Execution** - Code runs in isolated Judge0 sandbox
- ✅ **Submission History** - Track all past submissions with results
- ✅ **Custom Playlists** - Create and save problem collections
- ✅ **Dark/Light Mode** - Eye-friendly theme switching

### 👑 Admin Features
- ✅ **Role-Based Access** - Separate admin dashboard
- ✅ **Problem Creation** - Add new problems with test cases
- ✅ **Test Case Validation** - Auto-verify test cases via Judge0
- ✅ **User Management** - View and manage users

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15, React 19 | Server-side rendering, routing |
| **Styling** | Tailwind CSS, Shadcn UI | Modern, responsive UI |
| **Database** | PostgreSQL, Prisma ORM | Data persistence, type-safe queries |
| **Auth** | Clerk | Authentication, session management |
| **Code Execution** | Judge0 API | Secure code execution in sandbox |
| **Editor** | Monaco Editor | VS Code-like coding experience |
| **Deployment** | Vercel | Hosting, CI/CD |

## 📊 Database Schema

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String
  image       String?
  role        Role      @default(USER)
  submissions Submission[]
  playlists   Playlist[]
  createdAt   DateTime  @default(now())
}

model Problem {
  id          String    @id @default(cuid())
  title       String
  description String    @db.Text
  difficulty  Difficulty
  testCases   Json
  submissions Submission[]
  createdAt   DateTime  @default(now())
}

model Submission {
  id          String    @id @default(cuid())
  code        String    @db.Text
  language    String
  status      String
  runtime     Int?
  memory      Int?
  userId      String
  problemId   String
  createdAt   DateTime  @default(now())
}
```
