import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';
import { AcervoModule } from './acervos.js';
import { ReservaModule } from './reservas.js';

// --- Módulo de Empréstimos (emprestimos.js) ---
export const EmprestimoModule = {
    form: document.getElementById('loan-form'),
    list: document.getElementById('loan-list'),
    userSelect: document.getElementById('loanUser'),
    itemSelect: document.getElementById('loanItem'),

    init() {
        this.form.addEventListener('submit', this.handleSave.bind(this));
        this.list.addEventListener('click', this.handleListActions.bind(this));
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
            // --- CORREÇÃO CRÍTICA AQUI ---
            // O erro estava aqui: usava findUserById em vez de findItemById para encontrar o item.
            const item = DataService.findItemById(loan.itemId); 
            
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
                    <button data-id="${loan.id}" data-action="return" class="btn btn-success">Devolver</button>
                    <button data-id="${loan.id}" data-action="postpone" class="btn btn-secondary">Adiar</button>
                </td>
            `;
            this.list.appendChild(row);
        });
    },

    populateSelects() {
        this.userSelect.innerHTML = '<option value="">Selecione um usuário...</option>';
        DataService.getUsers().filter(u => !u.suspended).forEach(user => {
            this.userSelect.innerHTML += `<option value="${user.id}">${user.name} - ${user.matricula}</option>`;
        });

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

        const userLoansCount = DataService.getActiveLoans().filter(l => l.userId === userId).length;
        if (userLoansCount >= 3) {
            UIService.showFeedback('Este usuário já atingiu o limite de 3 empréstimos ativos.', 'error');
            return;
        }

        const loanDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(loanDate.getDate() + 14);

        const loan = {
            userId,
            itemId,
            loanDate: loanDate.toISOString(),
            dueDate: dueDate.toISOString(),
            returnDate: null
        };

        DataService.addLoan(loan);
        UIService.showFeedback('Empréstimo registrado com sucesso!', 'success');
        
        this.render();
        AcervoModule.render();
        this.form.reset();
    },

    handleListActions(e) {
        const button = e.target.closest('button[data-id]');
        if (!button) return;

        const { id, action } = button.dataset;

        if (action === 'return') {
            this.handleReturn(id);
        }

        if (action === 'postpone') {
            this.handlePostpone(id);
        }
    },

    handleReturn(loanId) {
        const loan = DataService.getLoans().find(l => l.id === loanId);
        const item = DataService.findItemById(loan.itemId);

        UIService.showModal('Confirmar Devolução', `Deseja registrar a devolução do item "${item.title}"?`, () => {
            DataService.returnLoan(loanId);
            
            const reservations = DataService.getItemReservations(loan.itemId);
            if (reservations.length > 0) {
                const nextUserInLine = DataService.findUserById(reservations[0].userId);
                DataService.removeReservation(reservations[0].id); // Ajuste para remover por ID da reserva
                UIService.showFeedback(`Devolvido! O item agora está disponível para ${nextUserInLine.name}.`, 'success');
                ReservaModule.render();
            } else {
                 UIService.showFeedback('Devolução registrada com sucesso!', 'success');
            }
            
            this.render();
            AcervoModule.render();
        });
    },

    handlePostpone(loanId) {
        UIService.showModal('Adiar Devolução', 'Deseja adiar a devolução deste item por mais 7 dias?', () => {
            DataService.postponeReturn(loanId, 7);
            UIService.showFeedback('Devolução adiada com sucesso!', 'success');
            this.render();
        });
    }
};