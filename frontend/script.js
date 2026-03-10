const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function runGraphQL(query, variables = {}) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
        throw error;
    }
}

// Utility to calculate days between dates
function calculateDays(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Page Specific Initializers
const Pages = {
    dashboard: async () => {
        const query = `
            query {
                allLeaves {
                    startDate
                    endDate
                    reason
                    status
                    employee { name }
                    leaveType { name }
                    approvedBy { name }
                }
            }
        `;
        try {
            const data = await runGraphQL(query);
            const leaves = data.allLeaves;
            const entriesPerPage = 10;
            let currentPage = 1;

            const renderTable = (page) => {
                const start = (page - 1) * entriesPerPage;
                const end = start + entriesPerPage;
                const pageLeaves = leaves.slice(start, end);
                const tableBody = document.getElementById('history-table-body');

                tableBody.innerHTML = pageLeaves.map(lr => `
                    <tr>
                        <td>${lr.employee.name}</td>
                        <td>${lr.leaveType.name}</td>
                        <td>${lr.startDate}</td>
                        <td>${lr.endDate}</td>
                        <td>${calculateDays(lr.startDate, lr.endDate)}</td>
                        <td>${lr.reason || '-'}</td>
                        <td>${lr.approvedBy ? lr.approvedBy.name : '-'}</td>
                        <td><span class="status-badge status-${lr.status}">${lr.status}</span></td>
                    </tr>
                `).join('') || '<tr><td colspan="8">No history found.</td></tr>';

                // Update Info
                const showingTo = Math.min(end, leaves.length);
                const showingFrom = leaves.length === 0 ? 0 : start + 1;
                document.getElementById('pagination-info').textContent = `Showing ${showingFrom} to ${showingTo} of ${leaves.length} entries`;
                renderPagination(page);
            };

            const renderPagination = (page) => {
                const totalPages = Math.ceil(leaves.length / entriesPerPage);
                const container = document.getElementById('pagination-controls');
                if (totalPages <= 1) {
                    container.innerHTML = '';
                    return;
                }

                let html = `<div class="page-nav ${page === 1 ? 'disabled' : ''}" onclick="window.setPage(${page - 1})"><</div>`;

                // Simplified pagination logic: 1, 2, 3 ... Last
                for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                        html += `<div class="page-num ${i === page ? 'active' : ''}" onclick="window.setPage(${i})">${i}</div>`;
                    } else if (i === page - 2 || i === page + 2) {
                        html += `<div class="page-num">...</div>`;
                    }
                }

                html += `<div class="page-nav ${page === totalPages ? 'disabled' : ''}" onclick="window.setPage(${page + 1})">></div>`;
                container.innerHTML = html;
            };

            window.setPage = (page) => {
                const totalPages = Math.ceil(leaves.length / entriesPerPage);
                if (page < 1 || page > totalPages) return;
                currentPage = page;
                renderTable(page);
            };

            // Calculate Cards (Existing logic)
            let total = leaves.length;
            let sick = 0;
            let casual = 0;
            let annual = 0;
            leaves.forEach(lr => {
                const name = lr.leaveType.name.toLowerCase();
                if (name.includes('sick')) sick++;
                if (name.includes('casual')) casual++;
                if (name.includes('annual')) annual++;
            });

            document.getElementById('card-total').textContent = total.toString().padStart(2, '0');
            document.getElementById('card-sick').textContent = sick.toString().padStart(2, '0');
            document.getElementById('card-casual').textContent = casual.toString().padStart(2, '0');
            document.getElementById('card-annual').textContent = annual.toString().padStart(2, '0');

            renderTable(1);

        } catch (err) {
            console.error('Dashboard Load Error:', err);
        }
    },

    applyLeave: async () => {
        const loadBtn = document.getElementById('load-emp-btn');
        const empInput = document.getElementById('employee-id');
        const balanceList = document.getElementById('balance-list');
        const formSection = document.getElementById('form-section');

        loadBtn.addEventListener('click', async () => {
            const id = empInput.value;
            if (!id) return;
            const query = `
                query GetBal($id: ID!) {
                    employee(id: $id) {
                        name
                        leaveBalances {
                            remainingDays
                            leaveType { id name }
                        }
                    }
                }
            `;
            try {
                const data = await runGraphQL(query, { id });
                if (!data.employee) throw new Error('Employee not found');

                // localStorage.setItem('currentEmpId', id); // Removed to keep dashboard Manager-only
                balanceList.innerHTML = data.employee.leaveBalances.map(b => {
                    const name = b.leaveType.name.toLowerCase();
                    let alTypeClass = "";
                    if (name.includes('annual')) alTypeClass = "annual";
                    else if (name.includes('sick')) alTypeClass = "sick";
                    else if (name.includes('casual')) alTypeClass = "casual";

                    return `
                        <div class="al-balance-card ${alTypeClass}">
                            <span class="al-balance-type">${b.leaveType.name}</span>
                            <span class="al-balance-days">${b.remainingDays} <span>days</span></span>
                        </div>
                    `;
                }).join('');

                const typeSelect = document.getElementById('leave-type');
                typeSelect.innerHTML = data.employee.leaveBalances.map(b => `<option value="${b.leaveType.id}">${b.leaveType.name}</option>`).join('');

                document.getElementById('balance-section').classList.remove('al-locked');
                formSection.classList.remove('al-locked');
            } catch (err) {
                alert(err.message);
            }
        });

        document.getElementById('leave-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const variables = {
                empId: empInput.value,
                typeId: document.getElementById('leave-type').value,
                start: document.getElementById('start-date').value,
                end: document.getElementById('end-date').value,
                reason: document.getElementById('reason').value
            };
            const mutation = `
                mutation Create($empId: ID!, $typeId: ID!, $start: String!, $end: String!, $reason: String) {
                    createLeaveRequest(employeeId: $empId, leaveTypeId: $typeId, startDate: $start, endDate: $end, reason: $reason) {
                        id
                        status
                    }
                }
            `;
            try {
                await runGraphQL(mutation, variables);
                document.getElementById('form-message').innerHTML = '<div class="message success">Leave request submitted!</div>';
                e.target.reset();
            } catch (err) {
                document.getElementById('form-message').innerHTML = `<div class="message error">${err.message}</div>`;
            }
        });
    },

    leaveRequests: async () => {
        const query = `
            query {
                pendingLeaves {
                    id
                    startDate
                    endDate
                    reason
                    status
                    employee { 
                        id name 
                        leaveBalances {
                            remainingDays
                            leaveType { name }
                        }
                    }
                    leaveType { name }
                }
            }
        `;
        try {
            const data = await runGraphQL(query);
            const tableBody = document.getElementById('requests-table-body');
            tableBody.innerHTML = data.pendingLeaves.map(lr => {
                const balance = lr.employee.leaveBalances.find(b => b.leaveType.name === lr.leaveType.name);
                return `
                    <tr>
                        <td>${lr.employee.name}</td>
                        <td>${lr.leaveType.name}</td>
                        <td>${lr.startDate}</td>
                        <td>${lr.endDate}</td>
                        <td>${calculateDays(lr.startDate, lr.endDate)}</td>
                        <td>${lr.reason || '-'}</td>
                        <td>${balance ? balance.remainingDays : '0'} days</td>
                        <td>
                            <button class="btn btn-sm btn-approve" onclick="Pages.processLeave(${lr.id}, 'approved')">Approve</button>
                            <button class="btn btn-sm btn-reject" onclick="Pages.processLeave(${lr.id}, 'rejected')">Reject</button>
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="8">No pending requests.</td></tr>';
        } catch (err) {
            console.error(err);
        }
    },

    processLeave: async (id, status) => {
        const managerId = '1'; // Standard manager ID for assignment
        const mutation = `
            mutation Approve($id: ID!, $status: String!, $mid: ID) {
                approveLeave(id: $id, status: $status, managerId: $mid) {
                    id
                    status
                }
            }
        `;
        try {
            await runGraphQL(mutation, { id, status, mid: managerId });
            alert(`Leave ${status}!`);
            Pages.leaveRequests();
        } catch (err) {
            alert(err.message);
        }
    },

    leaveBalance: async () => {
        const query = `
            query {
                allEmployees {
                    name
                    leaveBalances {
                        remainingDays
                        leaveType { name }
                    }
                }
            }
        `;
        try {
            const data = await runGraphQL(query);
            const tableBody = document.getElementById('balance-table-body');
            tableBody.innerHTML = data.allEmployees.map(emp => {
                const balances = emp.leaveBalances;
                const getVal = (name) => (balances.find(b => b.leaveType.name.toLowerCase().includes(name)) || { remainingDays: 0 }).remainingDays;
                return `
                    <tr>
                        <td>${emp.name}</td>
                        <td>${getVal('sick')} days</td>
                        <td>${getVal('casual')} days</td>
                        <td>${getVal('annual')} days</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
        }
    }
};

// Expose Pages globally with aliases for kebab-case
Pages['apply-leave'] = Pages.applyLeave;
Pages['leave-requests'] = Pages.leaveRequests;
Pages['leave-balance'] = Pages.leaveBalance;
window.Pages = Pages;

// Initialize based on body ID
document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.dataset.page;
    if (pageId && Pages[pageId]) {
        Pages[pageId]();
    }
});
