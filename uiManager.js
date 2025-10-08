/**
 * Módulo de Gerenciamento da Interface do Usuário
 * Controla navegação, modais, notificações e interações da UI
 */

class UIManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.modal = null;
        this.notifications = [];
        
        this.initializeEventListeners();
    }

    /**
     * Inicializa event listeners
     */
    initializeEventListeners() {
        // Event listeners serão adicionados quando o DOM estiver carregado
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.setupModal();
            this.setupLoginForm();
            this.setupLogout();
        });
    }

    /**
     * Configura navegação entre seções
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }

    /**
     * Navega para uma seção específica
     */
    navigateToSection(sectionName) {
        // Remove classe active de todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove classe active de todos os links de navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Ativa a seção selecionada
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Ativa o link de navegação correspondente
        const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Carrega conteúdo da seção se necessário
        this.loadSectionContent(sectionName);
    }

    /**
     * Carrega conteúdo específico da seção
     */
    loadSectionContent(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                if (window.authManager.hasPermission('manage_users')) {
                    this.loadUsersSection();
                }
                break;
            case 'assets':
                if (window.authManager.hasPermission('manage_assets')) {
                    this.loadAssetsSection();
                }
                break;
            case 'loans':
                if (window.authManager.hasPermission('manage_loans')) {
                    this.loadLoansSection();
                }
                break;
            case 'reservations':
                this.loadReservationsSection();
                break;
            case 'search':
                this.loadSearchSection();
                break;
            case 'notifications':
                this.loadNotificationsSection();
                break;
            case 'reports':
                if (window.authManager.hasPermission('view_reports')) {
                    this.loadReportsSection();
                }
                break;
        }
    }

    /**
     * Carrega dashboard
     */
    loadDashboard() {
        const assets = window.dataStorage.get    /**
     * Atualiza estatísticas do dashboard
     */
    updateDashboardStats() {
        const stats = window.dataStorage.getDashboardStats();

        // Atualiza elementos
        this.updateElement('total-assets', stats.totalAssets);
        this.updateElement('active-loans', stats.activeLoans);
        this.updateElement('total-users', stats.activeUsers);
        this.updateElement('overdue-loans', stats.overdueLoans);
    }

        // Carrega empréstimos recentes
        this.loadRecentLoans();
        
        // Carrega itens populares
        this.loadPopularItems();
    }

    /**
     * Carrega empréstimos recentes
     */
    loadRecentLoans() {
        const loans = window.dataStorage.getLoans();
        const users = window.dataStorage.getUsers();
        const assets = window.dataStorage.getAssets();
        
        const recentLoans = loans
            .sort((a, b) => new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo))
            .slice(0, 5);

        const container = document.getElementById('recent-loans');
        if (!container) return;

        if (recentLoans.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum empréstimo recente</p>';
            return;
        }

        const html = recentLoans.map(loan => {
            const user = users.find(u => u.id === loan.idUsuario);
            const asset = assets.find(a => a.id === loan.idAcervo);
            const date = new Date(loan.dataEmprestimo).toLocaleDateString('pt-BR');
            
            return `
                <div class="recent-loan-item">
                    <div class="loan-info">
                        <strong>${asset ? asset.titulo : 'Item não encontrado'}</strong>
                        <p>${user ? user.nome : 'Usuário não encontrado'}</p>
                        <small>${date}</small>
                    </div>
                    <span class="status-badge status-${loan.status.toLowerCase()}">${loan.status}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Carrega itens populares
     */
    loadPopularItems() {
        const loans = window.dataStorage.getLoans();
        const assets = window.dataStorage.getAssets();
        
        // Conta empréstimos por item
        const loanCounts = {};
        loans.forEach(loan => {
            loanCounts[loan.idAcervo] = (loanCounts[loan.idAcervo] || 0) + 1;
        });

        // Ordena por popularidade
        const popularItems = Object.entries(loanCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([assetId, count]) => {
                const asset = assets.find(a => a.id === assetId);
                return { asset, count };
            })
            .filter(item => item.asset);

        const container = document.getElementById('popular-items');
        if (!container) return;

        if (popularItems.length === 0) {
            container.innerHTML = '<p class="text-center">Nenhum dado disponível</p>';
            return;
        }

        const html = popularItems.map(item => `
            <div class="popular-item">
                <div class="item-info">
                    <strong>${item.asset.titulo}</strong>
                    <p>${item.asset.autor}</p>
                </div>
                <span class="loan-count">${item.count} empréstimos</span>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Configura sistema de modal
     */
    setupModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (!modalOverlay) return;

        // Fecha modal ao clicar no overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });

        // Fecha modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    /**
     * Abre modal
     */
    openModal(content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = content;
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Fecha modal
     */
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Configura formulário de login
     */
    setupLoginForm() {
        // Aguarda um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            const loginForm = document.getElementById('login-form');
            const demoButtons = document.querySelectorAll('.btn-demo');
            
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            // Botões de demonstração
            demoButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const email = button.getAttribute('data-email');
                    const password = button.getAttribute('data-password');
                    
                    const emailField = document.getElementById('email');
                    const passwordField = document.getElementById('password');
                    
                    if (emailField && passwordField) {
                        emailField.value = email;
                        passwordField.value = password;
                    }
                });
            });
        }, 100);
    }

    /**
     * Processa login
     */
    handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showAlert('Por favor, preencha todos os campos', 'warning');
            return;
        }

        const result = window.authManager.login(email, password);
        
        if (result.success) {
            this.showAlert(result.message, 'success');
            setTimeout(() => {
                this.showDashboard();
            }, 1000);
        } else {
            this.showAlert(result.message, 'danger');
        }
    }

    /**
     * Configura logout
     */
    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    /**
     * Processa logout
     */
    handleLogout() {
        const result = window.authManager.logout();
        
        if (result.success) {
            this.showAlert(result.message, 'success');
            setTimeout(() => {
                this.showLogin();
            }, 1000);
        }
    }

    /**
     * Mostra tela de login
     */
    showLogin() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('dashboard-screen').classList.remove('active');
        
        // Limpa campos
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }

    /**
     * Mostra dashboard
     */
    showDashboard() {
        const user = window.authManager.getCurrentUser();
        
        if (!user) {
            this.showLogin();
            return;
        }

        // Atualiza informações do usuário
        this.updateElement('user-name', user.nome);
        this.updateElement('user-role', user.tipo);

        // Configura visibilidade dos menus baseado no perfil
        this.setupMenuVisibility(user.tipo);

        // Mostra dashboard com transição
        const loginScreen = document.getElementById('login-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        
        if (loginScreen && dashboardScreen) {
            loginScreen.classList.remove('active');
            dashboardScreen.classList.add('active');
        }

        // Carrega dashboard
        this.navigateToSection('dashboard');
        
        // Atualiza notificações
        this.updateNotificationCount();
        
        console.log('Dashboard exibido para:', user.nome);
    }

    /**
     * Configura visibilidade dos menus
     */
    setupMenuVisibility(userType) {
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        const adminLibrarianElements = document.querySelectorAll('.admin-librarian');

        // Esconde todos primeiro
        adminOnlyElements.forEach(el => el.style.display = 'none');
        adminLibrarianElements.forEach(el => el.style.display = 'none');

        // Mostra baseado no tipo de usuário
        if (userType === 'Administrador') {
            adminOnlyElements.forEach(el => el.style.display = 'block');
            adminLibrarianElements.forEach(el => el.style.display = 'block');
        } else if (userType === 'Bibliotecário') {
            adminLibrarianElements.forEach(el => el.style.display = 'block');
        }
    }

    /**
     * Atualiza elemento do DOM
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Mostra alerta
     */
    showAlert(message, type = 'info') {
        // Remove alertas existentes
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Cria novo alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)}"></i>
            ${message}
        `;

        // Adiciona ao body
        document.body.appendChild(alert);

        // Posiciona o alerta
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';

        // Remove após 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    /**
     * Obtém ícone do alerta
     */
    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            danger: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Atualiza contador de notificações
     */
    updateNotificationCount() {
        const user = window.authManager.getCurrentUser();
        if (!user) return;

        const notifications = window.dataStorage.getNotifications();
        const userNotifications = notifications.filter(n => 
            !n.idUsuario || n.idUsuario === user.id
        );
        const unreadCount = userNotifications.filter(n => !n.lida).length;

        const badge = document.getElementById('notification-count');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline' : 'none';
        }
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Formata data e hora para exibição
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    /**
     * Calcula dias entre datas
     */
    daysBetween(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round((secondDate - firstDate) / oneDay);
    }

    /**
     * Carrega seção de usuários
     */
    loadUsersSection() {
        if (window.userManagement) {
            window.userManagement.loadUsersSection();
        }
    }

    /**
     * Carrega seção de acervos
     */
    loadAssetsSection() {
        if (window.assetManagement) {
            window.assetManagement.loadAssetsSection();
        }
    }

    loadLoansSection() {
        if (window.loanManagement) {
            window.loanManagement.loadLoansSection();
        }
    }

    loadReservationsSection() {
        if (window.reservationManagement) {
            window.reservationManagement.loadReservationsSection();
        }
    }

    loadSearchSection() {
        console.log('Carregando seção de pesquisa...');
    }

    loadNotificationsSection() {
        console.log('Carregando seção de notificações...');
    }

    loadReportsSection() {
        console.log('Carregando seção de relatórios...');
    }
}

// Instância global do UIManager
window.uiManager = new UIManager();
