import { DataService } from '../services/dataService.js';

// --- Módulo de Relatórios (relatorios.js) ---
// OBJETIVO: Exibir dados consolidados, como itens mais emprestados e usuários com atrasos.
export const RelatorioModule = {
    topItemsList: document.getElementById('report-top-items'),
    overdueUsersList: document.getElementById('report-overdue-users'),
    
    init() {
        // Módulo apenas de exibição, sem interações complexas.
    },

    render() {
        // Ao renderizar a view de relatórios, chama as funções para popular cada tabela.
        this.renderTopItems();
        this.renderOverdueUsers();
    },

    /**
     * Calcula e exibe os 5 itens mais emprestados da biblioteca.
     */
    renderTopItems() {
        this.topItemsList.innerHTML = '';
        const allLoans = DataService.getLoans();
        
        if (allLoans.length === 0) {
             this.topItemsList.innerHTML = `<tr><td colspan="2" class="placeholder-message">Nenhum empréstimo registrado para gerar o relatório.</td></tr>`;
             return;
        }

        // Conta a frequência de cada itemId nos empréstimos
        const loanCounts = allLoans.reduce((acc, loan) => {
            acc[loan.itemId] = (acc[loan.itemId] || 0) + 1;
            return acc;
        }, {});

        // Mapeia os IDs para objetos de item, ordena por contagem e pega os 5 primeiros
        const sortedItems = Object.keys(loanCounts)
            .map(itemId => ({ item: DataService.findItemById(itemId), count: loanCounts[itemId] }))
            .filter(data => data.item) // Garante que o item não foi excluído
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Pega o Top 5

        if (sortedItems.length === 0) {
            this.topItemsList.innerHTML = `<tr><td colspan="2" class="placeholder-message">Não há dados de empréstimos de itens existentes.</td></tr>`;
            return;
        }
        
        sortedItems.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${data.item.title}</td><td>${data.count}</td>`;
            this.topItemsList.appendChild(row);
        });
    },

    /**
     * Calcula e exibe os usuários que estão com empréstimos em atraso.
     */
    renderOverdueUsers() {
        this.overdueUsersList.innerHTML = '';
        const today = new Date();
        // Filtra apenas os empréstimos ativos cuja data de devolução já passou
        const overdueLoans = DataService.getActiveLoans().filter(l => today > new Date(l.dueDate));

        if (overdueLoans.length === 0) {
            this.overdueUsersList.innerHTML = `<tr><td colspan="2" class="placeholder-message">Nenhum usuário com atraso no momento.</td></tr>`;
            return;
        }
        
        // Ordena por dias em atraso (do maior para o menor)
        overdueLoans.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        overdueLoans.forEach(loan => {
            const user = DataService.findUserById(loan.userId);
            if (!user) return; // Pula se o usuário associado ao empréstimo foi excluído

            // Calcula a diferença em dias entre hoje e a data de devolução
            const overdueDays = Math.floor((today - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
            
            const row = document.createElement('tr');
            row.innerHTML = `<td>${user.name}</td><td>${overdueDays} dia(s)</td>`;
            this.overdueUsersList.appendChild(row);
        });
    }
};