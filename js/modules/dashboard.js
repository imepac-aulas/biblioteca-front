import { DataService } from '../services/dataService.js';

// --- Módulo de Dashboard (dashboard.js) ---
export const DashboardModule = {
    init() { /* Apenas atualização */ },
    
    update() {
        document.getElementById('stats-users').textContent = DataService.getUsers().length;
        document.getElementById('stats-items').textContent = DataService.getItems().length;
        
        const activeLoans = DataService.getActiveLoans();
        document.getElementById('stats-loans').textContent = activeLoans.length;
        
        const overdueLoans = activeLoans.filter(l => new Date() > new Date(l.dueDate)).length;
        document.getElementById('stats-overdue').textContent = overdueLoans;
    }
};
