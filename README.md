# 🧪 ForkableFullStackQASuite

[![Stack](https://img.shields.io/badge/stack-Playwright%20%7C%20TypeScript%20%7C%20Python-2563eb?style=flat-square)](#)
[![DB](https://img.shields.io/badge/db-MSSQL-cc2927?style=flat-square)](#)
[![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Next.js%20%7C%20Chart.js-black?style=flat-square)](#)
[![Forkable](https://img.shields.io/badge/type-Forkable-6e40c9?style=flat-square)](https://github.com/suryakulshreshtha/SuryaKulshreshtha)

**Dual-language (TypeScript + Python) Playwright automation scaffold** for an
app built on React/Next.js, Node.js, MSSQL, REST APIs, and Chart.js
dashboards. Clone it, run it, keep it or throw it away — see
[suryakulshreshtha/SuryaKulshreshtha](https://github.com/suryakulshreshtha/SuryaKulshreshtha)
for the rest of the index.

## System under test

An internal CRM tracking **employees**: current position, utilization over
the year, projects assigned (current + previous), available work hours, and
qualifications/skills — with **role-based visibility**, so different users
see an appropriate (not necessarily full) view of another employee's data.
That visibility requirement is treated as a first-class, P0 test surface
here (`VIS-*` rows in the test plan), not an afterthought.

---

## 🎯 What it is

Two **independent** Playwright suites (`ts-suite/`, `py-suite/`) testing the
same application, built by design to catch different blind spots rather than
share code. They're kept honest by three shared artifacts only:

| Shared artifact | Purpose |
|---|---|
| [`shared-test-plan.md`](./shared-test-plan.md) | Canonical test-case matrix — every row implemented in both suites |
| [`shared-test-data/`](./shared-test-data) | Common fixtures so "expired-subscription user" means the same DB row everywhere |
| Locator strategy (below) | Same semantic locators picked independently in both suites, no shared code |

## 🛠️ Stack

**Automation** · Playwright (TypeScript + Python) · Pytest **Under test** ·
React · Next.js · Node.js · REST APIs · MSSQL · Chart.js **CI** · GitHub
Actions (matrix: TS + Python in parallel)

## 📐 Architecture

```
ForkableFullStackQASuite/
├── shared-test-plan.md          # canonical test case matrix
├── shared-test-data/            # JSON fixtures used by both suites
├── .github/workflows/ci.yml     # matrix CI: ts-suite + py-suite in parallel
├── ts-suite/                    # Playwright + TypeScript
│   ├── src/api/                 # typed REST client (zod schema validation)
│   ├── src/db/                  # MSSQL helper (mssql) — Users vs Employees kept distinct
│   ├── src/pages/                # Page Object Models
│   └── tests/
│       ├── auth.setup.ts        # generates src/.auth/user.json — runs before authenticated projects
│       ├── api/                 # auth, employee visibility (RBAC)
│       ├── ui/                  # login.spec.ts runs unauthenticated (see playwright.config.ts)
│       └── charts/               # employee utilization chart
└── py-suite/                    # Playwright + Python + pytest
    ├── src/api/                 # REST client (pydantic schema validation)
    ├── src/db/                  # MSSQL helper (pyodbc) — Users vs Employees kept distinct
    ├── src/pages/
    └── tests/{api,ui,charts}/
```

## 🔍 Locator strategy (no `data-testid` in the app yet)

Priority order: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText`.
CSS/XPath fallback lives inside the Page Object only, never inline in a test.
Elements where semantic locators genuinely don't work (icon-only buttons,
repeated rows, chart legend items) get tracked and requested incrementally
in [`shared-test-data/testid-requests.md`](./shared-test-data/testid-requests.md)
— small, specific asks to the dev team rather than a blanket sweep.

## 🧱 Build order

1. **REST API** — CRUD, auth, schema validation. Doubles as the test-data
   seeding mechanism for UI tests.
2. **Role-based visibility** — treated as its own priority layer, not folded
   into generic API tests: assert what a standard user vs. a manager/admin
   can see on the same employee record (`VIS-*`). Get this early; it's the
   requirement most likely to regress silently.
3. **MSSQL validation** — ground-truth assertions (utilization %, available
   hours, project history) independent of what the UI renders.
4. **UI E2E** — Page Object Model, `storageState`/`storage_state` reuse to
   skip login-via-UI on every test.
5. **Chart.js validation** — reads the live `Chart.getChart(canvas)` instance
   data and asserts it against API truth, instead of pixel snapshotting.
6. **Composite E2E** — seed via API → act via UI → verify UI + DB + chart
   agree, *and* that visibility rules still hold after the action (`E2E-003`).
   Fewest tests, highest confidence, top of the pyramid.

## 🚀 Getting started

**TypeScript suite**
```bash
cd ts-suite
npm install
npx playwright install --with-deps
cp .env.example .env   # fill in real values
npm test
```

**Python suite**
```bash
cd py-suite
pip install -r requirements.txt
playwright install --with-deps
cp .env.example .env   # fill in real values
pytest
```

## 🤝 Open to

Feedback on the shared-test-plan model for multi-team suites, and on the
Chart.js data-read pattern (`page.evaluate` + `Chart.getChart`) vs. visual
snapshotting — happy to compare notes.

📬 · 🌐 [suryakulshreshtha.in](https://www.suryakulshreshtha.in) · index at
[suryakulshreshtha/SuryaKulshreshtha](https://github.com/suryakulshreshtha/SuryaKulshreshtha)
