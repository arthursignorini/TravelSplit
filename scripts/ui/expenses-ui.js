import expenseManager from '../modules/expenses.js';
import tripManager from '../modules/trips.js';
import travelerManager from '../modules/travelers.js';
import UIComponents from './components.js';
import { formatCurrency, formatDate } from '../data/helpers.js';

class ExpensesUI {
    constructor(appInstance) {
        this.app = appInstance;
        this.currentTripFilter = '';
    }

    // Render the expenses list
    renderExpensesList() {
        const container = document.getElementById('expensesList');
        if (!container) return;

        const tripFilter = document.getElementById('tripFilter');
        this.currentTripFilter = tripFilter ? tripFilter.value : '';
        
        const expenses = this.currentTripFilter 
            ? expenseManager.getExpensesByTrip(this.currentTripFilter)
            : expenseManager.getAllExpenses();

        const travelers = travelerManager.getAllTravelers();
        const trips = tripManager.getAllTrips();

        if (expenses.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                this.currentTripFilter ? 'Nenhum gasto nesta viagem' : 'Nenhum gasto registrado',
                'fa-receipt',
                { id: 'createExpenseBtn', text: 'Adicionar Gasto', icon: 'fa-plus' }
            );
            this.bindCreateExpenseButton();
            return;
        }

