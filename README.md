# Eloclinico.pt

A specialized SaaS platform empowering psychologists to manage clinical records, patient scheduling, and invoicing with privacy by design.

**Current Status:** Closed Beta (User Research Phase)

---

## 🎯 Project Vision

Psychologists face a unique challenge: managing highly sensitive clinical data while juggling scheduling and administrative overhead, often using fragmented tools that aren't compliant or optimized for their workflow.

**Eloclinico** solves this by providing a unified, secure workspace tailored to the therapeutic context.
*   **Privacy First:** Built with strict data isolation and security practices suitable for clinical records.
*   **Workflow Optimization:** deep integration with Google Calendar for seamless scheduling without double-booking.
*   **Clinical Focus:** Structured notes and patient management designed specifically for mental health professionals.

## 🛠 The Tech Stack

Built on a modern, type-safe web stack designed for performance, scalability, and developer experience.

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (Cloud-hosted)
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/) for type-safe database queries
*   **Authentication:** [Better Auth](https://better-auth.com/) for secure, robust session management
*   **UI/UX:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
*   **Integrations:** Google Calendar API (via `googleapis`)
*   **State Management:** React Server Components + React Hooks

## 🏗 Engineering Excellence

This repository demonstrates a commitment to "Production-Grade" engineering standards:

*   **CI/CD Pipelines:** Automated workflows via **GitHub Actions** ensure that every commit is linted and built before merging, maintaining code quality and preventing regressions.
*   **Strict Type Safety:** Comprehensive TypeScript and **Zod** schema validation ensure data integrity from the database layer to the UI.
*   **Environment Management:** Strict separation of concerns using `.env` configuration for Development and Production environments, ensuring no secrets are ever exposed in codebase.
*   **Modular Architecture:** Feature-based folder structure (e.g., `server/google`, `components/dnd`) for maintainability.

## 🚀 Product Roadmap

I am currently operating in a **Closed Beta** phase.
*   **Q1 Focus:** Conducting user interviews with pilot psychologists to refine the scheduling and notes interface.
*   **Upcoming:** Automated invoicing integration and enhanced patient portal features.

## 💻 Local Setup

To run the project locally for development or review:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/goncalocantante/psychologists-app.git
    cd psychologists-app
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    Duplicate `.env.example` to `.env` and populate the required API keys (Database URL, Google Client ID, etc.).
    ```bash
    cp .env.example .env
    ```

4.  **Database Initialization:**
    ```bash
    pnpm db:setup
    pnpm db:migrate
    pnpm db:seed
    ```

5.  **Run Development Server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---
*Built with ❤️ by Gonçalo Cantante*
