import TripsUI from './trips-ui.js';
import TravelersUI from './travelers-ui.js';
import ExpensesUI from './expenses-ui.js';
import SettlementsUI from './settlements-ui.js';
import { exportAllData, importAllData, clearAllData, getStorageStats } from '../data/storage.js';
import { formatCurrency, createDataURL, downloadFile } from '../data/helpers.js';
import UIComponents from './components.js';

class AppUI {
    constructor(appInstance) {
        this.app = appInstance;
        this.tripsUI = new TripsUI(appInstance);
        this.travelersUI = new TravelersUI(appInstance);
        this.expensesUI = new ExpensesUI(appInstance);
        this.settlementsUI = new SettlementsUI(appInstance);
        
        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindDataManagement();
        this.bindTripFilters();
        this.bindModalEvents();
        this.bindKeyboardEvents();
        this.updateStorageStatus();
    }

    // Navigation
    bindNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });
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

        this.app.currentSection = section;

        // Load section content
        switch(section) {
            case 'trips':
                this.tripsUI.renderTripsList();
                break;
            case 'travelers':
                this.travelersUI.renderTravelersList();
                break;
            case 'expenses':
                this.expensesUI.renderExpensesList();
                break;
            case 'settlements':
                this.settlementsUI.renderSettlements();
                break;
            case 'summary':
                this.settlementsUI.renderSummary();
                break;
        }
    }

    // Data Management
    bindDataManagement() {
        // Export data
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showImportExportModal('export'));
        }

        // Import data
        const importBtn = document.getElementById('importData');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportExportModal('import'));
        }

        // Clear data
        const clearBtn = document.getElementById('clearData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }
    }

    showImportExportModal(defaultTab = 'export') {
        // Create modal if it doesn't exist
        let modal = document.getElementById('importExportModal');
        if (!modal) {
            modal = this.createImportExportModal();
        }

        // Set active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === defaultTab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${defaultTab}Tab`);
        });

        // Load export data
        if (defaultTab === 'export') {
            const exportText = document.getElementById('exportDataText');
            const data = exportAllData();
            exportText.value = JSON.stringify(data, null, 2);
        } else {
            const importText = document.getElementById('importDataText');
            importText.value = '';
        }

        this.app.showModal(modal);

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
        const copyBtn = document.getElementById('copyExportBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const exportText = document.getElementById('exportDataText');
                exportText.select();
                document.execCommand('copy');
                this.showNotification('JSON copiado para a área de transferência!', 'success');
            });
        }

        // Bind import button
        const importConfirmBtn = document.getElementById('importConfirmBtn');
        if (importConfirmBtn) {
            importConfirmBtn.addEventListener('click', () => {
                const importText = document.getElementById('importDataText');
                this.importData(importText.value);
            });
        }
    }

    createImportExportModal() {
        const modalHTML = `
            <div id="importExportModal" class="modal hidden">
                <div class="modal-header">
                    <h3>Gerenciar Dados</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="export">Exportar</button>
                        <button class="tab-btn" data-tab="import">Importar</button>
                    </div>
                    <div id="exportTab" class="tab-content active">
                        <p>Copie o JSON abaixo para fazer backup dos seus dados:</p>
                        <textarea id="exportDataText" readonly rows="10" class="form-control"></textarea>
                        <div class="mt-2">
                            <button id="copyExportBtn" class="btn btn-secondary">
                                <i class="fas fa-copy"></i> Copiar JSON
                            </button>
                            <button id="downloadExportBtn" class="btn btn-primary">
                                <i class="fas fa-download"></i> Baixar Arquivo
                            </button>
                        </div>
                    </div>
                    <div id="importTab" class="tab-content">
                        <p>Cole o JSON com os dados para importar:</p>
                        <textarea id="importDataText" rows="10" placeholder="Cole o JSON aqui..." class="form-control"></textarea>
                        <p class="warning-text mt-2">
                            <i class="fas fa-exclamation-triangle"></i>
                            Isso substituirá todos os dados atuais.
                        </p>
                        <div class="mt-2">
                            <button id="importConfirmBtn" class="btn btn-danger">
                                <i class="fas fa-file-import"></i> Importar Dados
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Fechar</button>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.querySelector('.app-container').appendChild(modalContainer.firstElementChild);

        // Bind download button
        const downloadBtn = document.getElementById('downloadExportBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const data = exportAllData();
                const dataURL = createDataURL(data);
                downloadFile(dataURL, `viagem-justa-backup-${new Date().toISOString().slice(0, 10)}.json`);
            });
        }

        return document.getElementById('importExportModal');
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const success = importAllData(data);
            
            if (success) {
                this.app.hideAllModals();
                this.showNotification('Dados importados com sucesso!', 'success');
                this.refreshAllSections();
                this.updateStorageStatus();
            } else {
                this.showNotification('Erro ao importar dados. Verifique o formato do JSON.', 'error');
            }
        } catch (error) {
            this.showNotification('JSON inválido. Verifique o formato do arquivo.', 'error');
        }
    }

    clearAllData() {
        UIComponents.createConfirmationDialog(
            'Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.',
            () => {
                clearAllData();
                this.refreshAllSections();
                this.updateStorageStatus();
                this.showNotification('Todos os dados foram limpos.', 'success');
            }
        );
    }

    // Trip Filters
    bindTripFilters() {
        // Expenses filter
        const expenseFilter = document.getElementById('tripFilter');
        if (expenseFilter) {
            expenseFilter.addEventListener('change', (e) => {
                this.expensesUI.filterExpenses(e.target.value);
            });
        }

        // Settlements filter
        const settlementsFilter = document.getElementById('settlementsTripFilter');
        if (settlementsFilter) {
            settlementsFilter.addEventListener('change', (e) => {
                this.settlementsUI.renderSettlements(e.target.value);
            });
        }

        // Summary filter
        const summaryFilter = document.getElementById('summaryTripFilter');
        if (summaryFilter) {
            summaryFilter.addEventListener('change', (e) => {
                this.settlementsUI.renderSummary(e.target.value);
            });
        }
    }

    // Modal Management
    bindModalEvents() {
        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideAllModals());
        });

        // Overlay click
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hideAllModals());
        }
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

    // Keyboard Events
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideAllModals();
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.showImportExportModal('export');
            }
        });
    }

    // Storage Status
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

    // Refresh all sections
    refreshAllSections() {
        this.tripsUI.renderTripsList();
        this.travelersUI.renderTravelersList();
        this.expensesUI.renderExpensesList();
        this.tripsUI.populateTripFilters();
        this.settlementsUI.updateTripFilter();
    }

    // Trip Modal Management
    showTripModal(tripId = null) {
        const trip = tripId ? tripManager.getTrip(tripId) : null;
        this.tripsUI.renderTripForm(trip);
    }

    // Traveler Modal Management
    showTravelerModal(travelerId = null) {
        this.travelersUI.showTravelerModal(travelerId);
    }

    // Expense Modal Management
    showExpenseModal(expenseId = null) {
        this.expensesUI.showExpenseModal(expenseId);
    }

    // Notification System
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

    // Populate trip filters
    populateTripFilters() {
        this.tripsUI.populateTripFilters();
    }
}

// Import managers
import tripManager from '../modules/trips.js';
import travelerManager from '../modules/travelers.js';

export default AppUI;