        // Sort by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Viagem</th>
                            <th>Pagador</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Categoria</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        expenses.forEach(expense => {
            html += this.createExpenseRow(expense, travelers, trips);
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

        this.bindExpenseRowEvents();
        this.bindCreateExpenseButton();
    }

    // Create expense table row
    createExpenseRow(expense, travelers, trips) {
        const trip = trips.find(t => t.id === expense.tripId);
        const payer = travelers.find(t => t.id === expense.paidBy);
        const formattedAmount = formatCurrency(expense.amount, trip?.currency || 'BRL');
        const formattedDate = formatDate(expense.date);
        const categoryName = getCategoryName(expense.category);
        const categoryIcon = getCategoryIcon(expense.category);

        return `
            <tr data-id="${expense.id}">
                <td>
                    <div class="expense-description">
                        <strong>${expense.description}</strong>
                        ${expense.splitType === 'equal' ? '<span class="split-badge">Igual</span>' : 
                          expense.splitType === 'percentage' ? '<span class="split-badge">%</span>' : 
                          '<span class="split-badge">Fixo</span>'}
                    </div>
                </td>
                <td>${trip ? trip.name : 'Viagem desconhecida'}</td>
                <td>
                    <div class="traveler-with-avatar">
                        ${UIComponents.createTravelerAvatar(payer || { name: '??', color: '#999' }, 'small')}
                        <span>${payer ? payer.name : 'Desconhecido'}</span>
                    </div>
                </td>
                <td class="expense-amount">${formattedAmount}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="category-badge">
                        <i class="fas ${categoryIcon}"></i>
                        ${categoryName}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" data-action="edit-expense" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" data-action="delete-expense" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Bind events to expense rows
    bindExpenseRowEvents() {
        document.querySelectorAll('[data-action="edit-expense"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const expenseId = row.dataset.id;
                this.showExpenseModal(expenseId);
            });
        });

        document.querySelectorAll('[data-action="delete-expense"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                const expenseId = row.dataset.id;
                this.deleteExpense(expenseId);
            });
        });
    }

    // Bind create expense button
    bindCreateExpenseButton() {
        const btn = document.getElementById('createExpenseBtn');
        if (btn) {
            btn.addEventListener('click', () => this.showExpenseModal());
        }
    }

    // Show expense modal
    showExpenseModal(expenseId = null) {
        const expense = expenseId ? expenseManager.getExpense(expenseId) : null;
        this.renderExpenseForm(expense);
    }

    // Render expense form in modal
    renderExpenseForm(expense = null) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('expenseModal');
        if (!modal) {
            modal = this.createExpenseModal();
        }

        const trips = tripManager.getAllTrips();
        const travelers = travelerManager.getAllTravelers();

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = UIComponents.createExpenseForm(expense, trips, travelers);

        // Set modal title
        const title = modal.querySelector('.modal-header h3');
        title.textContent = expense ? 'Editar Gasto' : 'Novo Gasto';

        // Bind form submission
        const form = modal.querySelector('#expenseForm');
        form.removeEventListener('submit', this.handleExpenseSubmit);
        form.addEventListener('submit', (e) => this.handleExpenseSubmit(e));

        // Bind split type change
        const splitTypeSelect = modal.querySelector('#expenseSplitType');
        splitTypeSelect.addEventListener('change', (e) => this.handleSplitTypeChange(e));

        // Pre-select participants if editing
        if (expense) {
            const splits = expenseManager.getExpenseSplits(expense.id);
            splits.forEach(split => {
                const checkbox = modal.querySelector(`input[value="${split.travelerId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.toggleParticipantShare(checkbox, true);
                    
                    // Set share value based on split type
                    const shareInput = modal.querySelector(`[data-traveler-id="${split.travelerId}"] .share-input`);
                    if (shareInput) {
                        if (expense.splitType === 'percentage') {
                            shareInput.value = split.share; // percentage
                        } else if (expense.splitType === 'fixed') {
                            shareInput.value = split.actualAmount; // fixed amount
                        }
                    }
                }
            });
        } else {
            // For new expenses, pre-select current trip if any
            if (this.app.currentTripId) {
                const tripSelect = modal.querySelector('#expenseTrip');
                if (tripSelect) {
                    tripSelect.value = this.app.currentTripId;
                }
            }
        }

        this.app.showModal(modal);
    }

    // Create expense modal HTML
    createExpenseModal() {
        const modalHTML = `
            <div id="expenseModal" class="modal modal-lg hidden">
                <div class="modal-header">
                    <h3>Novo Gasto</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Form will be inserted here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    <button type="submit" form="expenseForm" class="btn btn-primary">Salvar</button>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.querySelector('.app-container').appendChild(modalContainer.firstElementChild);

        return document.getElementById('expenseModal');
    }

    // Handle expense form submission
    handleExpenseSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Get selected participants
        const participantCheckboxes = form.querySelectorAll('.participant-checkbox:checked');
        const participants = Array.from(participantCheckboxes).map(cb => ({
            travelerId: cb.value,
            share: this.getParticipantShare(cb.value)
        }));

        // Validate at least one participant
        if (participants.length === 0) {
            this.app.showNotification('Selecione pelo menos um participante', 'error');
            return;
        }

        const expenseData = {
            id: formData.get('expenseId') || crypto.randomUUID(),
            tripId: formData.get('expenseTrip'),
            description: formData.get('expenseDescription'),
            amount: parseFloat(formData.get('expenseAmount')),
            date: formData.get('expenseDate'),
            category: formData.get('expenseCategory'),
            paidBy: formData.get('expensePaidBy'),
            splitType: formData.get('expenseSplitType')
        };

        try {
            if (expenseData.id) {
                expenseManager.updateExpense(expenseData.id, expenseData, participants);
            } else {
                expenseManager.createExpense(expenseData, participants);
            }

            this.app.hideAllModals();
            this.renderExpensesList();
            this.app.showNotification('Gasto salvo com sucesso!', 'success');
        } catch (error) {
            this.app.showNotification(`Erro ao salvar gasto: ${error.message}`, 'error');
        }
    }

    // Get participant share value
    getParticipantShare(travelerId) {
        const shareInput = document.querySelector(`[data-traveler-id="${travelerId}"] .share-input`);
        if (!shareInput) return 0;
        
        const value = parseFloat(shareInput.value) || 0;
        const splitType = document.getElementById('expenseSplitType').value;
        
        if (splitType === 'equal') {
            return 100; // Will be divided equally among participants
        }
        
        return value;
    }

    // Handle split type change
    handleSplitTypeChange(e) {
        const splitType = e.target.value;
        const shareInputs = document.querySelectorAll('.participant-share');
        
        shareInputs.forEach(container => {
            const shareInput = container.querySelector('.share-input');
            if (splitType === 'equal') {
                container.classList.add('hidden');
                shareInput.placeholder = '';
            } else if (splitType === 'percentage') {
                container.classList.remove('hidden');
                shareInput.placeholder = '%';
                shareInput.type = 'number';
                shareInput.min = '0';
                shareInput.max = '100';
                shareInput.step = '0.01';
            } else if (splitType === 'fixed') {
                container.classList.remove('hidden');
                shareInput.placeholder = 'Valor';
                shareInput.type = 'number';
                shareInput.min = '0';
                shareInput.step = '0.01';
            }
        });
    }

    // Toggle participant share input
    toggleParticipantShare(checkbox, show) {
        const travelerId = checkbox.value;
        const shareContainer = document.querySelector(`[data-traveler-id="${travelerId}"]`);
        
        if (shareContainer) {
            if (show) {
                shareContainer.classList.remove('hidden');
            } else {
                shareContainer.classList.add('hidden');
            }
        }
    }

    // Delete expense with confirmation
    deleteExpense(expenseId) {
        const expense = expenseManager.getExpense(expenseId);
        if (!expense) return;

        UIComponents.createConfirmationDialog(
            'Tem certeza que deseja excluir este gasto?',
            () => {
                try {
                    expenseManager.deleteExpense(expenseId);
                    this.renderExpensesList();
                    this.app.showNotification('Gasto excluído com sucesso!', 'success');
                } catch (error) {
                    this.app.showNotification(`Erro ao excluir gasto: ${error.message}`, 'error');
                }
            }
        );
    }

    // Filter expenses by trip
    filterExpenses(tripId) {
        this.currentTripFilter = tripId;
        this.renderExpensesList();
    }

    // Get expense statistics for summary
    getExpenseStats(tripId) {
        return expenseManager.getExpenseStats(tripId);
    }
}

// Helper functions
function getCategoryName(categoryId) {
    const categories = {
        'transport': 'Transporte',
        'accommodation': 'Hospedagem',
        'food': 'Alimentação',
        'entertainment': 'Entretenimento',
        'shopping': 'Compras',
        'activities': 'Atividades',
        'groceries': 'Mercado',
        'health': 'Saúde',
        'other': 'Outros'
    };
    return categories[categoryId] || 'Outros';
}

function getCategoryIcon(categoryId) {
    const icons = {
        'transport': 'bus',
        'accommodation': 'hotel',
        'food': 'utensils',
        'entertainment': 'ticket-alt',
        'shopping': 'shopping-bag',
        'activities': 'hiking',
        'groceries': 'shopping-cart',
        'health': 'first-aid',
        'other': 'question-circle'
    };
    return icons[categoryId] || 'question-circle';
}

export default ExpensesUI;