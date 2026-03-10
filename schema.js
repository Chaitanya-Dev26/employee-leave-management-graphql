const { gql } = require('apollo-server-express');

const typeDefs = gql`
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

    type LeaveType {
        id: ID!
        name: String!
        max_days_per_year: Int!
    }

    type LeaveBalance {
        id: ID!
        employee_id: ID!
        leave_type_id: ID!
        remainingDays: Int!
        leaveType: LeaveType
    }

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
        approvedBy: Employee
    }

    type Approval {
        id: ID!
        leave_request_id: ID!
        manager_id: ID!
        status: String!
        remarks: String
        approved_at: String!
    }

    type Query {
        employee(id: ID!): Employee
        allEmployees: [Employee]
        pendingLeaves: [LeaveRequest]
        allLeaves: [LeaveRequest]
        leaveTypes: [LeaveType]
    }

    type Mutation {
        createLeaveRequest(
            employeeId: ID!
            leaveTypeId: ID!
            startDate: String!
            endDate: String!
            reason: String
        ): LeaveRequest

        approveLeave(
            id: ID!,
            status: String!,
            managerId: ID,
            remarks: String
        ): LeaveRequest
    }
`;

module.exports = typeDefs;
