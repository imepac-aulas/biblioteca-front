const emprestimosLista = document.getElementById("emprestimosLista");
const formEmprestimo = document.getElementById("novoEmprestimo");

let emprestimos = [
    { usuario: "Maria", item: "IA: Uma Abordagem Moderna", status: "Em andamento" },
    { usuario: "João", item: "Clean Code", status: "Devolvido" }
];

function renderizarEmprestimos() {
    emprestimosLista.innerHTML = "";
    emprestimos.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${e.usuario} - ${e.item} (${e.status})`;
        emprestimosLista.appendChild(li);
    });
}

formEmprestimo.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value;
    const item = document.getElementById("item").value;

    emprestimos.push({ usuario, item, status: "Em andamento" });
    renderizarEmprestimos();

    formEmprestimo.reset();
});

renderizarEmprestimos();