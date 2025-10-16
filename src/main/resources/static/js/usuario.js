            document.addEventListener('DOMContentLoaded', () => {

                // --- 1. CONFIGURAÇÃO E ELEMENTOS DO DOM ---
                const API_URL = 'http://localhost:8080/api/usuarios'; // URL do nosso back-end!

                const form = document.getElementById('user-form');
                const formTitle = document.getElementById('form-title');
                const submitButton = document.getElementById('submit-button');
                const cancelButton = document.getElementById('cancel-button');
                const userIdInput = document.getElementById('user-id');
                const nameInput = document.getElementById('name');
                const emailInput = document.getElementById('email');
                const userList = document.getElementById('user-list');

                let isEditing = false;

                // --- 2. FUNÇÕES DE COMUNICAÇÃO COM A API ---

                // READ (GET): Busca todos os usuários do back-end
                const fetchUsers = async () => {
                    try {
                        const response = await fetch(API_URL);
                        if (!response.ok) throw new Error('Não foi possível buscar os usuários.');

                        const users = await response.json();
                        renderTable(users);
                    } catch (error) {
                        console.error('Erro:', error);
                        userList.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Erro ao carregar dados do servidor.</td></tr>`;
                    }
                };

                // Renderiza a tabela com os dados vindos da API
                const renderTable = (users) => {
                    userList.innerHTML = '';
                    if (users.length === 0) {
                        userList.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum usuário cadastrado.</td></tr>';
                        return;
                    }
                    users.forEach(user => {
                        const row = document.createElement('tr');
                        // Ajuste: o back-end usa 'nome', o front usava 'name'.
                        row.innerHTML = `
                            <td>${user.id}</td>
                            <td>${user.nome}</td>
                            <td>${user.email}</td>
                            <td>Padrão</td> <td class="actions-cell">
                                <button class="btn btn-edit" data-id="${user.id}" data-nome="${user.nome}" data-email="${user.email}">Editar</button>
                                <button class="btn btn-delete" data-id="${user.id}">Excluir</button>
                            </td>
                        `;
                        userList.appendChild(row);
                    });
                };

                const startEdit = (user) => {
                    isEditing = true;
                    formTitle.textContent = 'Editar Usuário';
                    submitButton.textContent = 'Atualizar Usuário';
                    submitButton.classList.replace('btn-primary', 'btn-success');
                    cancelButton.style.display = 'inline-block';
                    userIdInput.value = user.id;
                    nameInput.value = user.nome;
                    emailInput.value = user.email;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };

                const resetForm = () => {
                    isEditing = false;
                    form.reset();
                    formTitle.textContent = 'Adicionar Novo Usuário';
                    submitButton.textContent = 'Adicionar Usuário';
                    submitButton.classList.replace('btn-success', 'btn-primary');
                    cancelButton.style.display = 'none';
                    userIdInput.value = '';
                };

                // --- 3. EVENT LISTENERS ---

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const id = userIdInput.value;
                    const nome = nameInput.value.trim();
                    const email = emailInput.value.trim();

                    if (!nome || !email) return alert('Por favor, preencha o nome e o email.');

                    // O back-end espera uma senha, vamos enviar uma padrão
                    const userData = { nome, email, senha: "123" };

                    try {
                        const url = isEditing ? `${API_URL}/${id}` : API_URL;
                        const method = isEditing ? 'PUT' : 'POST';

                        const response = await fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData)
                        });

                        if (!response.ok) throw new Error(`Falha ao ${isEditing ? 'atualizar' : 'criar'} usuário.`);

                        resetForm();
                        fetchUsers();
                    } catch (error) {
                        console.error('Erro:', error);
                        alert(`Ocorreu um erro: ${error.message}`);
                    }
                });

                userList.addEventListener('click', async (e) => {
                    const target = e.target;
                    const id = target.dataset.id;

                    if (target.classList.contains('btn-delete')) {
                        if (confirm('Tem certeza que deseja excluir este usuário?')) {
                            try {
                                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                                if (!response.ok) throw new Error('Falha ao excluir usuário.');
                                fetchUsers();
                            } catch(error) {
                                 console.error('Erro:', error);
                                 alert(`Ocorreu um erro: ${error.message}`);
                            }
                        }
                    }

                    if (target.classList.contains('btn-edit')) {
                        const user = { id, nome: target.dataset.nome, email: target.dataset.email };
                        startEdit(user);
                    }
                });

                cancelButton.addEventListener('click', resetForm);

                // --- 4. INICIALIZAÇÃO ---
                fetchUsers();
            });