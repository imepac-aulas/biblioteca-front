/**
 * Módulo de Gerenciamento de Acervos
 * Controla CRUD de acervos, exemplares e interface
 */

class AssetManagement {
    constructor() {
        this.currentAssets = [];
        this.filteredAssets = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortField = 'titulo';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filterType = 'all';
        this.filterCategory = 'all';
        
        this.initializeEventListeners();
    }

    /**
     * Inicializa event listeners
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupAssetManagement();
        });
    }

    /**
     * Configura gerenciamento de acervos
     */
    setupAssetManagement() {
        // Botão adicionar acervo
        const addAssetBtn = document.getElementById('add-asset-btn');
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => {
                this.showAssetModal();
            });
        }
    }

    /**
     * Carrega seção de acervos
     */
    loadAssetsSection() {
        if (!window.authManager.hasPermission('manage_assets')) {
            this.showAccessDenied();
            return;
        }

        this.loadAssets();
        this.renderAssetsInterface();
    }

    /**
     * Carrega lista de acervos
     */
    loadAssets() {
        this.currentAssets = window.dataStorage.getAssets();
        this.applyFilters();
    }

    /**
     * Aplica filtros e busca
     */
    applyFilters() {
        let filtered = [...this.currentAssets];

        // Filtro por tipo
        if (this.filterType !== 'all') {
            filtered = filtered.filter(asset => asset.tipo === this.filterType);
        }

        // Filtro por categoria
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(asset => asset.categoria === this.filterCategory);
        }

        // Busca por texto
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(asset => 
                asset.titulo.toLowerCase().includes(term) ||
                asset.autor.toLowerCase().includes(term) ||
                asset.categoria.toLowerCase().includes(term) ||
                (asset.isbn && asset.isbn.toLowerCase().includes(term))
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

        this.filteredAssets = filtered;
        this.currentPage = 1;
    }

    /**
     * Renderiza interface de acervos
     */
    renderAssetsInterface() {
        const container = document.getElementById('assets-content');
        if (!container) return;

        const categories = [...new Set(this.currentAssets.map(asset => asset.categoria))];

        container.innerHTML = `
            <div class="assets-controls">
                <div class="search-bar">
                    <input type="text" id="assets-search" class="search-input" placeholder="Buscar por título, autor, categoria ou ISBN..." value="${this.searchTerm}">
                    <select id="assets-type-filter" class="filter-select">
                        <option value="all">Todos os tipos</option>
                        <option value="Livro" ${this.filterType === 'Livro' ? 'selected' : ''}>Livros</option>
                        <option value="Revista" ${this.filterType === 'Revista' ? 'selected' : ''}>Revistas</option>
                        <option value="Eletrônico" ${this.filterType === 'Eletrônico' ? 'selected' : ''}>Eletrônicos</option>
                    </select>
                    <select id="assets-category-filter" class="filter-select">
                        <option value="all">Todas as categorias</option>
                        ${categories.map(cat => `
                            <option value="${cat}" ${this.filterCategory === cat ? 'selected' : ''}>${cat}</option>
                        `).join('')}
                    </select>
                    <button class="btn btn-secondary" id="clear-assets-filters">
                        <i class="fas fa-times"></i>
                        Limpar
                    </button>
                </div>
            </div>
            
            <div class="assets-stats">
                <div class="stat-item">
                    <span class="stat-label">Total de Títulos:</span>
                    <span class="stat-value">${this.currentAssets.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total de Exemplares:</span>
                    <span class="stat-value">${this.currentAssets.reduce((total, asset) => total + asset.exemplares.length, 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Disponíveis:</span>
                    <span class="stat-value">${this.getAvailableCount()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Emprestados:</span>
                    <span class="stat-value">${this.getLoanedCount()}</span>
                </div>
            </div>
            
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th class="sortable" data-field="titulo">
                                Título 
                                <i class="fas fa-sort${this.sortField === 'titulo' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="autor">
                                Autor/Marca
                                <i class="fas fa-sort${this.sortField === 'autor' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="tipo">
                                Tipo
                                <i class="fas fa-sort${this.sortField === 'tipo' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th class="sortable" data-field="categoria">
                                Categoria
                                <i class="fas fa-sort${this.sortField === 'categoria' ? (this.sortDirection === 'asc' ? '-up' : '-down') : ''}"></i>
                            </th>
                            <th>Exemplares</th>
                            <th>Disponibilidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="assets-table-body">
                        ${this.renderAssetsTable()}
                    </tbody>
                </table>
            </div>
            
            ${this.renderPagination()}
        `;

        this.setupAssetsEventListeners();
    }

    /**
     * Renderiza tabela de acervos
     */
    renderAssetsTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageAssets = this.filteredAssets.slice(startIndex, endIndex);

        if (pageAssets.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-books"></i>
                            <h3>Nenhum item encontrado</h3>
                            <p>Tente ajustar os filtros de busca</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return pageAssets.map(asset => {
            const totalExemplares = asset.exemplares.length;
            const disponiveisCount = asset.exemplares.filter(ex => ex.status === 'Disponível').length;
            const emprestadosCount = asset.exemplares.filter(ex => ex.status === 'Emprestado').length;
            const reservadosCount = asset.exemplares.filter(ex => ex.status === 'Reservado').length;
            const manutencaoCount = asset.exemplares.filter(ex => ex.status === 'Em Manutenção').length;
            
            return `
                <tr>
                    <td>
                        <div class="asset-info">
                            <strong>${asset.titulo}</strong>
                            ${asset.isbn ? `<small>ISBN: ${asset.isbn}</small>` : ''}
                            ${asset.edicao ? `<small>Edição: ${asset.edicao}</small>` : ''}
                        </div>
                    </td>
                    <td>${asset.autor}</td>
                    <td>
                        <span class="asset-type-badge type-${asset.tipo.toLowerCase()}">${asset.tipo}</span>
                    </td>
                    <td>${asset.categoria}</td>
                    <td>
                        <div class="exemplares-count">
                            <span class="total-count">${totalExemplares} total</span>
                            ${disponiveisCount > 0 ? `<span class="available-count">${disponiveisCount} disponível(is)</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="availability-status">
                            ${disponiveisCount > 0 ? 
                                `<span class="status-badge status-disponivel">Disponível</span>` :
                                emprestadosCount > 0 ? 
                                    `<span class="status-badge status-emprestado">Emprestado</span>` :
                                    `<span class="status-badge status-indisponivel">Indisponível</span>`
                            }
                            ${reservadosCount > 0 ? `<small>${reservadosCount} reservado(s)</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-secondary" onclick="assetManagement.viewAsset('${asset.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="assetManagement.editAsset('${asset.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-info" onclick="assetManagement.manageExemplares('${asset.id}')" title="Gerenciar Exemplares">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="assetManagement.deleteAsset('${asset.id}')" title="Excluir">
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
        const totalPages = Math.ceil(this.filteredAssets.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination">';
        
        pagination += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="assetManagement.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                pagination += `
                    <button class="${i === this.currentPage ? 'active' : ''}" onclick="assetManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                pagination += '<span>...</span>';
            }
        }
        
        pagination += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="assetManagement.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        pagination += '</div>';
        
        return pagination;
    }

    /**
     * Configura event listeners da seção de acervos
     */
    setupAssetsEventListeners() {
        // Busca
        const searchInput = document.getElementById('assets-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFilters();
                this.renderAssetsInterface();
            });
        }

        // Filtros
        const typeFilter = document.getElementById('assets-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.applyFilters();
                this.renderAssetsInterface();
            });
        }

        const categoryFilter = document.getElementById('assets-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterCategory = e.target.value;
                this.applyFilters();
                this.renderAssetsInterface();
            });
        }

        // Limpar filtros
        const clearFiltersBtn = document.getElementById('clear-assets-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.searchTerm = '';
                this.filterType = 'all';
                this.filterCategory = 'all';
                this.applyFilters();
                this.renderAssetsInterface();
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
                this.renderAssetsInterface();
            });
        });
    }

    /**
     * Vai para página específica
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredAssets.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderAssetsInterface();
        }
    }

    /**
     * Conta exemplares disponíveis
     */
    getAvailableCount() {
        return this.currentAssets.reduce((total, asset) => {
            return total + asset.exemplares.filter(ex => ex.status === 'Disponível').length;
        }, 0);
    }

    /**
     * Conta exemplares emprestados
     */
    getLoanedCount() {
        return this.currentAssets.reduce((total, asset) => {
            return total + asset.exemplares.filter(ex => ex.status === 'Emprestado').length;
        }, 0);
    }

    /**
     * Mostra modal de acervo
     */
    showAssetModal(assetId = null) {
        const isEdit = assetId !== null;
        const asset = isEdit ? window.dataStorage.getAssetById(assetId) : null;
        
        const modalContent = `
            <div class="modal-header">
                <h3>${isEdit ? 'Editar Item do Acervo' : 'Adicionar Item ao Acervo'}</h3>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="asset-form" class="form-container">
                <div class="form-row">
                    <div class="form-group">
                        <label for="asset-titulo">Título *</label>
                        <input type="text" id="asset-titulo" name="titulo" required value="${asset ? asset.titulo : ''}">
                    </div>
                    <div class="form-group">
                        <label for="asset-autor">Autor/Marca *</label>
                        <input type="text" id="asset-autor" name="autor" required value="${asset ? asset.autor : ''}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="asset-tipo">Tipo *</label>
                        <select id="asset-tipo" name="tipo" required onchange="assetManagement.toggleAssetFields()">
                            <option value="">Selecione...</option>
                            <option value="Livro" ${asset && asset.tipo === 'Livro' ? 'selected' : ''}>Livro</option>
                            <option value="Revista" ${asset && asset.tipo === 'Revista' ? 'selected' : ''}>Revista</option>
                            <option value="Eletrônico" ${asset && asset.tipo === 'Eletrônico' ? 'selected' : ''}>Eletrônico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="asset-categoria">Categoria *</label>
                        <input type="text" id="asset-categoria" name="categoria" required value="${asset ? asset.categoria : ''}" list="categories-list">
                        <datalist id="categories-list">
                            <option value="Literatura Brasileira">
                            <option value="Literatura Estrangeira">
                            <option value="Ciência">
                            <option value="Tecnologia">
                            <option value="História">
                            <option value="Geografia">
                            <option value="Matemática">
                            <option value="Física">
                            <option value="Química">
                            <option value="Biologia">
                            <option value="Filosofia">
                            <option value="Sociologia">
                            <option value="Psicologia">
                            <option value="Educação">
                            <option value="Arte">
                            <option value="Música">
                            <option value="Esportes">
                            <option value="Culinária">
                            <option value="Saúde">
                            <option value="Direito">
                        </datalist>
                    </div>
                </div>
                
                <!-- Campos específicos para Livros -->
                <div id="book-fields" class="conditional-fields" style="display: ${asset && asset.tipo === 'Livro' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="asset-isbn">ISBN</label>
                            <input type="text" id="asset-isbn" name="isbn" value="${asset && asset.isbn ? asset.isbn : ''}">
                        </div>
                        <div class="form-group">
                            <label for="asset-editora">Editora</label>
                            <input type="text" id="asset-editora" name="editora" value="${asset && asset.editora ? asset.editora : ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="asset-ano-publicacao">Ano de Publicação</label>
                            <input type="number" id="asset-ano-publicacao" name="anoPublicacao" min="1000" max="${new Date().getFullYear()}" value="${asset && asset.anoPublicacao ? asset.anoPublicacao : ''}">
                        </div>
                        <div class="form-group">
                            <label for="asset-paginas">Número de Páginas</label>
                            <input type="number" id="asset-paginas" name="paginas" min="1" value="${asset && asset.paginas ? asset.paginas : ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Campos específicos para Revistas -->
                <div id="magazine-fields" class="conditional-fields" style="display: ${asset && asset.tipo === 'Revista' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="asset-edicao">Edição</label>
                            <input type="text" id="asset-edicao" name="edicao" value="${asset && asset.edicao ? asset.edicao : ''}">
                        </div>
                        <div class="form-group">
                            <label for="asset-mes-ano">Mês/Ano</label>
                            <input type="text" id="asset-mes-ano" name="mesAno" placeholder="Ex: Janeiro 2025" value="${asset && asset.mesAno ? asset.mesAno : ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Campos específicos para Eletrônicos -->
                <div id="electronic-fields" class="conditional-fields" style="display: ${asset && asset.tipo === 'Eletrônico' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="asset-modelo">Modelo</label>
                            <input type="text" id="asset-modelo" name="modelo" value="${asset && asset.modelo ? asset.modelo : ''}">
                        </div>
                        <div class="form-group">
                            <label for="asset-numero-serie">Número de Série</label>
                            <input type="text" id="asset-numero-serie" name="numeroSerie" value="${asset && asset.numeroSerie ? asset.numeroSerie : ''}">
                        </div>
                    </div>
                </div>
                
                ${!isEdit ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label for="asset-exemplares-count">Número de Exemplares Iniciais</label>
                            <input type="number" id="asset-exemplares-count" name="exemplaresCount" min="1" max="50" value="1">
                            <small>Você poderá adicionar mais exemplares depois</small>
                        </div>
                        <div class="form-group">
                            <label for="asset-localizacao">Localização Padrão</label>
                            <input type="text" id="asset-localizacao" name="localizacao" placeholder="Ex: Estante A1" value="Estante A1">
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
        const form = document.getElementById('asset-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAsset(assetId);
            });
        }
    }

    /**
     * Alterna campos específicos do tipo de acervo
     */
    toggleAssetFields() {
        const tipo = document.getElementById('asset-tipo').value;
        
        document.getElementById('book-fields').style.display = tipo === 'Livro' ? 'block' : 'none';
        document.getElementById('magazine-fields').style.display = tipo === 'Revista' ? 'block' : 'none';
        document.getElementById('electronic-fields').style.display = tipo === 'Eletrônico' ? 'block' : 'none';
    }

    /**
     * Salva acervo
     */
    saveAsset(assetId = null) {
        const form = document.getElementById('asset-form');
        const formData = new FormData(form);
        
        const assetData = {
            titulo: formData.get('titulo').trim(),
            autor: formData.get('autor').trim(),
            tipo: formData.get('tipo'),
            categoria: formData.get('categoria').trim()
        };

        // Campos específicos por tipo
        if (assetData.tipo === 'Livro') {
            assetData.isbn = formData.get('isbn')?.trim() || null;
            assetData.editora = formData.get('editora')?.trim() || null;
            assetData.anoPublicacao = formData.get('anoPublicacao') ? parseInt(formData.get('anoPublicacao')) : null;
            assetData.paginas = formData.get('paginas') ? parseInt(formData.get('paginas')) : null;
        } else if (assetData.tipo === 'Revista') {
            assetData.edicao = formData.get('edicao')?.trim() || null;
            assetData.mesAno = formData.get('mesAno')?.trim() || null;
        } else if (assetData.tipo === 'Eletrônico') {
            assetData.modelo = formData.get('modelo')?.trim() || null;
            assetData.numeroSerie = formData.get('numeroSerie')?.trim() || null;
        }

        // Validações
        if (!assetData.titulo || !assetData.autor || !assetData.tipo || !assetData.categoria) {
            window.uiManager.showAlert('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        // Para novos acervos, cria exemplares iniciais
        if (!assetId) {
            const exemplaresCount = parseInt(formData.get('exemplaresCount')) || 1;
            const localizacao = formData.get('localizacao')?.trim() || 'Não definida';
            
            assetData.exemplares = [];
            for (let i = 0; i < exemplaresCount; i++) {
                assetData.exemplares.push({
                    idExemplar: window.dataStorage.generateId(),
                    status: 'Disponível',
                    localizacao: localizacao,
                    condicao: 'Bom'
                });
            }
        }

        // Salva acervo
        let result;
        if (assetId) {
            result = window.dataStorage.updateAsset(assetId, assetData);
        } else {
            result = window.dataStorage.addAsset(assetData);
        }

        if (result) {
            window.uiManager.showAlert(
                `Item ${assetId ? 'atualizado' : 'adicionado'} com sucesso!`, 
                'success'
            );
            window.uiManager.closeModal();
            this.loadAssets();
            this.renderAssetsInterface();
        } else {
            window.uiManager.showAlert('Erro ao salvar item', 'danger');
        }
    }

    /**
     * Visualiza acervo
     */
    viewAsset(assetId) {
        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        const loans = window.dataStorage.getLoans().filter(loan => loan.idAcervo === assetId);
        const reservations = window.dataStorage.getReservations().filter(res => res.idAcervo === assetId);

        const modalContent = `
            <div class="modal-header">
                <h3>Detalhes do Item</h3>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="asset-details">
                <div class="asset-info-section">
                    <h4>Informações Gerais</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Título:</label>
                            <span>${asset.titulo}</span>
                        </div>
                        <div class="info-item">
                            <label>Autor/Marca:</label>
                            <span>${asset.autor}</span>
                        </div>
                        <div class="info-item">
                            <label>Tipo:</label>
                            <span class="asset-type-badge type-${asset.tipo.toLowerCase()}">${asset.tipo}</span>
                        </div>
                        <div class="info-item">
                            <label>Categoria:</label>
                            <span>${asset.categoria}</span>
                        </div>
                        ${asset.isbn ? `
                            <div class="info-item">
                                <label>ISBN:</label>
                                <span>${asset.isbn}</span>
                            </div>
                        ` : ''}
                        ${asset.editora ? `
                            <div class="info-item">
                                <label>Editora:</label>
                                <span>${asset.editora}</span>
                            </div>
                        ` : ''}
                        ${asset.anoPublicacao ? `
                            <div class="info-item">
                                <label>Ano de Publicação:</label>
                                <span>${asset.anoPublicacao}</span>
                            </div>
                        ` : ''}
                        ${asset.edicao ? `
                            <div class="info-item">
                                <label>Edição:</label>
                                <span>${asset.edicao}</span>
                            </div>
                        ` : ''}
                        ${asset.modelo ? `
                            <div class="info-item">
                                <label>Modelo:</label>
                                <span>${asset.modelo}</span>
                            </div>
                        ` : ''}
                        <div class="info-item">
                            <label>Data de Cadastro:</label>
                            <span>${window.uiManager.formatDate(asset.dataCadastro)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="exemplares-section">
                    <h4>Exemplares (${asset.exemplares.length})</h4>
                    <div class="exemplares-grid">
                        ${asset.exemplares.map(exemplar => `
                            <div class="exemplar-card">
                                <div class="exemplar-header">
                                    <span class="exemplar-id">#${exemplar.idExemplar.slice(-8)}</span>
                                    <span class="status-badge status-${exemplar.status.toLowerCase().replace(' ', '-')}">${exemplar.status}</span>
                                </div>
                                <div class="exemplar-info">
                                    <p><strong>Localização:</strong> ${exemplar.localizacao}</p>
                                    <p><strong>Condição:</strong> ${exemplar.condicao}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${loans.length > 0 ? `
                    <div class="loans-history-section">
                        <h4>Histórico de Empréstimos (${loans.length})</h4>
                        <div class="loans-list">
                            ${loans.slice(0, 5).map(loan => {
                                const user = window.dataStorage.getUserById(loan.idUsuario);
                                return `
                                    <div class="loan-item">
                                        <div class="loan-info">
                                            <strong>${user ? user.nome : 'Usuário não encontrado'}</strong>
                                            <p>Empréstimo: ${window.uiManager.formatDate(loan.dataEmprestimo)}</p>
                                            ${loan.dataDevolucao ? 
                                                `<p>Devolução: ${window.uiManager.formatDate(loan.dataDevolucao)}</p>` :
                                                `<p>Previsão: ${window.uiManager.formatDate(loan.dataPrevistaDevolucao)}</p>`
                                            }
                                        </div>
                                        <span class="status-badge status-${loan.status.toLowerCase()}">${loan.status}</span>
                                    </div>
                                `;
                            }).join('')}
                            ${loans.length > 5 ? `<p class="text-center"><small>E mais ${loans.length - 5} empréstimos...</small></p>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="assetManagement.editAsset('${assetId}')">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn btn-info" onclick="assetManagement.manageExemplares('${assetId}')">
                    <i class="fas fa-list"></i>
                    Gerenciar Exemplares
                </button>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    Fechar
                </button>
            </div>
        `;

        window.uiManager.openModal(modalContent);
    }

    /**
     * Edita acervo
     */
    editAsset(assetId) {
        window.uiManager.closeModal();
        setTimeout(() => {
            this.showAssetModal(assetId);
        }, 100);
    }

    /**
     * Gerencia exemplares
     */
    manageExemplares(assetId) {
        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        const modalContent = `
            <div class="modal-header">
                <h3>Gerenciar Exemplares - ${asset.titulo}</h3>
                <button class="btn btn-secondary" onclick="window.uiManager.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="exemplares-management">
                <div class="exemplares-actions">
                    <button class="btn btn-primary" onclick="assetManagement.addExemplar('${assetId}')">
                        <i class="fas fa-plus"></i>
                        Adicionar Exemplar
                    </button>
                </div>
                
                <div class="exemplares-list">
                    ${asset.exemplares.map(exemplar => `
                        <div class="exemplar-item">
                            <div class="exemplar-info">
                                <div class="exemplar-header">
                                    <span class="exemplar-id">#${exemplar.idExemplar.slice(-8)}</span>
                                    <span class="status-badge status-${exemplar.status.toLowerCase().replace(' ', '-')}">${exemplar.status}</span>
                                </div>
                                <div class="exemplar-details">
                                    <p><strong>Localização:</strong> ${exemplar.localizacao}</p>
                                    <p><strong>Condição:</strong> ${exemplar.condicao}</p>
                                </div>
                            </div>
                            <div class="exemplar-actions">
                                <button class="btn btn-sm btn-primary" onclick="assetManagement.editExemplar('${assetId}', '${exemplar.idExemplar}')" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${exemplar.status === 'Disponível' ? `
                                    <button class="btn btn-sm btn-warning" onclick="assetManagement.setExemplarMaintenance('${assetId}', '${exemplar.idExemplar}')" title="Manutenção">
                                        <i class="fas fa-wrench"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="assetManagement.removeExemplar('${assetId}', '${exemplar.idExemplar}')" title="Remover">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : exemplar.status === 'Em Manutenção' ? `
                                    <button class="btn btn-sm btn-success" onclick="assetManagement.setExemplarAvailable('${assetId}', '${exemplar.idExemplar}')" title="Disponibilizar">
                                        <i class="fas fa-check"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        window.uiManager.openModal(modalContent);
    }

    /**
     * Adiciona exemplar
     */
    addExemplar(assetId) {
        const localizacao = prompt('Localização do novo exemplar:', 'Estante A1');
        if (!localizacao) return;

        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        const newExemplar = {
            idExemplar: window.dataStorage.generateId(),
            status: 'Disponível',
            localizacao: localizacao.trim(),
            condicao: 'Bom'
        };

        asset.exemplares.push(newExemplar);
        
        const result = window.dataStorage.updateAsset(assetId, asset);
        
        if (result) {
            window.uiManager.showAlert('Exemplar adicionado com sucesso!', 'success');
            this.manageExemplares(assetId); // Recarrega a tela
            this.loadAssets();
        } else {
            window.uiManager.showAlert('Erro ao adicionar exemplar', 'danger');
        }
    }

    /**
     * Edita exemplar
     */
    editExemplar(assetId, exemplarId) {
        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        const exemplar = asset.exemplares.find(ex => ex.idExemplar === exemplarId);
        if (!exemplar) return;

        const novaLocalizacao = prompt('Nova localização:', exemplar.localizacao);
        if (novaLocalizacao === null) return;

        const novaCondicao = prompt('Nova condição (Excelente/Bom/Regular/Ruim):', exemplar.condicao);
        if (novaCondicao === null) return;

        exemplar.localizacao = novaLocalizacao.trim();
        exemplar.condicao = novaCondicao.trim();
        
        const result = window.dataStorage.updateAsset(assetId, asset);
        
        if (result) {
            window.uiManager.showAlert('Exemplar atualizado com sucesso!', 'success');
            this.manageExemplares(assetId);
            this.loadAssets();
        } else {
            window.uiManager.showAlert('Erro ao atualizar exemplar', 'danger');
        }
    }

    /**
     * Define exemplar em manutenção
     */
    setExemplarMaintenance(assetId, exemplarId) {
        if (confirm('Deseja colocar este exemplar em manutenção?')) {
            this.updateExemplarStatus(assetId, exemplarId, 'Em Manutenção');
        }
    }

    /**
     * Define exemplar como disponível
     */
    setExemplarAvailable(assetId, exemplarId) {
        if (confirm('Deseja disponibilizar este exemplar?')) {
            this.updateExemplarStatus(assetId, exemplarId, 'Disponível');
        }
    }

    /**
     * Atualiza status do exemplar
     */
    updateExemplarStatus(assetId, exemplarId, newStatus) {
        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        const exemplar = asset.exemplares.find(ex => ex.idExemplar === exemplarId);
        if (!exemplar) return;

        exemplar.status = newStatus;
        
        const result = window.dataStorage.updateAsset(assetId, asset);
        
        if (result) {
            window.uiManager.showAlert('Status atualizado com sucesso!', 'success');
            this.manageExemplares(assetId);
            this.loadAssets();
        } else {
            window.uiManager.showAlert('Erro ao atualizar status', 'danger');
        }
    }

    /**
     * Remove exemplar
     */
    removeExemplar(assetId, exemplarId) {
        if (confirm('Tem certeza que deseja remover este exemplar? Esta ação não pode ser desfeita.')) {
            const asset = window.dataStorage.getAssetById(assetId);
            if (!asset) return;

            asset.exemplares = asset.exemplares.filter(ex => ex.idExemplar !== exemplarId);
            
            const result = window.dataStorage.updateAsset(assetId, asset);
            
            if (result) {
                window.uiManager.showAlert('Exemplar removido com sucesso!', 'success');
                this.manageExemplares(assetId);
                this.loadAssets();
            } else {
                window.uiManager.showAlert('Erro ao remover exemplar', 'danger');
            }
        }
    }

    /**
     * Exclui acervo
     */
    deleteAsset(assetId) {
        const asset = window.dataStorage.getAssetById(assetId);
        if (!asset) return;

        // Verifica se tem exemplares emprestados
        const loanedExemplares = asset.exemplares.filter(ex => ex.status === 'Emprestado');
        if (loanedExemplares.length > 0) {
            window.uiManager.showAlert('Não é possível excluir item com exemplares emprestados', 'warning');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir "${asset.titulo}"? Esta ação não pode ser desfeita.`)) {
            const result = window.dataStorage.deleteAsset(assetId);
            
            if (result) {
                window.uiManager.showAlert('Item excluído com sucesso', 'success');
                this.loadAssets();
                this.renderAssetsInterface();
            } else {
                window.uiManager.showAlert('Erro ao excluir item', 'danger');
            }
        }
    }

    /**
     * Mostra acesso negado
     */
    showAccessDenied() {
        const container = document.getElementById('assets-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Acesso Negado</h3>
                    <p>Você não tem permissão para gerenciar acervos</p>
                </div>
            `;
        }
    }
}

// Instância global do AssetManagement
window.assetManagement = new AssetManagement();
