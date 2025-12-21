import settlementManager from '../modules/settlements.js';
import tripManager from '../modules/trips.js';
import travelerManager from '../modules/travelers.js';
import UIComponents from './components.js';
import { formatCurrency } from '../data/helpers.js';

class SettlementsUI {
    constructor(appInstance) {
        this.app = appInstance;
    }

    // Render settlements view
    renderSettlements(tripId = null) {
        const container = document.getElementById('settlementsView');
        if (!container) return;

        if (!tripId) {
            tripId = document.getElementById('settlementsTripFilter')?.value;
            if (!tripId) {
                container.innerHTML = UIComponents.createEmptyState(
                    'Selecione uma viagem para ver os acertos',
                    'fa-calculator'
                );
                return;
            }
        }

        const summary = settlementManager.getSettlementSummary(tripId);
        if (!summary) {
            this.renderNoSettlements(tripId);
            return;
        }

        container.innerHTML = this.createSettlementsHTML(summary);
        this.bindSettlementEvents(tripId);
    }

    // Render when no settlements exist
    renderNoSettlements(tripId) {
        const container = document.getElementById('settlementsView');
        container.innerHTML = UIComponents.createEmptyState(
            'Nenhum acerto calculado para esta viagem',
            'fa-calculator',
            { id: 'calculateSettlements', text: 'Calcular Acertos', icon: 'fa-calculator' }
        );
        
        document.getElementById('calculateSettlements')?.addEventListener('click', () => {
            this.calculateSettlements(tripId);
        });
    }

