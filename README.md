# 🗓️ Employee Leave Management System

> A professional full-stack Leave Management app built with **Node.js**, **Express**, **Apollo GraphQL**, and **SQLite** — featuring a clean dashboard-style UI and strict business logic.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [GraphQL API](#graphql-api)
- [Business Rules](#business-rules)
- [Sample Data](#sample-data)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

---

## Overview

This system automates the full employee leave lifecycle — from application to manager approval — in a single, easy-to-run Node.js app.

**Key capabilities:**
- ✅ Employees can apply for leave with real-time balance checks
- ✅ Managers get a dedicated portal to approve or reject requests
- ✅ Balances are automatically deducted on approval
- ✅ Overlapping leave requests are blocked at the API level
- ✅ All data is exposed via a clean **GraphQL API** (Apollo Sandbox included)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js | Server-side JS |
| HTTP Server | Express | Routing + static files |
| API | Apollo Server (GraphQL) | Flexible, self-documented API |
| Database | SQLite | Zero-setup, file-based DB |
| Frontend | HTML5 + CSS3 + Vanilla JS | No build step, focus on backend |

---

## Project Structure

```
employee-leave-management-system/
│
├── server.js           # Express + Apollo Server entry point
├── schema.js           # GraphQL type definitions (SDL)
├── resolvers.js        # Business logic for all queries & mutations
├── package.json
│
├── database/
│   └── db.js           # SQLite setup, migrations & seed data
│
├── models/             # Raw SQL helpers (one file per entity)
│   ├── Employee.js
│   ├── LeaveType.js
│   ├── LeaveBalance.js
│   ├── LeaveRequest.js
│   └── Approval.js
│
└── frontend/           # Dashboard UI (no build step)
    ├── index.html
    ├── dashboard.html
    ├── apply-leave.html
    ├── leave-requests.html
    ├── leave-balance.html
    ├── style.css
    └── script.js
```

**Architecture rule:** Models contain only raw SQL. All business logic lives in `resolvers.js`. The frontend only displays — it never validates.

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- No database setup needed — SQLite auto-creates on first run

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/your-username/employee-leave-management-system.git
cd employee-leave-management-system

# 2. Install dependencies
npm install

# 3. Start the server
node server.js

# 4. Open in browser
# App:              http://localhost:4000
# GraphQL Sandbox:  http://localhost:4000/graphql
```

> **Reset data:** Delete `leave.db` from the project root and restart. All sample data will be re-seeded automatically.

---

## GraphQL API

The API lives at `http://localhost:4000/graphql`. Open it in your browser for the interactive Apollo Sandbox.

### Queries

```graphql
employees                         # All employees
employee(id: ID!)                 # Single employee
leaveTypes                        # Leave type catalog
leaveBalances(employeeId: ID!)    # Balances for an employee
leaveRequests                     # All requests with status
pendingRequests                   # PENDING only — for manager portal
```

### Mutations

```graphql
# Apply for leave
applyLeave(
  employeeId: ID!
  leaveTypeId: ID!
  startDate: String!
  endDate: String!
  reason: String
): LeaveRequest

# Approve a request (manager only)
approveLeave(
  leaveRequestId: ID!
  approvedBy: ID!
  comments: String
): Approval

# Reject a request (manager only)
rejectLeave(
  leaveRequestId: ID!
  approvedBy: ID!
  comments: String
): Approval
```

### Example

```graphql
mutation {
  applyLeave(
    employeeId: "2"
    leaveTypeId: "1"
    startDate: "2026-04-10"
    endDate: "2026-04-12"
    reason: "Family function"
  ) {
    id
    status
    startDate
    endDate
  }
}
```

---

## Business Rules

All rules are enforced server-side in `resolvers.js`. The API is safe regardless of the client.

| Rule | Behaviour |
|---|---|
| **Overlap prevention** | Throws error if new dates overlap an existing PENDING or APPROVED request |
| **Balance check** | Throws error if requested days exceed remaining balance |
| **Role-based approval** | Only employees with `role = 'manager'` can approve or reject |
| **Auto balance deduction** | On approval, balance is decremented by the number of days approved |

**Leave status flow:**
```
PENDING  →  APPROVED  (balance deducted)
         →  REJECTED  (no balance change)
```

---

## Sample Data

Seeded automatically on first run — no setup needed.

| ID | Name | Role | Use for |
|---|---|---|---|
| 1 | Alice Manager | manager | Approving / rejecting requests |
| 2 | Bob Employee | employee | Applying for leave |
| 3 | Charlie Dev | employee | Applying for leave |

---

## Screenshots

> _Add screenshots here after running the app locally._

| Dashboard | Apply Leave | Manager Portal |
|---|---|---|
| `dashboard.html` | `apply-leave.html` | `leave-requests.html` |

---

## Contributing

Contributions are welcome! Here's how to get oriented quickly:

1. **New database table?** → Add migration in `database/db.js`
2. **New entity/model?** → Add a file in `models/` with SQL helpers only
3. **New API field?** → Update `schema.js`, then implement in `resolvers.js`
4. **New UI page?** → Add to `frontend/`, link in the sidebar

### Code Conventions
- Use `async/await` throughout — no raw Promise chains
- Model files export plain async functions (no classes)
- Resolver errors must throw descriptive GraphQL errors
- CSS: use variables from `:root` in `style.css`, never hard-coded colours
- Commit format: `feat:`, `fix:`, `docs:`, `refactor:`

---

## Roadmap

- [ ] JWT authentication
- [ ] Email notifications on approval/rejection (Nodemailer)
- [ ] Unit tests for resolvers (Jest)
- [ ] React frontend
- [ ] Docker support
- [ ] PostgreSQL migration for production

---

## License

MIT — feel free to use this project for learning or as a starter template.
