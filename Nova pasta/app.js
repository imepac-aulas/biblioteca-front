// --- 1. "BANCO DE DADOS" EM MEMÓRIA E CONTADOR DE ID ---
const DATA = {
    USERS: [],
    ACERVOS: [],
    EMPRESTIMOS: [],
    RESERVAS: [], // Coleção de Reservas
    NEXT_ID: 1
};

const EMPLOYEE_PASSWORD = "1234";
let IS_LOGGED_IN = false;

/**
 * Gera um ID simulado e único (apenas para esta sessão).
 */
function generateUniqueId() {
    return (DATA.NEXT_ID++).toString().padStart(4, '0');
}

// --- 2. MODELOS DE DADOS COM REGRAS EMBUTIDAS ---

class User {
    constructor(nome, tipo) {
        this.id = generateUniqueId(); 
        this.nome = nome;
        this.tipo = tipo; // 'Aluno', 'Colaborador', 'Bibliotecário', 'Administrador'
        
        // Regras de Negócio (RN)
        this.limiteMaxEmprestimos = 5; 
        this.limiteMaxEletronicos = (tipo === 'Aluno' || tipo === 'Colaborador') ? 2 : 5; 
        
        this.suspensao = {
            ativo: false,
            dataFim: null, 
            motivo: null
        }; 
        
        this.emprestimosAtivos = 0;
        this.eletronicosAtivos = 0;
    }
}

class AcervoItem {
    constructor(titulo, autor, tipoMaterial) {
        this.id = generateUniqueId(); 
        this.titulo = titulo;
        this.autor = autor;
        this.exemplarId = `EX-${this.id}`; 
        this.tipoMaterial = tipoMaterial; // 'Livro', 'Revista', 'Eletrônico'
        
        // Regras de Negócio (RN)
        this.prazoPadraoDias = this.tipoMaterial === 'Eletrônico' ? 7 : 15;
        
        this.status = 'disponível'; // 'disponível', 'emprestado', 'reservado', 'em manutenção'
    }
}

class Reserva { // NOVO MODELO
    constructor(userId, acervoItemId) {
        this.id = generateUniqueId();
        this.userId = userId;
        this.acervoItemId = acervoItemId;
        this.dataReserva = new Date();
        this.dataDisponibilidade = null; // Data em que o item ficou PRONTO para retirada (inicia o prazo de 24h)
    }
}

class Emprestimo {
    constructor(userId, acervoItemId, prazoDias) {
        this.id = generateUniqueId(); 
        this.userId = userId;
        this.acervoItemId = acervoItemId;
        this.dataEmprestimo = new Date();
        
        const dataPrevista = new Date();
        dataPrevista.setDate(dataPrevista.getDate() + prazoDias);
        this.dataDevolucaoPrevista = dataPrevista;
        
        this.dataDevolucaoReal = null; 
        this.multa = 0; 
    }
}

// --- 3. FUNÇÕES DE UTILIDADE E UI ---

/**
 * Exibe mensagens de feedback na tela.
 * @param {string} message - Mensagem a ser exibida.
 * @param {'success'|'error'|'info'} type - Tipo da mensagem.
 */
function displayMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    let baseClasses = "p-3 rounded-lg font-semibold transition-all duration-300";
    let colorClasses;

    switch (type) {
        case 'success':
            colorClasses = "bg-green-100 text-green-700 border border-green-300";
            break;
        case 'error':
            colorClasses = "bg-red-100 text-red-700 border border-red-300";
            break;
        case 'info':
        default:
            colorClasses = "bg-blue-100 text-blue-700 border border-blue-300";
            break;
    }

    container.innerHTML = `<div class="${baseClasses} ${colorClasses}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 5000);
}

/**
 * Alterna entre as seções do dashboard.
 */
window.showSection = (sectionId, buttonElement) => {
    document.querySelectorAll('#dashboard section').forEach(section => {
        section.classList.add('section-hidden');
    });
    document.getElementById(sectionId).classList.remove('section-hidden');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
};

// --- 4. FUNÇÕES CRUD BASE (OPERAÇÕES EM MEMÓRIA) ---

function addItemToMemory(collectionName, data) {
    if (!DATA[collectionName]) throw new Error(`Coleção ${collectionName} não encontrada.`);
    DATA[collectionName].push(data);
    renderAllData(); 
    return data;
}

function getItemById(collectionName, id) {
     if (!DATA[collectionName]) throw new Error(`Coleção ${collectionName} não encontrada.`);
    // Retorna o objeto *real* no array, não uma cópia, para permitir UPDATE direto
    return DATA[collectionName].find(item => item.id === id) || null; 
}

function updateItemInMemory(collectionName, id, updates) {
    const item = getItemById(collectionName, id);
    if (item) {
        Object.assign(item, updates);
        renderAllData(); 
        return item;
    }
    // Permite falha silenciosa para Reservas, pois elas podem expirar
    if(collectionName !== 'RESERVAS') {
        throw new Error(`Item ID ${id} não encontrado na coleção ${collectionName}.`);
    }
    return null;
}

function deleteItemFromMemory(collectionName, id) {
    const index = DATA[collectionName].findIndex(item => item.id === id);
    if (index > -1) {
        const [deletedItem] = DATA[collectionName].splice(index, 1);
        renderAllData(); 
        return deletedItem;
    }
    throw new Error(`Item ID ${id} não encontrado na coleção ${collectionName}.`);
}

// Expõe as funções globais para o HTML
window.addItemToMemory = addItemToMemory;
window.deleteItemFromMemory = deleteItemFromMemory;
window.updateItemInMemory = updateItemInMemory;
window.getItemById = getItemById;
        
// --- 5. LÓGICA DE AUTENTICAÇÃO ---

window.handleLogin = () => {
    const password = document.getElementById('loginPassword').value;
    if (password === EMPLOYEE_PASSWORD) {
        IS_LOGGED_IN = true;
        document.getElementById('login-screen').classList.add('section-hidden');
        document.getElementById('dashboard').classList.remove('section-hidden');
        displayMessage("Acesso concedido. Bem-vindo(a) à Gestão da Biblioteca!", 'success');
        
        // Verifica e Notifica sobre prazos logo após o login (RN de Notificações)
        checkDeadlinesAndNotify();
        
        // Garante que a primeira seção seja exibida
        showSection('users-section', document.querySelector('[data-section="users-section"]')); 
        // Inicializa dados de demonstração
        initializeDemoData();
    } else {
        displayMessage("Senha incorreta.", 'error');
    }
};

window.handleLogout = () => {
    IS_LOGGED_IN = false;
    document.getElementById('dashboard').classList.add('section-hidden');
    document.getElementById('login-screen').classList.remove('section-hidden');
    document.getElementById('loginPassword').value = '';
    displayMessage("Sessão encerrada.", 'info');
};

// --- 6. HANDLERS DE FORMULÁRIO (USUÁRIOS, ACERVO) ---

// Usuários 
window.handleCreateUser = () => {
    const nameInput = document.getElementById('userName');
    const typeInput = document.getElementById('userType');
    const nome = nameInput.value.trim();
    const tipo = typeInput.value;

    if (!nome) {
        displayMessage('O nome é obrigatório!', 'error');
        return;
    }
    
    try {
        const newUserInstance = new User(nome, tipo);
        addItemToMemory('USERS', newUserInstance); 
        
        displayMessage(`Usuário "${nome}" (${tipo}) cadastrado! ID: ${newUserInstance.id}`, 'success');
        nameInput.value = ''; 
    } catch (error) {
        displayMessage(`Erro ao criar: ${error.message}`, 'error');
        console.error(error);
    }
};

window.handleCreateAcervo = () => {
    const tituloInput = document.getElementById('acervoTitulo');
    const autorInput = document.getElementById('acervoAutor');
    const tipoInput = document.getElementById('acervoTipo');

    const titulo = tituloInput.value.trim();
    const autor = autorInput.value.trim();
    const tipo = tipoInput.value;

    if (!titulo || !autor) {
        displayMessage('Título e Autor são obrigatórios!', 'error');
        return;
    }

    try {
        const newItem = new AcervoItem(titulo, autor, tipo);
        addItemToMemory('ACERVOS', newItem);

        displayMessage(`Item "${titulo}" cadastrado! ID: ${newItem.id} (Tipo: ${tipo})`, 'success');
        tituloInput.value = '';
        autorInput.value = '';
    } catch (error) {
        displayMessage(`Erro ao criar acervo: ${error.message}`, 'error');
        console.error(error);
    }
};

// --- 7. LÓGICA CENTRAL DE EMPRÉSTIMO, DEVOLUÇÃO E RESERVA (RN) ---

// 7.1. RESERVA
window.handleCreateReserva = (acervoId) => {
    // Para simplificar a UI, pede o ID do usuário via prompt
    const userId = prompt("Digite o ID do Usuário que deseja reservar o item:"); 
    if (!userId) return displayMessage("ID do Usuário é obrigatório para reserva.", 'error');

    const user = getItemById('USERS', userId);
    const item = getItemById('ACERVOS', acervoId);

    if (!user) return displayMessage(`Erro: Usuário ID ${userId} não encontrado.`, 'error');
    if (!item) return displayMessage(`Erro: Acervo ID ${acervoId} não encontrado.`, 'error');

    // RN: Item deve estar indisponível (emprestado ou em manutenção)
    if (item.status === 'disponível') {
        return displayMessage(`Erro: O item "${item.titulo}" já está disponível para empréstimo!`, 'error');
    }

    // RN: Checa se já existe uma reserva ativa para este item
    const existingReservation = DATA.RESERVAS.find(r => r.acervoItemId === acervoId);
    if (existingReservation) {
        const existingUser = getItemById('USERS', existingReservation.userId);
        return displayMessage(`Erro: "${item.titulo}" já possui uma reserva ativa por ${existingUser ? existingUser.nome : 'usuário desconhecido'}.`, 'error');
    }
    
    // RN: Não pode reservar se estiver suspenso
    if (user.suspensao.ativo) return displayMessage(`Erro: Usuário ${user.nome} está suspenso. Não pode realizar reservas.`, 'error');

    try {
        const newReserva = new Reserva(userId, acervoId);
        addItemToMemory('RESERVAS', newReserva); 

        // RN: Mudar status do item para 'reservado' se estiver em manutenção
        if (item.status === 'em manutenção') {
            updateItemInMemory('ACERVOS', item.id, { status: 'reservado' });
        }
        
        displayMessage(`Reserva de "${item.titulo}" realizada por ${user.nome}. Notificação será enviada na devolução.`, 'success');
        
    } catch (error) {
        displayMessage(`Erro ao criar reserva: ${error.message}`, 'error');
        console.error(error);
    }
};

// 7.2. EMPRÉSTIMO
window.handleCreateEmprestimo = () => {
    const userId = document.getElementById('emprestimoUserId').value.trim();
    const acervoId = document.getElementById('emprestimoAcervoId').value.trim();

    const user = getItemById('USERS', userId);
    const item = getItemById('ACERVOS', acervoId);

    if (!user) return displayMessage(`Erro: Usuário ID ${userId} não encontrado.`, 'error');
    if (!item) return displayMessage(`Erro: Acervo ID ${acervoId} não encontrado.`, 'error');
    
    // RN: Só permite empréstimo se status for 'disponível' (e não 'reservado')
    if (item.status !== 'disponível') return displayMessage(`Erro: O item "${item.titulo}" não está disponível (Status: ${item.status}).`, 'error');
    
    if (user.suspensao.ativo) return displayMessage(`Erro: Usuário ${user.nome} está suspenso até ${new Date(user.suspensao.dataFim).toLocaleDateString()}.`, 'error');

    // RN: Checagem de Limite Total
    if (user.emprestimosAtivos >= user.limiteMaxEmprestimos) {
         return displayMessage(`Erro: ${user.nome} atingiu o limite máximo de ${user.limiteMaxEmprestimos} empréstimos ativos.`, 'error');
    }

    // RN: Checagem de Limite de Eletrônicos
    if (item.tipoMaterial === 'Eletrônico') {
        if (user.eletronicosAtivos >= user.limiteMaxEletronicos) {
            return displayMessage(`Erro: ${user.nome} atingiu o limite máximo de ${user.limiteMaxEletronicos} itens eletrônicos ativos.`, 'error');
        }
        user.eletronicosAtivos++;
    }
    
    // Sucesso: Realiza o Empréstimo
    try {
        // 1. Cria o Empréstimo
        const newLoan = new Emprestimo(user.id, item.id, item.prazoPadraoDias);
        addItemToMemory('EMPRESTIMOS', newLoan);

        // 2. Atualiza o status do Item do Acervo
        updateItemInMemory('ACERVOS', item.id, { status: 'emprestado' });

        // 3. Atualiza os contadores do Usuário (em memória, por referência)
        user.emprestimosAtivos++;
        
        // 4. Força a renderização final para exibir o contador do usuário atualizado
        renderAllData(); 

        displayMessage(`Empréstimo realizado: Item ${item.id} para ${user.nome}. Devolução em: ${newLoan.dataDevolucaoPrevista.toLocaleDateString()}.`, 'success');

        document.getElementById('emprestimoUserId').value = '';
        document.getElementById('emprestimoAcervoId').value = '';

    } catch (error) {
        displayMessage(`Erro inesperado ao realizar empréstimo: ${error.message}`, 'error');
        console.error(error);
    }
};

// 7.3. DEVOLUÇÃO
window.handleDevolverEmprestimo = (emprestimoId) => {
    const loan = getItemById('EMPRESTIMOS', emprestimoId);
    if (!loan) return displayMessage(`Erro: Empréstimo ID ${emprestimoId} não encontrado.`, 'error');

    const item = getItemById('ACERVOS', loan.acervoItemId);
    const user = getItemById('USERS', loan.userId);

    if (!item || !user) return displayMessage("Erro: Dados de Acervo/Usuário do empréstimo estão inconsistentes.", 'error');

    const today = new Date();
    const dataPrevista = new Date(loan.dataDevolucaoPrevista);
    let multaMessage = "Devolução sem multa.";

    // 1. Checa por Multa (Atraso)
    if (today > dataPrevista) {
        const diffTime = Math.abs(today - dataPrevista);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        loan.multa = diffDays * 2.00; // Exemplo: R$ 2,00 por dia
        multaMessage = `ATENÇÃO: Atraso de ${diffDays} dias. Multa de R$ ${loan.multa.toFixed(2)}.`;
        
        // RN: Suspensão por Atraso (Exemplo: 5 dias de suspensão por atraso)
        user.suspensao.ativo = true;
        const dataFimSusp = new Date();
        dataFimSusp.setDate(today.getDate() + 5);
        user.suspensao.dataFim = dataFimSusp;
        user.suspensao.motivo = `Atraso na devolução do item ${item.titulo}.`;

        // Notificação de Penalidade
        displayMessage(`PENALIDADE: Usuário ${user.nome} SUSPENSO por atraso. Motivo: ${user.suspensao.motivo}`, 'error');
    }

    // 2. Atualiza Empréstimo (registra data de devolução)
    loan.dataDevolucaoReal = today;
    
    // 3. Checa por Reservas Pendentes (RN de Notificação)
    const nextReservation = DATA.RESERVAS.find(r => r.acervoItemId === item.id);
    
    let newStatus = 'disponível';
    if (nextReservation) {
        newStatus = 'reservado';
        
        // RN: Notifica o usuário e inicia o prazo de 24h
        updateItemInMemory('ACERVOS', item.id, { status: newStatus });
        
        // Atualiza a reserva com a data em que ficou disponível
        // ESTA AÇÃO SIMULA O ENVIO DE NOTIFICAÇÃO AO USUÁRIO
        updateItemInMemory('RESERVAS', nextReservation.id, { dataDisponibilidade: new Date() }); 
        
        const reservedUser = getItemById('USERS', nextReservation.userId);
        const reservedUserName = reservedUser ? reservedUser.nome : 'Usuário Desconhecido';
        multaMessage += ` (NOTIFICAÇÃO ENVIADA: Item reservado para ${reservedUserName}. Início do prazo de 24h para retirada.)`;
        displayMessage(`RESERVA PRONTA: Item "${item.titulo}" está disponível para retirada pelo usuário ${reservedUserName}.`, 'success');
    } else {
        // Item volta a estar disponível
        updateItemInMemory('ACERVOS', item.id, { status: newStatus });
    }

    // 4. Atualiza Contadores do Usuário
    user.emprestimosAtivos--;
    if (item.tipoMaterial === 'Eletrônico') {
        user.eletronicosAtivos--;
    }
    
    // Remove da lista de ativos
    deleteItemFromMemory('EMPRESTIMOS', emprestimoId); 

    displayMessage(`Devolução de "${item.titulo}" processada. ${multaMessage}`, 'success');

    // Re-renderiza tudo
    renderAllData();
};

// 7.4. RETIRADA DA RESERVA
window.handlePickupReserva = (reservaId) => {
    const reserva = getItemById('RESERVAS', reservaId);
    if (!reserva) return displayMessage(`Erro: Reserva ID ${reservaId} não encontrada.`, 'error');
    
    const item = getItemById('ACERVOS', reserva.acervoItemId);
    const user = getItemById('USERS', reserva.userId);
    
    if (!item || !user) return displayMessage("Erro: Item de acervo ou usuário inconsistente na reserva.", 'error');

    // RN: Verifica se a reserva expirou (24 horas)
    if (reserva.dataDisponibilidade) {
        const expirationTime = new Date(reserva.dataDisponibilidade);
        // 24 horas após a data de disponibilidade
        expirationTime.setHours(expirationTime.getHours() + 24);
        
        if (new Date() > expirationTime) {
            // Reserva expirou
            deleteItemFromMemory('RESERVAS', reservaId);
            // Item volta a estar disponível
            updateItemInMemory('ACERVOS', item.id, { status: 'disponível' });
            displayMessage(`Reserva ID ${reservaId} expirou (prazo de 24h excedido). Item "${item.titulo}" voltou a estar disponível.`, 'error');
            return;
        }
    } else {
        return displayMessage(`Erro: O item "${item.titulo}" ainda não está disponível para retirada (Não houve devolução).`, 'info');
    }

    // Checagem de Limites (Reaproveita lógica de empréstimo)
    if (user.suspensao.ativo) return displayMessage(`Erro: Usuário ${user.nome} está suspenso. Não pode realizar empréstimos.`, 'error');
    if (user.emprestimosAtivos >= user.limiteMaxEmprestimos) {
         return displayMessage(`Erro: ${user.nome} atingiu o limite máximo de ${user.limiteMaxEmprestimos} empréstimos ativos.`, 'error');
    }
    if (item.tipoMaterial === 'Eletrônico' && user.eletronicosAtivos >= user.limiteMaxEletronicos) {
        return displayMessage(`Erro: ${user.nome} atingiu o limite máximo de ${user.limiteMaxEletronicos} itens eletrônicos ativos.`, 'error');
    }

    // Se as checagens passarem, realiza o empréstimo:
    try {
        const newLoan = new Emprestimo(user.id, item.id, item.prazoPadraoDias);
        addItemToMemory('EMPRESTIMOS', newLoan);

        // O item já estava como 'reservado', agora vai para 'emprestado'
        updateItemInMemory('ACERVOS', item.id, { status: 'emprestado' });

        user.emprestimosAtivos++;
        if (item.tipoMaterial === 'Eletrônico') {
            user.eletronicosAtivos++;
        }
        
        // DELETA A RESERVA ATIVA
        deleteItemFromMemory('RESERVAS', reservaId);
        
        renderAllData(); 

        displayMessage(`Retirada da reserva bem-sucedida! Item ${item.id} emprestado para ${user.nome}.`, 'success');

    } catch (error) {
        displayMessage(`Erro inesperado ao realizar empréstimo via reserva: ${error.message}`, 'error');
        console.error(error);
    }
};


// --- 8. FUNÇÕES DE RENDERIZAÇÃO E RELATÓRIOS (RN) ---

/**
 * RN: Simula a checagem automática de prazos no Login e envia alerta de 24h.
 */
function checkDeadlinesAndNotify() {
    const today = new Date();
    let nearDeadlineCount = 0;
    
    DATA.EMPRESTIMOS.forEach(loan => {
        const dueDate = new Date(loan.dataDevolucaoPrevista);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Envia notificação se falta 1 dia para o vencimento
        if (daysDiff === 1) { 
            const user = getItemById('USERS', loan.userId);
            const item = getItemById('ACERVOS', loan.acervoItemId);
            if (user && item) {
                displayMessage(`ALERTA DE PRAZO: O item "${item.titulo}" deve ser devolvido amanhã por ${user.nome} (ID: ${user.id}).`, 'info');
                nearDeadlineCount++;
            }
        }
    });
    
    if (nearDeadlineCount > 0) {
        setTimeout(() => {
             displayMessage(`Verificação de Notificações concluída: ${nearDeadlineCount} alerta(s) de prazo próximo enviado(s).`, 'info');
        }, 100);
    }
}

/**
 * RN: Gera Relatório de Usuários em Atraso/Suspensos.
 */
function generateLateUsersReport() {
    const lateUsers = DATA.USERS.filter(user => user.suspensao.ativo);
    
    const reportContainer = document.getElementById('lateUsersReport');
    reportContainer.innerHTML = '';

    if (lateUsers.length === 0) {
        reportContainer.innerHTML = `<p class="text-gray-500 italic p-3 bg-green-50 rounded-lg">Nenhum usuário atualmente em atraso ou suspenso. Status regular.</p>`;
        return;
    }

    let html = '<ul class="divide-y divide-red-200">';
    lateUsers.forEach(user => {
        const suspensionEnd = new Date(user.suspensao.dataFim).toLocaleDateString();
        html += `
            <li class="p-3 bg-red-50 text-red-800 rounded-lg my-2 border border-red-300">
                <span class="font-bold">${user.nome}</span> (ID: ${user.id})
                <br>
                Motivo: ${user.suspensao.motivo}
                <br>
                <span class="text-sm font-bold">Suspensão termina em: ${suspensionEnd}</span>
            </li>
        `;
    });
    html += '</ul>';
    reportContainer.innerHTML = html;
}

/**
 * RN: Gera Relatório de Itens Mais Emprestados (Ativos).
 */
function generateMostBorrowedReport() {
    // 1. Conta empréstimos ativos por item
    const borrowCounts = {};
    DATA.EMPRESTIMOS.forEach(loan => {
        borrowCounts[loan.acervoItemId] = (borrowCounts[loan.acervoItemId] || 0) + 1;
    });
    
    // 2. Mapeia itens com suas contagens e filtra/ordena
    const sortedItems = DATA.ACERVOS
        .map(item => ({
            ...item,
            activeLoans: borrowCounts[item.id] || 0
        }))
        .filter(item => item.activeLoans > 0) // Só mostra os que estão ativamente emprestados
        .sort((a, b) => b.activeLoans - a.activeLoans)
        .slice(0, 10); // Top 10

    const reportContainer = document.getElementById('mostBorrowedReport');
    reportContainer.innerHTML = '';
    
    if (sortedItems.length === 0) {
        reportContainer.innerHTML = `<p class="text-gray-500 italic p-3 bg-gray-100 rounded-lg">Nenhum item ativo no momento para gerar o relatório.</p>`;
        return;
    }

    let html = '<ul class="divide-y divide-gray-200">';
    sortedItems.forEach((item, index) => {
        html += `
            <li class="p-3 flex justify-between items-center hover:bg-blue-50 transition duration-150">
                <span class="font-bold text-lg text-blue-700 w-10">${index + 1}.</span>
                <span class="flex-1 ml-4">${item.titulo} (${item.tipoMaterial})</span>
                <span class="font-semibold text-gray-800">${item.activeLoans} Empréstimos Ativos</span>
            </li>
        `;
    });
    html += '</ul>';
    reportContainer.innerHTML = html;
}

// Expõe a função de geração de relatórios para o botão na UI
window.generateReports = () => {
    generateLateUsersReport();
    generateMostBorrowedReport();
    displayMessage("Relatórios de gestão atualizados com sucesso.", 'info');
};


/**
 * Renderiza uma lista de documentos na tela.
 */
function renderList(elementId, countId, data, primaryProp) {
    const ul = document.getElementById(elementId);
    const count = document.getElementById(countId);
    ul.innerHTML = '';
    count.textContent = data.length;

    if (data.length === 0) {
        ul.innerHTML = `<li class="text-gray-500 italic p-2">Nenhum registro encontrado.</li>`;
        return;
    }
    
    data.forEach(item => {
        const li = document.createElement('li');
        // Usamos flex para garantir alinhamento horizontal
        li.className = 'py-3 px-1 text-gray-700 flex justify-between items-center border-b last:border-b-0 space-x-4'; 
        
        let display = `<span class="font-mono text-xs text-gray-500">ID:${item.id}</span> `;
        let actions = '';
        let statusBadge = '';

        if (elementId === 'userList') {
            const statusClass = item.suspensao.ativo ? 'bg-red-500' : 'bg-green-500';
            const statusText = item.suspensao.ativo ? `SUSPENSO (até ${new Date(item.suspensao.dataFim).toLocaleDateString()})` : 'ATIVO';

            statusBadge = `<span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass} text-white">${statusText}</span>`;
            
            display += `<span class="font-semibold">${item.nome}</span> (${item.tipo}) - Empréstimos: ${item.emprestimosAtivos}/${item.limiteMaxEmprestimos} ${statusBadge}`;
            
            actions = `
                <button onclick="deleteItemFromMemory('USERS', '${item.id}')" class="btn-danger">
                    Deletar
                </button>
            `;
        } else if (elementId === 'acervoList') {
            const statusColor = item.status === 'disponível' ? 'text-green-600' : (item.status === 'emprestado' ? 'text-red-600' : (item.status === 'reservado' ? 'text-yellow-600' : 'text-gray-600'));
            statusBadge = `<span class="font-bold ${statusColor}">${item.status.toUpperCase()}</span>`;

            // NOVO LAYOUT PARA ACERVO
            display = `
                <div class="flex flex-col flex-grow min-w-0">
                    <span class="font-semibold text-gray-800 truncate">${item.titulo}</span>
                    <span class="text-xs text-gray-600 truncate">Por: ${item.autor} (${item.tipoMaterial})</span>
                    <span class="font-mono text-xs text-gray-500 mt-1">ID: ${item.id} - Status: ${statusBadge}</span>
                </div>
            `;
            
            // Container das ações, mantido flexível
            actions = `
                <div class="flex items-center space-x-1 flex-shrink-0">
                    <button onclick="updateItemInMemory('ACERVOS', '${item.id}', {status: 'disponível'})" class="btn-secondary" title="Marcar como disponível">Disp</button>
                    <button onclick="updateItemInMemory('ACERVOS', '${item.id}', {status: 'em manutenção'})" class="btn-secondary" title="Marcar como em manutenção">Manut</button>
                    
            `;
            
            // RN: Permite Reservar se não estiver DISPONÍVEL e se não houver reserva ativa
            const isReserved = DATA.RESERVAS.some(r => r.acervoItemId === item.id);
            if (item.status !== 'disponível' && !isReserved) {
                 actions += `
                    <button onclick="handleCreateReserva('${item.id}')" class="btn-primary ml-2" title="Reservar Item Indisponível">Reservar</button>
                `;
            }
            actions += `
                    <button onclick="deleteItemFromMemory('ACERVOS', '${item.id}')" class="btn-danger">Del</button>
                </div>
            `;


        } else if (elementId === 'emprestimoList') {
            const user = getItemById('USERS', item.userId);
            const acervo = getItemById('ACERVOS', item.acervoItemId);

            const userName = user ? user.nome : 'Usuário Desconhecido';
            const acervoTitle = acervo ? acervo.titulo : 'Item Desconhecido';
            const dataPrev = item.dataDevolucaoPrevista.toLocaleDateString();

            display += `
                <div class="flex flex-col">
                    <span class="font-semibold">Item: ${acervoTitle}</span>
                    <span class="text-sm text-gray-600">Para: ${userName} (ID: ${item.userId})</span>
                    <span class="text-xs text-gray-500 mt-1">Devolução Prevista: ${dataPrev}</span>
                </div>
            `;
            actions = `
                <button onclick="handleDevolverEmprestimo('${item.id}')" class="btn-success">
                    Devolver
                </button>
            `;
        } else if (elementId === 'reservaList') { // NOVO RENDER PARA RESERVAS
            const user = getItemById('USERS', item.userId);
            const acervo = getItemById('ACERVOS', item.acervoItemId);
            
            const userName = user ? user.nome : 'Usuário Desconhecido';
            const acervoTitle = acervo ? acervo.titulo : 'Item Desconhecido';
            
            let statusReserva = 'Aguardando Devolução';
            let actionsReserva = '';
            let expiryTimeDisplay = '';
            
            if (item.dataDisponibilidade) {
                const availableDate = new Date(item.dataDisponibilidade);
                const expiryDate = new Date(availableDate);
                // RN: Prazo de 24 horas para retirada
                expiryDate.setHours(expiryDate.getHours() + 24);
                
                const now = new Date();
                
                if (now > expiryDate) {
                    statusReserva = 'EXPIRADA (Limpar)';
                    actionsReserva = `
                        <button onclick="handlePickupReserva('${item.id}')" class="btn-danger">Limpar Reserva</button>
                    `;
                    expiryTimeDisplay = `<span class="text-xs text-red-500 font-bold">PRAZO EXPIRADO!</span>`;
                } else {
                    statusReserva = 'PRONTA P/ RETIRADA';
                    actionsReserva = `
                        <button onclick="handlePickupReserva('${item.id}')" class="btn-success">Retirar</button>
                    `;
                    expiryTimeDisplay = `<span class="text-xs text-gray-500">Disponível até: ${expiryDate.toLocaleTimeString('pt-BR')}</span>`;
                }
            }

            display += `
                <div class="flex flex-col">
                    <span class="font-semibold">${acervoTitle} (ID: ${item.acervoItemId})</span>
                    <span class="text-sm text-gray-600">Reservado por: ${userName} (ID: ${item.userId})</span>
                    <span class="text-xs text-blue-600 mt-1 font-bold">Status: ${statusReserva}</span>
                    ${expiryTimeDisplay}
                </div>
            `;
            actions = actionsReserva;
        }
        
        li.innerHTML = `
            <div class="flex items-center space-x-3 w-4/5">
                ${display}
            </div>
            <div class="flex-shrink-0">
                ${actions}
            </div>
        `;
        ul.appendChild(li);
    });
}

