/**
 * Aplicação Principal - Biblioteca+
 * Inicializa e coordena todos os módulos do sistema
 */

class BibliotecaApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        
        this.init();
    }

    /**
     * Inicializa a aplicação
     */
    init() {
        // Aguarda o DOM estar carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.delayedStartup();
            });
        } else {
            this.delayedStartup();
        }
    }

    /**
     * Inicia a aplicação com delay para garantir que todos os scripts foram carregados
     */
    delayedStartup() {
        // Aguarda um pouco para garantir que todos os scripts foram executados
        setTimeout(() => {
            this.startup();
        }, 100);
    }

    /**
     * Inicia a aplicação
     */
    startup() {
        try {
            console.log(`Iniciando Biblioteca+ v${this.version}`);
            
            // Verifica se os módulos necessários estão disponíveis
            this.checkDependencies();
            
            // Inicializa dados se necessário
            this.initializeData();
            
            // Verifica sessão ativa
            this.checkSession();
            
            // Configura handlers globais
            this.setupGlobalHandlers();
            
            // Inicia tarefas em background
            this.startBackgroundTasks();
            
            this.initialized = true;
            console.log('Biblioteca+ inicializada com sucesso');
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showCriticalError('Erro ao inicializar o sistema. Recarregue a página.');
        }
    }

    /**
     * Verifica dependências necessárias
     */
    checkDependencies() {
        const requiredModules = [
            'dataStorage',
            'authManager',
            'uiManager'
        ];

        const missingModules = requiredModules.filter(module => !window[module]);
        
        if (missingModules.length > 0) {
            throw new Error(`Módulos não encontrados: ${missingModules.join(', ')}`);
        }
    }

    /**
     * Inicializa dados se necessário
     */
    initializeData() {
        // Verifica se é a primeira execução
        const isFirstRun = !localStorage.getItem('biblioteca_initialized');
        
        if (isFirstRun) {
            console.log('Primeira execução detectada, inicializando dados...');
            
            // Marca como inicializado
            localStorage.setItem('biblioteca_initialized', 'true');
            localStorage.setItem('biblioteca_install_date', new Date().toISOString());
            
            // Adiciona notificação de boas-vindas
            window.dataStorage.addNotification({
                tipo: 'success',
                titulo: 'Bem-vindo ao Biblioteca+',
                mensagem: 'Sistema inicializado com sucesso. Explore as funcionalidades disponíveis.',
                categoria: 'sistema'
            });
        }
    }

    /**
     * Verifica sessão ativa
     */
    checkSession() {
        if (window.authManager.isLoggedIn()) {
            console.log('Sessão ativa encontrada');
            window.uiManager.showDashboard();
        } else {
            console.log('Nenhuma sessão ativa');
            window.uiManager.showLogin();
        }
    }

    /**
     * Configura handlers globais
     */
    setupGlobalHandlers() {
        // Handler para erros JavaScript não capturados
        window.addEventListener('error', (event) => {
            console.error('Erro não capturado:', event.error);
            this.logError(event.error);
        });

        // Handler para promises rejeitadas não capturadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada não capturada:', event.reason);
            this.logError(event.reason);
        });

        // Handler para mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onPageVisible();
            } else {
                this.onPageHidden();
            }
        });

        // Handler para antes de sair da página
        window.addEventListener('beforeunload', (event) => {
            this.onBeforeUnload(event);
        });

        // Handler para redimensionamento da janela
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }

    /**
     * Inicia tarefas em background
     */
    startBackgroundTasks() {
        // Verifica empréstimos atrasados a cada 5 minutos
        setInterval(() => {
            this.checkOverdueLoans();
        }, 5 * 60 * 1000);

        // Verifica reservas expiradas a cada 10 minutos
        setInterval(() => {
            this.checkExpiredReservations();
        }, 10 * 60 * 1000);

        // Atualiza estatísticas a cada minuto
        setInterval(() => {
            this.updateStatistics();
        }, 60 * 1000);

        // Execução inicial
        setTimeout(() => {
            this.checkOverdueLoans();
            this.checkExpiredReservations();
        }, 1000);
    }

    /**
     * Verifica empréstimos atrasados
     */
    checkOverdueLoans() {
        try {
            const loans = window.dataStorage.getLoans();
            const now = new Date();
            
            loans.forEach(loan => {
                if (loan.status === 'Ativo') {
                    const dueDate = new Date(loan.dataPrevistaDevolucao);
                    
                    if (dueDate < now && loan.status !== 'Atrasado') {
                        // Marca como atrasado
                        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
                        const settings = window.dataStorage.getSettings();
                        const fine = daysOverdue * settings.multaPorDia;
                        
                        window.dataStorage.updateLoan(loan.id, {
                            status: 'Atrasado',
                            multa: fine
                        });

                        // Cria notificação de atraso
                        window.dataStorage.addNotification({
                            idUsuario: loan.idUsuario,
                            tipo: 'warning',
                            titulo: 'Empréstimo Atrasado',
                            mensagem: `Seu empréstimo está atrasado há ${daysOverdue} dia(s). Multa atual: R$ ${fine.toFixed(2)}`,
                            categoria: 'emprestimo'
                        });

                        console.log(`Empréstimo ${loan.id} marcado como atrasado`);
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao verificar empréstimos atrasados:', error);
        }
    }

    /**
     * Verifica reservas expiradas
     */
    checkExpiredReservations() {
        try {
            const reservations = window.dataStorage.getReservations();
            const now = new Date();
            const settings = window.dataStorage.getSettings();
            
            reservations.forEach(reservation => {
                if (reservation.status === 'Disponível para Retirada' && reservation.dataDisponibilidade) {
                    const availableDate = new Date(reservation.dataDisponibilidade);
                    const hoursElapsed = (now - availableDate) / (1000 * 60 * 60);
                    
                    if (hoursElapsed > settings.horasReserva) {
                        // Expira a reserva
                        window.dataStorage.updateReservation(reservation.id, {
                            status: 'Expirada'
                        });

                        // Libera o exemplar
                        const asset = window.dataStorage.getAssetById(reservation.idAcervo);
                        if (asset) {
                            const availableExemplar = asset.exemplares.find(ex => ex.status === 'Reservado');
                            if (availableExemplar) {
                                availableExemplar.status = 'Disponível';
                                window.dataStorage.updateAsset(asset.id, asset);
                            }
                        }

                        // Notifica o usuário
                        window.dataStorage.addNotification({
                            idUsuario: reservation.idUsuario,
                            tipo: 'warning',
                            titulo: 'Reserva Expirada',
                            mensagem: 'Sua reserva expirou por não ter sido retirada no prazo de 24 horas.',
                            categoria: 'reserva'
                        });

                        console.log(`Reserva ${reservation.id} expirada`);
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao verificar reservas expiradas:', error);
        }
    }

    /**
     * Atualiza estatísticas
     */
    updateStatistics() {
        if (window.uiManager.currentSection === 'dashboard') {
            window.uiManager.loadDashboard();
        }
        
        // Atualiza contador de notificações
        window.uiManager.updateNotificationCount();
    }

    /**
     * Quando a página fica visível
     */
    onPageVisible() {
        console.log('Página ficou visível');
        
        // Atualiza dados se necessário
        this.updateStatistics();
        
        // Verifica se a sessão ainda é válida
        if (window.authManager.isLoggedIn()) {
            const sessionValid = window.authManager.loadSession();
            if (!sessionValid) {
                window.uiManager.showAlert('Sessão expirada. Faça login novamente.', 'warning');
                window.uiManager.showLogin();
            }
        }
    }

    /**
     * Quando a página fica oculta
     */
    onPageHidden() {
        console.log('Página ficou oculta');
        // Pode ser usado para pausar operações desnecessárias
    }

    /**
     * Antes de sair da página
     */
    onBeforeUnload(event) {
        // Salva dados pendentes se houver
        // Em uma aplicação real, poderia verificar se há alterações não salvas
    }

    /**
     * Quando a janela é redimensionada
     */
    onWindowResize() {
        // Pode ser usado para ajustar layout responsivo se necessário
    }

    /**
     * Registra erro no sistema
     */
    logError(error) {
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: error.message || error.toString(),
                stack: error.stack || '',
                url: window.location.href,
                userAgent: navigator.userAgent,
                userId: window.authManager.getCurrentUser()?.id || 'anonymous'
            };

            // Salva no localStorage (em produção seria enviado para servidor)
            const logs = JSON.parse(localStorage.getItem('biblioteca_error_logs') || '[]');
            logs.unshift(errorLog);
            
            // Mantém apenas os últimos 50 logs
            if (logs.length > 50) {
                logs.splice(50);
            }
            
            localStorage.setItem('biblioteca_error_logs', JSON.stringify(logs));
        } catch (logError) {
            console.error('Erro ao registrar log:', logError);
        }
    }

    /**
     * Mostra erro crítico
     */
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
        `;
        
        errorDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2>Erro Crítico</h2>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Recarregar Página</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Obtém informações do sistema
     */
    getSystemInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            userAgent: navigator.userAgent,
            localStorage: {
                available: typeof Storage !== 'undefined',
                used: this.getLocalStorageUsage()
            },
            currentUser: window.authManager.getCurrentUser(),
            dataStats: {
                users: window.dataStorage.getUsers().length,
                assets: window.dataStorage.getAssets().length,
                loans: window.dataStorage.getLoans().length,
                reservations: window.dataStorage.getReservations().length,
                notifications: window.dataStorage.getNotifications().length
            }
        };
    }

    /**
     * Calcula uso do localStorage
     */
    getLocalStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return {
            bytes: total,
            kb: (total / 1024).toFixed(2),
            mb: (total / (1024 * 1024)).toFixed(2)
        };
    }

    /**
     * Exporta dados do sistema
     */
    exportSystemData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: this.version,
            data: window.dataStorage.exportData(),
            logs: {
                access: window.authManager.getAccessLogs(),
                errors: JSON.parse(localStorage.getItem('biblioteca_error_logs') || '[]')
            }
        };
        
        return data;
    }

    /**
     * Importa dados do sistema
     */
    importSystemData(data) {
        try {
            if (data.data) {
                return window.dataStorage.importData(data.data);
            }
            return false;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Reset completo do sistema
     */
    resetSystem() {
        if (confirm('Tem certeza que deseja resetar todo o sistema? Esta ação não pode ser desfeita.')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Inicializa a aplicação
window.bibliotecaApp = new BibliotecaApp();

// Expõe funções úteis globalmente para debug
window.debugBiblioteca = {
    getSystemInfo: () => window.bibliotecaApp.getSystemInfo(),
    exportData: () => window.bibliotecaApp.exportSystemData(),
    importData: (data) => window.bibliotecaApp.importSystemData(data),
    resetSystem: () => window.bibliotecaApp.resetSystem(),
    checkOverdueLoans: () => window.bibliotecaApp.checkOverdueLoans(),
    checkExpiredReservations: () => window.bibliotecaApp.checkExpiredReservations()
};
