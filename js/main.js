import { DataService } from './services/dataService.js';
import { UIService } from './services/uiService.js';
import { UserModule } from './modules/usuarios.js';
import { AcervoModule } from './modules/acervos.js';
import { EmprestimoModule } from './modules/emprestimos.js';
import { ReservaModule } from './modules/reservas.js';
import { DashboardModule } from './modules/dashboard.js';
import { RelatorioModule } from './modules/relatorios.js';

// --- Ponto de Entrada (main.js) ---
document.addEventListener('DOMContentLoaded', function() {
    const App = {
        init() {
            DataService.loadData();
            UIService.init(this.navigateTo);
            UserModule.init();
            AcervoModule.init();
            EmprestimoModule.init();
            ReservaModule.init();
            DashboardModule.init();
            RelatorioModule.init();

            this.navigateTo('dashboard');
        },
        
        // Centraliza a navegação e atualização da UI
        navigateTo(viewName) {
            UIService.showView(viewName);
            if (viewName === 'dashboard') DashboardModule.update();
            if (viewName === 'usuarios') UserModule.render();
            if (viewName === 'acervos') AcervoModule.render();
            if (viewName === 'emprestimos') EmprestimoModule.render();
            if (viewName === 'reservas') ReservaModule.render();
            // --- GARANTIA DA CORREÇÃO ---
            // Esta linha garante que os dados dos relatórios sejam calculados e exibidos.
            if (viewName === 'relatorios') RelatorioModule.render();
        },
    };

    App.init();
});