// Simulação de um banco de dados em memória
let db = {
    // Dados de demonstração para começar
    usuarios: [
        { id: 1, nome: 'João Silva', cpf: '111.111.111-11', email: 'joao@example.com', telefone: '(11) 99999-1111', tipo: 'Aluno', matricula: 'A123', status: 'Ativo', limiteEmprestimos: 5 },
        { id: 2, nome: 'Maria Santos', cpf: '222.222.222-22', email: 'maria@example.com', telefone: '(21) 98888-2222', tipo: 'Professor', matricula: 'P456', status: 'Ativo', limiteEmprestimos: 10 },
    ],
    acervos: [
        { id: 101, titulo: 'Dom Casmurro', autor: 'Machado de Assis', categoria: 'Literatura', tipo: 'Livro', exemplares: 1, status: 'Disponível', descricao: '' },
        { id: 102, titulo: '1984', autor: 'George Orwell', categoria: 'Ficção Científica', tipo: 'Livro', exemplares: 1, status: 'Emprestado', descricao: '' },
    ],
    emprestimos: [
        // Usamos IDs inteiros para corresponder à lógica do JS (parseInt)
        { id: 1001, usuarioId: 2, acervoId: 102, dataEmprestimo: '2024-10-01', dataDevolucao: '2024-10-15', status: 'Emprestado', dataDevolucaoReal: null },
    ],
    reservas: [
        { id: 2001, usuarioId: 1, acervoId: 102, dataReserva: '2024-10-02', status: 'Pendente' }
    ]
};

// ============================================
// LÓGICA GERAL E DE NAVEGAÇÃO
// ============================================

// Expondo a função para o HTML
window.showModule = function(moduleId) {
    // Esconde todos os módulos
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });

    // Mostra o módulo selecionado
    const activeModule = document.getElementById(moduleId);
    if (activeModule) {
        activeModule.classList.add('active');
    }

    // Atualiza o botão ativo na navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${moduleId}'`)) {
            btn.classList.add('active');
        }
    });

    // Atualiza dados dinâmicos ao trocar de módulo
    if (moduleId === 'emprestimos') {
        popularSelectsEmprestimo();
        renderEmprestimosAtivos();
    }
    if (moduleId === 'reservas') {
        popularSelectsReserva();
        renderReservas();
    }
    if (moduleId === 'acervos') {
        renderAcervosTable();
    }
    if (moduleId === 'usuarios') {
        renderUsuariosTable();
    }
    if (moduleId === 'relatorios') {
        gerarRelatorios();
    }
}

function showAlert(alertId, duration = 3000) {
    const alert = document.getElementById(alertId);
    if (!alert) return;
    
    // O JS no HTML usa display none/block para controlar a visibilidade de alerts
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, duration);
}

// ============================================
// MÓDULO 1: CADASTRO DE USUÁRIOS
// ============================================
const usuarioForm = document.getElementById('usuarioForm');

function validarUsuarioForm() {
    let isValid = true;
    const campos = ['Nome', 'Cpf', 'Email', 'Telefone', 'Tipo', 'Matricula'];

    campos.forEach(campo => {
        const input = document.getElementById(`usuario${campo}`);
        const error = document.getElementById(`usuario${campo}Error`);
        if (!input || !error) return;

        let condicao = input.value.trim() === '';

        if (campo === 'Cpf' && input.value.length > 0 && input.value.length < 14) condicao = true;
        if (campo === 'Email' && input.value.length > 0 && !/\S+@\S+\.\S+/.test(input.value)) condicao = true;
        if (campo === 'Telefone' && input.value.length > 0 && input.value.length < 15) condicao = true;

        if (condicao) {
            input.classList.add('input-error');
            error.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('input-error');
            error.style.display = 'none';
        }
    });
    return isValid;
}

