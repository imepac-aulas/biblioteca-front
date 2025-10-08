/**
 * Módulo de Gerenciamento de Usuários
 * Controla CRUD de usuários, validações e interface
 */

class UserManagement {
    constructor() {
        this.currentUsers = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = 'nome';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filterType = 'all';
        
        this.initializeEventListeners();
    }

    /**
     * Inicializa event listeners
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupUserManagement();
        });
    }

    /**
     * Configura gerenciamento de usuários
     */
    setupUserManagement() {
        // Botão adicionar usuário
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showUserModal();
            });
        }
    }

    /**
     * Carrega seção de usuários
     */
    loadUsersSection() {
        if (!window.authManager.hasPermission('manage_users')) {
            this.showAccessDenied();
            return;
        }

        this.loadUsers();
        this.renderUsersInterface();
    }

    /**
     * Carrega lista de usuários
     */
    loadUsers() {
        this.currentUsers = window.dataStorage.getUsers();
        this.applyFilters();
    }

    /**
     * Aplica filtros e busca
     */
    applyFilters() {
        let filtered = [...this.currentUsers];

        // Filtro por tipo
        if (this.filterType !== 'all') {
            filtered = filtered.filter(user => user.tipo === this.filterType);
        }

        // Busca por texto
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.nome.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.tipo.toLowerCase().includes(term)
            );
        }

        // Ordenação
        filtered.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (this.sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        this.filteredUsers = filtered;
        this.currentPage = 1; // Reset para primeira página
    }

    /**
     * Renderiza interface de usuários
     */
    renderUsersInterface() {
        const container = document.getElementById('users-content');
        if (!container) return;

        container.innerHTML = `
            <div class="users-controls">
                <div class="search-bar">
                    <input type="text" id="users-search" class="search-input" placeholder="Buscar usuários..." value="${this.searchTerm}">
                    <select id="users-filter" class="filter-select">
                        <option value="all">Todos os tipos</option>
                        <option value="Aluno" ${this.filterType === 'Aluno' ? 'selected' : ''}>Alunos</option>
                        <option value="Professor" ${this.filterType === 'Professor' ? 'selected' : ''}>Professores</option>
                        <option value="Colaborador" ${this.filterType === 'Colaborador' ? 'selected' : ''}>Colaboradores</option>
                        <option value="Bibliotecário" ${this.filterType === 'Bibliotecário' ? 'selected' : ''}>Bibliotecários</option>
                        <option value="Administrador" ${this.filterType === 'Administrador' ? 'selected' : ''}>Administradores</option>
                    </select>
                    <button class="btn btn-secondary" id="clear-filters">
                        <i class="fas fa-times"></i>
                        Limpar
                    </button>
                </div>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th class="sortable" data-field="nome">
                                Nome 
                                <i class="fas fa-sort${this.sortField === 'nome' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="email">
                                E-mail
                                <i class="fas fa-sort${this.sortField === 'email' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="tipo">
                                Tipo
                                <i class="fas fa-sort${this.sortField === 'tipo' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="status">
                                Status
                                <i class="fas fa-sort${this.sortField === 'status' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th>Empréstimos</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        ${this.renderUsersTable()}
                    </tbody>
                </table>
            </div>
            
            ${this.renderPagination()}
        `;

        this.setupUsersEventListeners();
    }

    /**
     * Renderiza tabela de usuários
     */
    renderUsersTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

        if (pageUsers.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>Nenhum usuário encontrado</h3>
                            <p>Tente ajustar os filtros de busca</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return pageUsers.map(user => {
            const activeLoans = user.emprestimosAtuais ? user.emprestimosAtuais.length : 0;
            const penalties = user.penalidades ? user.penalidades.filter(p => p.status === 'Ativa').length : 0;
            
            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <strong>${user.nome}</strong>
                            ${penalties > 0 ? `<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> ${penalties} penalidade(s)</span>` : ''}
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="user-type-badge type-${user.tipo.toLowerCase()}">${user.tipo}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span>
                    </td>
                    <td>
                        <span class="loan-count">${activeLoans}/${user.limiteEmprestimos}</span>
                        ${activeLoans >= user.limiteEmprestimos ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : ''}
                    </td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-secondary" onclick="userManagement.viewUser('${user.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="userManagement.editUser('${user.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${user.status === 'Ativo' ? 
                                `<button class="btn btn-sm btn-warning" onclick="userManagement.suspendUser('${user.id}')" title="Suspender">
                                    <i class="fas fa-ban"></i>
                                </button>` :
                                `<button class="btn btn-sm btn-success" onclick="userManagement.activateUser('${user.id}')" title="Ativar">
                                    <i class="fas fa-check"></i>
                                </button>`
                            }
                            <button class="btn btn-sm btn-danger" onclick="userManagement.deleteUser('${user.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Renderiza paginação
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination">';
        
        // Botão anterior
        pagination += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="userManagement.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pagination += `
                    <button class="${i === this.currentPage ? 'active' : ''}" onclick="userManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pagination += '<span>...</span>';
            }
        }
        
        // Botão próximo
        pagination += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="userManagement.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination += '</div>';
        
        return pagination;
    }

    /**
     * Configura event listeners da seção de usuários
     */
    setupUsersEventListeners() {
        // Busca
        const searchInput = document.getElementById('users-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFilters();
                this.renderUsersInterface();
            });
        }

        // Filtro
        const filterSelect = document.getElementById('users-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.applyFilters();
                this.renderUsersInterface();
            });
        }

        // Limpar filtros
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.filterType = 'all';
                this.applyFilters();
                this.renderUsersInterface();
            });
        }

        // Ordenação
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-field');
                if (this.sortField === field) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDirection = 'asc';
                }
                this.applyFilters();
                this.renderUsersInterface();
            });
        });
    }

    /**
     * Vai para página específica
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderUsersInterface();
        }
    }

    /**
     * Mostra modal de usuário
     */
    showUserModal(userId = null) {
        const isEdit = userId !== null;
        const user = isEdit ? window.dataStorage.getUserById(userId) : null;
        
        const modalContent = `
            <div class="modal-header">
                <h3>${isEdit ? 'Editar Usuário' : 'Adicionar Usuário'}</h3>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="user-form" class="form-container">
                <div class="form-row">
                    <div class="form-group">
                        <label for="user-nome">Nome Completo *</label>
                        <input type="text" id="user-nome" name="nome" required value="${user ? user.nome : ''}">
                    </div>
                    <div class="form-group">
                        <label for="user-email">E-mail *</label>
                        <input type="email" id="user-email" name="email" required value="${user ? user.email : ''}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="user-tipo">Tipo de Usuário *</label>
                        <select id="user-tipo" name="tipo" required>
                            <option value="">Selecione...</option>
                            <option value="Aluno" ${user && user.tipo === 'Aluno' ? 'selected' : ''}>Aluno</option>
                            <option value="Professor" ${user && user.tipo === 'Professor' ? 'selected' : ''}>Professor</option>
                            <option value="Colaborador" ${user && user.tipo === 'Colaborador' ? 'selected' : ''}>Colaborador</option>
                            ${window.authManager.isAdmin() ? `
                                <option value="Bibliotecário" ${user && user.tipo === 'Bibliotecário' ? 'selected' : ''}>Bibliotecário</option>
                                <option value="Administrador" ${user && user.tipo === 'Administrador' ? 'selected' : ''}>Administrador</option>
                            ` : ''}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="user-status">Status</label>
                        <select id="user-status" name="status">
                            <option value="Ativo" ${!user || user.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="Suspenso" ${user && user.status === 'Suspenso' ? 'selected' : ''}>Suspenso</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="user-limite-emprestimos">Limite de Empréstimos</label>
                        <input type="number" id="user-limite-emprestimos" name="limiteEmprestimos" min="1" max="20" value="${user ? user.limiteEmprestimos : 5}">
                    </div>
                    <div class="form-group">
                        <label for="user-limite-eletronicos">Limite de Eletrônicos</label>
                        <input type="number" id="user-limite-eletronicos" name="limiteEletronicos" min="1" max="10" value="${user ? user.limiteEletronicos : 2}">
                    </div>
                </div>
                
                ${!isEdit ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="user-senha">Senha ${isEdit ? '' : '*'}</label>
                            <input type="password" id="user-senha" name="senha" ${isEdit ? '' : 'required'} minlength="6">
                            <small>Mínimo 6 caracteres</small>
                        </div>
                        <div class="form-group">
                            <label for="user-confirmar-senha">Confirmar Senha ${isEdit ? '' : '*'}</label>
                            <input type="password" id="user-confirmar-senha" name="confirmarSenha" ${isEdit ? '' : 'required'} minlength="6">
                        </div>
                    </div>
                ` : ''}
                
                ${isEdit && user && user.penalidades && user.penalidades.length > 0 ? `
                    <div class="form-row full-width">
                        <div class="form-group">
                            <label>Penalidades Ativas</label>
                            <div class="penalties-list">
                                ${user.penalidades.filter(p => p.status === 'Ativa').map(penalty => `
                                    <div class="penalty-item">
                                        <span><strong>${penalty.tipo}</strong> - ${penalty.descricao}</span>
                                        <span class="penalty-date">${window.uiManager.formatDate(penalty.data)}</span>
                                        <button type="button" class="btn btn-sm btn-success" onclick="userManagement.resolvePenalty('${user.id}', '${penalty.data}')">
                                            Resolver
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        ${isEdit ? 'Atualizar' : 'Adicionar'}
                    </button>
                </div>
            </form>
        `;

        window.uiManager.openModal(modalContent);
        
        // Configura formulário
        const form = document.getElementById('user-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUser(userId);
            });
        }
    }

    /**
     * Salva usuário
     */
    saveUser(userId = null) {
        const form = document.getElementById('user-form');
        const formData = new FormData(form);
        
        const userData = {
            nome: formData.get('nome').trim(),
            email: formData.get('email').trim(),
            tipo: formData.get('tipo'),
            status: formData.get('status'),
            limiteEmprestimos: parseInt(formData.get('limiteEmprestimos')),
            limiteEletronicos: parseInt(formData.get('limiteEletronicos'))
        };

        // Validações
        if (!userData.nome || !userData.email || !userData.tipo) {
            window.uiManager.showAlert('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        // Validação de e-mail único
        const existingUser = window.dataStorage.getUserByEmail(userData.email);
        if (existingUser && (!userId || existingUser.id !== userId)) {
            window.uiManager.showAlert('Este e-mail já está em uso', 'warning');
            return;
        }

        // Validação de senha (apenas para novos usuários)
        if (!userId) {
            const senha = formData.get('senha');
            const confirmarSenha = formData.get('confirmarSenha');
            
            if (!senha || senha.length < 6) {
                window.uiManager.showAlert('Senha deve ter pelo menos 6 caracteres', 'warning');
                return;
            }
            
            if (senha !== confirmarSenha) {
                window.uiManager.showAlert('Senhas não coincidem', 'warning');
                return;
            }
            
            userData.senha = senha;
        }

        // Salva usuário
        let result;
        if (userId) {
            result = window.dataStorage.updateUser(userId, userData);
        } else {
            result = window.dataStorage.addUser(userData);
        }

        if (result) {
            window.uiManager.showAlert(
                `Usuário ${userId ? 'atualizado' : 'adicionado'} com sucesso!`, 
                'success'
            );
            window.uiManager.closeModal();
            this.loadUsers();
            this.renderUsersInterface();
        } else {
            window.uiManager.showAlert('Erro ao salvar usuário', 'danger');
        }
    }

    /**
     * Visualiza usuário
     */
    viewUser(userId) {
        const user = window.dataStorage.getUserById(userId);
        if (!user) return;

        const loans = window.dataStorage.getLoans().filter(loan => loan.idUsuario === userId);
        const activeLoans = loans.filter(loan => loan.status === 'Ativo');
        const reservations = window.dataStorage.getReservations().filter(res => res.idUsuario === userId);

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Usuário</h3>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="user-details">
                <div class="user-info-section">
                    <h4>Informações Pessoais</h4>
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
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span>
                        </div>
                        <div class="info-item">
                            <label>Data de Cadastro:</label>
                            <span>${window.uiManager.formatDate(user.dataCadastro)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="user-limits-section">
                    <h4>Limites de Empréstimo</h4>
                    <div class="limits-grid">
                        <div class="limit-item">
                            <span>Empréstimos Gerais:</span>
                            <span>${activeLoans.length}/${user.limiteEmprestimos}</span>
                        </div>
                        <div class="limit-item">
                            <span>Eletrônicos:</span>
                            <span>${activeLoans.filter(loan => {
                                const asset = window.dataStorage.getAssetById(loan.idAcervo);
                                return asset && asset.tipo === 'Eletrônico';
                            }).length}/${user.limiteEletronicos}</span>
                        </div>
                    </div>
                </div>
                
                ${activeLoans.length > 0 ? `
                    <div class="user-loans-section">
                        <h4>Empréstimos Ativos (${activeLoans.length})</h4>
                        <div class="loans-list">
                            ${activeLoans.map(loan => {
                                const asset = window.dataStorage.getAssetById(loan.idAcervo);
                                const isOverdue = new Date(loan.dataPrevistaDevolucao) < new Date();
                                return `
                                    <div class="loan-item ${isOverdue ? 'overdue' : ''}">
                                        <div class="loan-info">
                                            <strong>${asset ? asset.titulo : 'Item não encontrado'}</strong>
                                            <p>Empréstimo: ${window.uiManager.formatDate(loan.dataEmprestimo)}</p>
                                            <p>Devolução: ${window.uiManager.formatDate(loan.dataPrevistaDevolucao)}</p>
                                        </div>
                                        <div class="loan-status">
                                            <span class="status-badge status-${loan.status.toLowerCase()}">${loan.status}</span>
                                            ${loan.multa > 0 ? `<span class="fine">Multa: R$ ${loan.multa.toFixed(2)}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${user.penalidades && user.penalidades.filter(p => p.status === 'Ativa').length > 0 ? `
                    <div class="user-penalties-section">
                        <h4>Penalidades Ativas</h4>
                        <div class="penalties-list">
                            ${user.penalidades.filter(p => p.status === 'Ativa').map(penalty => `
                                <div class="penalty-item">
                                    <div class="penalty-info">
                                        <strong>${penalty.tipo}</strong>
                                        <p>${penalty.descricao}</p>
                                        <small>Data: ${window.uiManager.formatDate(penalty.data)}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="userManagement.editUser('${userId}')">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    Fechar
                </button>
            </div>
        `;

        window.uiManager.openModal(modalContent);
    }

    /**
     * Edita usuário
     */
    editUser(userId) {
        window.uiManager.closeModal();
        setTimeout(() => {
            this.showUserModal(userId);
        }, 100);
    }

    /**
     * Suspende usuário
     */
    suspendUser(userId) {
        if (confirm('Tem certeza que deseja suspender este usuário?')) {
            const result = window.dataStorage.updateUser(userId, { status: 'Suspenso' });
            
            if (result) {
                window.uiManager.showAlert('Usuário suspenso com sucesso', 'success');
                this.loadUsers();
                this.renderUsersInterface();
            } else {
                window.uiManager.showAlert('Erro ao suspender usuário', 'danger');
            }
        }
    }

    /**
     * Ativa usuário
     */
    activateUser(userId) {
        if (confirm('Tem certeza que deseja ativar este usuário?')) {
            const result = window.dataStorage.updateUser(userId, { status: 'Ativo' });
            
            if (result) {
                window.uiManager.showAlert('Usuário ativado com sucesso', 'success');
                this.loadUsers();
                this.renderUsersInterface();
            } else {
                window.uiManager.showAlert('Erro ao ativar usuário', 'danger');
            }
        }
    }

    /**
     * Exclui usuário
     */
    deleteUser(userId) {
        const user = window.dataStorage.getUserById(userId);
        if (!user) return;

        // Verifica se tem empréstimos ativos
        const activeLoans = window.dataStorage.getLoans().filter(loan => 
            loan.idUsuario === userId && loan.status === 'Ativo'
        );

        if (activeLoans.length > 0) {
            window.uiManager.showAlert('Não é possível excluir usuário com empréstimos ativos', 'warning');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"? Esta ação não pode ser desfeita.`)) {
            const result = window.dataStorage.deleteUser(userId);
            
            if (result) {
                window.uiManager.showAlert('Usuário excluído com sucesso', 'success');
                this.loadUsers();
                this.renderUsersInterface();
            } else {
                window.uiManager.showAlert('Erro ao excluir usuário', 'danger');
            }
        }
    }

    /**
     * Resolve penalidade
     */
    resolvePenalty(userId, penaltyDate) {
        const user = window.dataStorage.getUserById(userId);
        if (!user) return;

        const penalty = user.penalidades.find(p => p.data === penaltyDate);
        if (penalty) {
            penalty.status = 'Resolvida';
            penalty.dataResolucao = new Date().toISOString();
            
            const result = window.dataStorage.updateUser(userId, user);
            
            if (result) {
                window.uiManager.showAlert('Penalidade resolvida com sucesso', 'success');
                window.uiManager.closeModal();
                this.loadUsers();
                this.renderUsersInterface();
            } else {
                window.uiManager.showAlert('Erro ao resolver penalidade', 'danger');
            }
        }
    }

    /**
     * Mostra acesso negado
     */
    showAccessDenied() {
        const container = document.getElementById('users-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Acesso Negado</h3>
                    <p>Você não tem permissão para gerenciar usuários</p>
                </div>
            `;
        }
    }
}

// Instância global do UserManagement
window.userManagement = new UserManagement();
