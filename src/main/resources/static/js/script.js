    document.addEventListener('DOMContentLoaded', () => {
        const API_URL = 'http://localhost:8080/api/acervo'; // Mesma API do acervo
        const itemsGrid = document.getElementById('items-grid');
        const searchInput = document.getElementById('search-input');
        
        // Função para renderizar os cards dos itens
        function renderItems(items) {
            itemsGrid.innerHTML = '';
            items.forEach(item => {
                const card = `
                    <div class="item-card">
                        <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=60" alt="${item.titulo}">
                        <div class="item-card-content">
                            <span class="item-card-category">${item.tipo}</span>
                            <h3>${item.titulo}</h3>
                            <p>${item.author}</p>
                        </div>
                    </div>
                `;
                itemsGrid.innerHTML += card;
            });
        }
        
        // Função para buscar e renderizar
        async function filterAndRender() {
            const searchTerm = searchInput.value.toLowerCase();
            // Para busca no back-end, o ideal é passar o termo como parâmetro
            // Ex: /api/acervo?q=Hobbit
            try {
                const response = await fetch(`${API_URL}?q=${searchTerm}`);
                const items = await response.json();
                renderItems(items);
            } catch(error) {
                console.error("Erro na busca:", error);
            }
        }
        
        searchInput.addEventListener('keyup', filterAndRender);
        
        // Carregamento inicial
        filterAndRender();
    });