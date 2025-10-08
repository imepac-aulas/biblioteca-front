document.addEventListener('DOMContentLoaded', () => {
    const db = {
        getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
        setUsers: (users) => localStorage.setItem('users', JSON.stringify(users)),
    };

    // Inicializa com dados de exemplo se não houver nenhum
    if (!localStorage.getItem('users')) {
        const mockUsers = [
            { id: 1, name: 'Alice Silva', username: 'alice', email: 'alice@example.com', password: '123', userType: 'aluno' },
            { id: 2, name: 'Beto Costa', username: 'beto', email: 'beto@example.com', password: '123', userType: 'colaborador' }
        ];
        db.setUsers(mockUsers);
    }

    const showMessage = (message, type = 'success') => {
        const messageElement = document.getElementById('success-message');
        if (messageElement) {
            messageElement.textContent = message;
            // Adiciona a classe de alerta correspondente ao tipo
            messageElement.className = `alert alert-${type}`;
            messageElement.style.display = 'block';
            // Esconde a mensagem após 3 segundos
            setTimeout(() => {
                if(messageElement) {
                    messageElement.style.display = 'none';
                }
            }, 3000);
        }
    };

    const getUrlParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    // Lógica para a página de listagem (index.html)
    if (document.getElementById('user-table-body')) {
        const userTableBody = document.getElementById('user-table-body');
        const noUsersMessage = document.getElementById('no-users-message');
        
        const renderTable = () => {
            userTableBody.innerHTML = '';
            const users = db.getUsers();
            if (users.length === 0) {
                noUsersMessage.style.display = 'block';
                document.querySelector('table').style.display = 'none';
            } else {
                noUsersMessage.style.display = 'none';
                document.querySelector('table').style.display = 'table';
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Nome">${user.name}</td>
                        <td data-label="Username">${user.username}</td>
                        <td data-label="Email">${user.email}</td>
                        <td data-label="Tipo">${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</td>
                        <td data-label="Ações">
                            <a href="form.html?id=${user.id}&view=true" class="btn btn-secondary btn-sm">Visualizar</a>
                            <a href="form.html?id=${user.id}" class="btn btn-primary btn-sm">Editar</a>
                            <button class="btn btn-danger btn-sm" data-id="${user.id}">Deletar</button>
                        </td>
                    `;
                    userTableBody.appendChild(row);
                });
            }
        };

        userTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const userId = parseInt(e.target.getAttribute('data-id'));
                if (confirm('Tem certeza que deseja deletar este usuário?')) {
                    let users = db.getUsers();
                    users = users.filter(user => user.id !== userId);
                    db.setUsers(users);
                    showMessage('Usuário deletado com sucesso!');
                    renderTable();
                }
            }
        });
        
        // Verifica se há uma mensagem de sucesso no sessionStorage para exibir na listagem
        const successMessage = sessionStorage.getItem('successMessage');
        if (successMessage) {
            showMessage(successMessage);
            sessionStorage.removeItem('successMessage'); // Limpa a mensagem para não mostrar novamente
        }

        renderTable();
    }

    // Lógica para a página de formulário (form.html)
    if (document.getElementById('user-form')) {
        const userForm = document.getElementById('user-form');
        const formTitle = document.getElementById('form-title');
        const userId = getUrlParam('id');
        const isViewMode = getUrlParam('view') === 'true';

        if (userId) {
            const users = db.getUsers();
            const user = users.find(u => u.id == userId);

            if (user) {
                document.getElementById('name').value = user.name;
                document.getElementById('username').value = user.username;
                document.getElementById('email').value = user.email;
                document.getElementById('password').placeholder = isViewMode ? '********' : 'Deixe em branco para não alterar';
                if (!isViewMode) {
                    document.getElementById('password').required = false;
                }
                document.getElementById('userType').value = user.userType;

                if (isViewMode) {
                    formTitle.textContent = 'Visualizar Usuário';
                    Array.from(userForm.elements).forEach(el => el.disabled = true);
                    userForm.querySelector('button[type="submit"]').style.display = 'none';
                    const cancelButton = userForm.querySelector('.btn-secondary');
                    cancelButton.textContent = 'Voltar';
                } else {
                    formTitle.textContent = 'Editar Usuário';
                }
            }
        }

        userForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value.trim(),
                username: document.getElementById('username').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                userType: document.getElementById('userType').value,
            };

            if (!formData.name || !formData.username || !formData.email || !formData.userType || (!userId && !formData.password)) {
                 showMessage('Por favor, preencha todos os campos obrigatórios.', 'danger');
                 return;
            }

            let users = db.getUsers();
            let message = '';

            if (userId) { // Edição
                const userIndex = users.findIndex(u => u.id == userId);
                if (userIndex > -1) {
                    const updatedUser = { ...users[userIndex], ...formData };
                    if (!formData.password) {
                        updatedUser.password = users[userIndex].password;
                    }
                    users[userIndex] = updatedUser;
                    message = 'Usuário atualizado com sucesso!';
                }
            } else { // Criação
                const newUser = {
                    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                    ...formData
                };
                users.push(newUser);
                message = 'Usuário criado com sucesso!';
            }

            db.setUsers(users);
            
            // Mostra a mensagem de sucesso na própria página do formulário
            showMessage(message);

            // Redireciona para a página de listagem após 2 segundos para o usuário ver a mensagem
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        });
    }
});
