'use strict';
// JS mínimo: subida de archivos (PUT por archivo), copiar enlaces y confirmaciones.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-confirmar]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      if (!confirm(f.dataset.confirmar)) e.preventDefault();
    });
  });

  document.querySelectorAll('[data-copiar]').forEach((b) => {
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copiar);
        const t = b.textContent;
        b.textContent = '¡Copiado!';
        setTimeout(() => (b.textContent = t), 1500);
      } catch {
        prompt('Copia el enlace:', b.dataset.copiar);
      }
    });
  });

  document.querySelectorAll('[data-subir]').forEach((zona) => {
    const input = zona.querySelector('input[type=file]');
    const estado = zona.querySelector('.progreso');
    input.addEventListener('change', async () => {
      const archivos = Array.from(input.files);
      let errores = 0;
      for (let i = 0; i < archivos.length; i++) {
        const a = archivos[i];
        estado.textContent = `Subiendo ${i + 1} de ${archivos.length}: ${a.name}…`;
        try {
          const r = await fetch(zona.dataset.subir, {
            method: 'PUT',
            headers: { 'X-Filename': encodeURIComponent(a.name), 'Content-Type': 'application/octet-stream' },
            body: a,
          });
          if (!r.ok) {
            errores++;
            const j = await r.json().catch(() => ({}));
            alert(`${a.name}: ${j.error || 'error al subir'}`);
          }
        } catch {
          errores++;
          alert(`${a.name}: error de conexión`);
        }
      }
      estado.textContent = errores ? `${errores} archivo(s) con error` : 'Listo';
      location.reload();
    });
  });
});
