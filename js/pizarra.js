/*************************************************
 * PIZARRA.JS – ANGUILLA LOTTERY EXPRESS (CORREGIDO)
 *************************************************/

/* ---------- VARIABLES ---------- */
let sorteos = [];
let anuncios = [];
let config = { tiempoAnuncio: 15, anunciosActivos: true };

let pagina = 0;
const porPantalla = 8;

const pizarra = document.getElementById("pizarra");
const logo = document.getElementById("logo");

let anuncioActivo = false;
let ultimoAnuncio = null;

/* ---------- FECHA ---------- */
function obtenerHoyLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fechaLocalDesdeTexto(f) {
  if (!f) return null;
  const [y, m, d] = f.split("-");
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/* ---------- FIREBASE ---------- */
firebase.database().ref("pizarra").on("value", snap => {
  const data = snap.val();
  if (!data) return;

  /* ✅ SOLO ANUNCIOS ACTIVOS (NO TOCA FIREBASE) */
  anuncios = (data.anuncios || []).filter(a => a.activo === true);

  config = data.config || config;

  if (data.sorteos) {
    const fechas = Object.keys(data.sorteos).sort();
    sorteos = Object.values(data.sorteos[fechas.at(-1)]);
  } else {
    sorteos = [];
  }

  pagina = 0;
  cambiarPaginaSuave();
});

/* ---------- TRANSICIÓN SUAVE ---------- */
function cambiarPaginaSuave() {
  const cards = document.querySelectorAll(".card");

  cards.forEach(c => c.classList.add("card-salida"));

  setTimeout(renderizarPizarra, 500);
}

/* ---------- RENDER ---------- */
function renderizarPizarra() {
  pizarra.innerHTML = "";

  if (!sorteos.length) return;

  const totalPaginas = Math.ceil(sorteos.length / porPantalla);
  const inicio = pagina * porPantalla;
  const visibles = sorteos.slice(inicio, inicio + porPantalla);
  const hoy = obtenerHoyLocal();

  visibles.forEach(s => {
    const esHoy = fechaLocalDesdeTexto(s.fecha) === hoy;
    const fondo = esHoy ? "#0a8f3c" : "#fff";
    const color = esHoy ? "#fff" : "#000";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="bolos">
        <div class="bolo" style="background:${fondo};color:${color}">
          ${s.premios?.[0] || "--"}
        </div>
        <div class="bolo" style="background:${fondo};color:${color}">
          ${s.premios?.[1] || "--"}
        </div>
        <div class="bolo" style="background:${fondo};color:${color}">
          ${s.premios?.[2] || "--"}
        </div>
      </div>
      <div class="hora">${s.noche ? "🌙" : "☀️"} ${s.hora}</div>
      <div class="fecha">${s.fecha}</div>
    `;

    pizarra.appendChild(card);
  });

  pagina = (pagina + 1) % totalPaginas;
}

/* ---------- ANUNCIOS ---------- */
function mostrarAnuncioPantallaCompleta() {
  if (
    !config.anunciosActivos ||
    anuncioActivo ||
    anuncios.length === 0
  ) return;

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
    opacity:0;
    transition:.5s;
  `;
  document.body.appendChild(overlay);

  /* 🎯 Anuncio aleatorio SOLO ENTRE ACTIVOS */
  let anuncio;
  do {
    anuncio = anuncios[Math.floor(Math.random() * anuncios.length)];
  } while (anuncios.length > 1 && anuncio === ultimoAnuncio);

  ultimoAnuncio = anuncio;

  if (anuncio.tipo === "video") {
    const v = document.createElement("video");
    v.src = anuncio.contenido;
    v.muted = true;
    v.autoplay = true;
    v.preload = "auto";
    v.playsInline = true;
    v.style.cssText = "width:100%;height:100%;object-fit:contain";

    v.oncanplaythrough = () => {
      overlay.appendChild(v);
      overlay.style.opacity = 1;
      v.play();
    };
  }

  setTimeout(() => {
    overlay.remove();
    anuncioActivo = false;

    /* 🔥 ANIMACIÓN DEL LOGO */
    if (logo) {
      logo.classList.remove("logo-entrada");
      void logo.offsetWidth;
      logo.classList.add("logo-entrada");
    }

  }, (anuncio.duracion || config.tiempoAnuncio) * 1000);
}

/* ---------- CICLOS ---------- */
setInterval(cambiarPaginaSuave, 30000);
setInterval(mostrarAnuncioPantallaCompleta, 120000);


