// --- Módulo de UI (uiService.js) ---

export const UIService = {
    // A função navigateToApp será injetada pelo main.js
    navigateToApp: null,

    init(navigateToCallback) {
        this.navigateToApp = navigateToCallback;

        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Chama a função de navegação do App principal
                this.navigateToApp(link.dataset.view);
            });
        });

        // Modal listeners
        const modal = document.getElementById('confirmation-modal');
        modal.querySelector('#modal-cancel').addEventListener('click', () => this.hideModal());
        modal.addEventListener('click', (e) => { if (e.target === modal) this.hideModal(); });
    },

    showView(viewName) {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${viewName}-view`).classList.add('active');
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.sidebar-link[data-view="${viewName}"]`).classList.add('active');
        document.getElementById('view-title').textContent = document.querySelector(`.sidebar-link[data-view="${viewName}"] span`).textContent;
    },

    showModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmation-modal');
        modal.querySelector('#modal-title').textContent = title;
        modal.querySelector('#modal-message').textContent = message;
        
        const confirmBtn = modal.querySelector('#modal-confirm');
        const newConfirmBtn = confirmBtn.cloneNode(true); // Evita múltiplos listeners
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal();
        });

        modal.classList.add('active');
    },

    hideModal() {
        document.getElementById('confirmation-modal').classList.remove('active');
    }
};
