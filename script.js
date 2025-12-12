// --- Global Data Structures ---
let transactions = [];
let budgetGoals = [];
let categoryPieChart = null; 
let monthlyLineChart = null; 

// --- CURRENCY VARIABLES ---
let exchangeRates = { 'USD': 1 }; 
let currentCurrency = 'USD';
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'; 

// --- FILTER VARIABLE ---
let currentFilterDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); 

const CATEGORIES = [
    'Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Other'
];

/**
 * --- Local Storage Management ---
 */
function saveTransactions() {
    localStorage.setItem('budgetTransactions', JSON.stringify(transactions));
}

function loadTransactions() {
    const storedTransactions = localStorage.getItem('budgetTransactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
        transactions.forEach(t => {
            if (!t.timestamp) {
                t.timestamp = t.id; 
            }
        });
    }
}
function saveGoals() { localStorage.setItem('budgetGoals', JSON.stringify(budgetGoals)); }
function loadGoals() { 
    const storedGoals = localStorage.getItem('budgetGoals');
    if (storedGoals) { budgetGoals = JSON.parse(storedGoals); }
}

/**
 * --- Currency Conversion Logic ---
 */
async function fetchExchangeRates() {
    try {
        const response = await fetch(EXCHANGE_RATE_API_URL);
        const data = await response.json();
        
        if (data && data.rates) {
            exchangeRates = data.rates;
        } else {
            console.error("Failed to load exchange rates from API.");
        }
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}

function formatCurrency(amount) {
    const rate = exchangeRates[currentCurrency] || 1; 
    const convertedAmount = amount * rate;
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentCurrency
    }).format(convertedAmount);
}

/**
 * --- Data Filtering Helpers ---
 */
function isTransactionInSelectedMonth(transaction) {
    const transactionDate = new Date(transaction.timestamp);
    const filterYear = currentFilterDate.getFullYear();
    const filterMonth = currentFilterDate.getMonth();
    
    return transactionDate.getFullYear() === filterYear && 
           transactionDate.getMonth() === filterMonth;
}

function calculateSpendingByCategory() {
    return transactions
        .filter(t => t.type === 'expense' && isTransactionInSelectedMonth(t))
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
}

/**
 * --- UI Helpers (Category and Month Population) ---
 */
function populateCategories() {
    // Populates category dropdowns on both pages
    const selectIds = ['category', 'edit-category', 'goal-category'];
    selectIds.forEach(id => {
        const selectElement = document.getElementById(id);
        if (selectElement) {
            selectElement.innerHTML = CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    });
}

function populateMonthSelector() {
    // Populates month selectors for both index.html and transactions.html
    const selectorIds = ['month-selector', 'month-selector-transactions'];
    
    selectorIds.forEach(id => {
        const selector = document.getElementById(id);
        if (!selector) return;

        selector.innerHTML = '';
        const today = new Date();

        for (let i = 0; i < 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const value = date.toISOString(); 
            
            const option = document.createElement('option');
            option.value = value;
            option.textContent = monthYear;
            
            if (date.getMonth() === currentFilterDate.getMonth() && date.getFullYear() === currentFilterDate.getFullYear()) {
                 option.selected = true;
            }

            selector.appendChild(option);
        }
    });
}


/**
 * --- Core Rendering Logic ---
 */
function updateSummary() {
    const filteredTransactions = transactions.filter(isTransactionInSelectedMonth);
    
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpenses;

    document.getElementById('current-balance').textContent = formatCurrency(currentBalance);
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);

    const balanceEl = document.getElementById('current-balance');
    balanceEl.classList.remove('text-danger-balance', 'text-success-balance');
    if (currentBalance < 0) {
        balanceEl.classList.add('text-danger-balance');
    } else {
        balanceEl.classList.add('text-success-balance');
    }
}

