<h1 align="center">Tutela - Data Subject Request Portal (LGPD) 🛡️📨</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="http://www.apache.org/licenses/" target="_blank">
    <img alt="License: Apache License 2.0" src="https://img.shields.io/badge/License-Apache%20License%202.0-yellow.svg" />
  </a>
  <a href="https://twitter.com/yandevv_" target="_blank">
    <img alt="Twitter: yandevv_" src="https://img.shields.io/twitter/follow/yandevv_.svg?style=social" />
  </a>
</p>

<p align="center">
  The frontend of <strong>Tutela</strong>, a platform where organizations receive and handle the data subject requests guaranteed by Brazil's General Data Protection Law (LGPD, Law nº 13.709/2018) — from the public portal where a person asks for their data, to the queue, reports and audit trail of the data protection officer.
</p>

<h5 align="center">Give a ⭐️ if this project helped you or if you find it interesting!</h5>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Backend](#-backend)
- [About Me](#-about-me)
- [License](#-license)
- [What I Learned](#-what-i-learned)

---

## 🎯 About

**Tutela** is my undergraduate thesis project (TCC — Uni-FACEF). The LGPD gives every person the right to ask an organization whether it processes their data, to access, correct or delete it, and more (art. 18) — and gives the organization legal deadlines to answer (art. 19). Tutela is the channel for that conversation.

Each organization gets its own public portal, with its name, its data protection officer (DPO) and its contacts. On it:

- **Data subjects** create an account, register requests, follow the legal deadline, talk to the organization, cancel what they no longer need and rate the service.
- **DPOs** work a queue ordered by deadline, answer through a message thread, finalize requests with a conclusive answer and the delivered result, register requests received by phone or mail, and read management reports.

The UI is in Brazilian Portuguese and was **designed before development** as high-fidelity prototypes, each screen in a desktop (1280 px) and a mobile (360 px) frame. The functional requirements document of the thesis has the last word whenever the prototype and the business rules disagree.

### How It Works

1. **Sign up**: The data subject creates an account and confirms the e-mail address
2. **Register a request**: Chooses one of the nine rights of art. 18, describes the request and attaches documents
3. **Deadline starts**: A protocol number and a UUID v7 identifier are issued — 24 hours for simplified answers, 15 days otherwise
4. **DPO handles it**: The request enters the organization's queue, highlighted when due soon or overdue
5. **Conversation**: Both sides exchange messages and attachments inside the request
6. **Conclusion**: The DPO sends the conclusive answer with the delivered result attached
7. **Feedback & reports**: The data subject rates the service; the DPO follows the indicators in the management report

---

## ✨ Features

### Current Features

- ✅ **Public Portal**
  - Landing page with the nine rights, response deadlines and how the service works
  - Organization name and DPO contact loaded from the API
  - Terms of use and privacy notice

- ✅ **Authentication**
  - Sign up with a live password strength meter
  - E-mail confirmation, with a resend cooldown
  - Sign in with "keep me signed in", and sign-in with Google (OAuth)
  - Password recovery and reset by e-mail
  - Role-based redirect after sign-in (data subject or DPO)
  - DPO invitation acceptance

- ✅ **Data Subject Area**
  - Register requests (one right per request), with attachments
  - Request list ordered by urgency, with batch selection and batch cancellation
  - Request detail with deadline, answer, history and downloadable attachments
  - Message thread with edit (30-minute window) and delete of own messages
  - Satisfaction survey on concluded requests

- ✅ **DPO Area**
  - Request queue with filters and search kept in the URL, and CSV export
  - Request detail with the conclusive answer panel (answer text + required result file)
  - Register requests on behalf of a data subject (phone, e-mail, mail, in person…)
  - Management report computed by the server, with CSV and PDF export
  - Audit log and team invitations

- ✅ **Notifications**
  - Header bell with unread counter, kept in sync with the notifications page
  - Mark as read, mark all as read, clear list
  - Opening a notification leads to the related resource — or explains why it is gone

- ✅ **Account Settings**
  - Personal data masked by default, revealed on demand for 30 seconds
  - E-mail change confirmed at the new address
  - Password change and active sessions management
  - Notification preferences per event and channel, with mandatory ones locked

- ✅ **Security**
  - Session in `httpOnly` cookies — no token ever touches JavaScript
  - CSRF header on every write request
  - Single-flight session refresh when the access token expires
  - Route guards by role (authorization itself is enforced by the server)

- ✅ **Accessibility & Responsiveness**
  - Every screen works from 320 px wide
  - Keyboard navigation, focus management in dialogs and skip link
  - Errors announced to screen readers

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Vue 3](https://vuejs.org/) with Composition API (`<script setup>`)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with design tokens in `@theme`
- **HTTP Client**: native `fetch`, wrapped with CSRF, session refresh and `problem+json` error handling
- **Package Manager**: [pnpm](https://pnpm.io/)

### Testing

- **Unit Tests**: [Vitest](https://vitest.dev/) + [Vue Test Utils](https://test-utils.vuejs.org/)
- **End-to-End Tests**: [Cypress](https://www.cypress.io/), with the API simulated by `cy.intercept`

### Code Quality

- **Linting**: [oxlint](https://oxc.rs/) + [ESLint](https://eslint.org/)
- **Type Checking**: [vue-tsc](https://github.com/vuejs/language-tools)

### Prototyping

- [Figma](https://www.figma.com/) - UI/UX design and high-fidelity prototypes of every screen, in desktop and mobile frames

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 22.18 or 24.12 and above)
- **pnpm**
- **The backend** ([backend-dsars](https://github.com/yandevv/backend-dsars)) running — _optional for the unit and end-to-end tests, which simulate the API_

---

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yandevv/frontend-dsars.git
cd frontend-dsars
```

2. **Install the dependencies**

```bash
pnpm install
```

3. **Start the backend** — follow the instructions in [backend-dsars](https://github.com/yandevv/backend-dsars) (Docker Compose for PostgreSQL, Mailpit and MinIO, then migrations and seed).

---

## ⚙️ Configuration

### Environment Variables

`.env.development` and `.env.production` already point to the defaults. See `.env.example` for the documented template.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE` | Base path of the API calls | No | `/api` |
| `VITE_ORGANIZATION_SLUG` | Slug of the organization served by this portal | **Yes** | `demonstracao` |
| `API_PROXY_TARGET` | Where the dev/preview proxy sends `/api` (not exposed to the browser) | No | `http://localhost:3000` |

### API Proxy

During development, Vite proxies `/api` to the backend, so the frontend and the API share the same origin — cookies work with no CORS setup. The proxy also rewrites the refresh cookie path from `/auth` to `/api/auth`, so the browser sends it back on session refresh. In production, place both behind the same domain with a reverse proxy doing the same.

---

## 🎮 Usage

### Development Mode

```bash
pnpm dev
```

**Access the application:**

- **Frontend**: http://localhost:5173
- **Backend API** (through the proxy): http://localhost:5173/api

With the backend seeded, you can sign in with its demo accounts — a data subject and a DPO — using the password printed by the seed.

### Production Build

```bash
pnpm build     # type-check + production build
pnpm preview   # serves the build at http://localhost:4173
```

### Code Quality

```bash
pnpm type-check
pnpm lint      # oxlint + ESLint, with auto-fix
```

---

## 🧪 Testing

### Unit Tests

```bash
pnpm test:unit
```

Services, composables, components and views, with the API mocked at the `fetch` level.

### End-to-End Tests

```bash
pnpm test:e2e       # headless, over the production build
pnpm test:e2e:dev   # interactive Cypress, over the dev server
```

Every spec simulates the API with `cy.intercept`. A catch-all answers any call a test didn't simulate, so the suite never reaches a backend running on your machine.

---

## 📁 Project Structure

```
frontend-dsars/
├── cypress/
│   ├── e2e/                   # One spec per screen
│   └── support/               # API fixtures, in-memory servers, commands
│
├── src/
│   ├── assets/styles/         # Tailwind + design tokens (@theme)
│   ├── features/              # One folder per product area
│   │   ├── audit/             # DPO audit log
│   │   ├── auth/              # Sign up, sign in, e-mail confirmation, invites
│   │   ├── help/              # Help page content, per role
│   │   ├── landing/           # Public landing page
│   │   ├── notifications/     # Bell and notifications page
│   │   ├── reports/           # Management report
│   │   ├── requests/          # Requests, from registration to conclusion
│   │   ├── settings/          # Personal data, security, notification preferences
│   │   ├── survey/            # Satisfaction survey
│   │   ├── team/              # Team and invitations
│   │   └── tenant/            # The organization that owns the portal
│   ├── router/                # Routes and role guards
│   ├── shared/
│   │   ├── api/               # HTTP client, API contracts, enum mapping
│   │   ├── constants/         # Domain lists (the nine rights of art. 18)
│   │   ├── layout/            # Shell of authenticated screens
│   │   ├── ui/                # Base components (Base*)
│   │   └── utils/             # Dates, bytes, downloads, UUID
│   ├── test/                  # Vitest setup, fetch mock and factories
│   ├── views/                 # Route targets
│   ├── App.vue                # Root component
│   └── main.ts                # Application entry point
│
├── .env.example               # Environment variables template
├── vite.config.ts             # Vite config and API proxy
├── LICENSE                    # Apache License 2.0
└── README.md                  # This file
```

Inside each feature, code is split into `components/`, `composables/`, `constants/`, `services/`, `types/` and `utils/`. Code only moves to `shared/` when more than one feature needs it, and **services are the only place that talks to the API**.

---

## 🔌 Backend

This frontend consumes the **Tutela API**, built with NestJS, PostgreSQL (Prisma), S3-compatible storage and cookie-based authentication:

**[yandevv/backend-dsars](https://github.com/yandevv/backend-dsars)**

With the backend running, its interactive API documentation is at **http://localhost:3000/docs**.

---

## 👤 About Me

**YanDevv (author)**

* 🐦 Twitter: [@yandevv_](https://twitter.com/yandevv_)
* 💼 LinkedIn: [@yandevv](https://linkedin.com/in/yandevv)
* 🐙 GitHub: [@yandevv](https://github.com/yandevv)

---

## 📝 License

Copyright © 2026 [YanDevv](https://github.com/yandevv)

This project is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).

You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

---

## 📖 What I Learned

This project was the frontend half of my thesis, and it pushed me to turn a legal text and a requirements document into screens that a regular person can actually use. Here are the key takeaways:

**Frontend Architecture:**
- Organized the app **by feature** instead of by file type, keeping each product area self-contained.
- Kept a single seam between the UI and the data: services translate the API into UI types, so components never deal with the backend's format.
- Shared state across the header and pages with module-level composables.

**Working with a Real API:**
- Implemented **cookie-based sessions** with a CSRF header and a single-flight token refresh.
- Parsed **RFC 9457 `problem+json`** errors and showed the server's messages directly to users.
- Configured a **Vite proxy** — and learned the hard way that cookie paths must follow the proxy prefix.
- Handled **multipart uploads** and presigned download links for attachments.

**Testing:**
- Wrote unit tests for services, composables, components and views with **Vitest** and **Vue Test Utils**.
- Built **Cypress** end-to-end suites with in-memory fake servers on top of `cy.intercept`, so the tests don't depend on a running backend.

**Accessibility & Responsiveness:**
- Designed every screen to work from **320 px** wide.
- Managed focus in dialogs, forms and error summaries, and announced changes to screen readers.

**UI/UX Design:**
- **Prototyped every screen before coding**, in desktop and mobile frames.
- Translated the prototypes' colors and typography into **Tailwind CSS 4 design tokens**.
- Learned when the **requirements must win over the design**: business rules, deadlines and legal wording come first.

**Domain Knowledge:**
- Studied the **LGPD**: the nine rights of art. 18, the response deadlines of art. 19 and what an audit trail must keep.
- Learned how privacy concerns shape the UI: masking personal data, not revealing whether an e-mail has an account, and suppressing survey results too small to stay anonymous.

**Challenges Overcome:**
- Replacing every mocked service with the real API without rewriting the components.
- Modeling deadlines in hours (24 h) and in days (15 days) side by side.
- Keeping the notification counter consistent across the whole app.

This project taught me that **a good frontend is a careful translation** — of the law into plain language, of the design into accessible components, and of the API into a model the screens can trust.

---

<p align="center">Made with ❤️ by YanDevv</p>
