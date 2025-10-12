import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';
import { AcervoModule } from './acervos.js';
import { ReservaModule } from './reservas.js';

// --- Módulo de Empréstimos (emprestimos.js) ---
// OBJETIVO: Gerenciar o registro de novos empréstimos e a devolução de itens.
export const EmprestimoModule = {
    form: document.getElementById('loan-form'),
    list: document.getElementById('loan-list'),
    userSelect: document.getElementById('loanUser'),
    itemSelect: document.getElementById('loanItem'),

    init() {
        // Adiciona os listeners para o formulário e para a lista de empréstimos
        this.form.addEventListener('submit', this.handleSave.bind(this));
        this.list.addEventListener('click', this.handleReturn.bind(this));
    },

    render() {
        this.populateSelects();
        this.list.innerHTML = '';
        const activeLoans = DataService.getActiveLoans();

        if (activeLoans.length === 0) {
            this.list.innerHTML = `<tr><td colspan="5" class="placeholder-message">Nenhum empréstimo ativo no momento.</td></tr>`;
            return;
        }

        activeLoans.forEach(loan => {
            const user = DataService.findUserById(loan.userId);
            const item = DataService.findItemById(loan.itemId);
            
            // Se o usuário ou item associado ao empréstimo foi deletado, não renderiza
            if (!user || !item) return;

            const dueDate = new Date(loan.dueDate);
            const isOverdue = new Date() > dueDate;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${item.title}</td>
                <td>${new Date(loan.loanDate).toLocaleDateString()}</td>
                <td class="${isOverdue ? 'date-overdue' : ''}">${dueDate.toLocaleDateString()}</td>
                <td>
                    <button data-id="${loan.id}" class="btn btn-success">Devolver</button>
                </td>
            `;
            this.list.appendChild(row);
        });
    },

    populateSelects() {
        // Popula o select de usuários com usuários que não estão suspensos
        this.userSelect.innerHTML = '<option value="">Selecione um usuário...</option>';
        DataService.getUsers().filter(u => !u.suspended).forEach(user => {
            this.userSelect.innerHTML += `<option value="${user.id}">${user.name} - ${user.matricula}</option>`;
        });

        // Popula o select de itens com aqueles que têm exemplares disponíveis
        this.itemSelect.innerHTML = '<option value="">Selecione um item...</option>';
        DataService.getItems().filter(item => DataService.getItemAvailability(item) > 0).forEach(item => {
            this.itemSelect.innerHTML += `<option value="${item.id}">${item.title}</option>`;
        });
    },

    handleSave(e) {
        e.preventDefault();
        const userId = this.userSelect.value;
        const itemId = this.itemSelect.value;

        if (!userId || !itemId) {
            UIService.showFeedback('Por favor, selecione um usuário e um item.', 'error');
            return;
        }

        // Regra de negócio: Limite de 3 empréstimos por usuário
        const userLoansCount = DataService.getActiveLoans().filter(l => l.userId === userId).length;
        if (userLoansCount >= 3) {
            UIService.showFeedback('Este usuário já atingiu o limite de 3 empréstimos ativos.', 'error');
            return;
        }

        const loanDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(loanDate.getDate() + 14); // Prazo de devolução de 14 dias

        const loan = {
            userId,
            itemId,
            loanDate: loanDate.toISOString(),
            dueDate: dueDate.toISOString(),
            returnDate: null
        };

        DataService.addLoan(loan);
        UIService.showFeedback('Empréstimo registrado com sucesso!', 'success');
        
        this.render(); // Atualiza a lista de empréstimos
        AcervoModule.render(); // Atualiza o status de disponibilidade no acervo
        this.form.reset();
    },

    handleReturn(e) {
        const button = e.target.closest('button[data-id]');
        if (!button) return;

        const loanId = button.dataset.id;
        const loan = DataService.getLoans().find(l => l.id === loanId);
        const item = DataService.findItemById(loan.itemId);

        UIService.showModal('Confirmar Devolução', `Deseja registrar a devolução do item "${item.title}"?`, () => {
            DataService.returnLoan(loanId);
            
            // Verifica se há reservas para o item devolvido
            const reservations = DataService.getItemReservations(loan.itemId);
            if (reservations.length > 0) {
                const nextUserInLine = DataService.findUserById(reservations[0].userId);
                // Remove a reserva atendida
                DataService.removeReservation(loan.itemId, nextUserInLine.id);
                UIService.showFeedback(`Devolvido! O item agora está disponível para ${nextUserInLine.name}.`, 'success');
                ReservaModule.render(); // Atualiza a lista de reservas
            } else {
                 UIService.showFeedback('Devolução registrada com sucesso!', 'success');
            }
            
            this.render();
            AcervoModule.render();
        });
    }
};