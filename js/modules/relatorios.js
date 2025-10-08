import { DataService } from '../services/dataService.js';

// --- Módulo de Relatórios (relatorios.js) ---
// OBJETIVO: Exibir dados consolidados, como itens mais emprestados e usuários com atrasos.
export const RelatorioModule = {
    // 1. Mapear os elementos do DOM
    topItemsList: document.getElementById('report-top-items'),
    overdueUsersList: document.getElementById('report-overdue-users'),
    
    init() {
        // Módulo apenas de exibição, sem interações complexas.
        console.log('Módulo de Relatórios inicializado (desenvolvimento pendente).');
    },

    render() {
        // 2. Implementar a lógica de renderização para cada relatório.

        // Relatório de Itens mais emprestados:
        //    - Processar todos os empréstimos de DataService.getLoans() para contar quantas vezes cada item foi emprestado.
        //    - Ordenar os itens pelo número de empréstimos.
        //    - Pegar os 5 primeiros (Top 5).
        //    - Limpar a lista this.topItemsList e preenchê-la com os dados.
        this.topItemsList.innerHTML = `<tr><td colspan="2" class="placeholder-message">Desenvolvimento pendente.</td></tr>`;

        // Relatório de usuários com atraso:
        //    - Pegar os empréstimos ativos de DataService.getActiveLoans().
        //    - Filtrar apenas os que estão atrasados (new Date() > new Date(loan.dueDate)).
        //    - Limpar a lista this.overdueUsersList.
        //    - Para cada empréstimo atrasado, buscar os dados do usuário e calcular os dias de atraso.
        //    - Preencher a lista com os dados.
        this.overdueUsersList.innerHTML = `<tr><td colspan="2" class="placeholder-message">Desenvolvimento pendente.</td></tr>`;
    }
};

