import { DataService } from '../services/dataService.js';
import { UIService } from '../services/uiService.js';

// --- Módulo de Reservas (reservas.js) ---
export const ReservaModule = {
    list: document.getElementById('reservation-list'),

    init() {
        // Nenhuma interação direta nesta tela por enquanto
    },

    render() {
        this.list.innerHTML = '';
        const reservations = DataService.getReservations();

        if (reservations.length === 0) {
            this.list.innerHTML = `<tr><td colspan="3" class="placeholder-message">Nenhuma reserva ativa no momento.</td></tr>`;
            return;
        }
        
        // Ordena por item para agrupar
        reservations.sort((a,b) => a.itemId.localeCompare(b.itemId));

        reservations.forEach(res => {
            const item = DataService.findItemById(res.itemId);
            const user = DataService.findUserById(res.userId);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item ? item.title : 'Item não encontrado'}</td>
                <td>${user ? user.name : 'Usuário não encontrado'}</td>
                <td>${new Date(res.date).toLocaleDateString()}</td>
            `;
            this.list.appendChild(row);
        });
    },
    
    add(itemId) {
        // Simula um prompt para selecionar o usuário (idealmente, seria um select)
        const userId = prompt("Digite o ID do usuário para a reserva (em um sistema real, aqui haveria um seletor de usuários):");
        const user = DataService.findUserById(userId);

        if (!user) {
            alert('Usuário não encontrado.');
            return;
        }
        if (user.suspended) {
            alert('Usuário suspenso não pode fazer reservas.');
            return;
        }

        // Verifica se o usuário já tem reserva para este item
        const existingReservation = DataService.getReservations().find(r => r.userId === userId && r.itemId === itemId);
        if (existingReservation) {
            alert('Este usuário já possui uma reserva para este item.');
            return;
        }

        const reservation = {
            itemId,
            userId,
            date: new Date().toISOString()
        };
        
        DataService.addReservation(reservation);
        alert('Reserva realizada com sucesso!');
        this.render();
    }
};