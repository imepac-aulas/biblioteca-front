
document.addEventListener('DOMContentLoaded', () => {
    // --- DADOS SIMULADOS COMPLETOS DO SISTEMA ---
    const acervo = [
        { id: 1, titulo: 'O Hobbit', autor: 'J.R.R. Tolkien', exemplares: [{ idExemplar: 101 }, { idExemplar: 102 }] },
        { id: 2, titulo: 'Leitor Kindle', autor: 'Amazon', exemplares: [{ idExemplar: 201 }, { idExemplar: 202 }, { idExemplar: 203 }] },
        { id: 3, titulo: 'Sapiens', autor: 'Yuval Noah Harari', exemplares: [{ idExemplar: 301 }] }
    ];
    const users = [
        { id: 1, name: 'Ana Silva', email: 'ana.silva@example.com' },
        { id: 2, name: 'Bruno Costa', email: 'bruno.costa@example.com' },
        { id: 3, name: 'Carla Dias', email: 'carla.dias@example.com' }
    ];
    // Adicionamos um histórico de empréstimos para gerar os relatórios
    const emprestimos = [
        // Empréstimo em atraso
        { idEmprestimo: 1, idUsuario: 1, idExemplar: 101, dataEmprestimo: '2025-09-01', dataDevolucaoPrevista: '2025-09-15', dataDevolucaoReal: null },
        // Outro empréstimo em atraso
        { idEmprestimo: 2, idUsuario: 3, idExemplar: 201, dataEmprestimo: '2025-09-10', dataDevolucaoPrevista: '2025-09-24', dataDevolucaoReal: null },
        // Empréstimo em dia
        { idEmprestimo: 3, idUsuario: 2, idExemplar: 202, dataEmprestimo: '2025-09-30', dataDevolucaoPrevista: '2025-10-14', dataDevolucaoReal: null },
        // Empréstimo já devolvido (para o relatório de 'mais emprestados')
        { idEmprestimo: 4, idUsuario: 1, idExemplar: 301, dataEmprestimo: '2025-08-01', dataDevolucaoPrevista: '2025-08-15', dataDevolucaoReal: '2025-08-14' },
        // Repetindo um item para teste de 'mais emprestados'
        { idEmprestimo: 5, idUsuario: 2, idExemplar: 301, dataEmprestimo: '2025-09-01', dataDevolucaoPrevista: '2025-09-15', dataDevolucaoReal: '2025-09-15' }
    ];
    const reservas = [
        { idReserva: 1, idUsuario: 3, idExemplar: 101, status: 'Aguardando Devolução' }
    ];

    let notificacoes = [];

    // --- FUNÇÕES DE GERAÇÃO DE DADOS ---

    const gerarNotificacoes = () => {
        notificacoes = [];
        const hoje = new Date();
        
        // 1. Notificações de Atraso
        const emprestimosAtrasados = emprestimos.filter(e => e.dataDevolucaoReal === null && new Date(e.dataDevolucaoPrevista) < hoje);

        emprestimosAtrasados.forEach(emp => {
            const user = users.find(u => u.id === emp.idUsuario);
            const item = acervo.find(a => a.exemplares.some(ex => ex.idExemplar === emp.idExemplar));
            
            notificacoes.push({
                id: `atraso-${emp.idEmprestimo}`,
                type: 'Atraso na Devolução',
                user: user.name,
                item: item.titulo,
                status: 'Pendente'
            });
        });

        // Futuramente, adicionar outros tipos de notificação aqui (ex: reserva disponível)
    };

    const renderNotificacoes = () => {
        const list = document.getElementById('notifications-list');
        list.innerHTML = '';
        if (notificacoes.length === 0) {
            list.innerHTML = '<li>Nenhum alerta pendente.</li>';
            return;
        }
        notificacoes.forEach(n => {
            const statusClass = n.status === 'Pendente' ? 'status-pendente' : 'status-enviado';
            const itemHtml = `
                <li class="notification-item">
                    <input type="checkbox" data-id="${n.id}" ${n.status === 'Enviado' ? 'disabled' : ''}>
                    <div class="details">
                        <span class="user">${n.user}</span>
                        <span class="reason">${n.type}: ${n.item}</span>
                    </div>
                    <span class="status ${statusClass}">${n.status}</span>
                </li>
            `;
            list.innerHTML += itemHtml;
        });
    };
    
    // --- FUNÇÕES DE RELATÓRIO ---

    const gerarRelatorios = () => {
        // Widget: Resumo do Acervo
        document.getElementById('total-titulos').textContent = acervo.length;
        document.getElementById('total-exemplares').textContent = acervo.reduce((acc, item) => acc + item.exemplares.length, 0);

        // Widget: Estatísticas Gerais
        document.getElementById('total-emprestimos').textContent = emprestimos.length;
        document.getElementById('reservas-ativas').textContent = reservas.filter(r => r.status !== 'Finalizada').length;

        // Widget: Itens Mais Emprestados
        const emprestimosCount = {};
        emprestimos.forEach(emp => {
            const item = acervo.find(a => a.exemplares.some(ex => ex.idExemplar === emp.idExemplar));
            if (item) {
                emprestimosCount[item.titulo] = (emprestimosCount[item.titulo] || 0) + 1;
            }
        });
        const sortedItens = Object.entries(emprestimosCount).sort((a, b) => b[1] - a[1]);
        const maisEmprestadosList = document.getElementById('mais-emprestados-list');
        maisEmprestadosList.innerHTML = sortedItens.map(item => `<li><strong>${item[0]}</strong>: ${item[1]} empréstimos</li>`).join('');

        // Widget: Usuários com Atraso
        const hoje = new Date();
        const atrasosList = document.getElementById('atrasos-list');
        atrasosList.innerHTML = '';
        const emprestimosAtrasados = emprestimos.filter(e => e.dataDevolucaoReal === null && new Date(e.dataDevolucaoPrevista) < hoje);
        if (emprestimosAtrasados.length > 0) {
            emprestimosAtrasados.forEach(emp => {
                const user = users.find(u => u.id === emp.idUsuario);
                const item = acervo.find(a => a.exemplares.some(ex => ex.idExemplar === emp.idExemplar));
                const diasAtraso = Math.floor((hoje - new Date(emp.dataDevolucaoPrevista)) / (1000 * 60 * 60 * 24));
                atrasosList.innerHTML += `<li><span class="overdue-user">${user.name}</span> - Item: ${item.titulo} (${diasAtraso} dias de atraso)</li>`;
            });
        } else {
            atrasosList.innerHTML = '<li>Nenhum usuário com atraso no momento.</li>';
        }
    };
    
    // --- EVENT LISTENERS ---
    
    document.getElementById('send-notifications-btn').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#notifications-list input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            alert('Selecione pelo menos um alerta para enviar.');
            return;
        }
        
        checkboxes.forEach(cb => {
            const notificationId = cb.dataset.id;
            const notification = notificacoes.find(n => n.id === notificationId);
            if (notification) {
                notification.status = 'Enviado';
            }
        });
        
        alert(`${checkboxes.length} alertas foram "enviados" com sucesso!`);
        renderNotificacoes();
    });

    // --- INICIALIZAÇÃO ---
    const initPage = () => {
        gerarNotificacoes();
        renderNotificacoes();
        gerarRelatorios();
    };

    initPage();
});