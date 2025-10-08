/**
 * Módulo de Armazenamento de Dados
 * Gerencia todas as operações com localStorage
 */

class DataStorage {
    constructor() {
        this.keys = {
            users: 'biblioteca_users',
            assets: 'biblioteca_assets',
            loans: 'biblioteca_loans',
            reservations: 'biblioteca_reservations',
            notifications: 'biblioteca_notifications',
            settings: 'biblioteca_settings'
        };
        
        this.initializeData();
    }

    /**
     * Inicializa dados padrão se não existirem
     */
    initializeData() {
        // Inicializar usuários padrão
        if (!this.getUsers().length) {
            this.initializeDefaultUsers();
        }
        
        // Inicializar acervos de exemplo
        if (!this.getAssets().length) {
            this.initializeDefaultAssets();
        }
        
        // Inicializar configurações
        if (!this.getSettings()) {
            this.initializeDefaultSettings();
        }
    }

    /**
     * Usuários padrão do sistema
     */
    initializeDefaultUsers() {
        const defaultUsers = [
            {
                id: this.generateId(),
                nome: 'Administrador Sistema',
                tipo: 'Administrador',
                email: 'admin@biblioteca.com',
                senha: 'admin123',
                limiteEmprestimos: 10,
                limiteEletronicos: 5,
                emprestimosAtuais: [],
                penalidades: [],
                status: 'Ativo',
                dataCadastro: new Date().toISOString()
            },
            {
                id: this.generateId(),
                nome: 'Maria Bibliotecária',
                tipo: 'Bibliotecário',
                email: 'bibliotecario@biblioteca.com',
                senha: 'bib123',
                limiteEmprestimos: 8,
                limiteEletronicos: 3,
                emprestimosAtuais: [],
                penalidades: [],
                status: 'Ativo',
                dataCadastro: new Date().toISOString()
            },
            {
                id: this.generateId(),
                nome: 'João Aluno Silva',
                tipo: 'Aluno',
                email: 'aluno@biblioteca.com',
                senha: 'aluno123',
                limiteEmprestimos: 5,
                limiteEletronicos: 2,
                emprestimosAtuais: [],
                penalidades: [],
                status: 'Ativo',
                dataCadastro: new Date().toISOString()
            }
        ];
        
        this.saveData(this.keys.users, defaultUsers);
    }

