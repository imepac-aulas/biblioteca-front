/**
 * Módulo de Gerenciamento de Reservas
 * Sistema Biblioteca+ v1.0.0
 */

class ReservationManagement {
    constructor() {
        this.currentSection = null;
        this.currentFilters = {
            search: '',
            status: 'all',
            user: 'all'
        };
    }

    /**
     * Carrega seção de reservas
     */
    loadReservationsSection() {
        this.currentSection = 'reservations';
        const content = this.generateReservationsHTML();
        document.getElementById('main-content').innerHTML = content;
        this.setupReservationsEventListeners();
        this.loadReservationsData();
    }

    /**
     * Gera HTML da seção de reservas
     */
    generateReservationsHTML() {
        return `
            <div class="section-header">
                <h2>Reservas</h2>
                <p class="section-description">Gerencie reservas de itens indisponíveis</p>
                <button class="btn btn-primary" id="new-reservation-btn">
                    <i class="icon">📋</i> Nova Reserva
                </button>
            </div>

            <div class="reservations-controls">
                <div class="search-filters">
                    <input type="text" id="reservation-search" placeholder="Buscar por usuário ou item..." class="search-input">
                    <select id="reservation-status-filter" class="filter-select">
                        <option value="all">Todos os status</option>
                        <option value="active">Ativas</option>
                        <option value="ready">Prontas para Retirada</option>
                        <option value="completed">Concluídas</option>
                        <option value="cancelled">Canceladas</option>
                        <option value="expired">Expiradas</option>
                    </select>
                    <select id="reservation-user-filter" class="filter-select">
                        <option value="all">Todos os usuários</option>
                    </select>
                    <button class="btn btn-secondary" id="clear-reservation-filters">Limpar</button>
                </div>
            </div>

            <div class="reservations-stats">
                <div class="stat-item">
                    <span class="stat-label">Reservas Ativas:</span>
                    <span class="stat-value" id="active-reservations-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Prontas para Retirada:</span>
                    <span class="stat-value" id="ready-reservations-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Expiradas Hoje:</span>
                    <span class="stat-value" id="expired-today-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Fila de Espera:</span>
                    <span class="stat-value" id="queue-count">0</span>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table" id="reservations-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Item</th>
                            <th>Data da Reserva</th>
                            <th>Posição na Fila</th>
                            <th>Status</th>
                            <th>Prazo para Retirada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="reservations-table-body">
                        <!-- Dados serão inseridos aqui -->
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Configura event listeners da seção de reservas
     */
    setupReservationsEventListeners() {
        // Botão nova reserva
        document.getElementById('new-reservation-btn').addEventListener('click', () => {
            this.showNewReservationModal();
        });

        // Filtros e busca
        document.getElementById('reservation-search').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.loadReservationsData();
        });

        document.getElementById('reservation-status-filter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.loadReservationsData();
        });

        document.getElementById('reservation-user-filter').addEventListener('change', (e) => {
            this.currentFilters.user = e.target.value;
            this.loadReservationsData();
        });

        document.getElementById('clear-reservation-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    /**
     * Carrega dados das reservas
     */
    loadReservationsData() {
        const reservations = window.dataStorage.getReservations();
        const users = window.dataStorage.getUsers();
        const assets = window.dataStorage.getAssets();

        // Popula filtro de usuários
        this.populateUserFilter(users);

        // Processa reservas (atualiza status expirados)
        this.processReservations(reservations);

        // Filtra reservas
        const filteredReservations = this.filterReservations(reservations, users, assets);

        // Atualiza estatísticas
        this.updateReservationsStats(reservations);

        // Atualiza tabela
        this.updateReservationsTable(filteredReservations, users, assets);
    }

    /**
     * Processa reservas para atualizar status
     */
    processReservations(reservations) {
        const now = new Date();
        let updated = false;

        reservations.forEach(reservation => {
            if (reservation.status === 'ready' && reservation.prazoRetirada) {
                const deadline = new Date(reservation.prazoRetirada);
                if (now > deadline) {
                    reservation.status = 'expired';
                    window.dataStorage.updateReservation(reservation);
                    updated = true;
                }
            }
        });

        if (updated) {
            // Reprocessa fila de reservas para o mesmo item
            this.reprocessQueue();
        }
    }

    /**
     * Reprocessa fila de reservas
     */
    reprocessQueue() {
        const reservations = window.dataStorage.getReservations();
        const assets = window.dataStorage.getAssets();

        // Agrupa reservas por item
        const reservationsByAsset = {};
        reservations.forEach(reservation => {
            if (!reservationsByAsset[reservation.assetId]) {
                reservationsByAsset[reservation.assetId] = [];
            }
            reservationsByAsset[reservation.assetId].push(reservation);
        });

        // Para cada item, verifica se há exemplares disponíveis
        Object.keys(reservationsByAsset).forEach(assetId => {
            const asset = assets.find(a => a.id === assetId);
            if (!asset || !asset.exemplares) return;

            const availableExemplars = asset.exemplares.filter(ex => ex.status === 'Disponível');
            const activeReservations = reservationsByAsset[assetId]
                .filter(r => r.status === 'active')
                .sort((a, b) => new Date(a.dataReserva) - new Date(b.dataReserva));

            // Se há exemplares disponíveis e reservas ativas, marca como pronta
            if (availableExemplars.length > 0 && activeReservations.length > 0) {
                const nextReservation = activeReservations[0];
                nextReservation.status = 'ready';
                nextReservation.prazoRetirada = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
                window.dataStorage.updateReservation(nextReservation);
            }
        });
    }

    /**
     * Popula filtro de usuários
     */
    populateUserFilter(users) {
        const userFilter = document.getElementById('reservation-user-filter');
        const currentValue = userFilter.value;
        
        userFilter.innerHTML = '<option value="all">Todos os usuários</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nome;
            userFilter.appendChild(option);
        });
        
        userFilter.value = currentValue;
    }

    /**
     * Filtra reservas baseado nos filtros atuais
     */
    filterReservations(reservations, users, assets) {
        return reservations.filter(reservation => {
            const user = users.find(u => u.id === reservation.userId);
            const asset = assets.find(a => a.id === reservation.assetId);
            
            if (!user || !asset) return false;

            // Filtro de busca
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const matchUser = user.nome.toLowerCase().includes(searchTerm);
                const matchAsset = asset.titulo.toLowerCase().includes(searchTerm);
                if (!matchUser && !matchAsset) return false;
            }

            // Filtro de status
            if (this.currentFilters.status !== 'all') {
                if (this.currentFilters.status !== reservation.status) return false;
            }

            // Filtro de usuário
            if (this.currentFilters.user !== 'all') {
                if (this.currentFilters.user !== reservation.userId) return false;
            }

            return true;
        });
    }

    /**
     * Atualiza estatísticas das reservas
     */
    updateReservationsStats(reservations) {
        const activeReservations = reservations.filter(r => r.status === 'active').length;
        const readyReservations = reservations.filter(r => r.status === 'ready').length;
        
        const today = new Date().toDateString();
        const expiredToday = reservations.filter(r => {
            if (r.status !== 'expired') return false;
            const expiredDate = new Date(r.prazoRetirada).toDateString();
            return today === expiredDate;
        }).length;

        const queueCount = reservations.filter(r => r.status === 'active').length;

        document.getElementById('active-reservations-count').textContent = activeReservations;
        document.getElementById('ready-reservations-count').textContent = readyReservations;
        document.getElementById('expired-today-count').textContent = expiredToday;
        document.getElementById('queue-count').textContent = queueCount;
    }

    /**
     * Atualiza tabela de reservas
     */
    updateReservationsTable(reservations, users, assets) {
        const tbody = document.getElementById('reservations-table-body');
        
        if (reservations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">Nenhuma reserva encontrada</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reservations.map(reservation => {
            const user = users.find(u => u.id === reservation.userId);
            const asset = assets.find(a => a.id === reservation.assetId);
            
            if (!user || !asset) return '';

            const statusClass = this.getStatusClass(reservation.status);
            const statusText = this.getStatusText(reservation.status);
            const queuePosition = this.calculateQueuePosition(reservation, reservations);
            
            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <strong>${user.nome}</strong>
                            <small>${user.email}</small>
                        </div>
                    </td>
                    <td>
                        <div class="asset-info">
                            <strong>${asset.titulo}</strong>
                            <small>${asset.autorMarca}</small>
                        </div>
                    </td>
                    <td>${this.formatDate(reservation.dataReserva)}</td>
                    <td>
                        ${reservation.status === 'active' ? `#${queuePosition}` : '-'}
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        ${reservation.prazoRetirada ? this.formatDate(reservation.prazoRetirada) : '-'}
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${this.generateReservationActions(reservation)}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Calcula posição na fila
     */
    calculateQueuePosition(reservation, allReservations) {
        if (reservation.status !== 'active') return 0;

        const sameAssetReservations = allReservations
            .filter(r => r.assetId === reservation.assetId && r.status === 'active')
            .sort((a, b) => new Date(a.dataReserva) - new Date(b.dataReserva));

        return sameAssetReservations.findIndex(r => r.id === reservation.id) + 1;
    }

    /**
     * Gera ações disponíveis para uma reserva
     */
    generateReservationActions(reservation) {
        const actions = [];

        if (reservation.status === 'ready') {
            actions.push(`
                <button class="btn btn-sm btn-success" onclick="window.reservationManagement.completeReservation('${reservation.id}')" title="Confirmar Retirada">
                    <i class="icon">✅</i>
                </button>
            `);
        }

        if (reservation.status === 'active' || reservation.status === 'ready') {
            actions.push(`
                <button class="btn btn-sm btn-danger" onclick="window.reservationManagement.cancelReservation('${reservation.id}')" title="Cancelar">
                    <i class="icon">❌</i>
                </button>
            `);
        }

        actions.push(`
            <button class="btn btn-sm btn-primary" onclick="window.reservationManagement.viewReservationDetails('${reservation.id}')" title="Visualizar">
                <i class="icon">👁️</i>
            </button>
        `);

        return actions.join('');
    }

    /**
     * Mostra modal de nova reserva
     */
    showNewReservationModal() {
        const users = window.dataStorage.getUsers().filter(u => u.status === 'Ativo');
        const assets = window.dataStorage.getAssets();
        
        // Filtra apenas itens que estão totalmente emprestados
        const unavailableAssets = assets.filter(asset => {
            if (!asset.exemplares || asset.exemplares.length === 0) return false;
            return asset.exemplares.every(ex => ex.status !== 'Disponível');
        });
        
        const modalContent = `
            <div class="modal-header">
                <h3>Nova Reserva</h3>
                <button class="modal-close" onclick="window.uiManager.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${unavailableAssets.length === 0 ? `
                    <div class="alert alert-info">
                        <p>Não há itens indisponíveis no momento. Todos os itens do acervo possuem exemplares disponíveis para empréstimo.</p>
                    </div>
                ` : `
                    <form id="new-reservation-form">
                        <div class="form-group">
                            <label for="reservation-user">Usuário:</label>
                            <select id="reservation-user" required>
                                <option value="">Selecione um usuário</option>
                                ${users.map(user => `
                                    <option value="${user.id}">${user.nome} (${user.email})</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="reservation-asset">Item Indisponível:</label>
                            <select id="reservation-asset" required>
                                <option value="">Selecione um item</option>
                                ${unavailableAssets.map(asset => `
                                    <option value="${asset.id}">${asset.titulo} - ${asset.autorMarca}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="reservation-notes">Observações:</label>
                            <textarea id="reservation-notes" rows="3" placeholder="Observações opcionais..."></textarea>
                        </div>
                    </form>
                `}
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeModal()">Cancelar</button>
                ${unavailableAssets.length > 0 ? `
                    <button type="submit" form="new-reservation-form" class="btn btn-primary">Criar Reserva</button>
                ` : ''}
            </div>
        `;

        window.uiManager.showModal(modalContent);
        
        if (unavailableAssets.length > 0) {
            this.setupNewReservationForm();
        }
    }

    /**
     * Configura formulário de nova reserva
     */
    setupNewReservationForm() {
        const form = document.getElementById('new-reservation-form');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createReservation();
        });
    }

    /**
     * Cria nova reserva
     */
    createReservation() {
        const formData = {
            userId: document.getElementById('reservation-user').value,
            assetId: document.getElementById('reservation-asset').value,
            observacoes: document.getElementById('reservation-notes').value
        };

        // Validações
        if (!formData.userId || !formData.assetId) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Verifica se usuário já tem reserva para este item
        const existingReservations = window.dataStorage.getReservations();
        const userHasReservation = existingReservations.some(r => 
            r.userId === formData.userId && 
            r.assetId === formData.assetId && 
            (r.status === 'active' || r.status === 'ready')
        );

        if (userHasReservation) {
            alert('Este usuário já possui uma reserva ativa para este item.');
            return;
        }

        // Cria a reserva
        const reservation = {
            id: 'reservation_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: formData.userId,
            assetId: formData.assetId,
            dataReserva: new Date().toISOString(),
            status: 'active',
            observacoes: formData.observacoes
        };

        // Salva reserva
        window.dataStorage.addReservation(reservation);

        // Fecha modal e recarrega dados
        window.uiManager.closeModal();
        this.loadReservationsData();

        alert('Reserva criada com sucesso!');
    }

    /**
     * Completa reserva (confirma retirada)
     */
    completeReservation(reservationId) {
        if (!confirm('Confirma que o item foi retirado pelo usuário?')) return;

        const reservation = window.dataStorage.getReservations().find(r => r.id === reservationId);
        if (!reservation) {
            alert('Reserva não encontrada.');
            return;
        }

        // Atualiza reserva
        const updatedReservation = {
            ...reservation,
            status: 'completed',
            dataRetirada: new Date().toISOString()
        };

        window.dataStorage.updateReservation(updatedReservation);

        // Reprocessa fila
        this.reprocessQueue();

        this.loadReservationsData();
        alert('Reserva concluída com sucesso!');
    }

    /**
     * Cancela reserva
     */
    cancelReservation(reservationId) {
        if (!confirm('Confirma o cancelamento desta reserva?')) return;

        const reservation = window.dataStorage.getReservations().find(r => r.id === reservationId);
        if (!reservation) {
            alert('Reserva não encontrada.');
            return;
        }

        // Atualiza reserva
        const updatedReservation = {
            ...reservation,
            status: 'cancelled',
            dataCancelamento: new Date().toISOString()
        };

        window.dataStorage.updateReservation(updatedReservation);

        // Reprocessa fila
        this.reprocessQueue();

        this.loadReservationsData();
        alert('Reserva cancelada com sucesso!');
    }

    /**
     * Visualiza detalhes da reserva
     */
    viewReservationDetails(reservationId) {
        const reservation = window.dataStorage.getReservations().find(r => r.id === reservationId);
        if (!reservation) {
            alert('Reserva não encontrada.');
            return;
        }

        const user = window.dataStorage.getUsers().find(u => u.id === reservation.userId);
        const asset = window.dataStorage.getAssets().find(a => a.id === reservation.assetId);
        const queuePosition = this.calculateQueuePosition(reservation, window.dataStorage.getReservations());

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes da Reserva</h3>
                <button class="modal-close" onclick="window.uiManager.closeModal()">&times;</button>
            </div>
            <div class="reservation-details">
                <div class="reservation-info-section">
                    <h4>Informações da Reserva</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>ID:</label>
                            <span>${reservation.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${this.getStatusClass(reservation.status)}">${this.getStatusText(reservation.status)}</span>
                        </div>
                        <div class="info-item">
                            <label>Data da Reserva:</label>
                            <span>${this.formatDate(reservation.dataReserva)}</span>
                        </div>
                        ${reservation.status === 'active' ? `
                            <div class="info-item">
                                <label>Posição na Fila:</label>
                                <span>#${queuePosition}</span>
                            </div>
                        ` : ''}
                        ${reservation.prazoRetirada ? `
                            <div class="info-item">
                                <label>Prazo para Retirada:</label>
                                <span>${this.formatDate(reservation.prazoRetirada)}</span>
                            </div>
                        ` : ''}
                        ${reservation.dataRetirada ? `
                            <div class="info-item">
                                <label>Data de Retirada:</label>
                                <span>${this.formatDate(reservation.dataRetirada)}</span>
                            </div>
                        ` : ''}
                        ${reservation.dataCancelamento ? `
                            <div class="info-item">
                                <label>Data de Cancelamento:</label>
                                <span>${this.formatDate(reservation.dataCancelamento)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="user-info-section">
                    <h4>Usuário</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Nome:</label>
                            <span>${user.nome}</span>
                        </div>
                        <div class="info-item">
                            <label>E-mail:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Tipo:</label>
                            <span class="user-type-badge type-${user.tipo.toLowerCase()}">${user.tipo}</span>
                        </div>
                    </div>
                </div>

                <div class="asset-info-section">
                    <h4>Item Reservado</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Título:</label>
                            <span>${asset.titulo}</span>
                        </div>
                        <div class="info-item">
                            <label>Autor/Marca:</label>
                            <span>${asset.autorMarca}</span>
                        </div>
                        <div class="info-item">
                            <label>Tipo:</label>
                            <span class="asset-type-badge type-${asset.tipo.toLowerCase()}">${asset.tipo}</span>
                        </div>
                    </div>
                </div>

                ${reservation.observacoes ? `
                    <div class="notes-section">
                        <h4>Observações</h4>
                        <p>${reservation.observacoes}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeModal()">Fechar</button>
                ${reservation.status === 'ready' ? `
                    <button type="button" class="btn btn-success" onclick="window.reservationManagement.completeReservation('${reservation.id}'); window.uiManager.closeModal();">Confirmar Retirada</button>
                ` : ''}
                ${(reservation.status === 'active' || reservation.status === 'ready') ? `
                    <button type="button" class="btn btn-danger" onclick="window.reservationManagement.cancelReservation('${reservation.id}'); window.uiManager.closeModal();">Cancelar Reserva</button>
                ` : ''}
            </div>
        `;

        window.uiManager.showModal(modalContent);
    }

    /**
     * Limpa filtros
     */
    clearFilters() {
        this.currentFilters = {
            search: '',
            status: 'all',
            user: 'all'
        };

        document.getElementById('reservation-search').value = '';
        document.getElementById('reservation-status-filter').value = 'all';
        document.getElementById('reservation-user-filter').value = 'all';

        this.loadReservationsData();
    }

    /**
     * Utilitários
     */
    getStatusClass(status) {
        const classes = {
            'active': 'status-active',
            'ready': 'status-ready',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled',
            'expired': 'status-expired'
        };
        return classes[status] || 'status-unknown';
    }

    getStatusText(status) {
        const texts = {
            'active': 'Ativa',
            'ready': 'Pronta para Retirada',
            'completed': 'Concluída',
            'cancelled': 'Cancelada',
            'expired': 'Expirada'
        };
        return texts[status] || 'Desconhecido';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
}

// Inicialização global
window.reservationManagement = new ReservationManagement();
