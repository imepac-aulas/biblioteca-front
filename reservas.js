const reservasLista = document.getElementById("reservasLista");
const formReserva = document.getElementById("novaReserva");

let reservas = [
    { usuario: "Ana", item: "Livro de Python", status: "Pendente" }
];

function renderizarReservas() {
    reservasLista.innerHTML = "";
    reservas.forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.usuario} - ${r.item} (${r.status})`;
        reservasLista.appendChild(li);
    });
}

formReserva.addEventListener("submit", (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuarioReserva").value;
    const item = document.getElementById("itemReserva").value;

    reservas.push({ usuario, item, status: "Pendente" });
    renderizarReservas();

    formReserva.reset();
});

renderizarReservas();