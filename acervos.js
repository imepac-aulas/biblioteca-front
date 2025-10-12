const apiBaseUrl = 'http://localhost:8080'; // ajuste se necessário

const tabelaCorpo = document.querySelector('#tabelaAcervos tbody');
const loadingEl = document.getElementById('loading');
const inputBusca = document.getElementById('inputBusca');
const btnBuscar = document.getElementById('btnBuscar');
const btnLimpar = document.getElementById('btnLimpar');

// Dados mock para teste (remova quando a API estiver funcionando)
const dadosMock = [
    { titulo: 'Dom Casmurro', autor: 'Machado de Assis', tipo: 'Livro', status: 'Disponível' },
    { titulo: 'O Cortiço', autor: 'Aluísio Azevedo', tipo: 'Livro', status: 'Disponível' },
    { titulo: 'Revista Veja', autor: 'Editora Abril', tipo: 'Revista', status: 'Emprestado' },
    { titulo: '1984', autor: 'George Orwell', tipo: 'Livro', status: 'Disponível' },
    { titulo: 'National Geographic', autor: 'National Geographic Society', tipo: 'Revista', status: 'Disponível' }
];

async function carregarAcervos() {
  mostrarLoading(true);
  try {
    // Para teste, usando dados mock - remova quando a API estiver pronta
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay de rede
    mostrarAcervos(dadosMock);
    
    // Código original para API (descomente quando a API estiver funcionando):
    /*
    const res = await fetch(`${apiBaseUrl}/acervos`);
    if (!res.ok) throw new Error('Erro ao carregar acervos');
    const dados = await res.json();
    mostrarAcervos(dados);
    */
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao carregar acervos: ' + err.message);
  } finally {
    mostrarLoading(false);
  }
}

async function buscarPorTitulo(titulo) {
  mostrarLoading(true);
  try {
    // Para teste, usando dados mock - remova quando a API estiver pronta
    await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay de rede
    const resultados = dadosMock.filter(item => 
        item.titulo.toLowerCase().includes(titulo.toLowerCase())
    );
    mostrarAcervos(resultados);
    
    // Código original para API (descomente quando a API estiver funcionando):
    /*
    const url = `${apiBaseUrl}/acervos/buscar?titulo=${encodeURIComponent(titulo)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar acervos');
    const dados = await res.json();
    mostrarAcervos(dados);
    */
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro na busca: ' + err.message);
  } finally {
    mostrarLoading(false);
  }
}

function mostrarAcervos(acervos) {
  tabelaCorpo.innerHTML = '';
  if (acervos.length === 0) {
    tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum item encontrado</td></tr>`;
    return;
  }

  for (const item of acervos) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.titulo}</td>
      <td>${item.autor}</td>
      <td>${item.tipo}</td>
      <td>${item.status}</td>
    `;
    tabelaCorpo.appendChild(tr);
  }
}

function mostrarLoading(show) {
  loadingEl.style.display = show ? 'block' : 'none';
}

// Eventos
btnBuscar.addEventListener('click', () => {
  const titulo = inputBusca.value.trim();
  if (titulo === '') {
    alert('Digite um título para buscar');
    return;
  }
  buscarPorTitulo(titulo);
});

btnLimpar.addEventListener('click', () => {
  inputBusca.value = '';
  carregarAcervos();
});

// Busca ao pressionar Enter
inputBusca.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btnBuscar.click();
  }
});

// Carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
  carregarAcervos();
});