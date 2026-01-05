/*************************************************
 * PIZARRA.JS – ANGUILLA LOTTERY EXPRESS
 * Fuente de datos: Firebase Realtime Database
 *************************************************/

/* ---------- VARIABLES ---------- */
let sorteos = [];
let anuncios = [];
let config = {
  tiempoAnuncio: 15,
  anunciosActivos: true
};

let pagina = 0;
const porPantalla = 8;

const pizarra = document.getElementById("pizarra");
const ticker = document.getElementById("ticker-content");

// Fecha de hoy REAL (no se modifica sola)
const HOY = new Date().toISOString().split("T")[0];


let mensajeIndex = 0;

/* ---------- FIREBASE: ESCUCHAR CAMBIOS ---------- */
firebase.database().ref("pizarra").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;

  anuncios = data.anuncios || [];
  config  = data.config  || config;

  if (data.sorteos) {
    const fechas = Object.keys(data.sorteos).sort();
    const fechaActiva = fechas[fechas.length - 1];
    sorteos = Object.values(data.sorteos[fechaActiva] || []);
  } else {
    sorteos = [];
  }

  pagina = 0;
  renderizarPizarra();
});

/* ---------- TICKER ---------- */
function mostrarMensaje() {
  ticker.innerHTML = `
    <div style="
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:1.3rem;
      font-weight:bold;
      color:#FFD700;
      background:linear-gradient(90deg,#8B0000,#B22222,#8B0000);
      border-radius:8px;
      text-shadow:2px 2px 4px #000;
      border:2px solid #FFD700;
      padding:15px;
      text-align:center;
    ">
      ${mensajes[mensajeIndex]}
    </div>
  `;
  mensajeIndex = (mensajeIndex + 1) % mensajes.length;
}

/* ---------- RENDERIZAR PIZARRA ---------- */
function renderizarPizarra() {
  pizarra.innerHTML = "";

  if (!sorteos.length) {
    pizarra.innerHTML = `
      <div style="color:#fff; font-size:1.5rem; text-align:center;">
        ⏳ Esperando sorteos...
      </div>
    `;
    return;
  }

  const totalPaginas = Math.ceil(sorteos.length / porPantalla);
  const inicio = pagina * porPantalla;
  const visibles = sorteos.slice(inicio, inicio + porPantalla);

  visibles.forEach(s => {
    const icono = s.noche ? "🌙" : "☀️";

    const esHoy = s.fecha === HOY;

    const fondoBolo = esHoy ? "#0a8f3c" : "#ffffff";
    const colorTexto = esHoy ? "#ffffff" : "#000000";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="bolos">
        <div class="bolo" style="background:${fondoBolo}; color:${colorTexto};">
          ${s.premios?.[0] || "--"}
        </div>
        <div class="bolo" style="background:${fondoBolo}; color:${colorTexto};">
          ${s.premios?.[1] || "--"}
        </div>
        <div class="bolo" style="background:${fondoBolo}; color:${colorTexto};">
          ${s.premios?.[2] || "--"}
        </div>
      </div>
      <div class="hora">${icono} ${s.hora}</div>
      <div class="fecha">${s.fecha}</div>
    `;

    pizarra.appendChild(card);
  });

  pagina = (pagina + 1) % totalPaginas;
}

/* ---------- ROTACIONES ---------- */
setInterval(mostrarMensaje, 10000);
setInterval(renderizarPizarra, 30000);

/* ---------- ANUNCIOS PANTALLA COMPLETA ---------- */
let anuncioActivo = false;
let ultimoAnuncio = null;

function mostrarAnuncioPantallaCompleta() {
  if (!config.anunciosActivos || anuncioActivo || !anuncios.length) return;

  const activos = anuncios.filter(a => a.activo !== false);
  if (!activos.length) return;

  let disponibles = activos;
  if (ultimoAnuncio && activos.length > 1) {
    disponibles = activos.filter(a => a.id !== ultimoAnuncio);
  }

  const anuncio = disponibles[Math.floor(Math.random() * disponibles.length)];
  ultimoAnuncio = anuncio.id;
  anuncioActivo = true;

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;
    inset:0;
    background:#000;
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
  `;

  let contenidoHTML = "";

  if (anuncio.tipo === "imagen") {
    contenidoHTML = `<img src="${anuncio.contenido}" style="max-width:100%;max-height:100%;object-fit:contain;">`;
  } 
  else if (anuncio.tipo === "video") {
    contenidoHTML = `
      <video autoplay ${anuncio.repetir ? "loop" : ""} muted style="width:100%;height:100%;object-fit:contain;">
        <source src="${anuncio.contenido}">
      </video>`;
  } 
  else {
    contenidoHTML = anuncio.contenido;
  }

  overlay.innerHTML = contenidoHTML;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
    anuncioActivo = false;
  }, (anuncio.duracion || config.tiempoAnuncio) * 1000);
}

/* ---------- CICLO DE ANUNCIOS ---------- */
setInterval(mostrarAnuncioPantallaCompleta, 120000);

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  mostrarMensaje();
});