    /**
     * Acervos padrão do sistema
     */
    initializeDefaultAssets() {
        const defaultAssets = [
            {
                id: this.generateId(),
                titulo: 'Dom Casmurro',
                autor: 'Machado de Assis',
                categoria: 'Literatura Brasileira',
                tipo: 'Livro',
                isbn: '978-85-359-0277-5',
                editora: 'Ática',
                anoPublicacao: 1899,
                exemplares: [
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Estante A1',
                        condicao: 'Bom'
                    },
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Estante A1',
                        condicao: 'Bom'
                    }
                ],
                dataCadastro: new Date().toISOString()
            },
            {
                id: this.generateId(),
                titulo: 'O Cortiço',
                autor: 'Aluísio Azevedo',
                categoria: 'Literatura Brasileira',
                tipo: 'Livro',
                isbn: '978-85-08-18947-1',
                editora: 'Ática',
                anoPublicacao: 1890,
                exemplares: [
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Estante A2',
                        condicao: 'Bom'
                    }
                ],
                dataCadastro: new Date().toISOString()
            },
            {
                id: this.generateId(),
                titulo: 'Tablet Samsung Galaxy Tab A7',
                autor: 'Samsung',
                categoria: 'Tecnologia',
                tipo: 'Eletrônico',
                modelo: 'SM-T505',
                numeroSerie: 'TAB001',
                exemplares: [
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Armário Eletrônicos',
                        condicao: 'Excelente'
                    },
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Armário Eletrônicos',
                        condicao: 'Bom'
                    }
                ],
                dataCadastro: new Date().toISOString()
            },
            {
                id: this.generateId(),
                titulo: 'Revista Superinteressante - Edição 400',
                autor: 'Editora Abril',
                categoria: 'Ciência',
                tipo: 'Revista',
                edicao: '400',
                mesAno: 'Outubro 2025',
                exemplares: [
                    {
                        idExemplar: this.generateId(),
                        status: 'Disponível',
                        localizacao: 'Estante Revistas R1',
                        condicao: 'Novo'
                    }
                ],
                dataCadastro: new Date().toISOString()
            }
        ];
        
        this.saveData(this.keys.assets, defaultAssets);
    }

    /**
     * Configurações padrão do sistema
     */
    initializeDefaultSettings() {
        const defaultSettings = {
            prazosEmprestimo: {
                livro: 15,
                revista: 7,
                eletronico: 7
            },
            multaPorDia: 2.00,
            limiteEmprestimosDefault: 5,
            limiteEletronicosDefault: 2,
            horasReserva: 24
        };
        
        this.saveData(this.keys.settings, defaultSettings);
    }

    /**
     * Gera um ID único
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Salva dados no localStorage
     */
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }

    /**
     * Carrega dados do localStorage
     */
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return [];
        }
    }

    // === MÉTODOS PARA USUÁRIOS ===

    /**
     * Obtém todos os usuários
     */
    getUsers() {
        return this.loadData(this.keys.users);
    }

    /**
     * Obtém usuário por ID
     */
    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    /**
     * Obtém usuário por email
     */
    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    /**
     * Adiciona novo usuário
     */
    addUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: this.generateId(),
            ...userData,
            emprestimosAtuais: [],
            penalidades: [],
            status: 'Ativo',
            dataCadastro: new Date().toISOString()
        };
        
        users.push(newUser);
        return this.saveData(this.keys.users, users) ? newUser : null;
    }

    /**
     * Atualiza usuário
     */
    updateUser(id, userData) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            return this.saveData(this.keys.users, users) ? users[index] : null;
        }
        
        return null;
    }

    /**
     * Remove usuário
     */
    deleteUser(id) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== id);
        return this.saveData(this.keys.users, filteredUsers);
    }

    // === MÉTODOS PARA ACERVOS ===

    /**
     * Obtém todos os acervos
     */
    getAssets() {
        return this.loadData(this.keys.assets);
    }

    /**
     * Obtém acervo por ID
     */
    getAssetById(id) {
        const assets = this.getAssets();
        return assets.find(asset => asset.id === id);
    }

    /**
     * Adiciona novo acervo
     */
    addAsset(assetData) {
        const assets = this.getAssets();
        const newAsset = {
            id: this.generateId(),
            ...assetData,
            dataCadastro: new Date().toISOString()
        };
        
        assets.push(newAsset);
        return this.saveData(this.keys.assets, assets) ? newAsset : null;
    }

    /**
     * Atualiza acervo
     */
    updateAsset(id, assetData) {
        const assets = this.getAssets();
        const index = assets.findIndex(asset => asset.id === id);
        
        if (index !== -1) {
            assets[index] = { ...assets[index], ...assetData };
            return this.saveData(this.keys.assets, assets) ? assets[index] : null;
        }
        
        return null;
    }

    /**
     * Remove acervo
     */
    deleteAsset(id) {
        const assets = this.getAssets();
        const filteredAssets = assets.filter(asset => asset.id !== id);
        return this.saveData(this.keys.assets, filteredAssets);
    }

    // === MÉTODOS PARA EMPRÉSTIMOS ===

    /**
     * Obtém todos os empréstimos
     */
    getLoans() {
        return this.loadData(this.keys.loans);
    }

    /**
     * Obtém empréstimo por ID
     */
    getLoanById(id) {
        const loans = this.getLoans();
        return loans.find(loan => loan.id === id);
    }

    /**
     * Adiciona novo empréstimo
     */
    addLoan(loanData) {
        const loans = this.getLoans();
        const newLoan = {
            id: this.generateId(),
            ...loanData,
            dataEmprestimo: new Date().toISOString(),
            status: 'Ativo',
            multa: 0
        };
        
        loans.push(newLoan);
        return this.saveData(this.keys.loans, loans) ? newLoan : null;
    }

    /**
     * Atualiza empréstimo
     */
    updateLoan(loanData) {
        const loans = this.getLoans();
        const index = loans.findIndex(loan => loan.id === loanData.id);
        
        if (index !== -1) {
            loans[index] = loanData;
            return this.saveData(this.keys.loans, loans) ? loans[index] : null;
        }
        
        return null;
    }

    // === MÉTODOS PARA RESERVAS ===

    /**
     * Obtém todas as reservas
     */
    getReservations() {
        return this.loadData(this.keys.reservations);
    }

    /**
     * Adiciona nova reserva
     */
    addReservation(reservationData) {
        const reservations = this.getReservations();
        const newReservation = {
            id: this.generateId(),
            ...reservationData,
            dataReserva: new Date().toISOString(),
            status: 'Pendente'
        };
        
        reservations.push(newReservation);
        return this.saveData(this.keys.reservations, reservations) ? newReservation : null;
    }

    /**
     * Atualiza reserva
     */
    updateReservation(reservationData) {
        const reservations = this.getReservations();
        const index = reservations.findIndex(reservation => reservation.id === reservationData.id);
        
        if (index !== -1) {
            reservations[index] = reservationData;
            return this.saveData(this.keys.reservations, reservations) ? reservations[index] : null;
        }
        
        return null;
    }

    // === MÉTODOS PARA NOTIFICAÇÕES ===

    /**
     * Obtém todas as notificações
     */
    getNotifications() {
        return this.loadData(this.keys.notifications);
    }

    /**
     * Adiciona nova notificação
     */
    addNotification(notificationData) {
        const notifications = this.getNotifications();
        const newNotification = {
            id: this.generateId(),
            ...notificationData,
            dataNotificacao: new Date().toISOString(),
            lida: false
        };
        
        notifications.unshift(newNotification); // Adiciona no início
        return this.saveData(this.keys.notifications, notifications) ? newNotification : null;
    }

    /**
     * Marca notificação como lida
     */
    markNotificationAsRead(id) {
        return this.updateNotification(id, { lida: true });
    }

    /**
     * Atualiza notificação
     */
    updateNotification(id, notificationData) {
        const notifications = this.getNotifications();
        const index = notifications.findIndex(notification => notification.id === id);
        
        if (index !== -1) {
            notifications[index] = { ...notifications[index], ...notificationData };
            return this.saveData(this.keys.notifications, notifications) ? notifications[index] : null;
        }
        
        return null;
    }

    // === MÉTODOS PARA CONFIGURAÇÕES ===

    /**
     * Obtém configurações
     */
    getSettings() {
        return this.loadData(this.keys.settings);
    }

    /**
     * Atualiza configurações
     */
    updateSettings(settingsData) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...settingsData };
        return this.saveData(this.keys.settings, updatedSettings);
    }

    // === MÉTODOS UTILITÁRIOS ===

    /**
     * Limpa todos os dados (para reset do sistema)
     */
    clearAllData() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeData();
    }

    /**
     * Exporta todos os dados
     */
    exportData() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.loadData(key);
        });
        return data;
    }

    /**
     * Importa dados
     */
    importData(data) {
        try {
            Object.entries(data).forEach(([name, value]) => {
                if (this.keys[name]) {
                    this.saveData(this.keys[name], value);
                }
            });
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
}

// Instância global do DataStorage
window.dataStorage = new DataStorage();

    // === MÉTODOS AUXILIARES PARA EMPRÉSTIMOS E RESERVAS ===

    /**
     * Atualiza status do exemplar
     */
    updateExemplarStatus(assetId, exemplaId, newStatus) {
        const assets = this.getAssets();
        const asset = assets.find(a => a.id === assetId);
        
        if (asset && asset.exemplares) {
            const exemplar = asset.exemplares.find(ex => ex.id === exemplaId);
            if (exemplar) {
                exemplar.status = newStatus;
                this.updateAsset(asset.id, asset);
                return true;
            }
        }
        return false;
    }

    /**
     * Adiciona penalidade ao usuário
     */
    addUserPenalty(userId, penalty) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (user) {
            if (!user.penalidades) {
                user.penalidades = [];
            }
            user.penalidades.push(penalty);
            this.updateUser(user.id, user);
            return true;
        }
        return false;
    }

    /**
     * Atualiza empréstimos em atraso
     */
    updateOverdueLoans() {
        const loans = this.getLoans();
        const today = new Date();
        let updated = false;

        loans.forEach(loan => {
            if (loan.status === 'active') {
                const dueDate = new Date(loan.dataPrevista);
                if (today > dueDate) {
                    loan.status = 'overdue';
                    updated = true;
                }
            }
        });

        if (updated) {
            this.saveData(this.keys.loans, loans);
        }

        return updated;
    }

    /**
     * Obtém estatísticas do dashboard
     */
    getDashboardStats() {
        const users = this.getUsers();
        const assets = this.getAssets();
        const loans = this.getLoans();
        const reservations = this.getReservations();

        // Atualiza empréstimos em atraso
        this.updateOverdueLoans();

        // Calcula estatísticas
        const totalAssets = assets.reduce((total, asset) => {
            return total + (asset.exemplares ? asset.exemplares.length : 0);
        }, 0);

        const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue').length;
        const overdueLoans = loans.filter(loan => loan.status === 'overdue').length;
        const activeUsers = users.filter(user => user.status === 'Ativo').length;

        return {
            totalAssets,
            activeLoans,
            overdueLoans,
            activeUsers,
            totalReservations: reservations.filter(r => r.status === 'active').length
        };
    }

}

// Instância global do DataStorage
window.dataStorage = new DataStorage();
