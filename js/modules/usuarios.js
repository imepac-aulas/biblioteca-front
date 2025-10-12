import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';

// --- Módulo de Usuários (usuarios.js) ---
// ESTE É O EXEMPLO COMPLETO DE COMO UM MÓDULO DEVE SER.
export const UserModule = {
    // 1. Mapear os elementos do DOM com os quais este módulo interage.
    form: document.getElementById('user-form'),
    list: document.getElementById('user-list'),

    // 2. A função init() é chamada uma vez, no início, para configurar os event listeners.
    init() {
        this.form.addEventListener('submit', this.handleSave.bind(this));
        this.form.querySelector('#cancel-user').addEventListener('click', () => this.clearForm());
        this.list.addEventListener('click', this.handleActions.bind(this));
    },

    // 3. A função render() é responsável por desenhar os dados na tela. É chamada sempre que a view é exibida.
    render() {
        this.list.innerHTML = '';
        DataService.getUsers().forEach(user => {
            const statusClass = user.suspended ? 'status-suspended' : 'status-active';
            const statusText = user.suspended ? 'Suspenso' : 'Ativo';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.matricula}</td>
                <td>${user.type}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button data-id="${user.id}" data-action="edit" class="btn-icon btn-edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button data-id="${user.id}" data-action="delete" class="btn-icon btn-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            this.list.appendChild(row);
        });
    },

    // 4. Funções auxiliares que tratam a lógica dos eventos.
    handleSave(e) {
        e.preventDefault();
        const id = this.form.userId.value;
        const user = {
            id: id,
            name: this.form.userName.value,
            type: this.form.userType.value,
            matricula: this.form.userMatricula.value,
            email: this.form.userEmail.value,
            suspended: DataService.findUserById(id)?.suspended || false,
        };

        if (id) {
            DataService.updateUser(user);
        } else {
            DataService.addUser(user);
        }
        
        this.render();
        this.clearForm();
    },

    handleActions(e) {
        const button = e.target.closest('button');
        if (!button) return;
        const { id, action } = button.dataset;

        if (action === 'edit') {
            const user = DataService.findUserById(id);
            this.form.userId.value = user.id;
            this.form.userName.value = user.name;
            this.form.userType.value = user.type;
            this.form.userMatricula.value = user.matricula;
            this.form.userEmail.value = user.email;
            this.form.scrollIntoView({ behavior: 'smooth' });
        }
        if (action === 'delete') {
            const loans = DataService.getActiveLoans().filter(l => l.userId === id);
            if (loans.length > 0) {
                alert('Não é possível excluir usuário com empréstimos ativos.');
                return;
            }
            UIService.showModal('Excluir Usuário', `Deseja realmente excluir o usuário?`, () => {
                DataService.deleteUser(id);
                this.render();
            });
        }
    },
    
    clearForm() { this.form.reset(); this.form.userId.value = ''; }
};