function renderTransactions() {
    const list = document.getElementById('transaction-list');
    if (!list) return;

    list.innerHTML = ''; 

    const filteredTransactions = transactions.filter(isTransactionInSelectedMonth);

    filteredTransactions.sort((a, b) => b.timestamp - a.timestamp).forEach(t => { 
        const item = document.createElement('li');
        item.classList.add('transaction-item', 'list-group-item');

        const amountClass = t.type === 'income' ? 'income-amount' : 'expense-amount';
        const sign = t.type === 'income' ? '+' : '-';

        item.innerHTML = `
            <div>
                <strong>${t.description}</strong>
                <span class="badge bg-secondary ms-2">${t.category}</span>
            </div>
            <div class="${amountClass}">
                ${sign}${formatCurrency(t.amount)}
                <button class="btn btn-sm btn-info ms-2 edit-btn" data-id="${t.id}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
                <button class="btn btn-sm btn-danger ms-2 delete-btn" data-id="${t.id}">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });

    attachDeleteListeners();
    attachEditListeners();
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    if (!list) return;

    list.innerHTML = '';
    
    const spendingByCategory = calculateSpendingByCategory(); 

    budgetGoals.forEach(goal => {
        const spent = spendingByCategory[goal.category] || 0;
        const remaining = goal.limit - spent;
        const percentage = (spent / goal.limit) * 100;
        
        let progressClass = 'bg-success';
        if (percentage >= 100) {
            progressClass = 'bg-danger';
        } else if (percentage >= 75) {
            progressClass = 'bg-warning';
        }
        
        const item = document.createElement('div');
        item.classList.add('list-group-item', 'p-3', 'card-attractive', 'mb-2');
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="fw-bold">${goal.category}</span>
                <span class="text-muted">${formatCurrency(spent)} / ${formatCurrency(goal.limit)}</span>
            </div>
            <div class="progress mt-1 mb-2" style="height: 8px;">
                <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${Math.min(percentage, 100)}%" aria-valuenow="${spent}" aria-valuemin="0" aria-valuemax="${goal.limit}"></div>
            </div>
            <small class="text-muted d-flex justify-content-between">
                <span>Remaining: ${formatCurrency(remaining)}</span>
                <span class="${percentage >= 100 ? 'text-danger fw-bold' : ''}">
                    ${percentage.toFixed(0)}% Used
                </span>
            </small>
        `;
        list.appendChild(item);
    });
    
    if (budgetGoals.length === 0) {
        list.innerHTML = '<p class="text-center text-muted mt-3">No goals set for this period.</p>';
    }
}


/**
 * --- Chart.js Integrations ---
 */
function aggregateDataForPieChart() {
    const expenseData = calculateSpendingByCategory(); 
    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);
    
    const colors = labels.map((_, index) => 
        `hsl(${(index * 360 / labels.length)}, 70%, 50%)`
    );
    return { labels, data, colors };
}

function renderPieChart() {
    const chartData = aggregateDataForPieChart();
    const ctx = document.getElementById('category-pie-chart');
    if (!ctx) return;

    if (categoryPieChart) {
        categoryPieChart.destroy();
    }
    
    if (chartData.labels.length > 0) {
        categoryPieChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: chartData.data,
                    backgroundColor: chartData.colors,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: false }
                }
            }
        });
    } else {
        const parent = ctx.parentElement;
        parent.innerHTML = '<p class="text-center text-muted mt-5">Add expenses to see the breakdown for this period.</p>';
    }
} 

function aggregateDataForLineChart() {
    const monthlyExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const date = new Date(t.timestamp); 
            const monthYear = `${date.getFullYear()}-${date.getMonth()}`; 
            acc[monthYear] = (acc[monthYear] || 0) + t.amount;
            return acc;
        }, {});
    
    const labels = [];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthYearKey = `${d.getFullYear()}-${d.getMonth()}`;
        
        labels.push(monthName);
        data.push(monthlyExpenses[monthYearKey] || 0); 
    }
    return { labels, data };
}

function renderLineChart() {
    const chartData = aggregateDataForLineChart();
    const ctx = document.getElementById('monthly-line-chart');
    if (!ctx) return;

    // FIX: Destroy and re-create if it exists
    if (monthlyLineChart) {
        monthlyLineChart.destroy();
    }
    
    if (chartData.data.some(d => d > 0)) {
        monthlyLineChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Total Expenses (Base USD)',
                    data: chartData.data,
                    borderColor: '#343a40',
                    backgroundColor: 'rgba(52, 58, 64, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } else {
        // Re-insert canvas container if it was removed
        const parent = ctx.parentElement;
        if (parent.querySelector('canvas') === null) {
             parent.innerHTML = '<canvas id="monthly-line-chart"></canvas>';
        }
        parent.querySelector('canvas').parentElement.innerHTML = '<p class="text-center text-muted mt-5">No historical expense data to show trend.</p>';
    }
}

// --- CRUD & Goal Handlers (Simplified for inclusion, full logic maintained) ---
function handleGoalSubmit(e) { /* ... (Goal saving logic) ... */ e.preventDefault();
    const form = e.target;
    const category = form['goal-category'].value;
    const amount = parseFloat(form['goal-amount'].value);

    const existingGoalIndex = budgetGoals.findIndex(g => g.category === category);
    const newGoal = { category: category, limit: amount };

    if (existingGoalIndex > -1) { budgetGoals[existingGoalIndex] = newGoal; } 
    else { budgetGoals.push(newGoal); }
    saveGoals();
    renderGoals();
    form.reset();
}

