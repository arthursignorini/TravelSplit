// scripts/app.js
import tripManager from './modules/trips.js';
import travelerManager from './modules/travelers.js';
import expenseManager from './modules/expenses.js';
import settlementManager from './modules/settlements.js';
import { tripsStorage, travelersStorage, exportAllData, importAllData, clearAllData } from './data/storage.js';
import { formatCurrency, formatDate, createDataURL, downloadFile } from './data/helpers.js';

class TravelExpenseApp {
    constructor() {
        this.currentSection = 'trips';
        this.currentTripId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.updateStorageStatus();
        this.showSection('trips');
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section || e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Trip actions
        document.getElementById('createTripBtn').addEventListener('click', () => this.showTripModal());
        
        // Bind trip form submission
        document.getElementById('tripForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTripSubmit(e);
        });

        // Traveler actions
        document.getElementById('createTravelerBtn').addEventListener('click', () => this.showTravelerModal());

        // Expense actions
        document.getElementById('createExpenseBtn').addEventListener('click', () => this.showExpenseModal());

        // Data management
        document.getElementById('exportData').addEventListener('click', () => this.showImportExportModal('export'));
        document.getElementById('importData').addEventListener('click', () => this.showImportExportModal('import'));
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideAllModals());
        });

        document.getElementById('modalOverlay').addEventListener('click', () => this.hideAllModals());

        // Trip filter changes
        const tripFilter = document.getElementById('tripFilter');
        if (tripFilter) {
            tripFilter.addEventListener('change', (e) => this.filterExpenses(e.target.value));
        }

        const settlementsTripFilter = document.getElementById('settlementsTripFilter');
        if (settlementsTripFilter) {
            settlementsTripFilter.addEventListener('change', (e) => this.loadSettlements(e.target.value));
        }

        const summaryTripFilter = document.getElementById('summaryTripFilter');
        if (summaryTripFilter) {
            summaryTripFilter.addEventListener('change', (e) => this.loadSummary(e.target.value));
        }

        // Window events
        window.addEventListener('storage', (e) => {
            if (e.key.startsWith('@')) {
                this.updateStorageStatus();
                this.refreshCurrentSection();
            }
        });
    }

    loadInitialData() {
        this.loadTrips();
        this.loadTravelers();
        this.populateTripFilters();
    }

    showSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.toggle('active', el.id === `${section}Section`);
        });

        this.currentSection = section;

        // Load section content
        switch(section) {
            case 'trips':
                this.loadTrips();
                break;
            case 'travelers':
                this.loadTravelers();
                break;
            case 'expenses':
                this.loadExpenses();
                break;
            case 'settlements':
                this.loadSettlements();
                break;
            case 'summary':
                this.loadSummary();
                break;
        }
    }

    refreshCurrentSection() {
        this.showSection(this.currentSection);
    }

    // Trip Management
    loadTrips() {
        const container = document.getElementById('tripsList');
        if (!container) return;

        const trips = tripsStorage.getAll();
        
        if (trips.length === 0) {
            container.innerHTML = this.createEmptyState(
                'Nenhuma viagem cadastrada',
                'fa-suitcase',
                { id: 'createTripBtn', text: 'Criar Primeira Viagem', icon: 'fa-plus' }
            );
            return;
        }

        container.innerHTML = '';
        trips.forEach(trip => {
            const card = this.createTripCard(trip);
            container.appendChild(card);
        });

        this.bindTripCardEvents();
    }

    createTripCard(trip) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.tripId = trip.id;
        
        const expenses = expenseManager.getExpensesByTrip(trip.id);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const formattedTotal = formatCurrency(totalExpenses, trip.currency);
        const formattedDates = trip.startDate && trip.endDate 
            ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
            : 'Datas não definidas';

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <i class="fas fa-suitcase"></i>
                    <h3 class="card-title">${trip.name}</h3>
                    <p class="card-subtitle">${trip.destination || 'Sem destino'} • ${formattedDates}</p>
                </div>
                <div class="card-badges">
                    <span class="status-badge status-${trip.status}">${this.getStatusText(trip.status)}</span>
                </div>
            </div>
            <div class="card-content">
                <div class="trip-stats">
                    <div class="stat">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${formattedTotal}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-receipt"></i>
                        <span>${expenses.length} gastos</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-sm" data-action="view-trip">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-secondary btn-sm" data-action="edit-trip">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" data-action="delete-trip">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

        return card;
    }

    bindTripCardEvents() {
        document.querySelectorAll('[data-action="view-trip"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const tripId = card.dataset.tripId;
                this.viewTripDetails(tripId);
            });
        });

        document.querySelectorAll('[data-action="edit-trip"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const tripId = card.dataset.tripId;
                this.showTripModal(tripId);
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

    showTripModal(tripId = null) {
        const modal = document.getElementById('tripModal');
        const title = document.getElementById('tripModalTitle');
        const form = document.getElementById('tripForm');

        if (tripId) {
            // Edit mode
            const trip = tripsStorage.getById(tripId);
            if (!trip) return;

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

        this.showModal(modal);
    }

    async handleTripSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const tripData = {
            id: formData.get('tripId') || crypto.randomUUID(),
            name: formData.get('tripName'),
            destination: formData.get('tripDestination'),
            description: formData.get('tripDescription'),
            startDate: formData.get('tripStartDate'),
            endDate: formData.get('tripEndDate'),
            currency: formData.get('tripCurrency'),
            status: formData.get('tripStatus'),
            createdAt: formData.get('tripId') ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            tripsStorage.save(tripData);
            
            this.hideAllModals();
            this.loadTrips();
            this.populateTripFilters();
            this.showNotification('Viagem salva com sucesso!', 'success');
        } catch (error) {
            this.showNotification(`Erro ao salvar viagem: ${error.message}`, 'error');
        }
    }

    viewTripDetails(tripId) {
        const trip = tripsStorage.getById(tripId);
        if (!trip) return;

        const container = document.getElementById('tripDetail');
        const tripsList = document.getElementById('tripsList');

        tripsList.classList.add('hidden');
        container.classList.remove('hidden');

        const expenses = expenseManager.getExpensesByTrip(tripId);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const formattedTotal = formatCurrency(totalExpenses, trip.currency);

        container.innerHTML = `
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
            
            <div class="trip-stats-overview">
                <h3>Estatísticas</h3>
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
                        <div class="stat-value">${expenses.length}</div>
                        <div class="stat-label">Quantidade de Gastos</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('backToList').addEventListener('click', () => {
            container.classList.add('hidden');
            tripsList.classList.remove('hidden');
        });

        container.querySelector('[data-action="edit-trip"]').addEventListener('click', () => {
            this.showTripModal(tripId);
        });

        container.querySelector('[data-action="add-expense"]').addEventListener('click', () => {
            this.currentTripId = tripId;
            this.showSection('expenses');
            // Preencher filtro automaticamente
            const tripFilter = document.getElementById('tripFilter');
            if (tripFilter) {
                tripFilter.value = tripId;
            }
            this.showExpenseModal();
        });
    }

    deleteTrip(tripId) {
        if (confirm('Tem certeza que deseja excluir esta viagem? Todos os gastos relacionados também serão excluídos.')) {
            try {
                // Delete trip
                tripsStorage.delete(tripId);
                
                // Delete related expenses
                const expenses = expenseManager.getExpensesByTrip(tripId);
                expenses.forEach(expense => {
                    expenseManager.deleteExpense(expense.id);
                });
                
                this.loadTrips();
                this.populateTripFilters();
                this.showNotification('Viagem excluída com sucesso!', 'success');
            } catch (error) {
                this.showNotification(`Erro ao excluir viagem: ${error.message}`, 'error');
            }
        }
    }

    // Traveler Management
    loadTravelers() {
        const container = document.getElementById('travelersList');
        if (!container) return;

        const travelers = travelersStorage.getAll();
        
        if (travelers.length === 0) {
            container.innerHTML = this.createEmptyState(
                'Nenhum participante cadastrado',
                'fa-users',
                { id: 'createTravelerBtn', text: 'Adicionar Participante', icon: 'fa-user-plus' }
            );
            return;
        }

        container.innerHTML = '';
        travelers.forEach(traveler => {
            const card = this.createTravelerCard(traveler);
            container.appendChild(card);
        });
    }

    createTravelerCard(traveler) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.travelerId = traveler.id;
        
        const expensesPaid = expenseManager.getExpensesByPayer(traveler.id);
        const totalPaid = expensesPaid.reduce((sum, expense) => sum + expense.amount, 0);
        const formattedTotal = formatCurrency(totalPaid, 'BRL');

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <i class="fas fa-user"></i>
                    <h3 class="card-title">${traveler.name}</h3>
                    <p class="card-subtitle">${traveler.email || 'Sem email'}</p>
                </div>
            </div>
            <div class="card-content">
                <div class="traveler-info">
                    ${traveler.phone ? `
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <span>${traveler.phone}</span>
                        </div>
                    ` : ''}
                    <div class="info-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Total pago: ${formattedTotal}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-receipt"></i>
                        <span>${expensesPaid.length} gastos pagos</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" data-action="edit-traveler">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" data-action="delete-traveler">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

        return card;
    }

    showTravelerModal(travelerId = null) {
        const traveler = travelerId ? travelersStorage.getById(travelerId) : null;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('travelerModal')) {
            this.createTravelerModal();
        }
        
        const modal = document.getElementById('travelerModal');
        const title = modal.querySelector('#travelerModalTitle');
        const form = modal.querySelector('#travelerForm');

        if (traveler) {
            // Edit mode
            title.textContent = 'Editar Participante';
            form.travelerId.value = traveler.id;
            form.travelerName.value = traveler.name;
            form.travelerEmail.value = traveler.email || '';
            form.travelerPhone.value = traveler.phone || '';
            form.travelerColor.value = traveler.color;
        } else {
            // Create mode
            title.textContent = 'Novo Participante';
            form.reset();
            form.travelerId.value = '';
            form.travelerColor.value = '#4361ee';
        }

        this.showModal(modal);
    }

    createTravelerModal() {
        const modalHTML = `
            <div id="travelerModal" class="modal hidden">
                <div class="modal-header">
                    <h3 id="travelerModalTitle">Novo Participante</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="travelerForm">
                        <input type="hidden" id="travelerId">
                        <div class="form-group">
                            <label for="travelerName">Nome *</label>
                            <input type="text" id="travelerName" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="travelerEmail">Email</label>
                                <input type="email" id="travelerEmail">
                            </div>
                            <div class="form-group">
                                <label for="travelerPhone">Telefone</label>
                                <input type="tel" id="travelerPhone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="travelerColor">Cor de Identificação</label>
                            <input type="color" id="travelerColor" value="#4361ee">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    <button type="submit" form="travelerForm" class="btn btn-primary">Salvar</button>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.querySelector('.app-container').appendChild(modalContainer.firstElementChild);

        // Bind form submission
        const form = document.getElementById('travelerForm');
        form.addEventListener('submit', (e) => this.handleTravelerSubmit(e));
    }

    handleTravelerSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const travelerData = {
            id: formData.get('travelerId') || crypto.randomUUID(),
            name: formData.get('travelerName'),
            email: formData.get('travelerEmail'),
            phone: formData.get('travelerPhone'),
            color: formData.get('travelerColor'),
            createdAt: formData.get('travelerId') ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!travelerData.name || travelerData.name.trim().length < 2) {
            this.showNotification('Nome deve ter pelo menos 2 caracteres', 'error');
            return;
        }

        try {
            travelersStorage.save(travelerData);
            
            this.hideAllModals();
            this.loadTravelers();
            this.showNotification('Participante salvo com sucesso!', 'success');
        } catch (error) {
            this.showNotification(`Erro ao salvar participante: ${error.message}`, 'error');
        }
    }

    // Expense Management
    loadExpenses() {
        const container = document.getElementById('expensesList');
        if (!container) return;

        const tripFilter = document.getElementById('tripFilter')?.value;
        const expenses = tripFilter 
            ? expenseManager.getExpensesByTrip(tripFilter)
            : expenseManager.getAllExpenses();

        const travelers = travelersStorage.getAll();
        const trips = tripsStorage.getAll();

        if (expenses.length === 0) {
            container.innerHTML = this.createEmptyState(
                tripFilter ? 'Nenhum gasto nesta viagem' : 'Nenhum gasto registrado',
                'fa-receipt',
                { id: 'createExpenseBtn', text: 'Adicionar Gasto', icon: 'fa-plus' }
            );
            return;
        }

        // Sort by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = `
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
            const trip = trips.find(t => t.id === expense.tripId);
            const payer = travelers.find(t => t.id === expense.paidBy);
            const formattedAmount = formatCurrency(expense.amount, trip?.currency || 'BRL');
            const formattedDate = formatDate(expense.date);
            const categoryName = this.getCategoryName(expense.category);

            html += `
                <tr data-id="${expense.id}">
                    <td>${expense.description}</td>
                    <td>${trip ? trip.name : 'Viagem desconhecida'}</td>
                    <td>${payer ? payer.name : 'Desconhecido'}</td>
                    <td>${formattedAmount}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <span class="category-badge">
                            <i class="fas fa-${this.getCategoryIcon(expense.category)}"></i>
                            ${categoryName}
                        </span>
                    </td>
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
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;

        // Bind expense row events
        this.bindExpenseRowEvents();
    }

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

    filterExpenses(tripId) {
        this.loadExpenses();
    }

    showExpenseModal(expenseId = null) {
        const expense = expenseId ? expenseManager.getExpense(expenseId) : null;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('expenseModal')) {
            this.createExpenseModal();
        }
        
        const modal = document.getElementById('expenseModal');
        const modalBody = modal.querySelector('.modal-body');
        const title = modal.querySelector('.modal-header h3');
        
        const trips = tripsStorage.getAll();
        const travelers = travelersStorage.getAll();

        if (expense) {
            title.textContent = 'Editar Gasto';
            
            modalBody.innerHTML = this.createExpenseForm(expense, trips, travelers);
        } else {
            title.textContent = 'Novo Gasto';
            
            modalBody.innerHTML = this.createExpenseForm(null, trips, travelers);
            
            // Pre-select current trip if any
            if (this.currentTripId) {
                const tripSelect = modalBody.querySelector('#expenseTrip');
                if (tripSelect) {
                    tripSelect.value = this.currentTripId;
                }
            }
        }

        // Bind form submission
        const form = modalBody.querySelector('#expenseForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        }

        this.showModal(modal);
    }

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
    }

    createExpenseForm(expense = null, trips = [], travelers = []) {
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
                                    <span>${traveler.name}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;
    }

    handleExpenseSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Get selected participants
        const participantCheckboxes = form.querySelectorAll('.participant-checkbox:checked');
        const participants = Array.from(participantCheckboxes).map(cb => cb.value);

        // Validate at least one participant
        if (participants.length === 0) {
            this.showNotification('Selecione pelo menos um participante', 'error');
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
            splitType: formData.get('expenseSplitType'),
            createdAt: formData.get('expenseId') ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (expenseData.id) {
                expenseManager.updateExpense(expenseData.id, expenseData, participants);
            } else {
                expenseManager.createExpense(expenseData, participants);
            }

            this.hideAllModals();
            this.loadExpenses();
            this.showNotification('Gasto salvo com sucesso!', 'success');
        } catch (error) {
            this.showNotification(`Erro ao salvar gasto: ${error.message}`, 'error');
        }
    }

    deleteExpense(expenseId) {
        if (confirm('Tem certeza que deseja excluir este gasto?')) {
            try {
                expenseManager.deleteExpense(expenseId);
                this.loadExpenses();
                this.showNotification('Gasto excluído com sucesso!', 'success');
            } catch (error) {
                this.showNotification(`Erro ao excluir gasto: ${error.message}`, 'error');
            }
        }
    }

    // Settlements
    loadSettlements(tripId = null) {
        const container = document.getElementById('settlementsView');
        if (!container) return;

        if (!tripId) {
            tripId = document.getElementById('settlementsTripFilter')?.value;
            if (!tripId) {
                container.innerHTML = this.createEmptyState(
                    'Selecione uma viagem para ver os acertos',
                    'fa-calculator'
                );
                return;
            }
        }

        const balances = settlementManager.calculateBalances(tripId);
        if (!balances) {
            container.innerHTML = this.createEmptyState(
                'Nenhum acerto calculado para esta viagem',
                'fa-calculator',
                { id: 'calculateSettlements', text: 'Calcular Acertos', icon: 'fa-calculator' }
            );
            
            document.getElementById('calculateSettlements')?.addEventListener('click', () => {
                this.calculateSettlements(tripId);
            });
            return;
        }

        let html = `
            <div class="settlement-summary">
                <h3>Resumo de Acertos</h3>
                <div class="balances-grid">
        `;

        balances.balances.forEach(balance => {
            const isPositive = balance.balance > 0;
            const isNegative = balance.balance < 0;
            
            const formattedPaid = formatCurrency(balance.paid, balances.currency);
            const formattedConsumed = formatCurrency(balance.consumed, balances.currency);
            const formattedBalance = formatCurrency(Math.abs(balance.balance), balances.currency);

            html += `
                <div class="card">
                    <div class="card-header">
                        <h4>${balance.traveler.name}</h4>
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
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    calculateSettlements(tripId) {
        try {
            const settlements = settlementManager.generateSettlements(tripId);
            settlementManager.saveSettlements(tripId, settlements);
            this.loadSettlements(tripId);
            this.showNotification('Acertos calculados com sucesso!', 'success');
        } catch (error) {
            this.showNotification(`Erro ao calcular acertos: ${error.message}`, 'error');
        }
    }

    // Summary
    loadSummary(tripId = null) {
        const container = document.getElementById('summaryView');
        if (!container) return;

        if (!tripId) {
            tripId = document.getElementById('summaryTripFilter')?.value;
            if (!tripId) {
                container.innerHTML = this.createEmptyState(
                    'Selecione uma viagem para ver o resumo',
                    'fa-chart-pie'
                );
                return;
            }
        }

        const trip = tripsStorage.getById(tripId);
        const expenses = expenseManager.getExpensesByTrip(tripId);
        
        if (expenses.length === 0) {
            container.innerHTML = this.createEmptyState(
                'Nenhum dado disponível para esta viagem',
                'fa-chart-pie'
            );
            return;
        }

        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const formattedTotal = formatCurrency(totalAmount, trip.currency);
        const formattedCount = expenses.length;
        const averagePerExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;
        const formattedAverage = formatCurrency(averagePerExpense, trip.currency);

        // Calculate by category
        const byCategory = {};
        expenses.forEach(expense => {
            byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
        });

        let html = `
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
            
            <div class="category-breakdown">
                <h3>Gastos por Categoria</h3>
                <div class="categories-grid">
        `;

        Object.entries(byCategory).forEach(([category, amount]) => {
            const percentage = (amount / totalAmount * 100).toFixed(1);
            const formattedAmount = formatCurrency(amount, trip.currency);
            const categoryName = this.getCategoryName(category);
            const icon = this.getCategoryIcon(category);

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

        container.innerHTML = html;
    }

    // Data Management
    showImportExportModal(defaultTab = 'export') {
        const modal = document.getElementById('importExportModal');
        const exportText = document.getElementById('exportDataText');
        const importText = document.getElementById('importDataText');

        // Set active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === defaultTab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${defaultTab}Tab`);
        });

        // Load export data
        if (defaultTab === 'export') {
            const data = exportAllData();
            exportText.value = JSON.stringify(data, null, 2);
        } else {
            importText.value = '';
        }

        this.showModal(modal);

        // Bind tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === `${tab}Tab`);
                });
            });
        });

        // Bind copy button
        document.getElementById('copyExportBtn').addEventListener('click', () => {
            exportText.select();
            document.execCommand('copy');
            this.showNotification('JSON copiado para a área de transferência!', 'success');
        });

        // Bind import button
        document.getElementById('importConfirmBtn').addEventListener('click', () => {
            this.importData(importText.value);
        });
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const success = importAllData(data);
            
            if (success) {
                this.hideAllModals();
                this.loadInitialData();
                this.showNotification('Dados importados com sucesso!', 'success');
            } else {
                this.showNotification('Erro ao importar dados. Verifique o formato do JSON.', 'error');
            }
        } catch (error) {
            this.showNotification('JSON inválido. Verifique o formato do arquivo.', 'error');
        }
    }

    clearAllData() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
            clearAllData();
            this.loadInitialData();
            this.showNotification('Todos os dados foram limpos.', 'success');
        }
    }

    // Utility Methods
    populateTripFilters() {
        const trips = tripsStorage.getAll();
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

    showModal(modal) {
        document.getElementById('modalOverlay').classList.remove('hidden');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.getElementById('modalOverlay').classList.add('hidden');
        document.body.style.overflow = '';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Show with animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
    }

    updateStorageStatus() {
        const stats = getStorageStats();
        const status = document.getElementById('storageStatus');
        
        if (status) {
            const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);
            status.innerHTML = `
                <i class="fas fa-database"></i>
                <span>${totalItems} itens armazenados localmente</span>
            `;
        }
    }

    getStatusText(status) {
        const statusTexts = {
            'planning': 'Planejamento',
            'active': 'Em Andamento',
            'completed': 'Concluída',
            'cancelled': 'Cancelada'
        };
        return statusTexts[status] || status;
    }

    getCategoryName(categoryId) {
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

    getCategoryIcon(categoryId) {
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

    createEmptyState(message, icon = 'fa-inbox', action = null) {
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TravelExpenseApp();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 9999;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #2e7d32;
    }
    
    .notification-error {
        border-left: 4px solid #c62828;
    }
    
    .notification-info {
        border-left: 4px solid #1565c0;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .notification-content i {
        font-size: 1.25rem;
    }
    
    .notification-success .notification-content i {
        color: #2e7d32;
    }
    
    .notification-error .notification-content i {
        color: #c62828;
    }
    
    .notification-info .notification-content i {
        color: #1565c0;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }
    
    .notification-close:hover {
        background: #e9ecef;
    }
`;

// Add styles to document
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);

// Add missing CSS styles
const missingStyles = `
    .participants-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }
    
    .participant-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: 8px;
        background: white;
        transition: background-color 0.2s;
    }
    
    .participant-item:hover {
        background: #e9ecef;
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
        border: 2px solid #6c757d;
        border-radius: 3px;
        position: relative;
    }
    
    .participant-checkbox:checked + .checkbox-custom::after {
        content: '✓';
        position: absolute;
        top: -2px;
        left: 2px;
        color: #4361ee;
        font-weight: bold;
    }
    
    .category-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #e9ecef;
        border-radius: 8px;
        font-size: 0.8rem;
    }
    
    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6c757d;
    }
    
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #e9ecef;
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
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .summary-card.total-expenses {
        border-top: 3px solid #4361ee;
    }
    
    .summary-card .amount {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0.5rem 0;
    }
    
    .summary-card.total-expenses .amount {
        color: #4361ee;
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
        border-radius: 8px;
        border: 1px solid #e9ecef;
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
        color: #4361ee;
    }
    
    .progress-bar {
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
        margin: 0.5rem 0;
    }
    
    .progress {
        height: 100%;
        background: #4361ee;
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    
    .category-amount {
        text-align: right;
        font-weight: 500;
        color: #212529;
    }
    
    .settlement-summary {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .balances-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
        border-top: 1px solid #e9ecef;
        padding-top: 0.5rem;
        margin-top: 0.5rem;
        font-weight: bold;
    }
    
    .balance-label {
        color: #6c757d;
    }
    
    .balance-value {
        font-weight: 500;
        color: #212529;
    }
    
    .text-success {
        color: #2e7d32;
    }
    
    .text-danger {
        color: #f72585;
    }
    
    .hidden {
        display: none !important;
    }
`;

const missingStyleSheet = document.createElement('style');
missingStyleSheet.textContent = missingStyles;
document.head.appendChild(missingStyleSheet);

export default TravelExpenseApp;