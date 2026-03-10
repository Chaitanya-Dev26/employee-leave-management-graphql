# Employee Leave Management System (Refactored)

A professional full-stack project built with Node.js, Express, Apollo GraphQL, and SQLite, featuring a clean dashboard-style UI.

## Tech Stack
- **Backend:** Node.js, Express, Apollo Server, SQLite
- **Frontend:** HTML5, Vanilla CSS3 (Custom Variables), Vanilla JavaScript (Fetch API)

## Folder Structure
```text
employee-leave-management-system/
│
├── server.js          # Express & Apollo Server setup
├── schema.js          # GraphQL Type Definitions
├── resolvers.js       # GraphQL Resolvers (Business Logic)
├── package.json
│
├── database/
│   └── db.js          # SQLite Connection & Seeding
│
├── models/            # Database Query Helpers
│   ├── Employee.js
│   ├── LeaveType.js
│   ├── LeaveBalance.js
│   ├── LeaveRequest.js
│   └── Approval.js
│
├── frontend/          # Dashboard UI
│   ├── index.html     # Entry (Redirects to Dashboard)
│   ├── dashboard.html # Overview & History
│   ├── apply-leave.html
│   ├── leave-requests.html
│   ├── leave-balance.html
│   ├── style.css
│   └── script.js
│
└── README.md
```

## Features
- **Sidebar Navigation:** Easy access to all modules.
- **Dashboard:** At-a-glance leave balances and full history tracking.
- **Multi-step Application:** Verify employee balance before applying.
- **Manager Approval Portal:** Review pending requests with live balance visibility.
- **Strict Business Logic:** Overlap prevention, role-based approval, and automated balance deduction.

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Access the application at [http://localhost:4000](http://localhost:4000)

## Sample Data
- **Manager:** ID `1` (Alice Manager)
- **Employee:** ID `2` (Bob Employee) or ID `3` (Charlie Dev)
