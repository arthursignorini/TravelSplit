import { formatCurrency, formatDate, getInitials, getCategoryName, getCategoryIcon } from '../data/helpers.js';

// UI Component Factory
class UIComponents {
    // Create a card component
    static createCard({ title, subtitle, content, actions = [], badges = [], color = '', icon = '' }) {
        const card = document.createElement('div');
        card.className = 'card';
        
        if (color) {
            card.style.borderTop = `3px solid ${color}`;
        }

        let html = `
            <div class="card-header">
                <div>
                    ${icon ? `<i class="fas ${icon}"></i> ` : ''}
                    <h3 class="card-title">${title}</h3>
                    ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
                </div>
                <div class="card-badges">
        `;

        badges.forEach(badge => {
            html += `<span class="status-badge status-${badge.type}">${badge.text}</span>`;
        });

        html += `
                </div>
            </div>
            <div class="card-content">${content}</div>
        `;

        if (actions.length > 0) {
            html += `<div class="card-actions">`;
            actions.forEach(action => {
                html += `<button class="btn btn-${action.type} btn-sm" data-action="${action.id}">
                    ${action.icon ? `<i class="fas ${action.icon}"></i> ` : ''}
                    ${action.text}
                </button>`;
            });
            html += `</div>`;
        }

        card.innerHTML = html;
        return card;
    }