    // Create settlements HTML
    createSettlementsHTML(summary) {
        let html = `
            <div class="settlement-summary">
                <h3>Resumo de Acertos</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Total a acertar:</span>
                        <span class="stat-value">${formatCurrency(summary.totalToSettle, summary.balances.currency)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Já acertado:</span>
                        <span class="stat-value">${formatCurrency(summary.settledAmount, summary.balances.currency)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Pendente:</span>
                        <span class="stat-value">${formatCurrency(summary.pendingAmount, summary.balances.currency)}</span>
                    </div>
                </div>
                
                <div class="settlement-actions mb-3">
                    <button class="btn btn-primary" id="recalculateSettlements">
                        <i class="fas fa-redo"></i> Recalcular Acertos
                    </button>
                    <button class="btn btn-success" id="markAllAsPaid">
                        <i class="fas fa-check-double"></i> Marcar Todos como Pagos
                    </button>
                </div>
            </div>
            
            <div class="balances-section mb-3">
                <h4>Saldos Individuais</h4>
                <div class="balances-grid">
        `;

        summary.balances.balances.forEach(balance => {
            html += UIComponents.createBalanceCard(balance, summary.balances.currency);
        });

        html += `
                </div>
            </div>
            
            <div class="settlements-section">
                <h4>Transferências Recomendadas</h4>
                <div class="settlements-list">
        `;

        const travelers = travelerManager.getAllTravelers();
        summary.settlements.forEach(settlement => {
            html += UIComponents.createSettlementItem(settlement, travelers);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Bind settlement events
    bindSettlementEvents(tripId) {
        // Recalculate settlements
        const recalcBtn = document.getElementById('recalculateSettlements');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', () => {
                this.calculateSettlements(tripId);
            });
        }

        // Mark all as paid
        const markAllBtn = document.getElementById('markAllAsPaid');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => {
                this.markAllSettlementsAsPaid(tripId);
            });
        }

        // Individual settlement actions
        this.bindIndividualSettlementEvents();
    }

    // Bind individual settlement events
    bindIndividualSettlementEvents() {
        // Mark as paid/unpaid
        document.querySelectorAll('[data-action="mark-paid"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.settlement-item');
                const settlementId = item.dataset.id;
                this.toggleSettlementPayment(settlementId, true);
            });
        });

        document.querySelectorAll('[data-action="mark-unpaid"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.settlement-item');
                const settlementId = item.dataset.id;
                this.toggleSettlementPayment(settlementId, false);
            });
        });

        // View settlement details
        document.querySelectorAll('[data-action="view-settlement"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.settlement-item');
                const settlementId = item.dataset.id;
                this.viewSettlementDetails(settlementId);
            });
        });
    }

    // Calculate settlements for a trip
    calculateSettlements(tripId) {
        try {
            const settlements = settlementManager.generateSettlements(tripId);
            settlementManager.saveSettlements(tripId, settlements);
            this.renderSettlements(tripId);
            this.app.showNotification('Acertos calculados com sucesso!', 'success');
        } catch (error) {
            this.app.showNotification(`Erro ao calcular acertos: ${error.message}`, 'error');
        }
    }

    // Toggle settlement payment status
    toggleSettlementPayment(settlementId, isPaid) {
        try {
            if (isPaid) {
                settlementManager.markSettlementAsPaid(settlementId);
            } else {
                settlementManager.markSettlementAsUnpaid(settlementId);
            }
            
            const tripId = document.getElementById('settlementsTripFilter')?.value;
            this.renderSettlements(tripId);
            this.app.showNotification(`Acerto ${isPaid ? 'marcado como pago' : 'marcado como pendente'}!`, 'success');
        } catch (error) {
            this.app.showNotification(`Erro ao atualizar acerto: ${error.message}`, 'error');
        }
    }

    // Mark all settlements as paid
    markAllSettlementsAsPaid(tripId) {
        UIComponents.createConfirmationDialog(
            'Marcar todos os acertos como pagos?',
            () => {
                try {
                    const settlements = settlementManager.getSettlementsByTrip(tripId);
                    settlements.forEach(settlement => {
                        if (!settlement.isPaid) {
                            settlementManager.markSettlementAsPaid(settlement.id);
                        }
                    });
                    this.renderSettlements(tripId);
                    this.app.showNotification('Todos os acertos marcados como pagos!', 'success');
                } catch (error) {
                    this.app.showNotification(`Erro ao marcar acertos: ${error.message}`, 'error');
                }
            }
        );
    }

    // View settlement details
    viewSettlementDetails(settlementId) {
        const settlement = settlementManager.getSettlementById(settlementId);
        if (!settlement) return;

        const fromTraveler = travelerManager.getTraveler(settlement.fromTravelerId);
        const toTraveler = travelerManager.getTraveler(settlement.toTravelerId);
        const trip = tripManager.getTrip(settlement.tripId);

        if (!fromTraveler || !toTraveler || !trip) return;

        const modalHTML = `
            <div id="settlementDetailModal" class="modal">
                <div class="modal-header">
                    <h3>Detalhes do Acerto</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settlement-detail">
                        <div class="settlement-flow">
                            <div class="traveler-detail">
                                ${UIComponents.createTravelerAvatar(fromTraveler, 'large')}
                                <div class="traveler-info">
                                    <h4>${fromTraveler.name}</h4>
                                    <p>${fromTraveler.email || ''}</p>
                                </div>
                            </div>
                            
                            <div class="settlement-arrow-large">
                                <i class="fas fa-arrow-right"></i>
                                <div class="settlement-amount-large">
                                    ${formatCurrency(settlement.amount, settlement.currency)}
                                </div>
                            </div>
                            
                            <div class="traveler-detail">
                                ${UIComponents.createTravelerAvatar(toTraveler, 'large')}
                                <div class="traveler-info">
                                    <h4>${toTraveler.name}</h4>
                                    <p>${toTraveler.email || ''}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settlement-info-details">
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value">
                                    ${settlement.isPaid ? 
                                        `<span class="text-success"><i class="fas fa-check-circle"></i> Pago</span>` : 
                                        `<span class="text-danger"><i class="fas fa-clock"></i> Pendente</span>`
                                    }
                                </span>
                            </div>
                            ${settlement.isPaid ? `
                                <div class="info-row">
                                    <span class="info-label">Pago em:</span>
                                    <span class="info-value">${formatDate(settlement.paidAt)}</span>
                                </div>
                            ` : ''}
                            <div class="info-row">
                                <span class="info-label">Criado em:</span>
                                <span class="info-value">${formatDate(settlement.createdAt)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Viagem:</span>
                                <span class="info-value">${trip.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Fechar</button>
                    <button type="button" class="btn ${settlement.isPaid ? 'btn-secondary' : 'btn-success'}" 
                            id="togglePaymentBtn">
                        ${settlement.isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
                    </button>
                </div>
            </div>
        `;

        // Create modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.querySelector('.app-container').appendChild(modalContainer.firstElementChild);

        const modal = document.getElementById('settlementDetailModal');
        this.app.showModal(modal);

        // Bind toggle payment button
        const toggleBtn = document.getElementById('togglePaymentBtn');
        toggleBtn.addEventListener('click', () => {
            this.toggleSettlementPayment(settlementId, !settlement.isPaid);
            this.app.hideAllModals();
        });

        // Bind close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.app.hideAllModals();
        });
    }

    // Get balances for a trip
    getBalances(tripId) {
        return settlementManager.calculateBalances(tripId);
    }

    // Update trip filter
    updateTripFilter() {
        const filter = document.getElementById('settlementsTripFilter');
        if (filter) {
            filter.addEventListener('change', (e) => {
                this.renderSettlements(e.target.value);
            });
        }
    }

    // Render summary view
    renderSummary(tripId = null) {
        const container = document.getElementById('summaryView');
        if (!container) return;

        if (!tripId) {
            tripId = document.getElementById('summaryTripFilter')?.value;
            if (!tripId) {
                container.innerHTML = UIComponents.createEmptyState(
                    'Selecione uma viagem para ver o resumo',
                    'fa-chart-pie'
                );
                return;
            }
        }

        const trip = tripManager.getTrip(tripId);
        const expenseStats = this.app.expensesUI?.getExpenseStats(tripId);
        const balances = this.getBalances(tripId);

        if (!expenseStats || !balances) {
            container.innerHTML = UIComponents.createEmptyState(
                'Nenhum dado disponível para esta viagem',
                'fa-chart-pie'
            );
            return;
        }

        let html = UIComponents.createFinancialSummary(expenseStats, trip.currency);
        
        // Add category breakdown
        html += UIComponents.createCategoryBreakdown(
            expenseStats.byCategory, 
            expenseStats.totalAmount, 
            trip.currency
        );

        // Add payer breakdown if there are multiple payers
        if (Object.keys(expenseStats.byPayer).length > 1) {
            const travelers = travelerManager.getAllTravelers();
            html += UIComponents.createPayerBreakdown(
                expenseStats.byPayer,
                travelers,
                expenseStats.totalAmount,
                trip.currency
            );
        }

        container.innerHTML = html;
    }
}

