/* Biblioteca+ - script.js
   Persistência: localStorage (users, acervo, loans, reservations)
   Regras implementadas:
   - Max 5 itens por usuário, max 2 eletrônicos
   - Duração padrão: eletrônicos 7 dias, livros/revistas 15 dias
   - Multa: R$ 1,00 por dia de atraso (exemplo)
   - Reserva expira em 24h após notificação (simulado)
*/

const LS_KEYS = {
  USERS: 'bibl_users',
  ACERVO: 'bibl_acervo',
  LOANS: 'bibl_loans',
  RES: 'bibl_reservas'
};

// Util helpers
const $ = id => document.getElementById(id);
const todayISO = (d=new Date()) => d.toISOString().slice(0,10);

function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, arr){ localStorage.setItem(key, JSON.stringify(arr)); }

// Inicializa com admin se não existir
(function initData(){
  if(!load(LS_KEYS.USERS).length){
    save(LS_KEYS.USERS, [{nome:'Admin', tipo:'Administrador', email:'admin@biblioteca.com', emprestados:[], penalidades:0, suspenso:false}]);
  }
  // exemplo de acervo inicial
  if(!load(LS_KEYS.ACERVO).length){
    save(LS_KEYS.ACERVO, [
      {id:1,titulo:'Inteligência Artificial: Uma Abordagem Moderna',autor:'Russell & Norvig',tipo:'Livro',exemplares:2,emprestados:0},
      {id:2,titulo:'Revista Ciência Hoje',autor:'Vários',tipo:'Revista',exemplares:3,emprestados:0},
      {id:3,titulo:'Tablet Samsung',autor:'Samsung',tipo:'Tablet',exemplares:1,emprestados:0}
    ]);
  }
  // cria arrays vazios se necessário
  if(!load(LS_KEYS.LOANS).length) save(LS_KEYS.LOANS, []);
  if(!load(LS_KEYS.RES).length) save(LS_KEYS.RES, []);
})();

/* -------------------- LOGIN -------------------- */
const loginForm = $('loginForm');
if(loginForm){
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const email = $('email').value.trim();
    const senha = $('senha').value.trim();
    const erro = $('erroLogin');

    // login simples: apenas checa admin account (senha fixa para demo)
    if(email === 'admin@biblioteca.com' && senha === '1234'){
      localStorage.setItem('bibl_logado', 'admin@biblioteca.com');
      location.href = 'dashboard.html';
    } else {
      // tentar ver se existe usuário cadastrado (access only admin for dashboard)
      erro.textContent = 'Credenciais inválidas. Use admin@biblioteca.com / 1234';
    }
  });
}

