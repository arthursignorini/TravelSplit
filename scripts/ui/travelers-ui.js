import travelerManager from '../modules/travelers.js';
import expenseManager from '../modules/expenses.js';
import UIComponents from './components.js';
import { formatCurrency } from '../data/helpers.js';

class TravelersUI {
    constructor(appInstance) {
        this.app = appInstance;
    }

    // Render the travelers list
    renderTravelersList() {
        const container = document.getElementById('travelersList');
        if (!container) return;

        const travelers = travelerManager.getTravelersWithStats();
        
        if (travelers.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'Nenhum participante cadastrado',
                'fa-users',
                { id: 'createTravelerBtn', text: 'Adicionar Participante', icon: 'fa-user-plus' }
            );
            this.bindCreateTravelerButton();
            return;
        }

        container.innerHTML = '';
        travelers.forEach(traveler => {
            const card = this.createTravelerCard(traveler);
            container.appendChild(card);
        });

        this.bindTravelerCardEvents();
    }

    // Create a traveler card
    createTravelerCard(traveler) {
        const stats = traveler.stats;
        const formattedTotal = formatCurrency(stats?.totalPaid || 0, 'BRL');

        const card = UIComponents.createCard({
            title: traveler.name,
            subtitle: traveler.email || 'Sem email',
            content: `
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
                        <span>${stats?.expenseCount || 0} gastos pagos</span>
                    </div>
                </div>
            `,
            color: traveler.color,
            icon: 'fa-user',
            actions: [
                { id: 'edit-traveler', text: 'Editar', type: 'secondary', icon: 'fa-edit' },
                { id: 'delete-traveler', text: 'Excluir', type: 'danger', icon: 'fa-trash' }
            ]
        });

        card.dataset.travelerId = traveler.id;
        return card;
    }

    // Bind events to traveler cards
    bindTravelerCardEvents() {
        document.querySelectorAll('[data-action="edit-traveler"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const travelerId = card.dataset.travelerId;
                this.showTravelerModal(travelerId);
            });
        });

        document.querySelectorAll('[data-action="delete-traveler"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const travelerId = card.dataset.travelerId;
                this.deleteTraveler(travelerId);
            });
        });
    }

    // Bind create traveler button
    bindCreateTravelerButton() {
        const btn = document.getElementById('createTravelerBtn');
        if (btn) {
            btn.addEventListener('click', () => this.showTravelerModal());
        }
    }

    // Show traveler modal
    showTravelerModal(travelerId = null) {
        const traveler = travelerId ? travelerManager.getTraveler(travelerId) : null;
        this.renderTravelerForm(traveler);
    }

    // Render traveler form in modal
    renderTravelerForm(traveler = null) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('travelerModal');
        if (!modal) {
            modal = this.createTravelerModal();
        }

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

        this.app.showModal(modal);
    }

    // Create traveler modal HTML
    createTravelerModal() {
        const modalHTML = `
            <div id="travelerModal" class="modal hidden">
                <div class="modal-header">
                    <h3 id="travelerModalTitle">Novo Participante</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${UIComponents.createTravelerForm()}
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

        return document.getElementById('travelerModal');
    }

    // Handle traveler form submission
    handleTravelerSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const travelerData = {
            id: formData.get('travelerId') || crypto.randomUUID(),
            name: formData.get('travelerName'),
            email: formData.get('travelerEmail'),
            phone: formData.get('travelerPhone'),
            color: formData.get('travelerColor')
        };

        // Validate required fields
        if (!travelerData.name || travelerData.name.trim().length < 2) {
            this.app.showNotification('Nome deve ter pelo menos 2 caracteres', 'error');
            return;
        }

        try {
            if (travelerData.id) {
                travelerManager.updateTraveler(travelerData.id, travelerData);
            } else {
                travelerManager.createTraveler(travelerData);
            }

            this.app.hideAllModals();
            this.renderTravelersList();
            this.app.showNotification('Participante salvo com sucesso!', 'success');
        } catch (error) {
            this.app.showNotification(`Erro ao salvar participante: ${error.message}`, 'error');
        }
    }

    // Delete traveler with confirmation
    deleteTraveler(travelerId) {
        const traveler = travelerManager.getTraveler(travelerId);
        if (!traveler) return;

        // Check if traveler has any expenses paid
        const expensesPaid = expenseManager.getExpensesByPayer(travelerId);
        
        if (expensesPaid.length > 0) {
            UIComponents.createConfirmationDialog(
                `Este participante tem ${expensesPaid.length} gastos registrados. Se excluí-lo, será necessário reatribuir esses gastos. Deseja continuar?`,
                () => {
                    this.performDeleteTraveler(travelerId);
                }
            );
        } else {
            this.performDeleteTraveler(travelerId);
        }
    }

    // Perform the actual deletion
    performDeleteTraveler(travelerId) {
        try {
            const success = travelerManager.deleteTraveler(travelerId);
            if (success) {
                this.renderTravelersList();
                this.app.showNotification('Participante excluído com sucesso!', 'success');
            }
        } catch (error) {
            this.app.showNotification(`Erro ao excluir participante: ${error.message}`, 'error');
        }
    }

    // Get traveler by ID
    getTraveler(travelerId) {
        return travelerManager.getTraveler(travelerId);
    }

    // Get all travelers
    getAllTravelers() {
        return travelerManager.getAllTravelers();
    }

    // Get travelers for select options
    getTravelersForSelect() {
        return travelerManager.getAllTravelers().map(traveler => ({
            id: traveler.id,
            name: traveler.name,
            color: traveler.color
        }));
    }
}

export default TravelersUI;