/**
 * Atualiza todas as listas na tela.
 */
function renderAllData() {
    renderList('userList', 'userCount', DATA.USERS, 'nome');
    renderList('acervoList', 'acervoCount', DATA.ACERVOS, 'titulo');
    renderList('emprestimoList', 'emprestimoCount', DATA.EMPRESTIMOS, 'dataEmprestimo');
    renderList('reservaList', 'reservaCount', DATA.RESERVAS, 'dataReserva'); 
}

// --- 9. INICIALIZAÇÃO DE DADOS DE DEMONSTRAÇÃO ---

function initializeDemoData() {
    // Limpa dados de demonstração (para não duplicar a cada login)
    DATA.USERS.length = 0;
    DATA.ACERVOS.length = 0;
    DATA.EMPRESTIMOS.length = 0;
    DATA.RESERVAS.length = 0;
    DATA.NEXT_ID = 1;
    
    // Usuário Aluno (ID 0001)
    addItemToMemory('USERS', new User("Aline Souza", "Aluno")); 
    // Usuário Colaborador (ID 0002) - Tem limite de 2 eletrônicos
    addItemToMemory('USERS', new User("Roberto Silva", "Colaborador")); 
    // Usuário Bibliotecário (ID 0003)
    addItemToMemory('USERS', new User("Carlos Lima", "Bibliotecário")); 

    // Itens de Acervo (Livros e Revistas)
    addItemToMemory('ACERVOS', new AcervoItem("A Ilíada", "Homero", "Livro")); // ID 0004
    addItemToMemory('ACERVOS', new AcervoItem("Economia em Foco (Junho)", "Editora XPTO", "Revista")); // ID 0005
    
    // NOVOS ITENS ELETRÔNICOS PARA DEMONSTRAÇÃO
    // Eletrônico 1
    addItemToMemory('ACERVOS', new AcervoItem("Smartphone Pro Max 14", "TechCorp", "Eletrônico")); // ID 0006
    // Eletrônico 2
    addItemToMemory('ACERVOS', new AcervoItem("Notebook Ultralite X", "GloboTech", "Eletrônico")); // ID 0007
    // Eletrônico 3
    addItemToMemory('ACERVOS', new AcervoItem("Tablet Educacional V2", "Aprende Fácil", "Eletrônico")); // ID 0008


    // SIMULAÇÕES INICIAIS
    
    // 1. Empréstimo de item 0004 (Livro) para o Usuário 0001 (Aline)
    const itemLivro = getItemById('ACERVOS', '0004');
    const loanLivro = new Emprestimo('0001', itemLivro.id, itemLivro.prazoPadraoDias);
    addItemToMemory('EMPRESTIMOS', loanLivro);
    updateItemInMemory('ACERVOS', itemLivro.id, { status: 'emprestado' });
    const userAline = getItemById('USERS', '0001');
    if(userAline) userAline.emprestimosAtivos++;

    // 2. Empréstimo de item 0006 (Eletrônico 1) para o Usuário 0002 (Roberto)
    const itemEletr1 = getItemById('ACERVOS', '0006');
    const loanEletr1 = new Emprestimo('0002', itemEletr1.id, itemEletr1.prazoPadraoDias);
    addItemToMemory('EMPRESTIMOS', loanEletr1);
    updateItemInMemory('ACERVOS', itemEletr1.id, { status: 'emprestado' });
    const userRoberto = getItemById('USERS', '0002');
    if(userRoberto) {
        userRoberto.emprestimosAtivos++;
        userRoberto.eletronicosAtivos++;
    }

    // 3. Reserva pendente (para item 0007, Notebook, que está DISPONÍVEL)
    // NOTA: A reserva só é criada se o item estiver indisponível. Vamos deixar o item 0007 disponível.
    // O usuário 0002 já tem 1/2 eletrônicos ativos. Se ele tentar pegar o 0007 (Eletrônico 2), ele ainda pode.
    
    // Se Roberto (0002) pegar o item 0007, ele atingirá o limite de 2 eletrônicos (2/2).
    // Tente emprestar o item 0007 para o ID 0002 na aba Empréstimos. Ele deve funcionar.
    
    // Tente emprestar o item 0008 (Eletrônico 3) para o ID 0002. Ele **DEVE SER BLOQUEADO** pela RN.
}

// --- 10. INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
     // Configura as classes iniciais
    document.getElementById('dashboard').classList.add('section-hidden');
    document.getElementById('login-screen').classList.remove('section-hidden');

    // Chamada de renderização inicial (apenas para garantir que os contadores sejam 0 antes do login)
    renderAllData(); 
});