/* -------------------- DASHBOARD CONTROLS -------------------- */
if(window.location.pathname.includes('dashboard.html')){
  // segurança simples
  if(localStorage.getItem('bibl_logado') !== 'admin@biblioteca.com'){
    location.href = 'login.html';
  }
  // inicial render
  renderAll();

  // seção switch
  window.showSection = id => {
    document.querySelectorAll('.sec').forEach(s=>s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'relatorios') buildReports();
  };

  window.logout = ()=>{ localStorage.removeItem('bibl_logado'); location.href='index.html'; };

  /* ---------- USUÁRIOS ---------- */
  const formUsuario = $('formUsuario');
  formUsuario.addEventListener('submit', e=>{
    e.preventDefault();
    const nome = $('u_nome').value.trim();
    const tipo = $('u_tipo').value;
    const email = $('u_email').value.trim().toLowerCase();
    if(!nome || !tipo || !email){ $('msgUsuario').textContent = 'Preencha todos os campos'; return; }

    const users = load(LS_KEYS.USERS);
    if(users.some(u=>u.email === email)){ $('msgUsuario').textContent = 'E-mail já cadastrado'; return; }

    users.push({nome,tipo,email,emprestados:[],penalidades:0,suspenso:false});
    save(LS_KEYS.USERS, users);
    $('msgUsuario').textContent = 'Usuário cadastrado com sucesso!';
    formUsuario.reset();
    renderUsuarios();
  });

  /* ---------- ACERVO ---------- */
  const formAcervo = $('formAcervo');
  formAcervo.addEventListener('submit', e=>{
    e.preventDefault();
    const titulo = $('a_titulo').value.trim();
    const autor = $('a_autor').value.trim();
    const tipo = $('a_tipo').value;
    const exemplares = parseInt($('a_exemplares').value,10) || 1;
    if(!titulo || !autor || !tipo){ $('msgAcervo').textContent = 'Preencha todos os campos'; return; }

    const acervo = load(LS_KEYS.ACERVO);
    const id = (acervo.reduce((m,it)=>Math.max(m,it.id||0),0) || 0) + 1;
    acervo.push({id,titulo,autor,tipo,exemplares,emprestados:0});
    save(LS_KEYS.ACERVO, acervo);
    $('msgAcervo').textContent = 'Item adicionado ao acervo!';
    formAcervo.reset();
    renderAcervo();
  });

  /* ---------- EMPRÉSTIMOS ---------- */
  const formEmp = $('formEmprestimo');
  formEmp.addEventListener('submit', e=>{
    e.preventDefault();
    const userEmail = $('e_usuario').value.trim().toLowerCase();
    const itemTitulo = $('e_item').value.trim();
    const dataRetirada = $('e_retirada').value;
    if(!userEmail || !itemTitulo || !dataRetirada){ $('msgEmprestimo').textContent = 'Preencha todos os campos'; return; }

    // validações e regras
    const users = load(LS_KEYS.USERS);
    const acervo = load(LS_KEYS.ACERVO);
    const loans = load(LS_KEYS.LOANS);

    const user = users.find(u=>u.email === userEmail);
    if(!user){ $('msgEmprestimo').textContent = 'Usuário não encontrado'; return; }
    if(user.suspenso){ $('msgEmprestimo').textContent = 'Usuário suspenso. Regularize pendências.'; return; }

    // conta emprestados ativos
    const emprestadosCount = user.emprestados.length;
    if(emprestadosCount >= 5){ $('msgEmprestimo').textContent = 'Usuário já tem 5 itens emprestados.'; return; }

    // localizar item disponível
    const item = acervo.find(a=>a.titulo.toLowerCase() === itemTitulo.toLowerCase());
    if(!item){ $('msgEmprestimo').textContent = 'Item não encontrado no acervo'; return; }
    const disponiveis = item.exemplares - item.emprestados;
    if(disponiveis <= 0){ $('msgEmprestimo').textContent = 'Nenhum exemplar disponível. Considere reservar.'; return; }

    // verifica limite eletrônico
    const tipoEletronico = ['Tablet','Notebook','E-reader'].includes(item.tipo);
    if(tipoEletronico){
      // quantos eletrônicos esse usuário já tem
      const usuEmp = user.emprestados || [];
      const elecCount = usuEmp.reduce((acc,lnId)=>{
        const ln = loans.find(l=>l.id===lnId);
        if(!ln) return acc;
        const itm = acervo.find(a=>a.id===ln.itemId);
        if(!itm) return acc;
        return acc + (['Tablet','Notebook','E-reader'].includes(itm.tipo) ? 1 : 0);
      },0);
      if(elecCount >= 2){ $('msgEmprestimo').textContent = 'Usuário já tem 2 eletrônicos emprestados.'; return; }
    }

    // calcular data prevista
    const retiro = new Date(dataRetirada);
    const prazoDias = (['Tablet','Notebook','E-reader'].includes(item.tipo) ? 7 : 15);
    const devolPrev = new Date(retiro);
    devolPrev.setDate(devolPrev.getDate() + prazoDias);

    // registrar empréstimo
    const idLoan = (loans.reduce((m,l)=>Math.max(m,l.id||0),0) || 0) + 1;
    const loanObj = {
      id:idLoan,
      userEmail,
      itemId:item.id,
      itemTitulo:item.titulo,
      retirada: dataRetirada,
      devolPrev: devolPrev.toISOString().slice(0,10),
      devolvido: null,
      multa: 0,
      status: 'Ativo'
    };
    loans.push(loanObj);
    save(LS_KEYS.LOANS, loans);

    // atualizar contadores no acervo e usuário
    item.emprestados = (item.emprestados || 0) + 1;
    save(LS_KEYS.ACERVO, acervo);

    user.emprestados = user.emprestados || [];
    user.emprestados.push(idLoan);
    save(LS_KEYS.USERS, users);

    $('msgEmprestimo').textContent = 'Empréstimo registrado com sucesso!';
    formEmp.reset();
    renderEmprestimos();
    renderAcervo();
    renderUsuarios();
  });

  /* ---------- RESERVAS ---------- */
  const formRes = $('formReserva');
  formRes.addEventListener('submit', e=>{
    e.preventDefault();
    const userEmail = $('r_usuario').value.trim().toLowerCase();
    const itemTitulo = $('r_item').value.trim();
    if(!userEmail || !itemTitulo){ $('msgReserva').textContent = 'Preencha todos os campos'; return; }

    const users = load(LS_KEYS.USERS);
    const acervo = load(LS_KEYS.ACERVO);
    const res = load(LS_KEYS.RES);

    const user = users.find(u=>u.email===userEmail);
    if(!user){ $('msgReserva').textContent = 'Usuário não encontrado'; return; }

    const item = acervo.find(a=>a.titulo.toLowerCase()===itemTitulo.toLowerCase());
    if(!item){ $('msgReserva').textContent = 'Item não encontrado'; return; }
    const disponiveis = item.exemplares - item.emprestados;
    if(disponiveis > 0){ $('msgReserva').textContent = 'Item disponível — você pode emprestar em vez de reservar.'; return; }

    // criar reserva
    const idRes = (res.reduce((m,r)=>Math.max(m,r.id||0),0) || 0) + 1;
    const now = new Date();
    res.push({
      id:idRes,
      userEmail,
      itemId:item.id,
      itemTitulo:item.titulo,
      quando: now.toISOString(),
      notificado: false,
      status: 'Aguardando'
    });
    save(LS_KEYS.RES, res);
    $('msgReserva').textContent = 'Reserva registrada — você será notificado quando o item estiver disponível.';
    formRes.reset();
    renderReservas();
  });

  /* ---------- RENDER FUNCTIONS ---------- */
  function renderAll(){
    renderUsuarios();
    renderAcervo();
    renderEmprestimos();
    renderReservas();
    buildReports();
  }

  function renderUsuarios(){
    const tbody = $('tabelaUsuarios').querySelector('tbody');
    tbody.innerHTML = '';
    const users = load(LS_KEYS.USERS);
    users.forEach(u=>{
      const tr = document.createElement('tr');
      const status = u.suspenso ? 'Suspenso' : (u.penalidades>0? 'Com penalidade':'Ativo');
      tr.innerHTML = `<td>${u.nome}</td><td>${u.tipo}</td><td>${u.email}</td><td>${u.emprestados?.length||0}</td><td>${status}</td>
        <td>
          <button class="small-btn" onclick="forcarDevolucao('${u.email}')">Forçar Devolução</button>
          <button class="small-btn" onclick="removerUsuario('${u.email}')">Remover</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  window.removerUsuario = function(email){
    if(!confirm('Remover usuário? A operação é irreversível.')) return;
    let users = load(LS_KEYS.USERS);
    users = users.filter(u=>u.email!==email);
    save(LS_KEYS.USERS, users);
    renderUsuarios(); buildReports();
  };

  window.forcarDevolucao = function(email){
    // força devolução de todos os empréstimos do usuário (uso só administrativo)
    const users = load(LS_KEYS.USERS);
    const loans = load(LS_KEYS.LOANS);
    const acervo = load(LS_KEYS.ACERVO);
    const user = users.find(u=>u.email===email);
    if(!user) return alert('Usuário não encontrado');
    if(!confirm('Forçar devolução de todos os itens do usuário?')) return;
    (user.emprestados || []).forEach(loanId=>{
      const loan = loans.find(l=>l.id===loanId);
      if(!loan) return;
      if(!loan.devolvido){
        loan.devolvido = todayISO();
        loan.status = 'Devolvido';
        // atualizar acervo
        const item = acervo.find(a=>a.id===loan.itemId);
        if(item && item.emprestados>0) item.emprestados--;
      }
    });
    user.emprestados = [];
    save(LS_KEYS.LOANS, loans);
    save(LS_KEYS.ACERVO, acervo);
    save(LS_KEYS.USERS, users);
    renderAll();
    alert('Devoluções forçadas registradas.');
  };

  function renderAcervo(){
    const tbody = $('tabelaAcervo').querySelector('tbody');
    tbody.innerHTML = '';
    const acervo = load(LS_KEYS.ACERVO);
    acervo.forEach(a=>{
      const disponiveis = a.exemplares - (a.emprestados||0);
      const status = disponiveis>0 ? 'Disponível' : 'Indisponível';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.titulo}</td><td>${a.autor}</td><td>${a.tipo}</td><td>${disponiveis}</td><td>${status}</td>
        <td>
          <button class="small-btn" onclick="removerItem(${a.id})">Remover</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  window.removerItem = function(id){
    if(!confirm('Remover item do acervo?')) return;
    let acervo = load(LS_KEYS.ACERVO);
    acervo = acervo.filter(a=>a.id!==id);
    save(LS_KEYS.ACERVO, acervo);
    renderAcervo(); buildReports();
  };

  function renderEmprestimos(){
    const tbody = $('tabelaEmprestimos').querySelector('tbody');
    tbody.innerHTML = '';
    const loans = load(LS_KEYS.LOANS);
    const now = new Date();
    loans.forEach(l=>{
      const devolPrev = new Date(l.devolPrev);
      let multa = 0;
      let status = l.status;
      if(!l.devolvido && now > devolPrev){
        // cálculo de multa: R$1 por dia de atraso (exemplo)
        const diasAtraso = Math.floor((now - devolPrev)/(1000*60*60*24));
        multa = diasAtraso > 0 ? diasAtraso * 1 : 0;
        l.multa = multa;
        status = 'Atrasado';
      } else if(l.devolvido){
        status = 'Devolvido';
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.userEmail}</td><td>${l.itemTitulo}</td><td>${l.retirada}</td><td>${l.devolPrev}</td><td>${(l.multa||0).toFixed(2)}</td><td>${status}</td>
        <td>
          ${l.status!=='Devolvido' ? `<button class="small-btn" onclick="registrarDevolucao(${l.id})">Registrar Devolução</button>` : ''}
        </td>`;
      tbody.appendChild(tr);
    });
    save(LS_KEYS.LOANS, loans);
  }

  window.registrarDevolucao = function(loanId){
    const loans = load(LS_KEYS.LOANS);
    const acervo = load(LS_KEYS.ACERVO);
    const users = load(LS_KEYS.USERS);
    const loan = loans.find(l=>l.id===loanId);
    if(!loan) return;
    if(loan.devolvido) return alert('Já devolvido.');
    loan.devolvido = todayISO();
    loan.status = 'Devolvido';
    // atualizar acervo
    const item = acervo.find(a=>a.id===loan.itemId);
    if(item) item.emprestados = Math.max(0,(item.emprestados||0)-1);
    // atualizar usuário
    const user = users.find(u=>u.email===loan.userEmail);
    if(user){
      user.emprestados = (user.emprestados || []).filter(id=>id!==loanId);
      // se havia multa, incrementar penalidades e possivelmente suspender
      if(loan.multa && loan.multa>0){
        user.penalidades = (user.penalidades||0) + 1;
        if(user.penalidades >= 3) user.suspenso = true; // regra: suspensão para reincidência (exemplo)
      }
    }
    save(LS_KEYS.LOANS, loans);
    save(LS_KEYS.ACERVO, acervo);
    save(LS_KEYS.USERS, users);
    renderAll();
    alert('Devolução registrada com sucesso.');
    // checar reservas para item e notificar
    checarReservasPosDevolucao(item && item.id);
  };

  /* ---------- RESERVAS RENDER ---------- */
  function renderReservas(){
    const tbody = $('tabelaReservas').querySelector('tbody');
    tbody.innerHTML = '';
    const res = load(LS_KEYS.RES);
    res.forEach(r=>{
      const quando = new Date(r.quando);
      // calcula expira em 24h a partir da notificação (se notificado). Aqui mostramos info bruta.
      const expira = r.notificado ? new Date(quando.getTime() + 24*60*60*1000).toISOString().slice(0,10) : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.userEmail}</td><td>${r.itemTitulo}</td><td>${quando.toLocaleString()}</td><td>${expira}</td><td>${r.status}</td>
        <td>
          ${r.status !== 'Cancelada' ? `<button class="small-btn" onclick="cancelarReserva(${r.id})">Cancelar</button>` : ''}
        </td>`;
      tbody.appendChild(tr);
    });
  }

  window.cancelarReserva = function(id){
    if(!confirm('Cancelar reserva?')) return;
    let res = load(LS_KEYS.RES);
    res = res.map(r=> r.id===id ? {...r, status:'Cancelada'} : r);
    save(LS_KEYS.RES, res);
    renderReservas();
  };

  /* ---------- RESERVAS ao devolver: notificar primeiro da fila ---------- */
  function checarReservasPosDevolucao(itemId){
    if(!itemId) return;
    const res = load(LS_KEYS.RES);
    const acervo = load(LS_KEYS.ACERVO);
    const fila = res.filter(r => r.itemId===itemId && r.status==='Aguardando');
    if(fila.length===0) return;
    // notifica o primeiro da fila (simulação)
    fila.sort((a,b)=> new Date(a.quando) - new Date(b.quando));
    const primeiro = fila[0];
    // marca notificado, define expiração (vamos usar notificado timestamp)
    primeiro.notificado = true;
    primeiro.status = 'Notificado';
    save(LS_KEYS.RES, res);
    alert(`Notificação enviada (simulada) para ${primeiro.userEmail} sobre disponibilidade do item "${primeiro.itemTitulo}". Retirar em até 24h.`);
    renderReservas();
    // Observação: um processo automático deveria expirar reserva após 24h; aqui simulamos chamando função que checa expiracoes
    setTimeout(()=>{ expiradorReservas(); }, 1000); // curto timeout só para demo
  }

  function expiradorReservas(){
    let res = load(LS_KEYS.RES);
    const now = new Date();
    let changed=false;
    res = res.map(r=>{
      if(r.notificado && r.status==='Notificado'){
        const quando = new Date(r.quando);
        // se passou mais de 24h desde notificação, expira
        if((now - quando) > 24*60*60*1000){
          changed=true;
          return {...r, status:'Expirada'};
        }
      }
      return r;
    });
    if(changed){ save(LS_KEYS.RES, res); renderReservas(); }
  }

  /* ---------- RELATÓRIOS ---------- */
  function buildReports(){
    const users = load(LS_KEYS.USERS);
    const acervo = load(LS_KEYS.ACERVO);
    const loans = load(LS_KEYS.LOANS);

    $('rel_total_usuarios').textContent = users.length;
    $('rel_total_itens').textContent = acervo.reduce((s,a)=>s+(a.exemplares||0),0);
    $('rel_itens_emprestados').textContent = loans.filter(l=>!l.devolvido).length;
    const usuariosAtraso = loans.filter(l=>!l.devolvido && new Date() > new Date(l.devolPrev)).map(l=>l.userEmail);
    $('rel_usuarios_atraso').textContent = [...new Set(usuariosAtraso)].length;

    // top itens (por número de empréstimos históricos)
    const contagem = {};
    loans.forEach(l=>{ contagem[l.itemTitulo] = (contagem[l.itemTitulo]||0)+1; });
    const lista = Object.entries(contagem).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const el = $('rel_top_itens'); el.innerHTML = '';
    lista.forEach(([titulo,qt])=>{
      const li = document.createElement('li'); li.textContent = `${titulo} — ${qt} empréstimos`; el.appendChild(li);
    });
  }

  /* inicial render calls */
  renderAll();

} // fim dashboard block

/* ---------- UTILIDADES GLOBAIS (disponíveis no console) ---------- */
window._bibl_debug = {
  users: () => load(LS_KEYS.USERS),
  acervo: () => load(LS_KEYS.ACERVO),
  loans: () => load(LS_KEYS.LOANS),
  reservas: () => load(LS_KEYS.RES),
  clearAll: () => { if(confirm('Limpar dados?')) { Object.values(LS_KEYS).forEach(k=>localStorage.removeItem(k)); location.reload(); } }
};
