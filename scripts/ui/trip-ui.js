import tripManager from '../modules/trips.js';
import expenseManager from '../modules/expenses.js';
import travelerManager from '../modules/travelers.js';
import UIComponents from './components.js';
import { formatCurrency, formatDate } from '../data/helpers.js';

class TripsUI {
    constructor(appInstance) {
        this.app = appInstance;
    }

    // Render the trips list
    renderTripsList() {
        const container = document.getElementById('tripsList');
        if (!container) return;

        const trips = tripManager.getTripsWithStats();
        
        if (trips.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'Nenhuma viagem cadastrada',
                'fa-suitcase',
                { id: 'createTripBtn', text: 'Criar Primeira Viagem', icon: 'fa-plus' }
            );
            this.bindCreateTripButton();
            return;
        }

        container.innerHTML = '';
        trips.forEach(trip => {
            const card = this.createTripCard(trip);
            container.appendChild(card);
        });

        this.bindTripCardEvents();
    }

    // Create a trip card
    createTripCard(trip) {
        const stats = trip.stats;
        const formattedTotal = formatCurrency(stats?.totalExpenses || 0, trip.currency);
        const formattedDates = trip.startDate && trip.endDate 
            ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
            : 'Datas não definidas';

        const card = UIComponents.createCard({
            title: trip.name,
            subtitle: `${trip.destination || 'Sem destino'} • ${formattedDates}`,
            content: `
                <div class="trip-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${stats?.travelerCount || 0} participantes</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-receipt"></i>
                        <span>${stats?.expenseCount || 0} gastos</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${formattedTotal}</span>
                    </div>
                </div>
            `,
            badges: [
                { type: trip.status, text: this.getStatusText(trip.status) }
            ],
            color: this.getStatusColor(trip.status),
            icon: 'fa-suitcase',
            actions: [
                { id: 'view-trip', text: 'Ver', type: 'primary', icon: 'fa-eye' },
                { id: 'edit-trip', text: 'Editar', type: 'secondary', icon: 'fa-edit' },
                { id: 'delete-trip', text: 'Excluir', type: 'danger', icon: 'fa-trash' }
            ]
        });

        card.dataset.tripId = trip.id;
        return card;
    }

    // Bind events to trip cards
    bindTripCardEvents() {
        document.querySelectorAll('[data-action="view-trip"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const tripId = card.dataset.tripId;
                this.showTripDetails(tripId);
            });
        });

        document.querySelectorAll('[data-action="edit-trip"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const tripId = card.dataset.tripId;
                this.app.showTripModal(tripId);
            });
        });

        document.querySelectorAll('[data-action="delete-trip"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const tripId = card.dataset.tripId;
                this.deleteTrip(tripId);
            });
        });
    }

    // Bind create trip button
    bindCreateTripButton() {
        const btn = document.getElementById('createTripBtn');
        if (btn) {
            btn.addEventListener('click', () => this.app.showTripModal());
        }
    }

    // Show trip details
    showTripDetails(tripId) {
        const trip = tripManager.getTrip(tripId);
        if (!trip) return;

        const container = document.getElementById('tripDetail');
        const tripsList = document.getElementById('tripsList');

        tripsList.classList.add('hidden');
        container.classList.remove('hidden');

        const stats = tripManager.getTripStats(tripId);
        
        container.innerHTML = this.createTripDetailHTML(trip, stats);
        
        this.bindTripDetailEvents(tripId);
        this.loadTripExpenses(tripId);
    }

    // Create trip detail HTML
    createTripDetailHTML(trip, stats) {
        const formattedTotal = formatCurrency(stats?.totalExpenses || 0, trip.currency);
        const formattedAverage = formatCurrency(stats?.averagePerDay || 0, trip.currency);
        const duration = stats?.durationDays > 0 ? `${stats.durationDays} dias` : 'Data não definida';

        return `
            <div class="trip-detail-header">
                <button class="btn btn-secondary" id="backToList">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h2>${trip.name}</h2>
                <div class="trip-actions">
                    <button class="btn btn-primary" data-action="add-expense">
                        <i class="fas fa-plus"></i> Adicionar Gasto
                    </button>
                    <button class="btn btn-secondary" data-action="edit-trip">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
            
            <div class="trip-info">
                <div class="info-row">
                    <span class="info-label">Destino:</span>
                    <span class="info-value">${trip.destination || 'Não informado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Período:</span>
                    <span class="info-value">
                        ${trip.startDate ? formatDate(trip.startDate) : 'Não definido'} 
                        a 
                        ${trip.endDate ? formatDate(trip.endDate) : 'Não definido'}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">
                        <span class="status-badge status-${trip.status}">
                            ${this.getStatusText(trip.status)}
                        </span>
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Moeda:</span>
                    <span class="info-value">${trip.currency}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Descrição:</span>
                    <span class="info-value">${trip.description || 'Sem descrição'}</span>
                </div>
            </div>
            
            ${UIComponents.createTripStatsOverview(trip, stats)}
            
            <div class="trip-expenses">
                <h3>Gastos Recentes</h3>
                <div id="tripExpensesList"></div>
            </div>
        `;
    }

    // Bind trip detail events
    bindTripDetailEvents(tripId) {
        document.getElementById('backToList').addEventListener('click', () => {
            const container = document.getElementById('tripDetail');
            const tripsList = document.getElementById('tripsList');
            
            container.classList.add('hidden');
            tripsList.classList.remove('hidden');
        });

        document.querySelector('[data-action="edit-trip"]').addEventListener('click', () => {
            this.app.showTripModal(tripId);
        });

        document.querySelector('[data-action="add-expense"]').addEventListener('click', () => {
            this.app.currentTripId = tripId;
            this.app.showSection('expenses');
            this.app.showExpenseModal();
        });
    }

    // Load trip expenses
    loadTripExpenses(tripId) {
        const container = document.getElementById('tripExpensesList');
        if (!container) return;

        const expenses = expenseManager.getExpensesByTrip(tripId);
        const travelers = travelerManager.getAllTravelers();
        const trip = tripManager.getTrip(tripId);

        if (expenses.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'Nenhum gasto registrado para esta viagem',
                'fa-receipt'
            );
            return;
        }

        let html = '<div class="expenses-table">';
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Pagador</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Categoria</th>
                    </tr>
                </thead>
                <tbody>
        `;

        expenses.slice(0, 10).forEach(expense => {
            const payer = travelers.find(t => t.id === expense.paidBy);
            const formattedAmount = formatCurrency(expense.amount, trip.currency);
            const formattedDate = formatDate(expense.date);
            const categoryName = getCategoryName(expense.category);

            html += `
                <tr data-id="${expense.id}">
                    <td>${expense.description}</td>
                    <td>
                        <div class="traveler-with-avatar">
                            ${UIComponents.createTravelerAvatar(payer || { name: '??', color: '#999' }, 'small')}
                            <span>${payer ? payer.name : 'Desconhecido'}</span>
                        </div>
                    </td>
                    <td>${formattedAmount}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <span class="category-badge">
                            <i class="fas fa-${getCategoryIcon(expense.category)}"></i>
                            ${categoryName}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </div>`;

        if (expenses.length > 10) {
            html += `
                <div class="view-all mt-2">
                    <button class="btn btn-secondary" onclick="app.showSection('expenses')">
                        Ver todos os ${expenses.length} gastos
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // Delete trip with confirmation
    deleteTrip(tripId) {
        UIComponents.createConfirmationDialog(
            'Tem certeza que deseja excluir esta viagem? Todos os gastos e acertos relacionados serão excluídos permanentemente.',
            () => {
                try {
                    tripManager.deleteTrip(tripId);
                    this.renderTripsList();
                    this.app.populateTripFilters();
                    this.app.showNotification('Viagem excluída com sucesso!', 'success');
                } catch (error) {
                    this.app.showNotification(`Erro ao excluir viagem: ${error.message}`, 'error');
                }
            }
        );
    }

    // Get status text in Portuguese
    getStatusText(status) {
        const statusTexts = {
            'planning': 'Planejamento',
            'active': 'Em Andamento',
            'completed': 'Concluída',
            'cancelled': 'Cancelada'
        };
        return statusTexts[status] || status;
    }

    // Get status color
    getStatusColor(status) {
        const statusColors = {
            'planning': '#4cc9f0',
            'active': '#2a9d8f',
            'completed': '#7209b7',
            'cancelled': '#f72585'
        };
        return statusColors[status] || '#6c757d';
    }

    // Populate trip filters in other sections
    populateTripFilters() {
        const trips = tripManager.getAllTrips();
        const filters = [
            document.getElementById('tripFilter'),
            document.getElementById('settlementsTripFilter'),
            document.getElementById('summaryTripFilter')
        ];

        filters.forEach(filter => {
            if (!filter) return;
            
            const currentValue = filter.value;
            filter.innerHTML = '<option value="">Todas as viagens</option>';
            
            trips.forEach(trip => {
                const option = document.createElement('option');
                option.value = trip.id;
                option.textContent = trip.name;
                filter.appendChild(option);
            });
            
            // Restore previous selection if still valid
            if (trips.some(t => t.id === currentValue)) {
                filter.value = currentValue;
            }
        });
    }

    // Render trip form in modal
    renderTripForm(trip = null) {
        const modal = document.getElementById('tripModal');
        const title = document.getElementById('tripModalTitle');
        const form = document.getElementById('tripForm');

        if (trip) {
            // Edit mode
            title.textContent = 'Editar Viagem';
            form.tripId.value = trip.id;
            form.tripName.value = trip.name;
            form.tripDestination.value = trip.destination || '';
            form.tripDescription.value = trip.description || '';
            form.tripStartDate.value = trip.startDate || '';
            form.tripEndDate.value = trip.endDate || '';
            form.tripCurrency.value = trip.currency;
            form.tripStatus.value = trip.status;
        } else {
            // Create mode
            title.textContent = 'Nova Viagem';
            form.reset();
            form.tripId.value = '';
            form.tripStatus.value = 'planning';
            form.tripCurrency.value = 'BRL';
            form.tripStartDate.value = new Date().toISOString().split('T')[0];
        }

        this.app.showModal(modal);
    }

    // Handle trip form submission
    handleTripSubmit(formData) {
        const tripData = {
            id: formData.get('tripId') || crypto.randomUUID(),
            name: formData.get('tripName'),
            destination: formData.get('tripDestination'),
            description: formData.get('tripDescription'),
            startDate: formData.get('tripStartDate'),
            endDate: formData.get('tripEndDate'),
            currency: formData.get('tripCurrency'),
            status: formData.get('tripStatus')
        };

        try {
            if (tripData.id) {
                tripManager.updateTrip(tripData.id, tripData);
            } else {
                tripManager.createTrip(tripData);
            }

            this.app.hideAllModals();
            this.renderTripsList();
            this.populateTripFilters();
            this.app.showNotification('Viagem salva com sucesso!', 'success');
        } catch (error) {
            this.app.showNotification(`Erro ao salvar viagem: ${error.message}`, 'error');
        }
    }
}

export default TripsUI;