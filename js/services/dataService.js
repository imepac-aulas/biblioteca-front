// --- Módulo de Dados (dataService.js) ---
// OBJETIVO: Centralizar toda a lógica de manipulação de dados (CRUD)
// e a comunicação com o localStorage.

/**
 * Gera um identificador único universal (UUID).
 * @returns {string} Um UUID.
 */
const generateUUID = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

export const DataService = {
    state: { users: [], items: [], loans: [], reservations: [] },
    
    /**
     * Carrega todos os dados do localStorage para o estado da aplicação.
     */
    loadData() {
        this.state.users = JSON.parse(localStorage.getItem('biblioteca_users')) || [];
        this.state.items = JSON.parse(localStorage.getItem('biblioteca_items')) || [];
        this.state.loans = JSON.parse(localStorage.getItem('biblioteca_loans')) || [];
        this.state.reservations = JSON.parse(localStorage.getItem('biblioteca_reservations')) || [];
    },
    
    /**
     * Salva uma parte específica do estado no localStorage.
     * @param {string} key - A chave para salvar (ex: 'users').
     * @param {Array} data - Os dados a serem salvos.
     * @private
     */
    _commit(key, data) {
        localStorage.setItem(`biblioteca_${key}`, JSON.stringify(data));
    },
    
    // --- User CRUD ---
    getUsers: () => DataService.state.users,
    addUser: (user) => { 
        user.id = generateUUID();
        DataService.state.users.push(user); 
        DataService._commit('users', DataService.state.users); 
    },
    updateUser: (updatedUser) => {
        const index = DataService.state.users.findIndex(u => u.id === updatedUser.id);
        if (index > -1) DataService.state.users[index] = updatedUser;
        DataService._commit('users', DataService.state.users);
    },
    deleteUser: (userId) => { 
        DataService.state.users = DataService.state.users.filter(u => u.id !== userId); 
        DataService._commit('users', DataService.state.users); 
    },
    findUserById: (id) => DataService.state.users.find(u => u.id === id),
    
    // --- Item CRUD ---
    getItems: () => DataService.state.items,
    addItem: (item) => { 
        item.id = generateUUID();
        DataService.state.items.push(item); 
        DataService._commit('items', DataService.state.items); 
    },
    updateItem: (updatedItem) => {
        const index = DataService.state.items.findIndex(i => i.id === updatedItem.id);
        if (index > -1) DataService.state.items[index] = updatedItem;
        DataService._commit('items', DataService.state.items);
    },
    deleteItem: (itemId) => { 
        DataService.state.items = DataService.state.items.filter(i => i.id !== itemId); 
        DataService._commit('items', DataService.state.items); 
    },
    findItemById: (id) => DataService.state.items.find(i => i.id === id),

    // --- Loan and Reservation Logic ---
    getLoans: () => DataService.state.loans,
    getActiveLoans: () => DataService.state.loans.filter(l => !l.returnDate),
    addLoan: (loan) => { 
        loan.id = generateUUID();
        DataService.state.loans.push(loan); 
        DataService._commit('loans', DataService.state.loans); 
    },
    returnLoan: (loanId) => {
        const loan = DataService.state.loans.find(l => l.id === loanId);
        if (loan) loan.returnDate = new Date().toISOString();
        DataService._commit('loans', DataService.state.loans);
    },

    /**
     * Adia a data de devolução de um empréstimo.
     * @param {string} loanId - O ID do empréstimo a ser adiado.
     * @param {number} days - O número de dias para adiar.
     */
    postponeReturn: (loanId, days) => {
        const loan = DataService.state.loans.find(l => l.id === loanId);
        if (loan) {
            const currentDueDate = new Date(loan.dueDate);
            currentDueDate.setDate(currentDueDate.getDate() + days);
            loan.dueDate = currentDueDate.toISOString();
        }
        DataService._commit('loans', DataService.state.loans);
    },

    getReservations: () => DataService.state.reservations,
    addReservation: (reservation) => { 
        reservation.id = generateUUID();
        DataService.state.reservations.push(reservation); 
        DataService._commit('reservations', DataService.state.reservations); 
    },
    removeReservation: (itemId, userId) => {
        DataService.state.reservations = DataService.state.reservations.filter(r => !(r.itemId === itemId && r.userId === userId));
        DataService._commit('reservations', DataService.state.reservations);
    },
    getItemReservations: (itemId) => DataService.state.reservations.filter(r => r.itemId === itemId).sort((a,b) => new Date(a.date) - new Date(b.date)),

    /**
     * Calcula o número de exemplares disponíveis de um item.
     * @param {object} item - O objeto do item.
     * @returns {number} O número de cópias disponíveis.
     */
    getItemAvailability(item) {
        if (!item || typeof item.copies !== 'number') return 0;
        const activeLoans = this.getActiveLoans().filter(l => l.itemId === item.id).length;
        return item.copies - activeLoans;
    }
};