function handleTransactionFormSubmit(e) { /* ... (Transaction creation logic) ... */ e.preventDefault();
    const form = e.target;
    const timestamp = Date.now();
    const newTransaction = {
        id: timestamp, timestamp: timestamp, type: form.type.value,
        description: form.description.value, amount: parseFloat(form.amount.value),
        category: form.category.value,
    };
    transactions.push(newTransaction);
    saveTransactions();
    form.reset(); 
    initApp(); 
    alert(`${newTransaction.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
}

function deleteTransaction(id) { /* ... (Delete logic) ... */
    const transactionId = parseInt(id);
    transactions = transactions.filter(t => t.id !== transactionId);
    saveTransactions();
    initApp(); 
}

function attachDeleteListeners() { /* ... (Attach delete event) ... */
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this transaction?')) {
                deleteTransaction(id);
            }
        });
    });
}
function attachEditListeners() { /* ... (Attach edit event) ... */
     document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const transactionToEdit = transactions.find(t => t.id === id);

            if (transactionToEdit) {
                document.getElementById('edit-id').value = transactionToEdit.id;
                document.getElementById('edit-type').value = transactionToEdit.type;
                document.getElementById('edit-description').value = transactionToEdit.description;
                document.getElementById('edit-amount').value = transactionToEdit.amount;
                document.getElementById('edit-category').value = transactionToEdit.category;
            }
        });
    });
}
function handleEditFormSubmit(e) { /* ... (Edit submit logic) ... */ e.preventDefault();
    const editedId = parseInt(document.getElementById('edit-id').value);
    const index = transactions.findIndex(t => t.id === editedId);

    if (index !== -1) {
        const existingTimestamp = transactions[index].timestamp;
        transactions[index] = {
            id: editedId, timestamp: existingTimestamp,
            type: document.getElementById('edit-type').value,
            description: document.getElementById('edit-description').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            category: document.getElementById('edit-category').value,
        };
        saveTransactions();
        initApp(); 
        const modalElement = document.getElementById('editModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) { modalInstance.hide(); }
        alert('Transaction updated successfully!');
    }
}


/**
 * --- Event Listener Attachments ---
 */
function attachMonthListener() {
    const selectorIds = ['month-selector', 'month-selector-transactions'];

    selectorIds.forEach(id => {
        const selector = document.getElementById(id);
        if (selector) {
            selector.addEventListener('change', (e) => {
                currentFilterDate = new Date(e.target.value);
                
                // Synchronize selectors
                selectorIds.forEach(otherId => {
                    const otherSelector = document.getElementById(otherId);
                    if (otherSelector) otherSelector.value = e.target.value;
                });
                
                // Re-render based on the current page
                if (document.getElementById('current-balance')) { updateDashboard(); }
                if (document.getElementById('transaction-list')) { renderTransactions(); }
            });
        }
    });
}

function attachCurrencyListener() {
    const selector = document.getElementById('currency-selector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            currentCurrency = e.target.value;
            updateDashboard(); 
            if (document.getElementById('transaction-list')) { renderTransactions(); }
        });
    }
}

// Reruns all dashboard components
function updateDashboard() {
    updateSummary();
    renderPieChart();
    renderGoals();
    renderLineChart(); // Ensures Line Chart is called
}


/**
 * --- Initialization (FIXED) ---
 */
async function initApp() {
    loadTransactions(); 
    loadGoals();
    
    await fetchExchangeRates(); 

    // FIX: These UI population functions MUST run on BOTH pages regardless of page ID check.
    populateCategories(); 
    populateMonthSelector(); 
    
    // Page-specific rendering
    if (document.getElementById('current-balance')) {
        updateDashboard();
    }
    
    if (document.getElementById('transaction-list')) {
        renderTransactions();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Attach form listeners
    if (document.getElementById('edit-transaction-form')) {
        document.getElementById('edit-transaction-form').addEventListener('submit', handleEditFormSubmit);
    }
    if (document.getElementById('transaction-form')) {
        document.getElementById('transaction-form').addEventListener('submit', handleTransactionFormSubmit);
    }
    if (document.getElementById('goal-form')) {
        document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);
    }

    attachCurrencyListener(); 
    attachMonthListener(); 
    
    initApp();
});