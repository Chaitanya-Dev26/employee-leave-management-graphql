// 1. The Address: Automatically detects whether we're on localhost or deployed (e.g. Vercel).
const GRAPHQL_URL = `${window.location.origin}/graphql`;

// 2. The Messenger: This function takes a request and sends it to the Backend.
async function runGraphQL(query, variables = {}) {
    try {
        // We use 'fetch' to send a POST message to the server.
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        // If the server says something went wrong, we show the error.
        if (result.errors) throw new Error(result.errors[0].message);
        return result.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
        throw error;
    }
}

// 3. Date Calculator: A small tool to count how many days are between two dates.
function calculateDays(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    const diffTime = Math.abs(e - s);
    // Convert the time difference into days and add 1 (so March 1 to March 1 is 1 day).
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// 4. Page Logic: This object contains the instructions for every page on our site.
const Pages = {

    // Logic for the main Dashboard page.
    dashboard: async () => {
        // Step A: Ask the Butler (Backend) for all leave history.
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
            const entriesPerPage = 10; // We only show 10 rows at a time.
            let currentPage = 1;

            // Function to draw the table rows on the screen.
            const renderTable = (page) => {
                const start = (page - 1) * entriesPerPage;
                const end = start + entriesPerPage;
                const pageLeaves = leaves.slice(start, end);
                const tableBody = document.getElementById('history-table-body');

                // We map each leave record into a row in the HTML table.
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

                // Update the "Showing 1 to 10 of 50" text.
                const showingTo = Math.min(end, leaves.length);
                const showingFrom = leaves.length === 0 ? 0 : start + 1;
                document.getElementById('pagination-info').textContent = `Showing ${showingFrom} to ${showingTo} of ${leaves.length} entries`;
                renderPagination(page);
            };

            // Function to create the "1, 2, 3..." buttons at the bottom.
            const renderPagination = (page) => {
                const totalPages = Math.ceil(leaves.length / entriesPerPage);
                const container = document.getElementById('pagination-controls');
                if (totalPages <= 1) {
                    container.innerHTML = '';
                    return;
                }

                let html = `<div class="page-nav ${page === 1 ? 'disabled' : ''}" onclick="window.setPage(${page - 1})"><</div>`;

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

            // Switch to a different page of data when a button is clicked.
            window.setPage = (page) => {
                const totalPages = Math.ceil(leaves.length / entriesPerPage);
                if (page < 1 || page > totalPages) return;
                currentPage = page;
                renderTable(page);
            };

            // Step B: Update the color-coded Stat Cards at the top.
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

            // Put the numbers into the HTML cards.
            document.getElementById('card-total').textContent = total.toString().padStart(2, '0');
            document.getElementById('card-sick').textContent = sick.toString().padStart(2, '0');
            document.getElementById('card-casual').textContent = casual.toString().padStart(2, '0');
            document.getElementById('card-annual').textContent = annual.toString().padStart(2, '0');

            // Draw the first page of the table.
            renderTable(1);

        } catch (err) {
            console.error('Dashboard Load Error:', err);
        }
    },

    // Logic for the 'Apply Leave' page.
    applyLeave: async () => {
        const loadBtn = document.getElementById('load-emp-btn');
        const empInput = document.getElementById('employee-id');
        const balanceList = document.getElementById('balance-list');
        const formSection = document.getElementById('form-section');

        // When you type an ID and click 'Load Profile'...
        loadBtn.addEventListener('click', async () => {
            const id = empInput.value;
            if (!id) return;

            // Ask the Backend for this specific person's leave allowance.
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
                if (!data.employee) throw new Error('We could not find that employee ID!');

                // Show the colorful balance cards for Sick, Annual, and Casual leave.
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

                // Fill the dropdown menu with the types of leave they can pick.
                const typeSelect = document.getElementById('leave-type');
                typeSelect.innerHTML = data.employee.leaveBalances.map(b => `<option value="${b.leaveType.id}">${b.leaveType.name}</option>`).join('');

                // Unlock the rest of the form so they can type dates.
                document.getElementById('balance-section').classList.remove('al-locked');
                formSection.classList.remove('al-locked');
            } catch (err) {
                alert(err.message);
            }
        });

        // When you click the final "Submit Request" button...
        document.getElementById('leave-form').addEventListener('submit', async (e) => {
            e.preventDefault(); // Don't refresh the page.

            // Gather all the info from the form boxes.
            const variables = {
                empId: empInput.value,
                typeId: document.getElementById('leave-type').value,
                start: document.getElementById('start-date').value,
                end: document.getElementById('end-date').value,
                reason: document.getElementById('reason').value
            };

            // Send the new request to the database.
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
                // Show a green success message.
                document.getElementById('form-message').innerHTML = '<div class="message success">Your leave request has been submitted!</div>';
                e.target.reset(); // Clear the form.
            } catch (err) {
                // Show a red error message if something went wrong.
                document.getElementById('form-message').innerHTML = `<div class="message error">${err.message}</div>`;
            }
        });
    },

    // Logic for the Manager's "Pending Requests" page.
    leaveRequests: async () => {
        // Ask for only the requests that are currently 'pending'.
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

            // Draw each pending request row with "Approve" and "Reject" buttons.
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
                        <td>${balance ? balance.remainingDays : '0'} days left</td>
                        <td>
                            <button class="btn btn-sm btn-approve" onclick="Pages.processLeave(${lr.id}, 'approved')">Approve</button>
                            <button class="btn btn-sm btn-reject" onclick="Pages.processLeave(${lr.id}, 'rejected')">Reject</button>
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="8">No pending requests at the moment.</td></tr>';
        } catch (err) {
            console.error(err);
        }
    },

    // Function called when a Manager clicks Approve or Reject.
    processLeave: async (id, status) => {
        const managerId = '1'; // In this demo, we assume the manager is ID #1.
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
            alert(`The request has been ${status}!`);
            Pages.leaveRequests(); // Refresh the list.
        } catch (err) {
            alert(err.message);
        }
    },

    // Logic for the "Leave Balances" summary page.
    leaveBalance: async () => {
        // Ask for every employee and their remaining days.
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

            // Create a row for every person showing their 3 balances.
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

// 5. Global Setup: We make the 'Pages' details available for the whole browser.
Pages['apply-leave'] = Pages.applyLeave;
Pages['leave-requests'] = Pages.leaveRequests;
Pages['leave-balance'] = Pages.leaveBalance;
window.Pages = Pages;

// 6. Ignition: When the page finishes loading, check which page we are on and start it!
document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.dataset.page;
    if (pageId && Pages[pageId]) {
        Pages[pageId]();
    }
});
