import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';
import { AcervoModule } from './acervos.js';

// --- Módulo de Empréstimos (emprestimos.js) ---
// OBJETIVO: Gerenciar o registro de novos empréstimos e a devolução de itens.
export const EmprestimoModule = {
    // 1. Mapear os elementos do DOM
    form: document.getElementById('loan-form'),
    list: document.getElementById('loan-list'),
    userSelect: document.getElementById('loanUser'),
    itemSelect: document.getElementById('loanItem'),

    init() {
        // 2. Adicionar os 'event listeners'
        //    - Criar o listener para o 'submit' do formulário (chamar handleSave)
        //    - Criar um listener de 'click' na lista para capturar a ação de devolução (chamar handleReturn)
        console.log('Módulo de Empréstimos inicializado (desenvolvimento pendente).');
    },

    render() {
        // 3. Implementar a lógica para renderizar a tela
        //    - Chamar a função populateSelects() para preencher os menus de usuário e item.
        //    - Limpar a lista de empréstimos ativos (this.list.innerHTML = '')
        //    - Pegar os empréstimos ativos de DataService.getActiveLoans()
        //    - Para cada empréstimo, buscar o nome do usuário e o título do item.
        //    - Criar o HTML da linha e adicionar na lista.
        //    - Verificar se o empréstimo está atrasado para aplicar a estilização de data.
        this.list.innerHTML = `<tr><td colspan="5" class="placeholder-message">O desenvolvimento do módulo de empréstimos está pendente.</td></tr>`;
        this.populateSelects();
    },

    // 4. Criar as funções auxiliares
    populateSelects() {
        //    - Preencher o select de usuários (this.userSelect) com os usuários não-suspensos.
        //    - Preencher o select de itens (this.itemSelect) com os itens que têm cópias disponíveis.
        this.userSelect.innerHTML = '<option>Carregando...</option>';
        this.itemSelect.innerHTML = '<option>Carregando...</option>';
    },

    handleSave(e) {
        //    - Prevenir o default, ler os dados do form (userId, itemId).
        //    - Aplicar as regras de negócio (limite de empréstimos, usuário suspenso, etc.).
        //    - Criar um objeto 'loan' e chamar DataService.addLoan().
        //    - Chamar this.render() e AcervoModule.render() para atualizar as telas.
    },

    handleReturn(e) {
        //    - Identificar o ID do empréstimo a ser devolvido.
        //    - Chamar UIService.showModal() para confirmar a devolução.
        //    - No callback do modal, chamar DataService.returnLoan(loanId).
        //    - Verificar se há reservas para o item devolvido e mostrar um alerta.
        //    - Chamar this.render() e AcervoModule.render().
    }
};

