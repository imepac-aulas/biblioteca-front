import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';
import { ReservaModule } from './reservas.js';
import { EmprestimoModule } from './emprestimos.js'; // Importado para atualizar a lista de empréstimos

// --- Módulo de Acervos (acervos.js) ---
// OBJETIVO: Gerenciar o cadastro, edição, exclusão e listagem de itens do acervo.
export const AcervoModule = {
    form: document.getElementById('item-form'),
    list: document.getElementById('item-list'),
    search: document.getElementById('search-item'),
    
    init() {
        // Adiciona os event listeners para as interações da página
        this.form.addEventListener('submit', this.handleSave.bind(this));
        this.form.querySelector('#cancel-item').addEventListener('click', () => this.clearForm());
        this.list.addEventListener('click', this.handleActions.bind(this));
        this.search.addEventListener('input', () => this.render()); // Filtra em tempo real
    },

    render() {
        this.list.innerHTML = '';
        const items = DataService.getItems();
        const searchTerm = this.search.value.toLowerCase();

        // Filtra os itens com base no título ou autor
        const filteredItems = items.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.author.toLowerCase().includes(searchTerm)
        );

        if (filteredItems.length === 0) {
            this.list.innerHTML = `<tr><td colspan="5" class="placeholder-message">Nenhum item encontrado.</td></tr>`;
            return;
        }

        filteredItems.forEach(item => {
            const availability = DataService.getItemAvailability(item);
            const statusClass = availability > 0 ? 'status-available' : 'status-loaned';
            const statusText = availability > 0 ? `${availability} disponível(is)` : 'Indisponível';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title}</td>
                <td>${item.author}</td>
                <td>${item.type}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button data-id="${item.id}" data-action="edit" class="btn-icon btn-edit" title="Editar" aria-label="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button data-id="${item.id}" data-action="delete" class="btn-icon btn-delete" title="Excluir" aria-label="Excluir"><i class="fas fa-trash"></i></button>
                    ${availability === 0 ? `<button data-id="${item.id}" data-action="reserve" class="btn btn-secondary" title="Reservar">Reservar</button>` : ''}
                </td>
            `;
            this.list.appendChild(row);
        });
    },

    handleSave(e) {
        e.preventDefault();
        const id = this.form.itemId.value;
        // Validação para garantir que o número de exemplares é positivo
        const copies = parseInt(this.form.itemCopies.value, 10);
        if (copies < 1) {
            UIService.showFeedback('O número de exemplares deve ser ao menos 1.', 'error');
            return;
        }
        
        const item = {
            id: id,
            title: this.form.itemTitle.value,
            author: this.form.itemAuthor.value,
            category: this.form.itemCategory.value,
            type: this.form.itemType.value,
            copies: copies,
        };

        if (id) {
            DataService.updateItem(item);
            UIService.showFeedback('Item atualizado com sucesso!', 'success');
        } else {
            DataService.addItem(item);
            UIService.showFeedback('Item cadastrado com sucesso!', 'success');
        }
        
        this.render();
        EmprestimoModule.render(); // Atualiza a lista de itens disponíveis para empréstimo
        this.clearForm();
    },

    handleActions(e) {
        const button = e.target.closest('button');
        if (!button) return;
        const { id, action } = button.dataset;

        if (action === 'edit') {
            const item = DataService.findItemById(id);
            if (!item) return;
            
            this.form.itemId.value = item.id;
            this.form.itemTitle.value = item.title;
            this.form.itemAuthor.value = item.author;
            this.form.itemCategory.value = item.category;
            this.form.itemType.value = item.type;
            this.form.itemCopies.value = item.copies;
            this.form.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (action === 'delete') {
            // Regra de negócio: não permitir exclusão se houver itens emprestados
            const loans = DataService.getActiveLoans().filter(l => l.itemId === id);
            if (loans.length > 0) {
                alert('Não é possível excluir um item com exemplares emprestados.');
                return;
            }
            
            const item = DataService.findItemById(id);
            UIService.showModal('Excluir Item', `Deseja realmente excluir o item "${item.title}"?`, () => {
                DataService.deleteItem(id);
                this.render();
                EmprestimoModule.render(); // Atualiza a lista de itens disponíveis
                UIService.showFeedback('Item excluído com sucesso.', 'success');
            });
        }
        
        if (action === 'reserve') {
            ReservaModule.add(id);
        }
    },
    
    clearForm() {
        this.form.reset();
        this.form.itemId.value = '';
    }
};