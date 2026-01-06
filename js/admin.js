/************************************************
 * ADMIN.JS – ANGUILLA LOTTERY EXPRESS
 ************************************************/

const DB = firebase.database().ref("pizarra");

let fechaActiva = null;
let sorteos = [];
let anuncios = [];
let config = { tiempoAnuncio: 15, anunciosActivos: true };

/* =======================
   UTILIDADES
======================= */
function normalizarLink(url) {
  url = url.trim();
  url = url.replace("?raw=true", "");

  if (url.includes("github.com") && url.includes("/blob/")) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  if (url.includes("youtube.com/watch?v=")) {
    const id = url.split("v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

/* =======================
   CARGA INICIAL
======================= */
DB.once("value", snap => {
  const data = snap.val() || {};

  anuncios = data.anuncios || [];
  config = data.config || config;

  if (data.sorteos) {
    const fechas = Object.keys(data.sorteos).sort();
    fechaActiva = fechas.at(-1);
    sorteos = data.sorteos[fechaActiva];
  }

  vista("premios");
});

/* =======================
   VISTAS
======================= */
function vista(tipo) {
  if (tipo === "premios") mostrarPremios();
  if (tipo === "anunciosPantalla") mostrarAnuncios();
}

/* =======================
   PREMIOS
======================= */
function mostrarPremios() {
  const cont = document.getElementById("contenido");

  cont.innerHTML = `
    <div class="card">
      <h2>🎱 Sorteos – ${fechaActiva}</h2>

      <div class="lista-sorteos">
        ${sorteos.map((s, i) => `
          <div class="sorteo-item">
            <div><strong>${s.hora}</strong></div>

            <div>
              <input type="date" value="${s.fecha}" id="f-${i}">
            </div>

            <div class="premios">
              <input id="p1-${i}" value="${s.premios?.[0] || ""}">
              <input id="p2-${i}" value="${s.premios?.[1] || ""}">
              <input id="p3-${i}" value="${s.premios?.[2] || ""}">
            </div>
          </div>
        `).join("")}
      </div>

      <button onclick="guardar()">💾 Guardar Premios</button>
    </div>
  `;
}

function guardar() {
  sorteos.forEach((s, i) => {
    s.fecha = document.getElementById(`f-${i}`).value;
    s.premios = [
      document.getElementById(`p1-${i}`).value,
      document.getElementById(`p2-${i}`).value,
      document.getElementById(`p3-${i}`).value
    ];
  });

  DB.child("sorteos").child(fechaActiva).set(sorteos);
  alert("✅ Premios guardados");
}

/* =======================
   ANUNCIOS
======================= */
function mostrarAnuncios() {
  const cont = document.getElementById("contenido");

  cont.innerHTML = `
    <div class="card">
      <h2>📢 Anuncios – Pantalla Completa</h2>

      <div class="form-anuncio">
        <select id="tipo">
          <option value="texto">Texto</option>
          <option value="imagen">Imagen (Link)</option>
          <option value="video">Video (Link)</option>
        </select>

        <input id="contenidoAnuncio" placeholder="Pega el link o texto">
        <input type="number" id="duracion" value="10" min="3">

        <button onclick="agregarAnuncio()">➕ Agregar</button>
      </div>

      <hr>

      <div class="lista-anuncios">
        ${anuncios.map((a, i) => `
          <div class="anuncio-item">
            <div class="anuncio-info">
              <b>${a.tipo.toUpperCase()}</b>
              <small class="texto-limitado">${a.contenido}</small>
              ⏱ ${a.duracion}s
            </div>

            <div class="anuncio-acciones">
              <button onclick="toggleAnuncio(${i})">
                ${a.activo ? "🟢" : "🔴"}
              </button>
              <button onclick="eliminarAnuncio(${i})">❌</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function agregarAnuncio() {
  const tipo = document.getElementById("tipo").value;
  let contenido = document.getElementById("contenidoAnuncio").value.trim();
  const duracion = parseInt(document.getElementById("duracion").value);

  if (!contenido) return alert("❌ Campo vacío");

  if (tipo !== "texto") contenido = normalizarLink(contenido);

  anuncios.push({
    id: Date.now(),
    tipo,
    contenido,
    duracion,
    activo: true,
    fechaCreacion: new Date().toISOString()
  });

  DB.child("anuncios").set(anuncios);
  mostrarAnuncios();
}

function toggleAnuncio(i) {
  anuncios[i].activo = !anuncios[i].activo;
  DB.child("anuncios").set(anuncios);
  mostrarAnuncios();
}

function eliminarAnuncio(i) {
  if (!confirm("¿Eliminar anuncio?")) return;
  anuncios.splice(i, 1);
  DB.child("anuncios").set(anuncios);
  mostrarAnuncios();
}

