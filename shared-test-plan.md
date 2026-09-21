# Shared Test Plan

Canonical list of test cases. Both `ts-suite` and `py-suite` implement every
row independently. Update this file first when scope changes; then both
teams pick up the new row.

Status values: `Not Started`, `In Progress (TS)`, `In Progress (PY)`,
`Done (TS)`, `Done (PY)`, `Done (Both)`.

## Legend
- **Layer**: API / DB / UI / Chart / E2E (composite)
- **Priority**: P0 (blocks release) / P1 (high) / P2 (nice to have)

Note on entities: **Users** are login accounts (who can sign in — standard
staff, managers/admins). **Employees** are the CRM's actual tracked entity
(position, utilization, availability, projects, skills, qualifications). A
user may or may not correspond to an employee record; keep the two apart in
tests rather than assuming "the logged-in user" and "the employee being
viewed" are always the same row.

| ID | Layer | Priority | Scenario | Expected Result | Status |
|----|-------|----------|----------|------------------|--------|
| AUTH-001 | API | P0 | POST /auth/login with valid credentials | 200, valid JWT/session returned, matches schema | Not Started |
| AUTH-002 | API | P0 | POST /auth/login with invalid password | 401, error body matches schema, no session issued | Not Started |
| AUTH-003 | API | P1 | POST /auth/login with malformed payload | 400, validation error | Not Started |
| AUTH-004 | UI | P0 | Log in via UI with valid credentials | Redirect to dashboard, session persisted | Not Started |
| AUTH-005 | UI | P0 | Log in via UI with invalid credentials | Inline error shown, no redirect | Not Started |
| USER-001 | API | P0 | Create login account via POST /users | 201, record exists in DB (verify via DB) | Not Started |
| USER-002 | DB | P0 | Verify created user row matches API payload | Row exists, fields match, timestamps sane | Not Started |
| USER-003 | API | P1 | Duplicate user creation (same email) | 409 conflict | Not Started |
| DASH-001 | UI | P0 | Dashboard loads for authenticated user | Key widgets render, no console errors | Not Started |
| VIS-001 | API | **P0** | Standard user requests another employee's profile | Only appropriate fields returned (e.g. no compensation); 200 | Not Started |
| VIS-002 | API | **P0** | Manager/admin requests the same employee's profile | Full profile returned including restricted fields | Not Started |
| VIS-003 | UI | P1 | Standard user views employee profile page in UI | Restricted fields not rendered anywhere in the DOM, not just hidden by CSS | Not Started |
| UTIL-001 | API+DB | **P0** | GET utilization % for an employee | API value matches DB ground truth for the current period | Not Started |
| UTIL-002 | E2E | P1 | Employee assigned to a new project | Utilization % recalculates correctly, reflected in API + UI + chart | Not Started |
| AVAIL-001 | API+DB | **P0** | GET available hours for an employee | Available hours = total capacity minus hours committed to active project assignments, matches DB | Not Started |
| PROJ-001 | API | P1 | GET employee's previous (completed) project history | All completed assignments returned, correct dates/roles | Not Started |
| PROJ-002 | API | P1 | GET employee's current project assignment(s) | Active assignments only, correct role-on-project shown | Not Started |
| SKILL-001 | UI | P2 | Employee profile displays skills and qualifications | Rendered list matches DB record exactly, including empty-state (no skills listed) | Not Started |
| CHART-001 | Chart | P0 | Employee utilization chart reflects API data | Chart.js dataset values match `/employees/{id}/utilization` exactly | Not Started |
| CHART-002 | Chart | P1 | Chart updates after date-range filter change | Dataset updates to match new API call | Not Started |
| CHART-003 | Chart | P2 | Employee with no utilization history (new hire) | Chart shows empty/placeholder state, no JS error | Not Started |
| E2E-001 | E2E | P0 | Create employee record via API → appears in UI list → persists in DB | All three layers agree | Not Started |
| E2E-002 | E2E | P1 | Edit employee record via UI → API reflects change → DB reflects change → chart updates | All four layers agree | Not Started |
| E2E-003 | E2E | **P0** | Assign employee to a project via UI (as manager) → utilization recalculates → standard user's view of that employee still respects visibility rules | Cross-cuts VIS + UTIL — the highest-value composite test for this system | Not Started |

_Add new rows here as scope grows. Do not implement a test that isn't in
this table — add it here first so the other team can track it. Rows marked
**P0** above (VIS-001/002, UTIL-001, AVAIL-001, E2E-003) are new since the
system's actual visibility/utilization requirements were described — treat
them as the priority backlog, not the original generic AUTH/DASH rows._
