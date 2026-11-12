// Interfaz de Arcana (sin frameworks).

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const estado = {
  servidor: null, // respuesta de /api/estado
  tipo: 'gratis', // gratis | completa
  tirada: null, // id de la tirada elegida
  baraja: null,
  aElegir: 3,
  elegidas: [],
  lectura: null,
};

// ------------------------------------------------------------------ utilidades
async function api(ruta, opciones = {}) {
  const res = await fetch(ruta, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(datos.error || 'Error de conexión'), { status: res.status });
  return datos;
}

function toast(texto) {
  const t = $('#toast');
  t.textContent = texto;
  t.classList.add('visible');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('visible'), 3500);
}

function ir(vista) {
  $$('.vista').forEach((v) => v.classList.toggle('activa', v.id === `v-${vista}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const guardarSesion = (k, v) => {
  try {
    v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const leerSesion = (k) => {
  try {
    return JSON.parse(sessionStorage.getItem(k));
  } catch {
    return null;
  }
};

function escapar(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function textoAHtml(texto) {
  return texto
    .split(/\n{2,}/)
    .map((p) => `<p>${escapar(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ------------------------------------------------------------------ estado del servidor
function pintarEstado(s) {
  estado.servidor = s;
  $('#chip-gratis b').textContent = `${s.gratisRestantes}/${s.gratisPorDia}`;
  $('#chip-creditos b').textContent = s.creditos;
  $('#chip-creditos').hidden = s.creditos === 0;
  $('#txt-gratis').textContent = `${s.gratisPorDia} al día`;
  const precio = s.precioCompleta.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  $('#txt-precio').textContent = precio;
  $('#pago-precio').textContent = precio;
  $$('.txt-tarotista').forEach((e) => (e.textContent = s.whatsapp.nombre));
  $('#txt-precios-tarotista').textContent = s.whatsapp.horario;
}

async function cargarEstado() {
  pintarEstado(await api('/api/estado'));
}

// ------------------------------------------------------------------ inicio
$$('[data-ir]').forEach((el) =>
  el.addEventListener('click', (e) => {
    const destino = el.dataset.ir;
    if (destino === 'inicio') return ir('inicio');
    if (destino === 'whatsapp') {
      e.stopPropagation();
      return window.open(estado.servidor.whatsapp.url, '_blank', 'noopener');
    }
    abrirConfiguracion(destino);
  }),
);
$$('[data-volver]').forEach((b) => b.addEventListener('click', () => ir('inicio')));

// ------------------------------------------------------------------ configurar
function abrirConfiguracion(tipo, preseleccion) {
  estado.tipo = tipo;
  const lista = estado.servidor.tiradas[tipo];
  estado.tirada = preseleccion?.tirada || lista[0].id;
  $('#cfg-titulo').textContent = tipo === 'gratis' ? 'Tirada gratuita de 3 cartas' : 'Tirada completa de 9 cartas';
  $('#lista-tiradas').innerHTML = lista
    .map(
      (t) => `
      <label class="tirada ${t.id === estado.tirada ? 'sel' : ''}">
        <input type="radio" name="tirada" value="${t.id}" ${t.id === estado.tirada ? 'checked' : ''}>
        <span class="tirada-nombre">${t.nombre}</span>
        <span class="tirada-desc">${t.descripcion}</span>
        <span class="tirada-pos">${t.posiciones.join(' · ')}</span>
      </label>`,
    )
    .join('');
  $$('#lista-tiradas input').forEach((i) =>
    i.addEventListener('change', () => {
      estado.tirada = i.value;
      $$('#lista-tiradas .tirada').forEach((l) => l.classList.toggle('sel', l.contains(i)));
    }),
  );
  if (preseleccion?.pregunta !== undefined) $('#pregunta').value = preseleccion.pregunta;
  $('#cfg-error').textContent = '';
  const s = estado.servidor;
  $('#btn-barajar').textContent =
    tipo === 'gratis'
      ? s.gratisRestantes > 0
        ? `Barajar las cartas (te quedan ${s.gratisRestantes} hoy)`
        : 'Sin tiradas gratuitas hoy'
      : s.creditos > 0
        ? 'Barajar las cartas'
        : `Pagar ${$('#txt-precio').textContent} y barajar`;
  $('#btn-barajar').disabled = tipo === 'gratis' && s.gratisRestantes === 0;
  if (tipo === 'gratis' && s.gratisRestantes === 0)
    $('#cfg-error').textContent = 'Has usado tus tiradas gratuitas de hoy. Vuelve mañana o prueba la tirada completa.';
  ir('configurar');
}

$('#btn-barajar').addEventListener('click', async () => {
  $('#cfg-error').textContent = '';
  if (estado.tipo === 'completa' && estado.servidor.creditos < 1) return abrirPago();
  try {
    const r = await api('/api/barajar', { method: 'POST', body: { tirada: estado.tirada } });
    estado.baraja = r.baraja;
    estado.aElegir = r.aElegir;
    estado.elegidas = [];
    pintarMazo(r.total);
    ir('elegir');
  } catch (err) {
    $('#cfg-error').textContent = err.message;
  }
});

// ------------------------------------------------------------------ pago
function abrirPago() {
  const metodos = estado.servidor.metodosPago;
  $('#metodos-pago').innerHTML = metodos
    .map(
      (m) => `<button type="button" class="metodo metodo-${m.id}" data-metodo="${m.id}">
        <span class="metodo-icono">${m.id === 'bizum' ? 'B' : '▭'}</span>
        <span>Pagar con ${m.nombre}</span>
        ${m.proveedor === 'simulado' ? '<small>modo demo</small>' : ''}
      </button>`,
    )
    .join('');
  $('#pago-error').textContent = '';
  $$('#metodos-pago .metodo').forEach((b) => b.addEventListener('click', () => pagar(b.dataset.metodo)));
  $('#modal-pago').showModal();
}

async function pagar(metodo) {
  $('#pago-error').textContent = '';
  try {
    guardarSesion('arcana-pendiente', { tirada: estado.tirada, pregunta: $('#pregunta').value });
    const r = await api('/api/pedido', { method: 'POST', body: { metodo } });
    guardarSesion('arcana-pedido', r.pedido);
    if (r.accion === 'redirigir') return (location.href = r.url);
    if (r.accion === 'formulario') {
      const f = document.createElement('form');
      f.method = 'POST';
      f.action = r.url;
      for (const [k, v] of Object.entries(r.campos)) {
        const i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = v;
        f.append(i);
      }
      document.body.append(f);
      f.submit();
    }
  } catch (err) {
    $('#pago-error').textContent = err.message;
  }
}

async function volverDePago() {
  const p = new URLSearchParams(location.search);
  const resultado = p.get('pago');
  if (!resultado) return false;
  const pedido = p.get('pedido');
  const pendiente = leerSesion('arcana-pendiente');
  history.replaceState(null, '', '/');
  if (resultado === 'ko') {
    toast('El pago no se ha completado. No se te ha cobrado nada.');
    if (pendiente) abrirConfiguracion('completa', pendiente);
    return true;
  }
  // La confirmación del banco puede tardar unos segundos: consultamos varias veces.
  const extra = p.get('stripe_sesion') ? `&stripe_sesion=${encodeURIComponent(p.get('stripe_sesion'))}` : '';
  for (let intento = 0; intento < 10; intento++) {
    const r = await api(`/api/pedido?id=${encodeURIComponent(pedido)}${extra}`).catch(() => null);
    if (r?.estado === 'pagado') {
      pintarEstado(r);
      toast('¡Pago recibido! Ya puedes hacer tu tirada completa.');
      guardarSesion('arcana-pendiente', null);
      abrirConfiguracion('completa', pendiente || undefined);
      return true;
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
  toast('Estamos esperando la confirmación del pago. Recarga en unos segundos.');
  return true;
}

// ------------------------------------------------------------------ elegir cartas
function pintarMazo(total) {
  $('#elegir-n').textContent = estado.aElegir;
  $('#elegir-total').textContent = estado.aElegir;
  $('#elegir-cuenta').textContent = '0';
  $('#btn-revelar').disabled = true;
  $('#btn-revelar').textContent = 'Revelar cartas';
  $('#ranuras').innerHTML = Array.from({ length: estado.aElegir }, (_, i) => `<div class="ranura" data-i="${i}"><span>${i + 1}</span></div>`).join('');
  const mazo = $('#mazo');
  mazo.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const b = document.createElement('button');
    b.className = 'carta-dorso';
    b.style.setProperty('--i', i);
    b.style.setProperty('--giro', `${(Math.random() * 6 - 3).toFixed(1)}deg`);
    b.setAttribute('aria-label', `Carta ${i + 1}`);
    b.addEventListener('click', () => elegirCarta(i, b));
    mazo.append(b);
  }
  mazo.classList.remove('barajando');
  void mazo.offsetWidth;
  mazo.classList.add('barajando');
}

function elegirCarta(i, boton) {
  const ya = estado.elegidas.indexOf(i);
  if (ya >= 0) {
    estado.elegidas.splice(ya, 1);
    boton.classList.remove('elegida');
  } else {
    if (estado.elegidas.length >= estado.aElegir) return toast(`Ya has elegido ${estado.aElegir} cartas. Toca una para cambiarla.`);
    estado.elegidas.push(i);
    boton.classList.add('elegida');
  }
  $$('#ranuras .ranura').forEach((r, k) => r.classList.toggle('llena', k < estado.elegidas.length));
  $('#elegir-cuenta').textContent = estado.elegidas.length;
  $('#btn-revelar').disabled = estado.elegidas.length !== estado.aElegir;
}

$('#btn-revelar').addEventListener('click', async () => {
  $('#btn-revelar').disabled = true;
  $('#btn-revelar').textContent = 'Revelando…';
  try {
    const r = await api('/api/revelar', {
      method: 'POST',
      body: { baraja: estado.baraja, posiciones: estado.elegidas, pregunta: $('#pregunta').value },
    });
    pintarEstado(r.estado);
    mostrarLectura(r);
  } catch (err) {
    toast(err.message);
    $('#btn-revelar').disabled = false;
    $('#btn-revelar').textContent = 'Revelar cartas';
  }
});

// ------------------------------------------------------------------ lectura
function mostrarLectura(r) {
  estado.lectura = r;
  const completa = r.tirada.tipo === 'completa';
  $('#lec-titulo').textContent = r.tirada.nombre;
  const pregunta = $('#pregunta').value.trim();
  $('#lec-pregunta').textContent = pregunta ? `«${pregunta}»` : 'Lectura general';
  $('#lec-agente').textContent = completa ? 'Agente profundo · lectura completa' : 'Agente de consultas · lectura breve';
  $('#lec-agente').classList.toggle('profundo', completa);
  $('#tablero').className = `tablero t${r.cartas.length}`;
  $('#tablero').innerHTML = r.cartas
    .map(
      (c, i) => `
      <figure class="hueco" style="--d:${i * (completa ? 280 : 450)}ms">
        <button class="volteo" data-id="${c.id}" data-nombre="${c.nombre}${c.invertida ? ' (invertida)' : ''}" data-inv="${c.invertida}" aria-label="${c.nombre}">
          <span class="cara dorso"></span>
          <span class="cara frente"><img src="/cartas/${c.id}.jpg" alt="${c.nombre}" class="${c.invertida ? 'invertida' : ''}"></span>
        </button>
        <figcaption><small>${c.posicion}</small><b>${c.nombre}</b>${c.invertida ? '<i>invertida</i>' : ''}</figcaption>
      </figure>`,
    )
    .join('');
  $$('#tablero .volteo').forEach((b) =>
    b.addEventListener('click', () => {
      $('#carta-grande').src = `/cartas/${b.dataset.id}.jpg`;
      $('#carta-grande').classList.toggle('invertida', b.dataset.inv === 'true');
      $('#carta-grande-nombre').textContent = b.dataset.nombre;
      $('#modal-carta').showModal();
    }),
  );
  requestAnimationFrame(() => setTimeout(() => $('#tablero').classList.add('revelado'), 60));

  const nombres = r.cartas.map((c) => `${c.nombre}${c.invertida ? ' (invertida)' : ''}`).join(', ');
  const texto = `Hola, acabo de hacer una tirada «${r.tirada.nombre}» en Arcana y me salieron: ${nombres}.${pregunta ? ` Mi pregunta era: «${pregunta}».` : ''} Me gustaría una consulta personalizada.`;
  $('#btn-wa-lectura').href = `https://wa.me/${estado.servidor.whatsapp.numero}?text=${encodeURIComponent(texto)}`;
  $('#btn-mejorar').hidden = completa;
  ir('lectura');
  const espera = r.cartas.length * (completa ? 280 : 450) + 700;
  setTimeout(() => cargarLectura(r.lectura), espera);
}

async function cargarLectura(id) {
  const caja = $('#lec-texto');
  caja.innerHTML = '';
  $('#btn-repetir').hidden = true;
  $('#lec-escribiendo').classList.add('activo');
  let texto = '';
  try {
    const res = await fetch(`/api/lectura/${id}`);
    const lector = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { value, done } = await lector.read();
      if (done) break;
      texto += dec.decode(value, { stream: true });
      caja.innerHTML = textoAHtml(texto);
    }
  } catch {
    texto += '\n\n(Se ha perdido la conexión.)';
    caja.innerHTML = textoAHtml(texto);
  }
  $('#lec-escribiendo').classList.remove('activo');
  if (/Repetir lectura|perdido la conexión/.test(texto)) $('#btn-repetir').hidden = false;
}

$('#btn-repetir').addEventListener('click', () => estado.lectura && cargarLectura(estado.lectura.lectura));
$('#btn-mejorar').addEventListener('click', () => abrirConfiguracion('completa', { pregunta: $('#pregunta').value }));

// ------------------------------------------------------------------ arranque
(async () => {
  try {
    await cargarEstado();
    await volverDePago();
  } catch (err) {
    toast('No se ha podido conectar con el servidor.');
  }
})();