// Helper function
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Add CSS for settlements
const settlementsStyles = `
    .settlement-summary {
        background: white;
        padding: 1.5rem;
        border-radius: var(--border-radius);
        margin-bottom: 2rem;
        box-shadow: var(--box-shadow);
    }
    
    .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: var(--gray-color);
    }
    
    .stat-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--dark-color);
    }
    
    .settlement-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .balances-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .settlement-detail {
        padding: 1rem;
    }
    
    .settlement-flow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
        padding: 1rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: var(--border-radius);
    }
    
    .traveler-detail {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
    }
    
    .settlement-arrow-large {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .settlement-arrow-large i {
        font-size: 1.5rem;
        color: var(--primary-color);
    }
    
    .settlement-amount-large {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--danger-color);
    }
    
    .traveler-info {
        text-align: center;
    }
    
    .traveler-info h4 {
        margin: 0;
        font-size: 1.1rem;
    }
    
    .traveler-info p {
        margin: 0;
        color: var(--gray-color);
        font-size: 0.9rem;
    }
    
    .settlement-info-details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .info-row:last-child {
        border-bottom: none;
    }
    
    .info-label {
        font-weight: 500;
        color: var(--gray-color);
    }
    
    .info-value {
        color: var(--dark-color);
    }
    
    .split-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: var(--light-gray);
        border-radius: 3px;
        font-size: 0.7rem;
        margin-left: 0.5rem;
        color: var(--gray-color);
    }
    
    .expense-description {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .expense-amount {
        font-weight: 600;
        color: var(--dark-color);
    }
    
    .action-buttons {
        display: flex;
        gap: 0.25rem;
    }
    
    @media (max-width: 768px) {
        .balances-grid {
            grid-template-columns: 1fr;
        }
        
        .summary-stats {
            grid-template-columns: 1fr;
        }
        
        .settlement-flow {
            flex-direction: column;
            gap: 1rem;
        }
        
        .settlement-arrow-large {
            transform: rotate(90deg);
        }
    }
`;

// Add styles to document
const settlementsStyleSheet = document.createElement('style');
settlementsStyleSheet.textContent = settlementsStyles;
document.head.appendChild(settlementsStyleSheet);

export default SettlementsUI;