    // Create a table row for expense
    static createExpenseRow(expense, travelers, trip) {
        const payer = travelers.find(t => t.id === expense.paidBy);
        const payerName = payer ? payer.name : 'Desconhecido';
        const payerInitials = payer ? getInitials(payer.name) : '??';
        const payerColor = payer ? payer.color : '#999';

        const formattedDate = formatDate(expense.date);
        const formattedAmount = formatCurrency(expense.amount, trip?.currency || 'BRL');
        const categoryName = getCategoryName(expense.category);
        const categoryIcon = getCategoryIcon(expense.category);

        return `
            <tr data-id="${expense.id}">
                <td>
                    <div class="traveler-avatar" style="background-color: ${payerColor}">
                        ${payerInitials}
                    </div>
                    ${payerName}
                </td>
                <td>${expense.description}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="category-badge">
                        <i class="fas ${categoryIcon}"></i>
                        ${categoryName}
                    </span>
                </td>
                <td class="text-right">${formattedAmount}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" data-action="edit-expense">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete-expense">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Create a settlement item
    static createSettlementItem(settlement, travelers) {
        const fromTraveler = travelers.find(t => t.id === settlement.fromTravelerId);
        const toTraveler = travelers.find(t => t.id === settlement.toTravelerId);
        
        const fromName = fromTraveler ? fromTraveler.name : 'Desconhecido';
        const toName = toTraveler ? toTraveler.name : 'Desconhecido';
        const formattedAmount = formatCurrency(settlement.amount, settlement.currency);

        return `
            <div class="settlement-item ${settlement.isPaid ? 'settlement-paid' : ''}" data-id="${settlement.id}">
                <div class="settlement-info">
                    <div class="traveler-avatar" style="background-color: ${fromTraveler?.color || '#999'}">
                        ${fromTraveler ? getInitials(fromTraveler.name) : '??'}
                    </div>
                    <span class="settlement-arrow">→</span>
                    <div class="traveler-avatar" style="background-color: ${toTraveler?.color || '#999'}">
                        ${toTraveler ? getInitials(toTraveler.name) : '??'}
                    </div>
                    <div class="settlement-details">
                        <div class="settlement-text">
                            <strong>${fromName}</strong> deve para <strong>${toName}</strong>
                        </div>
                        <div class="settlement-status">
                            ${settlement.isPaid ? 
                                `<span class="text-success"><i class="fas fa-check-circle"></i> Pago em ${formatDate(settlement.paidAt)}</span>` :
                                `<span class="text-danger"><i class="fas fa-clock"></i> Pendente</span>`
                            }
                        </div>
                    </div>
                </div>
                <div class="settlement-actions">
                    <span class="settlement-amount">${formattedAmount}</span>
                    <button class="btn btn-sm ${settlement.isPaid ? 'btn-secondary' : 'btn-success'}" 
                            data-action="${settlement.isPaid ? 'mark-unpaid' : 'mark-paid'}">
                        <i class="fas fa-${settlement.isPaid ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" data-action="view-settlement">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Create a balance summary card
    static createBalanceCard(balance, currency) {
        const isPositive = balance.balance > 0;
        const isNegative = balance.balance < 0;
        const balanceClass = isPositive ? 'balance-positive' : isNegative ? 'balance-negative' : '';
        
        const formattedPaid = formatCurrency(balance.paid, currency);
        const formattedConsumed = formatCurrency(balance.consumed, currency);
        const formattedBalance = formatCurrency(Math.abs(balance.balance), currency);

        return `
            <div class="card balance-card ${balanceClass}">
                <div class="card-header">
                    <div class="traveler-avatar-large" style="background-color: ${balance.traveler.color}">
                        ${getInitials(balance.traveler.name)}
                    </div>
                    <div>
                        <h4 class="card-title">${balance.traveler.name}</h4>
                        <p class="card-subtitle">${balance.traveler.email || ''}</p>
                    </div>
                </div>
                <div class="card-content">
                    <div class="balance-details">
                        <div class="balance-item">
                            <span class="balance-label">Pagou:</span>
                            <span class="balance-value">${formattedPaid}</span>
                        </div>
                        <div class="balance-item">
                            <span class="balance-label">Consumiu:</span>
                            <span class="balance-value">${formattedConsumed}</span>
                        </div>
                        <div class="balance-item total">
                            <span class="balance-label">${isPositive ? 'A receber:' : isNegative ? 'A pagar:' : 'Equilibrado:'}</span>
                            <span class="balance-value ${isPositive ? 'text-success' : isNegative ? 'text-danger' : ''}">
                                ${isPositive ? '+' : isNegative ? '-' : ''}${formattedBalance}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Create a financial summary
    static createFinancialSummary(stats, currency) {
        const formattedTotal = formatCurrency(stats.totalAmount, currency);
        const formattedAverage = formatCurrency(stats.averagePerExpense, currency);
        const formattedCount = stats.expenseCount;

        return `
            <div class="financial-summary">
                <div class="summary-card total-expenses">
                    <div class="summary-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <h4>Total Gastos</h4>
                    <div class="amount">${formattedTotal}</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h4>Quantidade</h4>
                    <div class="amount">${formattedCount}</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <h4>Média por Gasto</h4>
                    <div class="amount">${formattedAverage}</div>
                </div>
            </div>
        `;
    }

    // Create an empty state
    static createEmptyState(message, icon = 'fa-inbox', action = null) {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <h3>${message}</h3>
                ${action ? `
                    <button class="btn btn-primary" id="${action.id}">
                        <i class="fas ${action.icon}"></i> ${action.text}
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Create a traveler avatar
    static createTravelerAvatar(traveler, size = 'medium') {
        const sizes = {
            small: '30px',
            medium: '40px',
            large: '60px'
        };
        
        const sizePx = sizes[size] || sizes.medium;
        const initials = getInitials(traveler.name);

        return `
            <div class="traveler-avatar" 
                 style="width: ${sizePx}; height: ${sizePx}; background-color: ${traveler.color};"
                 title="${traveler.name}">
                ${initials}
            </div>
        `;
    }

    // Create loading spinner
    static createLoadingSpinner(text = 'Carregando...') {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${text}</p>
            </div>
        `;
    }

    // Create error message
    static createErrorMessage(message, retryAction = null) {
        return `
            <div class="error-message">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Ocorreu um erro</h3>
                <p>${message}</p>
                ${retryAction ? `
                    <button class="btn btn-primary" id="${retryAction.id}">
                        <i class="fas ${retryAction.icon}"></i> ${retryAction.text}
                    </button>
                ` : ''}
            </div>
        `;
    }

    // Create confirmation dialog
    static createConfirmationDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3><i class="fas fa-exclamation-circle"></i> Confirmação</h3>
                <p>${message}</p>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="cancelBtn">Cancelar</button>
                    <button class="btn btn-danger" id="confirmBtn">Confirmar</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        document.getElementById('confirmBtn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
        
        return dialog;
    }

    // Create expense form
    static createExpenseForm(expense = null, trips = [], travelers = []) {
        const isEdit = !!expense;
        
        return `
            <form id="expenseForm">
                <input type="hidden" id="expenseId" value="${expense?.id || ''}">
                
                <div class="form-group">
                    <label for="expenseDescription">Descrição *</label>
                    <input type="text" id="expenseDescription" value="${expense?.description || ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="expenseTrip">Viagem *</label>
                        <select id="expenseTrip" required>
                            <option value="">Selecione uma viagem</option>
                            ${trips.map(trip => `
                                <option value="${trip.id}" ${expense?.tripId === trip.id ? 'selected' : ''}>
                                    ${trip.name} (${trip.destination || 'Sem destino'})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseCategory">Categoria</label>
                        <select id="expenseCategory">
                            <option value="transport" ${expense?.category === 'transport' ? 'selected' : ''}>Transporte</option>
                            <option value="accommodation" ${expense?.category === 'accommodation' ? 'selected' : ''}>Hospedagem</option>
                            <option value="food" ${expense?.category === 'food' ? 'selected' : ''}>Alimentação</option>
                            <option value="entertainment" ${expense?.category === 'entertainment' ? 'selected' : ''}>Entretenimento</option>
                            <option value="shopping" ${expense?.category === 'shopping' ? 'selected' : ''}>Compras</option>
                            <option value="activities" ${expense?.category === 'activities' ? 'selected' : ''}>Atividades</option>
                            <option value="groceries" ${expense?.category === 'groceries' ? 'selected' : ''}>Mercado</option>
                            <option value="health" ${expense?.category === 'health' ? 'selected' : ''}>Saúde</option>
                            <option value="other" ${!expense?.category || expense?.category === 'other' ? 'selected' : ''}>Outros</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="expenseAmount">Valor *</label>
                        <input type="number" id="expenseAmount" step="0.01" min="0.01" 
                               value="${expense?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseDate">Data</label>
                        <input type="date" id="expenseDate" value="${expense?.date || new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="expensePaidBy">Quem pagou? *</label>
                    <select id="expensePaidBy" required>
                        <option value="">Selecione quem pagou</option>
                        ${travelers.map(traveler => `
                            <option value="${traveler.id}" ${expense?.paidBy === traveler.id ? 'selected' : ''}>
                                ${traveler.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="expenseSplitType">Tipo de Divisão *</label>
                    <select id="expenseSplitType">
                        <option value="equal" ${expense?.splitType === 'equal' ? 'selected' : ''}>Igualitária</option>
                        <option value="percentage" ${expense?.splitType === 'percentage' ? 'selected' : ''}>Percentual</option>
                        <option value="fixed" ${expense?.splitType === 'fixed' ? 'selected' : ''}>Valor Fixo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Participantes da divisão:</label>
                    <div id="expenseParticipants" class="participants-list">
                        ${travelers.map(traveler => `
                            <div class="participant-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="participants" value="${traveler.id}" 
                                           class="participant-checkbox" checked>
                                    <span class="checkbox-custom"></span>
                                    <div class="traveler-avatar" style="background-color: ${traveler.color}">
                                        ${getInitials(traveler.name)}
                                    </div>
                                    <span>${traveler.name}</span>
                                </label>
                                <div class="participant-share hidden" data-traveler-id="${traveler.id}">
                                    <input type="number" class="share-input" placeholder="% ou valor" step="0.01">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;
    }

    // Create traveler form
    static createTravelerForm(traveler = null) {
        return `
            <form id="travelerForm">
                <input type="hidden" id="travelerId" value="${traveler?.id || ''}">
                
                <div class="form-group">
                    <label for="travelerName">Nome *</label>
                    <input type="text" id="travelerName" value="${traveler?.name || ''}" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="travelerEmail">Email</label>
                        <input type="email" id="travelerEmail" value="${traveler?.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="travelerPhone">Telefone</label>
                        <input type="tel" id="travelerPhone" value="${traveler?.phone || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="travelerColor">Cor de Identificação</label>
                    <input type="color" id="travelerColor" value="${traveler?.color || '#4361ee'}">
                </div>
            </form>
        `;
    }

    // Create category breakdown
    static createCategoryBreakdown(byCategory, totalAmount, currency) {
        let html = `
            <div class="category-breakdown">
                <h3>Gastos por Categoria</h3>
                <div class="categories-grid">
        `;

        Object.entries(byCategory).forEach(([category, amount]) => {
            const percentage = (amount / totalAmount * 100).toFixed(1);
            const formattedAmount = formatCurrency(amount, currency);
            const categoryName = getCategoryName(category);
            const icon = getCategoryIcon(category);

            html += `
                <div class="category-item">
                    <div class="category-header">
                        <i class="fas fa-${icon}"></i>
                        <span class="category-name">${categoryName}</span>
                        <span class="category-percentage">${percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-amount">${formattedAmount}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Create payer breakdown
    static createPayerBreakdown(byPayer, travelers, totalAmount, currency) {
        let html = `
            <div class="payer-breakdown">
                <h3>Total Pago por Participante</h3>
                <div class="payers-grid">
        `;

        Object.entries(byPayer).forEach(([payerId, amount]) => {
            const traveler = travelers.find(t => t.id === payerId);
            if (!traveler) return;

            const percentage = (amount / totalAmount * 100).toFixed(1);
            const formattedAmount = formatCurrency(amount, currency);
            const avatar = this.createTravelerAvatar(traveler, 'small');

            html += `
                <div class="payer-item">
                    <div class="payer-info">
                        ${avatar}
                        <span class="payer-name">${traveler.name}</span>
                    </div>
                    <div class="payer-amount">${formattedAmount}</div>
                    <div class="payer-percentage">${percentage}%</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Create trip stats overview
    static createTripStatsOverview(trip, stats) {
        const formattedTotal = formatCurrency(stats.totalExpenses, trip.currency);
        const formattedAverage = formatCurrency(stats.averagePerDay || 0, trip.currency);
        const duration = stats.durationDays > 0 ? `${stats.durationDays} dias` : 'Data não definida';

        return `
            <div class="trip-stats-overview">
                <h3>Estatísticas da Viagem</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="stat-value">${formattedTotal}</div>
                        <div class="stat-label">Total Gastos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div class="stat-value">${stats.expenseCount}</div>
                        <div class="stat-label">Quantidade de Gastos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-value">${stats.travelerCount}</div>
                        <div class="stat-label">Participantes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-day"></i>
                        </div>
                        <div class="stat-value">${duration}</div>
                        <div class="stat-label">Duração</div>
                    </div>
                    ${stats.averagePerDay ? `
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="stat-value">${formattedAverage}/dia</div>
                        <div class="stat-label">Média Diária</div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Add CSS for UI components
const componentStyles = `
    .traveler-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: 0.8em;
        flex-shrink: 0;
    }
    
    .traveler-avatar-large {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: 1.2em;
        width: 50px;
        height: 50px;
        flex-shrink: 0;
    }
    
    .traveler-with-avatar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .category-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: var(--light-gray);
        border-radius: var(--border-radius);
        font-size: 0.8rem;
    }
    
    .balance-card .card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .balance-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .balance-item {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
    }
    
    .balance-item.total {
        border-top: 1px solid var(--light-gray);
        padding-top: 0.5rem;
        margin-top: 0.5rem;
        font-weight: bold;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--gray-color);
    }
    
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: var(--light-gray);
    }
    
    .loading-spinner {
        text-align: center;
        padding: 2rem;
    }
    
    .spinner {
        border: 3px solid var(--light-gray);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-message {
        text-align: center;
        padding: 2rem;
        background: #ffebee;
        border-radius: var(--border-radius);
        color: #c62828;
    }
    
    .error-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    
    .confirmation-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: var(--border-radius);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 1002;
        min-width: 300px;
        max-width: 90%;
    }
    
    .dialog-content h3 {
        color: var(--danger-color);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .dialog-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
    }
    
    .participants-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem;
        border: 1px solid var(--light-gray);
        border-radius: var(--border-radius);
    }
    
    .participant-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: var(--border-radius);
        background: white;
        transition: background-color 0.2s;
    }
    
    .participant-item:hover {
        background: var(--light-gray);
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        flex: 1;
    }
    
    .checkbox-custom {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--gray-color);
        border-radius: 3px;
        position: relative;
    }
    
    .participant-checkbox:checked + .checkbox-custom::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: var(--primary-color);
        font-weight: bold;
    }
    
    .participant-share {
        width: 100px;
    }
    
    .share-input {
        width: 100%;
        padding: 0.25rem;
        font-size: 0.9rem;
    }
    
    .category-breakdown {
        margin-top: 2rem;
    }
    
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .category-item {
        background: white;
        padding: 1rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--light-gray);
    }
    
    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .category-name {
        font-weight: 500;
        flex: 1;
        margin: 0 0.5rem;
    }
    
    .category-percentage {
        font-weight: bold;
        color: var(--primary-color);
    }
    
    .progress-bar {
        height: 6px;
        background: var(--light-gray);
        border-radius: 3px;
        overflow: hidden;
        margin: 0.5rem 0;
    }
    
    .progress {
        height: 100%;
        background: var(--primary-color);
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    
    .category-amount {
        text-align: right;
        font-weight: 500;
        color: var(--dark-color);
    }
    
    .payer-breakdown {
        margin-top: 2rem;
    }
    
    .payers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .payer-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: white;
        border-radius: var(--border-radius);
        border: 1px solid var(--light-gray);
    }
    
    .payer-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .payer-name {
        font-weight: 500;
    }
    
    .payer-amount {
        font-weight: 600;
        color: var(--dark-color);
    }
    
    .payer-percentage {
        color: var(--gray-color);
        font-size: 0.9rem;
        margin-left: 0.5rem;
    }
    
    .trip-stats-overview {
        margin-top: 2rem;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .stat-card {
        text-align: center;
        padding: 1.5rem;
        background: white;
        border-radius: var(--border-radius);
        border: 1px solid var(--light-gray);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--box-shadow);
    }
    
    .stat-icon {
        font-size: 2rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.5rem 0;
        color: var(--dark-color);
    }
    
    .stat-label {
        color: var(--gray-color);
        font-size: 0.9rem;
    }
    
    .financial-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .summary-card {
        text-align: center;
        padding: 1.5rem;
        border-radius: var(--border-radius);
        background: white;
        box-shadow: var(--box-shadow);
    }
    
    .summary-card.total-expenses {
        border-top: 3px solid var(--primary-color);
    }
    
    .summary-card .amount {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.5rem 0;
    }
    
    .summary-card.total-expenses .amount {
        color: var(--primary-color);
    }
    
    .balance-positive .balance-item.total .balance-value {
        color: #2e7d32;
    }
    
    .balance-negative .balance-item.total .balance-value {
        color: var(--danger-color);
    }
    
    .settlement-item {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--light-gray);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .settlement-item:last-child {
        border-bottom: none;
    }
    
    .settlement-item.settlement-paid {
        opacity: 0.6;
    }
    
    .settlement-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }
    
    .settlement-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .settlement-text {
        font-size: 0.9rem;
    }
    
    .settlement-status {
        font-size: 0.8rem;
    }
    
    .settlement-arrow {
        color: var(--gray-color);
        font-weight: bold;
    }
    
    .settlement-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .settlement-amount {
        font-weight: 600;
        color: var(--danger-color);
        margin-right: 0.5rem;
    }
    
    .hidden {
        display: none !important;
    }
    
    @media (max-width: 768px) {
        .categories-grid,
        .payers-grid,
        .stats-grid,
        .financial-summary {
            grid-template-columns: 1fr;
        }
        
        .settlement-item {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        
        .settlement-actions {
            justify-content: flex-end;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = componentStyles;
document.head.appendChild(styleSheet);

export default UIComponents;