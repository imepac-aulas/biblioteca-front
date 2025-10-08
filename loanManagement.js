/**
 * Módulo de Gerenciamento de Empréstimos e Devoluções
 * Sistema Biblioteca+ v1.0.0
 */

class LoanManagement {
    constructor() {
        this.currentSection = null;
        this.currentFilters = {
            search: '',
            status: 'all',
            user: 'all'
        };
    }

    /**
     * Carrega seção de empréstimos
     */
    loadLoansSection() {
        this.currentSection = 'loans';
        const content = this.generateLoansHTML();
        document.getElementById('main-content').innerHTML = content;
        this.setupLoansEventListeners();
        this.loadLoansData();
    }

    /**
     * Gera HTML da seção de empréstimos
     */
    generateLoansHTML() {
        return `
            <div class="section-header">
                <h2>Empréstimos e Devoluções</h2>
                <p class="section-description">Gerencie empréstimos ativos, histórico e devoluções</p>
                <button class="btn btn-primary" id="new-loan-btn">
                    <i class="icon">📚</i> Novo Empréstimo
                </button>
            </div>

            <div class="loans-controls">
                <div class="search-filters">
                    <input type="text" id="loan-search" placeholder="Buscar por usuário ou item..." class="search-input">
                    <select id="loan-status-filter" class="filter-select">
                        <option value="all">Todos os status</option>
                        <option value="active">Ativos</option>
                        <option value="overdue">Em atraso</option>
                        <option value="returned">Devolvidos</option>
                    </select>
                    <select id="loan-user-filter" class="filter-select">
                        <option value="all">Todos os usuários</option>
                    </select>
                    <button class="btn btn-secondary" id="clear-loan-filters">Limpar</button>
                </div>
            </div>

            <div class="loans-stats">
                <div class="stat-item">
                    <span class="stat-label">Empréstimos Ativos:</span>
                    <span class="stat-value" id="active-loans-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Em Atraso:</span>
                    <span class="stat-value" id="overdue-loans-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Devoluções Hoje:</span>
                    <span class="stat-value" id="today-returns-count">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total de Multas:</span>
                    <span class="stat-value" id="total-fines">R$ 0,00</span>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table" id="loans-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Item</th>
                            <th>Data Empréstimo</th>
                            <th>Data Prevista</th>
                            <th>Status</th>
                            <th>Multa</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="loans-table-body">
                        <!-- Dados serão inseridos aqui -->
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Configura event listeners da seção de empréstimos
     */
    setupLoansEventListeners() {
        // Botão novo empréstimo
        document.getElementById('new-loan-btn').addEventListener('click', () => {
            this.showNewLoanModal();
        });

        // Filtros e busca
        document.getElementById('loan-search').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.loadLoansData();
        });

        document.getElementById('loan-status-filter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.loadLoansData();
        });

        document.getElementById('loan-user-filter').addEventListener('change', (e) => {
            this.currentFilters.user = e.target.value;
            this.loadLoansData();
        });

        document.getElementById('clear-loan-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    /**
     * Carrega dados dos empréstimos
     */
    loadLoansData() {
        const loans = window.dataStorage.getLoans();
        const users = window.dataStorage.getUsers();
        const assets = window.dataStorage.getAssets();

        // Popula filtro de usuários
        this.populateUserFilter(users);

        // Filtra empréstimos
        const filteredLoans = this.filterLoans(loans, users, assets);

        // Atualiza estatísticas
        this.updateLoansStats(loans);

        // Atualiza tabela
        this.updateLoansTable(filteredLoans, users, assets);
    }

    /**
     * Popula filtro de usuários
     */
    populateUserFilter(users) {
        const userFilter = document.getElementById('loan-user-filter');
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
     * Filtra empréstimos baseado nos filtros atuais
     */
    filterLoans(loans, users, assets) {
        return loans.filter(loan => {
            const user = users.find(u => u.id === loan.userId);
            const asset = assets.find(a => a.id === loan.assetId);
            
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
                if (this.currentFilters.status !== loan.status) return false;
            }

            // Filtro de usuário
            if (this.currentFilters.user !== 'all') {
                if (this.currentFilters.user !== loan.userId) return false;
            }

            return true;
        });
    }

    /**
     * Atualiza estatísticas dos empréstimos
     */
    updateLoansStats(loans) {
        const activeLoans = loans.filter(loan => loan.status === 'active').length;
        const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
        const todayReturns = loans.filter(loan => {
            if (loan.status !== 'returned') return false;
            const today = new Date().toDateString();
            const returnDate = new Date(loan.dataRetorno).toDateString();
            return today === returnDate;
        }).length;
        
        const totalFines = loans.reduce((total, loan) => total + (loan.multa || 0), 0);

        document.getElementById('active-loans-count').textContent = activeLoans;
        document.getElementById('overdue-loans-count').textContent = overdueLoans;
        document.getElementById('today-returns-count').textContent = todayReturns;
        document.getElementById('total-fines').textContent = `R$ ${totalFines.toFixed(2).replace('.', ',')}`;
    }

    /**
     * Atualiza tabela de empréstimos
     */
    updateLoansTable(loans, users, assets) {
        const tbody = document.getElementById('loans-table-body');
        
        if (loans.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">Nenhum empréstimo encontrado</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = loans.map(loan => {
            const user = users.find(u => u.id === loan.userId);
            const asset = assets.find(a => a.id === loan.assetId);
            
            if (!user || !asset) return '';

            const statusClass = this.getStatusClass(loan.status);
            const statusText = this.getStatusText(loan.status);
            const fine = loan.multa || 0;
            
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
                            <small>Exemplar: ${loan.exemplaId}</small>
                        </div>
                    </td>
                    <td>${this.formatDate(loan.dataEmprestimo)}</td>
                    <td>${this.formatDate(loan.dataPrevista)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        ${fine > 0 ? `<span class="fine">R$ ${fine.toFixed(2).replace('.', ',')}</span>` : '-'}
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${this.generateLoanActions(loan)}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Gera ações disponíveis para um empréstimo
     */
    generateLoanActions(loan) {
        const actions = [];

        if (loan.status === 'active' || loan.status === 'overdue') {
            actions.push(`
                <button class="btn btn-sm btn-success" onclick="window.loanManagement.returnLoan('${loan.id}')" title="Devolver">
                    <i class="icon">↩️</i>
                </button>
            `);
            
            actions.push(`
                <button class="btn btn-sm btn-warning" onclick="window.loanManagement.renewLoan('${loan.id}')" title="Renovar">
                    <i class="icon">🔄</i>
                </button>
            `);
        }

        actions.push(`
            <button class="btn btn-sm btn-primary" onclick="window.loanManagement.viewLoanDetails('${loan.id}')" title="Visualizar">
                <i class="icon">👁️</i>
            </button>
        `);

        return actions.join('');
    }

    /**
     * Mostra modal de novo empréstimo
     */
    showNewLoanModal() {
        const users = window.dataStorage.getUsers().filter(u => u.status === 'Ativo');
        const assets = window.dataStorage.getAssets();
        
        const modalContent = `
            <div class="modal-header">
                <h3>Novo Empréstimo</h3>
                <button class="modal-close" onclick="window.uiManager.closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="new-loan-form">
                    <div class="form-group">
                        <label for="loan-user">Usuário:</label>
                        <select id="loan-user" required>
                            <option value="">Selecione um usuário</option>
                            ${users.map(user => `
                                <option value="${user.id}">${user.nome} (${user.email})</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="loan-asset">Item:</label>
                        <select id="loan-asset" required>
                            <option value="">Selecione um item</option>
                            ${assets.map(asset => `
                                <option value="${asset.id}">${asset.titulo} - ${asset.autorMarca}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="loan-exemplar">Exemplar:</label>
                        <select id="loan-exemplar" required disabled>
                            <option value="">Selecione primeiro o item</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="loan-due-date">Data de Devolução:</label>
                        <input type="date" id="loan-due-date" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="loan-notes">Observações:</label>
                        <textarea id="loan-notes" rows="3" placeholder="Observações opcionais..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeModal()">Cancelar</button>
                <button type="submit" form="new-loan-form" class="btn btn-primary">Criar Empréstimo</button>
            </div>
        `;

        window.uiManager.showModal(modalContent);
        this.setupNewLoanForm();
    }

    /**
     * Configura formulário de novo empréstimo
     */
    setupNewLoanForm() {
        const assetSelect = document.getElementById('loan-asset');
        const exemplarSelect = document.getElementById('loan-exemplar');
        const dueDateInput = document.getElementById('loan-due-date');
        const form = document.getElementById('new-loan-form');

        // Configura data padrão (7 dias para eletrônicos, 15 para outros)
        const today = new Date();
        const defaultDays = 15;
        const dueDate = new Date(today.getTime() + (defaultDays * 24 * 60 * 60 * 1000));
        dueDateInput.value = dueDate.toISOString().split('T')[0];

        // Atualiza exemplares quando item é selecionado
        assetSelect.addEventListener('change', () => {
            this.updateExemplarOptions(assetSelect.value, exemplarSelect);
            
            // Ajusta data baseado no tipo do item
            const assets = window.dataStorage.getAssets();
            const selectedAsset = assets.find(a => a.id === assetSelect.value);
            if (selectedAsset) {
                const days = selectedAsset.tipo === 'Eletrônico' ? 7 : 15;
                const newDueDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
                dueDateInput.value = newDueDate.toISOString().split('T')[0];
            }
        });

        // Submissão do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createLoan();
        });
    }

    /**
     * Atualiza opções de exemplares
     */
    updateExemplarOptions(assetId, exemplarSelect) {
        exemplarSelect.innerHTML = '<option value="">Carregando...</option>';
        exemplarSelect.disabled = true;

        if (!assetId) {
            exemplarSelect.innerHTML = '<option value="">Selecione primeiro o item</option>';
            return;
        }

        const assets = window.dataStorage.getAssets();
        const asset = assets.find(a => a.id === assetId);
        
        if (!asset || !asset.exemplares) {
            exemplarSelect.innerHTML = '<option value="">Nenhum exemplar disponível</option>';
            return;
        }

        const availableExemplars = asset.exemplares.filter(ex => ex.status === 'Disponível');
        
        if (availableExemplars.length === 0) {
            exemplarSelect.innerHTML = '<option value="">Nenhum exemplar disponível</option>';
            return;
        }

        exemplarSelect.innerHTML = `
            <option value="">Selecione um exemplar</option>
            ${availableExemplars.map(ex => `
                <option value="${ex.id}">
                    ${ex.id} - ${ex.localizacao} (${ex.condicao})
                </option>
            `).join('')}
        `;
        
        exemplarSelect.disabled = false;
    }

    /**
     * Cria novo empréstimo
     */
    createLoan() {
        const formData = {
            userId: document.getElementById('loan-user').value,
            assetId: document.getElementById('loan-asset').value,
            exemplaId: document.getElementById('loan-exemplar').value,
            dataPrevista: document.getElementById('loan-due-date').value,
            observacoes: document.getElementById('loan-notes').value
        };

        // Validações
        if (!formData.userId || !formData.assetId || !formData.exemplaId || !formData.dataPrevista) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Verifica se usuário pode fazer empréstimo
        const user = window.dataStorage.getUsers().find(u => u.id === formData.userId);
        if (!user || user.status !== 'Ativo') {
            alert('Usuário não está ativo para empréstimos.');
            return;
        }

        // Verifica limites do usuário
        const userLoans = window.dataStorage.getLoans().filter(l => 
            l.userId === formData.userId && (l.status === 'active' || l.status === 'overdue')
        );

        if (userLoans.length >= user.limiteEmprestimos) {
            alert(`Usuário já atingiu o limite de ${user.limiteEmprestimos} empréstimos simultâneos.`);
            return;
        }

        // Verifica limite de eletrônicos
        const asset = window.dataStorage.getAssets().find(a => a.id === formData.assetId);
        if (asset.tipo === 'Eletrônico') {
            const electronicLoans = userLoans.filter(loan => {
                const loanAsset = window.dataStorage.getAssets().find(a => a.id === loan.assetId);
                return loanAsset && loanAsset.tipo === 'Eletrônico';
            });
            
            if (electronicLoans.length >= user.limiteEletronicos) {
                alert(`Usuário já atingiu o limite de ${user.limiteEletronicos} empréstimos de eletrônicos.`);
                return;
            }
        }

        // Cria o empréstimo
        const loan = {
            id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: formData.userId,
            assetId: formData.assetId,
            exemplaId: formData.exemplaId,
            dataEmprestimo: new Date().toISOString(),
            dataPrevista: new Date(formData.dataPrevista).toISOString(),
            status: 'active',
            observacoes: formData.observacoes,
            multa: 0
        };

        // Salva empréstimo
        window.dataStorage.addLoan(loan);

        // Atualiza status do exemplar
        window.dataStorage.updateExemplarStatus(formData.assetId, formData.exemplaId, 'Emprestado');

        // Fecha modal e recarrega dados
        window.uiManager.closeModal();
        this.loadLoansData();
        
        // Atualiza dashboard se estiver visível
        if (window.uiManager.currentSection === 'dashboard') {
            window.uiManager.updateDashboardStats();
        }

        alert('Empréstimo criado com sucesso!');
    }

    /**
     * Processa devolução de empréstimo
     */
    returnLoan(loanId) {
        if (!confirm('Confirma a devolução deste empréstimo?')) return;

        const loan = window.dataStorage.getLoans().find(l => l.id === loanId);
        if (!loan) {
            alert('Empréstimo não encontrado.');
            return;
        }

        // Calcula multa se em atraso
        const today = new Date();
        const dueDate = new Date(loan.dataPrevista);
        let fine = 0;

        if (today > dueDate) {
            const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * 2.00; // R$ 2,00 por dia de atraso
        }

        // Atualiza empréstimo
        const updatedLoan = {
            ...loan,
            status: 'returned',
            dataRetorno: today.toISOString(),
            multa: fine
        };

        window.dataStorage.updateLoan(updatedLoan);

        // Atualiza status do exemplar
        window.dataStorage.updateExemplarStatus(loan.assetId, loan.exemplaId, 'Disponível');

        // Se há multa, adiciona penalidade ao usuário
        if (fine > 0) {
            const penalty = {
                id: 'penalty_' + Date.now(),
                tipo: 'Multa por Atraso',
                descricao: `Devolução em atraso - ${Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))} dias`,
                valor: fine,
                data: today.toISOString(),
                status: 'Pendente'
            };
            
            window.dataStorage.addUserPenalty(loan.userId, penalty);
        }

        this.loadLoansData();
        
        // Atualiza dashboard se estiver visível
        if (window.uiManager.currentSection === 'dashboard') {
            window.uiManager.updateDashboardStats();
        }

        if (fine > 0) {
            alert(`Devolução processada com sucesso!\nMulta aplicada: R$ ${fine.toFixed(2).replace('.', ',')}`);
        } else {
            alert('Devolução processada com sucesso!');
        }
    }

    /**
     * Renova empréstimo
     */
    renewLoan(loanId) {
        const loan = window.dataStorage.getLoans().find(l => l.id === loanId);
        if (!loan) {
            alert('Empréstimo não encontrado.');
            return;
        }

        const asset = window.dataStorage.getAssets().find(a => a.id === loan.assetId);
        const renewalDays = asset.tipo === 'Eletrônico' ? 7 : 15;
        
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + renewalDays);

        if (!confirm(`Confirma a renovação até ${this.formatDate(newDueDate.toISOString())}?`)) return;

        const updatedLoan = {
            ...loan,
            dataPrevista: newDueDate.toISOString(),
            status: 'active'
        };

        window.dataStorage.updateLoan(updatedLoan);
        this.loadLoansData();

        alert('Empréstimo renovado com sucesso!');
    }

    /**
     * Visualiza detalhes do empréstimo
     */
    viewLoanDetails(loanId) {
        const loan = window.dataStorage.getLoans().find(l => l.id === loanId);
        if (!loan) {
            alert('Empréstimo não encontrado.');
            return;
        }

        const user = window.dataStorage.getUsers().find(u => u.id === loan.userId);
        const asset = window.dataStorage.getAssets().find(a => a.id === loan.assetId);

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Empréstimo</h3>
                <button class="modal-close" onclick="window.uiManager.closeModal()">&times;</button>
            </div>
            <div class="loan-details">
                <div class="loan-info-section">
                    <h4>Informações do Empréstimo</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>ID:</label>
                            <span>${loan.id}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${this.getStatusClass(loan.status)}">${this.getStatusText(loan.status)}</span>
                        </div>
                        <div class="info-item">
                            <label>Data do Empréstimo:</label>
                            <span>${this.formatDate(loan.dataEmprestimo)}</span>
                        </div>
                        <div class="info-item">
                            <label>Data Prevista:</label>
                            <span>${this.formatDate(loan.dataPrevista)}</span>
                        </div>
                        ${loan.dataRetorno ? `
                            <div class="info-item">
                                <label>Data de Retorno:</label>
                                <span>${this.formatDate(loan.dataRetorno)}</span>
                            </div>
                        ` : ''}
                        ${loan.multa > 0 ? `
                            <div class="info-item">
                                <label>Multa:</label>
                                <span class="fine">R$ ${loan.multa.toFixed(2).replace('.', ',')}</span>
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
                    <h4>Item Emprestado</h4>
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
                        <div class="info-item">
                            <label>Exemplar:</label>
                            <span>${loan.exemplaId}</span>
                        </div>
                    </div>
                </div>

                ${loan.observacoes ? `
                    <div class="notes-section">
                        <h4>Observações</h4>
                        <p>${loan.observacoes}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeModal()">Fechar</button>
                ${loan.status === 'active' || loan.status === 'overdue' ? `
                    <button type="button" class="btn btn-success" onclick="window.loanManagement.returnLoan('${loan.id}'); window.uiManager.closeModal();">Devolver</button>
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

        document.getElementById('loan-search').value = '';
        document.getElementById('loan-status-filter').value = 'all';
        document.getElementById('loan-user-filter').value = 'all';

        this.loadLoansData();
    }

    /**
     * Utilitários
     */
    getStatusClass(status) {
        const classes = {
            'active': 'status-active',
            'overdue': 'status-overdue',
            'returned': 'status-returned'
        };
        return classes[status] || 'status-unknown';
    }

    getStatusText(status) {
        const texts = {
            'active': 'Ativo',
            'overdue': 'Em Atraso',
            'returned': 'Devolvido'
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
window.loanManagement = new LoanManagement();
