// 1. Import GQL: This is a special tool for building GraphQL APIs.
const { gql } = require('graphql-tag');

// 2. The Schema: This is like the "Table of Contents" for your API.
// It defines what kinds of data the frontend is allowed to ask for.
const typeDefs = gql`
    # Definition of an Employee
    type Employee {
        id: ID!
        name: String!
        email: String!
        department: String
        designation: String
        joining_date: String
        role: String!
        leaveBalances: [LeaveBalance]
        leaveRequests: [LeaveRequest]
    }

    # Definition of a Leave Type (like 'Sick Leave')
    type LeaveType {
        id: ID!
        name: String!
        max_days_per_year: Int!
    }

    # Definition of how many days an employee has left
    type LeaveBalance {
        id: ID!
        employee_id: ID!
        leave_type_id: ID!
        remainingDays: Int!
        leaveType: LeaveType
    }

    # Definition of a single leave application
    type LeaveRequest {
        id: ID!
        employee_id: ID!
        leave_type_id: ID!
        startDate: String!
        endDate: String!
        reason: String
        status: String!
        applied_at: String!
        employee: Employee
        leaveType: LeaveType
        approvedBy: Employee # The Manager who approved it
    }

    # Definition of the manager's decision record
    type Approval {
        id: ID!
        leave_request_id: ID!
        manager_id: ID!
        status: String!
        remarks: String
        approved_at: String!
    }

    # Queries: These are the "Questions" the frontend can ask.
    type Query {
        # "Tell me about employee #2"
        employee(id: ID!): Employee
        # "Give me a list of everyone"
        allEmployees: [Employee]
        # "What requests are waiting for a decision?"
        pendingLeaves: [LeaveRequest]
        # "Show me the full history of all leaves"
        allLeaves: [LeaveRequest]
        # "What types of leave are available?"
        leaveTypes: [LeaveType]
    }

    # Mutations: These are the "Actions" the frontend can perform.
    type Mutation {
        # "Add a new leave application to the database"
        createLeaveRequest(
            employeeId: ID!
            leaveTypeId: ID!
            startDate: String!
            endDate: String!
            reason: String
        ): LeaveRequest

        # "A manager is approving or rejecting a request"
        approveLeave(
            id: ID!,
            status: String!,
            managerId: ID,
            remarks: String
        ): LeaveRequest
    }
`;

// 3. Export: Send this "Table of Contents" to the server.
module.exports = typeDefs;