function limparUsuarioForm() {
    if (!usuarioForm) return;
    usuarioForm.reset();
    ['Nome', 'Cpf', 'Email', 'Telefone', 'Tipo', 'Matricula'].forEach(campo => {
        const input = document.getElementById(`usuario${campo}`);
        const error = document.getElementById(`usuario${campo}Error`);
        if (input) input.classList.remove('input-error');
        if (error) error.style.display = 'none';
    });
     document.getElementById('usuarioSuccess').style.display = 'none';
     document.getElementById('usuarioError').style.display = 'none';
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function formatarTelefone(tel) {
    tel = tel.replace(/\D/g, '');
    tel = tel.replace(/^(\d{2})(\d)/g, '($1) $2');
    tel = tel.replace(/(\d)(\d{4})$/, '$1-$2');
    return tel;
}

function renderUsuariosTable() {
    const tableBody = document.getElementById('usuariosTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    const nomeFiltroInput = document.getElementById('searchUsuarioNome');
    const tipoFiltroSelect = document.getElementById('searchUsuarioTipo');
    
    const nomeFiltro = nomeFiltroInput ? nomeFiltroInput.value.toLowerCase() : '';
    const tipoFiltro = tipoFiltroSelect ? tipoFiltroSelect.value : '';

    const usuariosFiltrados = db.usuarios.filter(u => {
        const nomeMatch = u.nome.toLowerCase().includes(nomeFiltro);
        const tipoMatch = tipoFiltro === '' || u.tipo === tipoFiltro;
        return nomeMatch && tipoMatch;
    });

    if (usuariosFiltrados.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    usuariosFiltrados.forEach(user => {
        const emprestimosCount = db.emprestimos.filter(e => e.usuarioId === user.id && e.status === 'Emprestado').length;
        const statusClass = user.status === 'Ativo' ? 'badge-success' : 'badge-danger';

        const row = `
            <tr>
                <td>${user.nome}</td>
                <td>${user.cpf}</td>
                <td><span class="badge badge-secondary">${user.tipo}</span></td>
                <td>${user.matricula}</td>
                <td><span class="badge ${statusClass}">${user.status}</span></td>
                <td>${emprestimosCount} / ${user.limiteEmprestimos}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="suspenderUsuario(${user.id})">${user.status === 'Ativo' ? 'Suspender' : 'Ativar'}</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Expondo a função
window.suspenderUsuario = function(id) {
    const user = db.usuarios.find(u => u.id === id);
    if (user) {
        user.status = user.status === 'Ativo' ? 'Suspenso' : 'Ativo';
        renderUsuariosTable();
        popularSelectsEmprestimo(); // Atualiza a lista de empréstimos
    }
}


// ============================================
// MÓDULO 2: GESTÃO DE ACERVOS
// ============================================
const acervoForm = document.getElementById('acervoForm');

function validarAcervoForm() {
    let isValid = true;
    const campos = ['Titulo', 'Autor', 'Categoria', 'Tipo', 'Exemplares'];
    campos.forEach(campo => {
        const input = document.getElementById(`acervo${campo}`);
        const error = document.getElementById(`acervo${campo}Error`);
        if (!input || !error) return;

        let condicao = input.value.trim() === '';

        if (campo === 'Exemplares' && (parseInt(input.value) < 1 || isNaN(parseInt(input.value)))) condicao = true;

        if (condicao) {
            input.classList.add('input-error');
            error.style.display = 'block';
            isValid = false;
        } else {
            input.classList.remove('input-error');
            error.style.display = 'none';
        }
    });
    return isValid;
}

function limparAcervoForm() {
    if (!acervoForm) return;
    acervoForm.reset();
      ['Titulo', 'Autor', 'Categoria', 'Tipo', 'Exemplares'].forEach(campo => {
        const input = document.getElementById(`acervo${campo}`);
        const error = document.getElementById(`acervo${campo}Error`);
        if (input) input.classList.remove('input-error');
        if (error) error.style.display = 'none';
    });
     document.getElementById('acervoSuccess').style.display = 'none';
}

function renderAcervosTable() {
    const tableBody = document.getElementById('acervosTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const tituloFiltro = document.getElementById('searchAcervoTitulo')?.value.toLowerCase() || '';
    const autorFiltro = document.getElementById('searchAcervoAutor')?.value.toLowerCase() || '';
    const categoriaFiltro = document.getElementById('searchAcervoCategoria')?.value || '';
    const statusFiltro = document.getElementById('searchAcervoStatus')?.value || '';

    const acervosFiltrados = db.acervos.filter(a => {
        return a.titulo.toLowerCase().includes(tituloFiltro) &&
               a.autor.toLowerCase().includes(autorFiltro) &&
               (categoriaFiltro === '' || a.categoria === categoriaFiltro) &&
               (statusFiltro === '' || a.status === statusFiltro);
    });

    if (acervosFiltrados.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum acervo encontrado.</td></tr>';
        return;
    }

    acervosFiltrados.forEach(item => {
        let statusClass = '';
        switch(item.status) {
            case 'Disponível': statusClass = 'badge-success'; break;
            case 'Emprestado': statusClass = 'badge-warning'; break;
            case 'Reservado': statusClass = 'badge-info'; break;
            case 'Em Manutenção': statusClass = 'badge-secondary'; break;
            default: statusClass = 'badge-secondary';
        }
        
        const isAvailable = item.status === 'Disponível';

        const row = `
            <tr>
                <td>${item.titulo}</td>
                <td>${item.autor}</td>
                <td>${item.categoria}</td>
                <td>${item.exemplares}</td>
                <td><span class="badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" ${!isAvailable ? 'disabled' : ''} onclick="window.showModule('emprestimos')">Emprestar</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}


// ============================================
// MÓDULO 3: EMPRÉSTIMOS E DEVOLUÇÕES
// ============================================
const emprestimoForm = document.getElementById('emprestimoForm');

function popularSelectsEmprestimo() {
    const usuarioSelect = document.getElementById('emprestimoUsuario');
    const acervoSelect = document.getElementById('emprestimoAcervo');
    if (!usuarioSelect || !acervoSelect) return;
    
    usuarioSelect.innerHTML = '<option value="">Selecione o usuário</option>';
    db.usuarios.filter(u => u.status === 'Ativo').forEach(u => {
        usuarioSelect.innerHTML += `<option value="${u.id}">${u.nome} - ${u.matricula}</option>`;
    });

    acervoSelect.innerHTML = '<option value="">Selecione o acervo</option>';
    db.acervos.filter(a => a.status === 'Disponível').forEach(a => {
        acervoSelect.innerHTML += `<option value="${a.id}">${a.titulo} - ${a.autor}</option>`;
    });
}

function handleUsuarioChangeEmprestimo() {
    const usuarioId = document.getElementById('emprestimoUsuario')?.value;
    const alertWarning = document.getElementById('emprestimoWarning');
    
    if (!usuarioId || !alertWarning) {
         alertWarning.style.display = 'none';
         return;
    }

    const usuario = db.usuarios.find(u => u.id === parseInt(usuarioId));
    if (!usuario) {
        alertWarning.style.display = 'none';
        return;
    }

    const emprestimosAtivos = db.emprestimos.filter(e => e.usuarioId === usuario.id && e.status === 'Emprestado').length;
    let warnings = [];

    if (emprestimosAtivos >= usuario.limiteEmprestimos) {
        warnings.push(`Usuário atingiu o limite de ${usuario.limiteEmprestimos} empréstimos.`);
    }

    if (warnings.length > 0) {
        alertWarning.innerHTML = `⚠️ ${warnings.join(' ')}`;
        alertWarning.style.display = 'block';
    } else {
        alertWarning.style.display = 'none';
    }
}

function validarEmprestimoForm() {
    const usuarioId = document.getElementById('emprestimoUsuario')?.value;
    const acervoId = document.getElementById('emprestimoAcervo')?.value;
    const dataDevolucao = document.getElementById('emprestimoDataDevolucao')?.value;
    let isValid = true;
    
    const usuarioError = document.getElementById('emprestimoUsuarioError');
    const acervoError = document.getElementById('emprestimoAcervoError');
    const dataDevolucaoError = document.getElementById('emprestimoDataDevolucaoError');

    // Resetar erros e alertas
    usuarioError.style.display = 'none';
    acervoError.style.display = 'none';
    dataDevolucaoError.style.display = 'none';
    document.getElementById('emprestimoSuccess').style.display = 'none';


    if (!usuarioId) {
        usuarioError.style.display = 'block';
        isValid = false;
    }

    if (!acervoId) {
        acervoError.style.display = 'block';
        isValid = false;
    }

    if (!dataDevolucao) {
        dataDevolucaoError.style.display = 'block';
        isValid = false;
    }
    
    if (!isValid) {
        const alertWarning = document.getElementById('emprestimoWarning');
        alertWarning.innerHTML = '⚠️ Atenção: Preencha todos os campos obrigatórios.';
        alertWarning.style.display = 'block';
    } else {
        document.getElementById('emprestimoWarning').style.display = 'none';
    }
    
    return isValid;
}

function renderEmprestimosAtivos() {
    const container = document.getElementById('emprestimosAtivos');
    if (!container) return;
    container.innerHTML = '';
    
    const emprestimosFiltrados = db.emprestimos.filter(e => e.status === 'Emprestado');

    if (emprestimosFiltrados.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum empréstimo ativo no momento.</p>';
        return;
    }
    
    emprestimosFiltrados.forEach(emprestimo => {
        const usuario = db.usuarios.find(u => u.id === emprestimo.usuarioId);
        const acervo = db.acervos.find(a => a.id === emprestimo.acervoId);
        
        if (!usuario || !acervo) return;
        
        const dataDevolucao = new Date(emprestimo.dataDevolucao);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const atrasado = dataDevolucao < hoje;

        const statusClass = atrasado ? 'badge-danger' : 'badge-success';

        const card = `
            <div class="loan-card p-4 border border-gray-100 shadow-sm">
                <div class="loan-header flex justify-between items-center mb-3">
                    <h3 class="text-lg font-semibold m-0 p-0 border-none">${acervo.titulo}</h3>
                    <span class="badge ${statusClass}">
                        ${atrasado ? 'ATRASADO' : 'EM DIA'}
                    </span>
                </div>
                <div class="loan-info flex flex-col sm:grid sm:grid-cols-3 gap-3">
                    <div class="info-item">
                        <span class="info-label">Usuário</span>
                        <span class="info-value">${usuario.nome}</span>
                    </div>
                     <div class="info-item">
                        <span class="info-label">Empréstimo</span>
                        <span class="info-value">${new Date(emprestimo.dataEmprestimo).toLocaleDateString('pt-BR')}</span>
                    </div>
                     <div class="info-item">
                        <span class="info-label">Devolução Prevista</span>
                        <span class="info-value">${new Date(emprestimo.dataDevolucao).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                 <div class="btn-group mt-4 justify-end">
                    <button class="btn btn-success-custom" onclick="registrarDevolucao(${emprestimo.id})">
                        Registrar Devolução
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Expondo a função
window.registrarDevolucao = function(emprestimoId) {
    const emprestimo = db.emprestimos.find(e => e.id === emprestimoId);
    if (!emprestimo) return;

    const acervo = db.acervos.find(a => a.id === emprestimo.acervoId);
    if (!acervo) return;
    
    emprestimo.status = 'Devolvido';
    emprestimo.dataDevolucaoReal = new Date().toISOString().split('T')[0];

    const reservaPendente = db.reservas.find(r => r.acervoId === acervo.id && r.status === 'Pendente');
    if (reservaPendente) {
        acervo.status = 'Reservado';
        reservaPendente.status = 'Aguardando Retirada';
    } else {
        acervo.status = 'Disponível';
    }

    renderEmprestimosAtivos();
    renderAcervosTable();
    renderReservas();
    showAlert('devolucaoSuccess');
}

// ============================================
// MÓDULO 4: RESERVAS
// ============================================
const reservaForm = document.getElementById('reservaForm');

function popularSelectsReserva() {
    const usuarioSelect = document.getElementById('reservaUsuario');
    const acervoSelect = document.getElementById('reservaAcervo');
    if (!usuarioSelect || !acervoSelect) return;

    usuarioSelect.innerHTML = '<option value="">Selecione o usuário</option>';
    db.usuarios.filter(u => u.status === 'Ativo').forEach(u => {
        usuarioSelect.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    });

    acervoSelect.innerHTML = '<option value="">Selecione o acervo</option>';
    db.acervos.filter(a => a.status === 'Emprestado').forEach(a => {
        acervoSelect.innerHTML += `<option value="${a.id}">${a.titulo}</option>`;
    });
}

function validarReservaForm() {
    const usuarioId = document.getElementById('reservaUsuario')?.value;
    const acervoId = document.getElementById('reservaAcervo')?.value;
    let isValid = true;

    document.getElementById('reservaUsuarioError').style.display = 'none';
    document.getElementById('reservaAcervoError').style.display = 'none';

    if(!usuarioId) {
        document.getElementById('reservaUsuarioError').style.display = 'block';
        isValid = false;
    } 

    if(!acervoId) {
        document.getElementById('reservaAcervoError').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

function renderReservas() {
    const tableBody = document.getElementById('reservasTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const reservasAtivas = db.reservas.filter(r => r.status !== 'Finalizada' && r.status !== 'Cancelada');

    if (reservasAtivas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma reserva ativa.</td></tr>';
        return;
    }

    reservasAtivas.forEach(reserva => {
        const usuario = db.usuarios.find(u => u.id === reserva.usuarioId);
        const acervo = db.acervos.find(a => a.id === reserva.acervoId);
        if (!usuario || !acervo) return;
        
        let statusClass = '';
        switch(reserva.status) {
            case 'Pendente': statusClass = 'badge-warning'; break;
            case 'Aguardando Retirada': statusClass = 'badge-info'; break;
            default: statusClass = 'badge-secondary';
        }

        const row = `
            <tr>
                <td>${acervo.titulo}</td>
                <td>${usuario.nome}</td>
                <td>${new Date(reserva.dataReserva).toLocaleDateString('pt-BR')}</td>
                <td><span class="badge ${statusClass}">${reserva.status}</span></td>
                <td>
                    ${reserva.status === 'Aguardando Retirada' ? `<button class="btn btn-sm btn-success" onclick="confirmarRetirada(${reserva.id})">Confirmar Retirada</button>` : ''}
                    ${reserva.status === 'Pendente' ? `<button class="btn btn-sm btn-danger" onclick="cancelarReserva(${reserva.id})">Cancelar</button>` : ''}
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Expondo as funções
window.confirmarRetirada = function(reservaId) {
    const reserva = db.reservas.find(r => r.id === reservaId);
    if (!reserva) return;
    
    // Altera status da reserva para Finalizada
    reserva.status = 'Finalizada';
    
    // Atualiza o status do acervo para Emprestado
    const acervo = db.acervos.find(a => a.id === reserva.acervoId);
    if (acervo) acervo.status = 'Emprestado';

    // Cria um novo empréstimo (com data de devolução padrão de 7 dias)
    const dataEmprestimo = new Date().toISOString().split('T')[0];
    const dataDevolucaoPadrao = new Date();
    dataDevolucaoPadrao.setDate(dataDevolucaoPadrao.getDate() + 7);

    db.emprestimos.push({
        id: Date.now(),
        usuarioId: reserva.usuarioId,
        acervoId: reserva.acervoId,
        dataEmprestimo: dataEmprestimo,
        dataDevolucao: dataDevolucaoPadrao.toISOString().split('T')[0],
        status: 'Emprestado'
    });
    
    showAlert('reservaSuccess', 5000); // Reutiliza o alerta de sucesso
    window.showModule('emprestimos'); // Leva o usuário para a tela de Empréstimos
}

window.cancelarReserva = function(reservaId) {
    const reserva = db.reservas.find(r => r.id === reservaId);
    if (!reserva) return;
    
    // Se a reserva cancelada estava Aguardando Retirada, o item volta a ser Disponível
    if (reserva.status === 'Aguardando Retirada') {
         const acervo = db.acervos.find(a => a.id === reserva.acervoId);
         if (acervo) acervo.status = 'Disponível';
    }

    reserva.status = 'Cancelada';
    renderReservas();
    renderAcervosTable();
}

// ============================================
// MÓDULO 5: RELATÓRIOS E NOTIFICAÇÕES
// ============================================
function gerarRelatorios() {
    const totalUsuariosEl = document.getElementById('totalUsuarios');
    if (!totalUsuariosEl) return;

    totalUsuariosEl.textContent = db.usuarios.length;
    document.getElementById('totalAcervos').textContent = db.acervos.length;
    document.getElementById('totalEmprestimos').textContent = db.emprestimos.filter(e => e.status === 'Emprestado').length;
    document.getElementById('totalReservas').textContent = db.reservas.filter(r => r.status === 'Pendente' || r.status === 'Aguardando Retirada').length;
    
    // Notificações
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;

    notificationsContainer.innerHTML = '';
    
    let hasNotifications = false;
    db.emprestimos.filter(e => e.status === 'Emprestado').forEach(e => {
        const dataDevolucao = new Date(e.dataDevolucao);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        
        if (dataDevolucao < hoje) {
             hasNotifications = true;
             const usuario = db.usuarios.find(u => u.id === e.usuarioId);
             const acervo = db.acervos.find(a => a.id === e.acervoId);
             
             const diffTime = Math.abs(hoje.getTime() - dataDevolucao.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             const multa = (diffDays * 0.50).toFixed(2); 

             notificationsContainer.innerHTML += `
                 <div class="notification-item danger">
                     <div class="notification-header">
                         <span class="notification-title">Empréstimo Atrasado (${diffDays} dias)</span>
                         <span class="notification-time">Multa: R$ ${multa}</span>
                     </div>
                     <p>O usuário <strong>${usuario.nome}</strong> está com o item <strong>"${acervo.titulo}"</strong> em atraso.</p>
                 </div>
              `;
        }
    });

    // Reservas para retirada
    db.reservas.filter(r => r.status === 'Aguardando Retirada').forEach(r => {
        hasNotifications = true;
        const usuario = db.usuarios.find(u => u.id === r.usuarioId);
        const acervo = db.acervos.find(a => a.id === r.acervoId);
        notificationsContainer.innerHTML += `
            <div class="notification-item warning">
                <div class="notification-header">
                    <span class="notification-title">Retirada Pendente</span>
                    <span class="notification-time">Atenção</span>
                </div>
                <p>O item <strong>"${acervo.titulo}"</strong> está aguardando retirada pelo usuário <strong>${usuario.nome}</strong>.</p>
            </div>
           `;
    });

    if(!hasNotifications) {
        notificationsContainer.innerHTML = '<p class="empty-state">Nenhuma notificação importante.</p>';
    }
}

// ============================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners para formulários
    if(usuarioForm) {
        usuarioForm.addEventListener('submit', e => {
            e.preventDefault();
            if (validarUsuarioForm()) {
                const limite = document.getElementById('usuarioTipo').value === 'Professor' ? 10 : 5;
                db.usuarios.push({
                    id: Date.now(),
                    nome: document.getElementById('usuarioNome').value,
                    cpf: document.getElementById('usuarioCpf').value,
                    email: document.getElementById('usuarioEmail').value,
                    telefone: document.getElementById('usuarioTelefone').value,
                    tipo: document.getElementById('usuarioTipo').value,
                    matricula: document.getElementById('usuarioMatricula').value,
                    status: 'Ativo',
                    limiteEmprestimos: limite
                });
                showAlert('usuarioSuccess');
                limparUsuarioForm();
                renderUsuariosTable();
                popularSelectsEmprestimo(); // Atualiza listas de empréstimo
            } else {
                showAlert('usuarioError');
            }
        });
    }
    
    if(acervoForm) {
        acervoForm.addEventListener('submit', e => {
            e.preventDefault();
            if(validarAcervoForm()) {
                db.acervos.push({
                    id: Date.now(),
                    titulo: document.getElementById('acervoTitulo').value,
                    autor: document.getElementById('acervoAutor').value,
                    categoria: document.getElementById('acervoCategoria').value,
                    tipo: document.getElementById('acervoTipo').value,
                    exemplares: parseInt(document.getElementById('acervoExemplares').value),
                    status: document.getElementById('acervoStatus').value,
                    descricao: document.getElementById('acervoDescricao').value
                });
                showAlert('acervoSuccess');
                limparAcervoForm();
                renderAcervosTable();
                popularSelectsEmprestimo(); // Atualiza listas de empréstimo
            }
        });
    }
    
    if(emprestimoForm) {
        emprestimoForm.addEventListener('submit', e => {
            e.preventDefault();
            if(validarEmprestimoForm()) {
                const usuarioId = parseInt(document.getElementById('emprestimoUsuario').value);
                const acervoId = parseInt(document.getElementById('emprestimoAcervo').value);
                
                db.emprestimos.push({
                    id: Date.now(),
                    usuarioId,
                    acervoId,
                    dataEmprestimo: document.getElementById('emprestimoData').value,
                    dataDevolucao: document.getElementById('emprestimoDataDevolucao').value,
                    status: 'Emprestado',
                    dataDevolucaoReal: null
                });

                const acervo = db.acervos.find(a => a.id === acervoId);
                acervo.status = 'Emprestado';

                showAlert('emprestimoSuccess');
                emprestimoForm.reset();
                popularSelectsEmprestimo();
                renderAcervosTable();
                renderEmprestimosAtivos();
            }
        });
    }

    if(reservaForm) {
        reservaForm.addEventListener('submit', e => {
            e.preventDefault();
            if(validarReservaForm()) {
                const acervoId = parseInt(document.getElementById('reservaAcervo').value);

                const reservaExistente = db.reservas.find(r => r.acervoId === acervoId && r.status === 'Pendente');
                if (reservaExistente) {
                    showAlert('emprestimoWarning', 5000); 
                    document.getElementById('emprestimoWarning').innerHTML = '⚠️ Este item já tem uma reserva pendente.';
                    return;
                }

                db.reservas.push({
                    id: Date.now(),
                    usuarioId: parseInt(document.getElementById('reservaUsuario').value),
                    acervoId: acervoId,
                    dataReserva: new Date().toISOString().split('T')[0],
                    status: 'Pendente'
                });
                showAlert('reservaSuccess');
                reservaForm.reset();
                renderReservas();
            }
        });
    }

    // Event Listeners para inputs de formatação e busca
    document.getElementById('usuarioCpf')?.addEventListener('input', e => e.target.value = formatarCPF(e.target.value));
    document.getElementById('usuarioTelefone')?.addEventListener('input', e => e.target.value = formatarTelefone(e.target.value));

    document.getElementById('searchUsuarioNome')?.addEventListener('input', renderUsuariosTable);
    document.getElementById('searchUsuarioTipo')?.addEventListener('change', renderUsuariosTable);

    document.getElementById('searchAcervoTitulo')?.addEventListener('input', renderAcervosTable);
    document.getElementById('searchAcervoAutor')?.addEventListener('input', renderAcervosTable);
    document.getElementById('searchAcervoCategoria')?.addEventListener('change', renderAcervosTable);
    document.getElementById('searchAcervoStatus')?.addEventListener('change', renderAcervosTable);

    document.getElementById('emprestimoUsuario')?.addEventListener('change', handleUsuarioChangeEmprestimo);
    
    document.getElementById('btnGerarRelatorio')?.addEventListener('click', gerarRelatorios);

    // Setar data de hoje nos campos de data, se existirem
    const emprestimoDataInput = document.getElementById('emprestimoData');
    if (emprestimoDataInput) emprestimoDataInput.value = new Date().toISOString().split('T')[0];
    
    // Renderização inicial para todos os módulos
    renderUsuariosTable();
    renderAcervosTable();
    renderEmprestimosAtivos();
    popularSelectsEmprestimo(); 
    popularSelectsReserva();
    renderReservas();
    gerarRelatorios();
});

// Força a exibição inicial do módulo de Empréstimos
document.addEventListener('DOMContentLoaded', () => {
    window.showModule('emprestimos');
});
