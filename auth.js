/**
 * Módulo de Autenticação
 * Gerencia login, logout e controle de sessão
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'biblioteca_session';
        this.loadSession();
    }

    /**
     * Carrega sessão do localStorage
     */
    loadSession() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            if (session) {
                const sessionData = JSON.parse(session);
                // Verifica se a sessão não expirou (24 horas)
                const now = new Date().getTime();
                const sessionTime = new Date(sessionData.timestamp).getTime();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.currentUser = sessionData.user;
                    return true;
                } else {
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar sessão:', error);
            this.clearSession();
        }
        return false;
    }

    /**
     * Salva sessão no localStorage
     */
    saveSession(user) {
        try {
            const sessionData = {
                user: user,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
            return false;
        }
    }

    /**
     * Limpa sessão
     */
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
    }

    /**
     * Realiza login
     */
    login(email, password) {
        try {
            const user = window.dataStorage.getUserByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuário não encontrado'
                };
            }

            // Verificação simples de senha (em produção seria hash)
            if (user.senha !== password) {
                return {
                    success: false,
                    message: 'Senha incorreta'
                };
            }

            // Verifica se o usuário está ativo
            if (user.status !== 'Ativo') {
                return {
                    success: false,
                    message: 'Usuário suspenso. Entre em contato com a administração.'
                };
            }

            // Login bem-sucedido
            this.currentUser = user;
            this.saveSession(user);

            // Registra log de acesso
            this.logAccess(user);

            return {
                success: true,
                message: 'Login realizado com sucesso',
                user: user
            };

        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                message: 'Erro interno do sistema'
            };
        }
    }

    /**
     * Realiza logout
     */
    logout() {
        if (this.currentUser) {
            this.logAccess(this.currentUser, 'logout');
        }
        
        this.clearSession();
        return {
            success: true,
            message: 'Logout realizado com sucesso'
        };
    }

    /**
     * Verifica se o usuário está logado
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Obtém o usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verifica se o usuário tem permissão para uma ação
     */
    hasPermission(action) {
        if (!this.currentUser) {
            return false;
        }

        const userType = this.currentUser.tipo;
        const permissions = this.getPermissions(userType);
        
        return permissions.includes(action);
    }

    /**
     * Obtém permissões por tipo de usuário
     */
    getPermissions(userType) {
        const permissionsMap = {
            'Administrador': [
                'manage_users',
                'manage_assets',
                'manage_loans',
                'manage_reservations',
                'view_reports',
                'manage_system',
                'search_catalog',
                'view_notifications'
            ],
            'Bibliotecário': [
                'manage_assets',
                'manage_loans',
                'manage_reservations',
                'view_reports',
                'search_catalog',
                'view_notifications'
            ],
            'Aluno': [
                'search_catalog',
                'view_notifications',
                'make_reservations'
            ],
            'Professor': [
                'search_catalog',
                'view_notifications',
                'make_reservations'
            ],
            'Colaborador': [
                'search_catalog',
                'view_notifications',
                'make_reservations'
            ]
        };

        return permissionsMap[userType] || [];
    }

    /**
     * Verifica se é administrador
     */
    isAdmin() {
        return this.currentUser && this.currentUser.tipo === 'Administrador';
    }

    /**
     * Verifica se é bibliotecário
     */
    isLibrarian() {
        return this.currentUser && this.currentUser.tipo === 'Bibliotecário';
    }

    /**
     * Verifica se é administrador ou bibliotecário
     */
    isAdminOrLibrarian() {
        return this.isAdmin() || this.isLibrarian();
    }

    /**
     * Atualiza dados do usuário atual
     */
    updateCurrentUser(userData) {
        if (this.currentUser) {
            const updatedUser = window.dataStorage.updateUser(this.currentUser.id, userData);
            if (updatedUser) {
                this.currentUser = updatedUser;
                this.saveSession(updatedUser);
                return true;
            }
        }
        return false;
    }

    /**
     * Registra log de acesso
     */
    logAccess(user, action = 'login') {
        try {
            const logEntry = {
                userId: user.id,
                userName: user.nome,
                userType: user.tipo,
                action: action,
                timestamp: new Date().toISOString(),
                ip: 'localhost' // Em um ambiente real, seria obtido do servidor
            };

            // Salva no localStorage (em produção seria enviado para servidor)
            const logs = JSON.parse(localStorage.getItem('biblioteca_access_logs') || '[]');
            logs.unshift(logEntry);
            
            // Mantém apenas os últimos 100 logs
            if (logs.length > 100) {
                logs.splice(100);
            }
            
            localStorage.setItem('biblioteca_access_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Erro ao registrar log de acesso:', error);
        }
    }

    /**
     * Obtém logs de acesso
     */
    getAccessLogs() {
        try {
            return JSON.parse(localStorage.getItem('biblioteca_access_logs') || '[]');
        } catch (error) {
            console.error('Erro ao obter logs de acesso:', error);
            return [];
        }
    }

    /**
     * Valida força da senha
     */
    validatePasswordStrength(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const score = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ].filter(Boolean).length;

        let strength = 'Muito Fraca';
        let color = '#dc2626';

        if (score >= 4) {
            strength = 'Forte';
            color = '#059669';
        } else if (score >= 3) {
            strength = 'Média';
            color = '#d97706';
        } else if (score >= 2) {
            strength = 'Fraca';
            color = '#dc2626';
        }

        return {
            score,
            strength,
            color,
            isValid: score >= 2
        };
    }

    /**
     * Gera senha temporária
     */
    generateTemporaryPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Solicita redefinição de senha
     */
    requestPasswordReset(email) {
        const user = window.dataStorage.getUserByEmail(email);
        
        if (!user) {
            return {
                success: false,
                message: 'E-mail não encontrado'
            };
        }

        // Gera nova senha temporária
        const tempPassword = this.generateTemporaryPassword();
        
        // Atualiza usuário com senha temporária
        const updated = window.dataStorage.updateUser(user.id, {
            senha: tempPassword,
            senhaTemporaria: true,
            dataResetSenha: new Date().toISOString()
        });

        if (updated) {
            // Em um sistema real, enviaria por e-mail
            // Aqui vamos simular com uma notificação
            window.dataStorage.addNotification({
                idUsuario: user.id,
                tipo: 'info',
                titulo: 'Senha Redefinida',
                mensagem: `Sua nova senha temporária é: ${tempPassword}. Altere-a no próximo login.`,
                categoria: 'sistema'
            });

            return {
                success: true,
                message: 'Nova senha enviada para seu e-mail',
                tempPassword: tempPassword // Apenas para demonstração
            };
        }

        return {
            success: false,
            message: 'Erro ao redefinir senha'
        };
    }

    /**
     * Altera senha do usuário
     */
    changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return {
                success: false,
                message: 'Usuário não logado'
            };
        }

        // Verifica senha atual (exceto se for temporária)
        if (!this.currentUser.senhaTemporaria && this.currentUser.senha !== currentPassword) {
            return {
                success: false,
                message: 'Senha atual incorreta'
            };
        }

        // Valida nova senha
        const validation = this.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            return {
                success: false,
                message: 'Nova senha muito fraca. Use pelo menos 6 caracteres com letras e números.'
            };
        }

        // Atualiza senha
        const updated = window.dataStorage.updateUser(this.currentUser.id, {
            senha: newPassword,
            senhaTemporaria: false,
            dataAlteracaoSenha: new Date().toISOString()
        });

        if (updated) {
            this.currentUser = updated;
            this.saveSession(updated);

            return {
                success: true,
                message: 'Senha alterada com sucesso'
            };
        }

        return {
            success: false,
            message: 'Erro ao alterar senha'
        };
    }
}

// Instância global do AuthManager
window.authManager = new AuthManager();
