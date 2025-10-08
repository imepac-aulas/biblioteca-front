// Simulação de um banco de dados em memória
let db = {
    usuarios: [],
    acervos: [],
    emprestimos: [],
    reservas: []
};

// ============================================
// LÓGICA GERAL E DE NAVEGAÇÃO
// ============================================

function showModule(moduleId) {
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
    }
    if (moduleId === 'reservas') {
        popularSelectsReserva();
    }
}

function showAlert(alertId, duration = 3000) {
    const alert = document.getElementById(alertId);
    alert.classList.add('show');
    setTimeout(() => {
        alert.classList.remove('show');
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
        let condicao = input.value.trim() === '';

        if (campo === 'Cpf' && input.value.length > 0 && input.value.length < 14) condicao = true;
        if (campo === 'Email' && input.value.length > 0 && !/\S+@\S+\.\S+/.test(input.value)) condicao = true;
        if (campo === 'Telefone' && input.value.length > 0 && input.value.length < 15) condicao = true;

        if (condicao) {
            input.classList.add('input-error');
            error.classList.add('show');
            isValid = false;
        } else {
            input.classList.remove('input-error');
            error.classList.remove('show');
        }
    });
    return isValid;
}

function limparUsuarioForm() {
    usuarioForm.reset();
    ['Nome', 'Cpf', 'Email', 'Telefone', 'Tipo', 'Matricula'].forEach(campo => {
        document.getElementById(`usuario${campo}`).classList.remove('input-error');
        document.getElementById(`usuario${campo}Error`).classList.remove('show');
    });
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
    
    const nomeFiltro = document.getElementById('searchUsuarioNome').value.toLowerCase();
    const tipoFiltro = document.getElementById('searchUsuarioTipo').value;

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
                    <button class="btn btn-sm btn-danger" onclick="suspenderUsuario(${user.id})">Suspender</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function suspenderUsuario(id) {
    const user = db.usuarios.find(u => u.id === id);
    if (user) {
        user.status = user.status === 'Ativo' ? 'Suspenso' : 'Ativo';
        renderUsuariosTable();
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
        let condicao = input.value.trim() === '';

        if (campo === 'Exemplares' && parseInt(input.value) < 1) condicao = true;

        if (condicao) {
            input.classList.add('input-error');
            error.classList.add('show');
            isValid = false;
        } else {
            input.classList.remove('input-error');
            error.classList.remove('show');
        }
    });
    return isValid;
}

function limparAcervoForm() {
    acervoForm.reset();
     ['Titulo', 'Autor', 'Categoria', 'Tipo', 'Exemplares'].forEach(campo => {
        document.getElementById(`acervo${campo}`).classList.remove('input-error');
        document.getElementById(`acervo${campo}Error`).classList.remove('show');
    });
}

