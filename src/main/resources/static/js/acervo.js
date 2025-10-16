document.addEventListener('DOMContentLoaded', () => {
        // --- 1. CONFIGURAÇÃO ---
        const API_URL = 'http://localhost:8080/api/acervo'; // API que você irá criar para o acervo

        // --- 2. SELETORES DO DOM ---
        const itemForm = document.getElementById('item-form');
        const acervoList = document.getElementById('acervo-list');
        // ... (demais seletores do form)

        let isEditing = false;

        // --- 3. FUNÇÕES PRINCIPAIS ---

        // RENDER: Mostra os itens na tabela
        const renderAcervo = (items) => {
            acervoList.innerHTML = '';
            if (items.length === 0) {
                acervoList.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum item encontrado.</td></tr>';
                return;
            }
            items.forEach(item => {
                const row = `
                    <tr>
                        <td>${item.titulo}</td>
                        <td>${item.autor}</td>
                        <td>${item.tipo}</td>
                        <td>${item.id}</td>
                        <td class="actions-cell">
                            <button class="btn btn-primary">Exemplares</button>
                            <button class="btn btn-edit" onclick="startEdit(${JSON.stringify(item).replace(/"/g, '&quot;')})">Editar</button>
                            <button class="btn btn-delete" onclick="deleteItem(${item.id})">Excluir</button>
                        </td>
                    </tr>
                `;
                acervoList.innerHTML += row;
            });
        };

        // FETCH: Busca os itens do acervo no back-end
        const fetchAcervo = async () => {
            try {
                const response = await fetch(API_URL);
                if(!response.ok) throw new Error('Falha ao buscar itens do acervo');
                const items = await response.json();
                renderAcervo(items);
            } catch(error) {
                console.error("Erro:", error);
                acervoList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>';
            }
        };

        // --- 4. LÓGICA DO FORMULÁRIO (CREATE/UPDATE) ---
        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('item-id').value;
            const itemData = {
                tipo: document.getElementById('tipo').value,
                titulo: document.getElementById('titulo').value,
                autor: document.getElementById('autor').value,
                categoria: document.getElementById('categoria').value,
            };

            const url = isEditing ? `${API_URL}/${id}` : API_URL;
            const method = isEditing ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
                if(!response.ok) throw new Error('Falha ao salvar item.');
                resetForm();
                fetchAcervo();
            } catch(error) {
                alert(error.message);
            }
        });

        window.startEdit = (item) => {
            isEditing = true;
            document.getElementById('item-id').value = item.id;
            document.getElementById('tipo').value = item.tipo;
            document.getElementById('titulo').value = item.titulo;
            document.getElementById('autor').value = item.autor;
            document.getElementById('categoria').value = item.categoria;
            //...(ajusta os botões e títulos do form)
        };
        
        const resetForm = () => { /* ... (função de reset do formulário) ... */ };

        window.deleteItem = async (id) => {
            if (confirm('Tem certeza que deseja excluir este item?')) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if(!response.ok) throw new Error('Falha ao excluir item.');
                    fetchAcervo();
                } catch(error) {
                    alert(error.message);
                }
            }
        };
        
        // --- 7. INICIALIZAÇÃO ---
        fetchAcervo();
    });