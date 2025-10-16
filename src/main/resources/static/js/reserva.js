document.addEventListener('DOMContentLoaded', () => {
    // --- URLs DAS NOSSAS APIs ---
    const API_RESERVAS = 'http://localhost:8080/api/reservas';
    const API_USUARIOS = 'http://localhost:8080/api/usuarios';
    const API_ACERVO = 'http://localhost:8080/api/acervo';

    // --- SELETORES DO DOM ---
    const reservasTbody = document.getElementById('reservas-list');
    const reservaForm = document.getElementById('reserva-form');

    // --- ARMAZENAMENTO DOS DADOS VINDOS DO BACK-END ---
    let todosOsUsuarios = [];
    let todoOAcervo = [];
    let todasAsReservas = [];

    // --- FUNÇÕES ---

    const renderReservas = () => {
        reservasTbody.innerHTML = '';
        if (todasAsReservas.length === 0) {
            reservasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma reserva ativa.</td></tr>';
            return;
        }

        todasAsReservas.forEach(reserva => {
            const usuario = todosOsUsuarios.find(u => u.id === reserva.idUsuario);
            const item = todoOAcervo.find(i => i.id === reserva.idItemAcervo);

            // Só renderiza se encontrar os dados correspondentes
            if (!usuario || !item) return;

            const row = `
                <tr>
                    <td>
                        <div class="item-title">${item.titulo}</div>
                        <div class="user-name">Item ID: ${item.id}</div>
                    </td>
                    <td>
                        <div class="item-title">${usuario.nome}</div>
                        <div class="user-name">${usuario.email}</div>
                    </td>
                    <td>${new Date(reserva.dataReserva).toLocaleDateString('pt-BR')}</td>
                    <td><span class="status status-aguardando">${reserva.status}</span></td>
                    <td>
                        <button class="btn btn-danger">Cancelar</button>
                    </td>
                </tr>
            `;
            reservasTbody.innerHTML += row;
        });
    };

    // --- FORMULÁRIO DE CRIAÇÃO ---
    reservaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userEmail = document.getElementById('user-email').value;
        const itemId = parseInt(document.getElementById('item-id').value, 10);

        // AGORA A BUSCA É FEITA NA LISTA ATUALIZADA DO BANCO DE DADOS!
        const usuario = todosOsUsuarios.find(u => u.email === userEmail);
        const item = todoOAcervo.find(i => i.id === itemId);

        if (!usuario) {
            alert('Erro: Usuário não encontrado com este email. Verifique o cadastro.');
            return;
        }
        if (!item) {
            alert('Erro: Item não encontrado no acervo com este ID.');
            return;
        }

        const novaReserva = {
            idUsuario: usuario.id,
            idItemAcervo: item.id,
            dataReserva: new Date().toISOString().split('T')[0], // Data de hoje
            status: 'Aguardando Devolução'
        };

        try {
            const response = await fetch(API_RESERVAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaReserva)
            });
            if (!response.ok) throw new Error('Falha ao criar reserva no servidor.');

            alert('Reserva criada com sucesso!');
            reservaForm.reset();
            fetchAllData(); // Atualiza a tabela com a nova reserva
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
        }
    });

    // --- INICIALIZAÇÃO ---
    const fetchAllData = async () => {
        try {
            // Usa Promise.all para fazer as requisições em paralelo
            const [reservasRes, usuariosRes, acervoRes] = await Promise.all([
                fetch(API_RESERVAS),
                fetch(API_USUARIOS),
                fetch(API_ACERVO)
            ]);

            todasAsReservas = await reservasRes.json();
            todosOsUsuarios = await usuariosRes.json();
            todoOAcervo = await acervoRes.json();

            renderReservas(); // Renderiza a tabela com os dados reais
        } catch (error) {
            console.error('Falha ao carregar dados iniciais:', error);
            reservasTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Falha ao carregar dados do servidor.</td></tr>';
        }
    };

    fetchAllData();
});