function renderAcervosTable() {
    const tableBody = document.getElementById('acervosTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const tituloFiltro = document.getElementById('searchAcervoTitulo').value.toLowerCase();
    const autorFiltro = document.getElementById('searchAcervoAutor').value.toLowerCase();
    const categoriaFiltro = document.getElementById('searchAcervoCategoria').value;
    const statusFiltro = document.getElementById('searchAcervoStatus').value;

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
        }

        const row = `
            <tr>
                <td>${item.titulo}</td>
                <td>${item.autor}</td>
                <td>${item.categoria}</td>
                <td>${item.exemplares}</td>
                <td><span class="badge ${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" ${item.status !== 'Disponível' ? 'disabled' : ''} onclick="showModule('emprestimos')">Emprestar</button>
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
    const usuarioId = document.getElementById('emprestimoUsuario').value;
    if (!usuarioId) return;

    const usuario = db.usuarios.find(u => u.id === parseInt(usuarioId));
    const emprestimosAtivos = db.emprestimos.filter(e => e.usuarioId === usuario.id && e.status === 'Emprestado').length;
    
    const alertWarning = document.getElementById('emprestimoWarning');
    let warnings = [];

    if (emprestimosAtivos >= usuario.limiteEmprestimos) {
        warnings.push('Usuário atingiu o limite de empréstimos.');
    }

    if (warnings.length > 0) {
        alertWarning.innerHTML = `⚠️ ${warnings.join(' ')}`;
        alertWarning.classList.add('show');
    } else {
        alertWarning.classList.remove('show');
    }
}

function validarEmprestimoForm() {
    const usuarioId = document.getElementById('emprestimoUsuario').value;
    const acervoId = document.getElementById('emprestimoAcervo').value;
    const dataDevolucao = document.getElementById('emprestimoDataDevolucao').value;
    let isValid = true;
    
    if (!usuarioId) {
        document.getElementById('emprestimoUsuarioError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('emprestimoUsuarioError').classList.remove('show');
    }

    if (!acervoId) {
        document.getElementById('emprestimoAcervoError').classList.add('show');
        isValid = false;
    } else {
        document.getElementById('emprestimoAcervoError').classList.remove('show');
    }

    if (!dataDevolucao) {
         document.getElementById('emprestimoDataDevolucaoError').classList.add('show');
        isValid = false;
    } else {
         document.getElementById('emprestimoDataDevolucaoError').classList.remove('show');
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
        
        const dataDevolucao = new Date(emprestimo.dataDevolucao);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const atrasado = dataDevolucao < hoje;

        const card = `
            <div class="loan-card">
                <div class="loan-header">
                    <h3>${acervo.titulo}</h3>
                    <span class="badge ${atrasado ? 'badge-danger' : 'badge-success'}">
                        ${atrasado ? 'Atrasado' : 'Em dia'}
                    </span>
                </div>
                <div class="loan-info">
                    <div class="info-item">
                        <span class="info-label">Usuário</span>
                        <span class="info-value">${usuario.nome}</span>
                    </div>
                     <div class="info-item">
                        <span class="info-label">Empréstimo</span>
                        <span class="info-value">${new Date(emprestimo.dataEmprestimo).toLocaleDateString()}</span>
                    </div>
                     <div class="info-item">
                        <span class="info-label">Devolução Prevista</span>
                        <span class="info-value">${new Date(emprestimo.dataDevolucao).toLocaleDateString()}</span>
                    </div>
                </div>
                 <div class="btn-group">
                    <button class="btn btn-success" onclick="registrarDevolucao(${emprestimo.id})">
                        Registrar Devolução
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function registrarDevolucao(emprestimoId) {
    const emprestimo = db.emprestimos.find(e => e.id === emprestimoId);
    const acervo = db.acervos.find(a => a.id === emprestimo.acervoId);
    
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
    const usuarioId = document.getElementById('reservaUsuario').value;
    const acervoId = document.getElementById('reservaAcervo').value;
    let isValid = true;

    if(!usuarioId) {
        document.getElementById('reservaUsuarioError').classList.add('show');
        isValid = false;
    } else {
         document.getElementById('reservaUsuarioError').classList.remove('show');
    }

     if(!acervoId) {
        document.getElementById('reservaAcervoError').classList.add('show');
        isValid = false;
    } else {
         document.getElementById('reservaAcervoError').classList.remove('show');
    }
    return isValid;
}

function renderReservas() {
    const tableBody = document.getElementById('reservasTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (db.reservas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma reserva encontrada.</td></tr>';
        return;
    }

    db.reservas.forEach(reserva => {
        const usuario = db.usuarios.find(u => u.id === reserva.usuarioId);
        const acervo = db.acervos.find(a => a.id === reserva.acervoId);
        let statusClass = '';
        switch(reserva.status) {
            case 'Pendente': statusClass = 'badge-warning'; break;
            case 'Aguardando Retirada': statusClass = 'badge-info'; break;
            case 'Finalizada': statusClass = 'badge-success'; break;
            case 'Cancelada': statusClass = 'badge-secondary'; break;
        }

        const row = `
            <tr>
                <td>${acervo.titulo}</td>
                <td>${usuario.nome}</td>
                <td>${new Date(reserva.dataReserva).toLocaleDateString()}</td>
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

function confirmarRetirada(reservaId) {
    const reserva = db.reservas.find(r => r.id === reservaId);
    reserva.status = 'Finalizada';
    // Aqui, idealmente, se criaria um novo empréstimo
    showModule('emprestimos');
    renderReservas();
}
function cancelarReserva(reservaId) {
    const reserva = db.reservas.find(r => r.id === reservaId);
    reserva.status = 'Cancelada';
    renderReservas();
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
    notificationsContainer.innerHTML = '';
    
    // Atrasos
    db.emprestimos.filter(e => e.status === 'Emprestado').forEach(e => {
        const dataDevolucao = new Date(e.dataDevolucao);
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        if (dataDevolucao < hoje) {
             const usuario = db.usuarios.find(u => u.id === e.usuarioId);
             const acervo = db.acervos.find(a => a.id === e.acervoId);
             notificationsContainer.innerHTML += `
                <div class="notification-item danger">
                    <div class="notification-header">
                        <span class="notification-title">Empréstimo Atrasado</span>
                        <span class="notification-time">Urgente</span>
                    </div>
                    <p>O usuário <strong>${usuario.nome}</strong> está com o item <strong>"${acervo.titulo}"</strong> em atraso.</p>
                </div>
             `;
        }
    });

    // Reservas para retirada
    db.reservas.filter(r => r.status === 'Aguardando Retirada').forEach(r => {
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

    if(notificationsContainer.innerHTML === '') {
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
                    exemplares: document.getElementById('acervoExemplares').value,
                    status: document.getElementById('acervoStatus').value,
                    descricao: document.getElementById('acervoDescricao').value
                });
                showAlert('acervoSuccess');
                limparAcervoForm();
                renderAcervosTable();
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
                    status: 'Emprestado'
                });

                const acervo = db.acervos.find(a => a.id === acervoId);
                acervo.status = 'Emprestado';

                showAlert('emprestimoSuccess');
                emprestimoForm.reset();
                renderAcervosTable();
                renderEmprestimosAtivos();
            }
        });
    }

    if(reservaForm) {
        reservaForm.addEventListener('submit', e => {
            e.preventDefault();
            if(validarReservaForm()) {
                db.reservas.push({
                    id: Date.now(),
                    usuarioId: parseInt(document.getElementById('reservaUsuario').value),
                    acervoId: parseInt(document.getElementById('reservaAcervo').value),
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
    // Adicionando verificações para garantir que os elementos existam
    const cpfInput = document.getElementById('usuarioCpf');
    if (cpfInput) cpfInput.addEventListener('input', e => e.target.value = formatarCPF(e.target.value));

    const telInput = document.getElementById('usuarioTelefone');
    if (telInput) telInput.addEventListener('input', e => e.target.value = formatarTelefone(e.target.value));

    const searchUsuarioNomeInput = document.getElementById('searchUsuarioNome');
    if (searchUsuarioNomeInput) searchUsuarioNomeInput.addEventListener('input', renderUsuariosTable);

    const searchUsuarioTipoSelect = document.getElementById('searchUsuarioTipo');
    if (searchUsuarioTipoSelect) searchUsuarioTipoSelect.addEventListener('change', renderUsuariosTable);

    const searchAcervoTituloInput = document.getElementById('searchAcervoTitulo');
    if (searchAcervoTituloInput) searchAcervoTituloInput.addEventListener('input', renderAcervosTable);
    
    const searchAcervoAutorInput = document.getElementById('searchAcervoAutor');
    if (searchAcervoAutorInput) searchAcervoAutorInput.addEventListener('input', renderAcervosTable);

    const searchAcervoCategoriaSelect = document.getElementById('searchAcervoCategoria');
    if (searchAcervoCategoriaSelect) searchAcervoCategoriaSelect.addEventListener('change', renderAcervosTable);

    const searchAcervoStatusSelect = document.getElementById('searchAcervoStatus');
    if (searchAcervoStatusSelect) searchAcervoStatusSelect.addEventListener('change', renderAcervosTable);

    const emprestimoUsuarioSelect = document.getElementById('emprestimoUsuario');
    if (emprestimoUsuarioSelect) emprestimoUsuarioSelect.addEventListener('change', handleUsuarioChangeEmprestimo);
    
    const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
    if (btnGerarRelatorio) btnGerarRelatorio.addEventListener('click', gerarRelatorios);

    // Setar data de hoje nos campos de data, se existirem
    const emprestimoDataInput = document.getElementById('emprestimoData');
    if (emprestimoDataInput) emprestimoDataInput.value = new Date().toISOString().split('T')[0];
    
    // Renderização inicial para todas as tabelas
    renderUsuariosTable();
    renderAcervosTable();
    renderEmprestimosAtivos();
    renderReservas();
    gerarRelatorios();
});
