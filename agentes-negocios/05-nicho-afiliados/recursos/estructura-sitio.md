# Estructura del sitio — Factura sin Líos

## Objetivo de cada página
- **Guías (informacionales):** captar tráfico SEO y suscriptores. CTA principal: newsletter / checklist.
- **Comparativas y páginas por profesión (comerciales):** convertir con enlaces de afiliado, siempre con aviso de afiliación arriba.
- **Herramientas:** calculadora y checklist, imanes de enlaces y suscriptores.

## Mapa de URLs
```
/                                   Portada: propuesta de valor + alta newsletter + 3 guías destacadas
/verifactu/                         Hub Verifactu (enlaza a todo lo de Verifactu)
  /verifactu/guia-autonomos/        Art. 01
  /verifactu/excel-word/            Art. 02
  /verifactu/sanciones/             Art. 07
  /verifactu/app-gratuita-aeat/     Art. 08
/facturar/                          Hub "facturar bien"
  /facturar/como-hacer-factura/     Art. 03
  /facturar/calculadora-iva-irpf/   Art. 06 (herramienta)
  /facturar/factura-electronica-b2b/ Art. 09
/programas/                         Hub comparativas
  /programas/mejor-programa-facturacion-autonomos/  Art. 04
  /programas/gratis/                Art. 10
  /programas/para/psicologos/       Art. 05 (plantilla para todas las profesiones)
  /programas/para/<profesion>/      Futuras: diseñadores, fisioterapeutas, profesores, fotógrafos, programadores, formadores
/newsletter/                        Archivo de números + alta
/checklist-verifactu/               Lead magnet (descarga tras alta)
/sobre-nosotros/  /como-ganamos-dinero/  /aviso-legal/  /privacidad/  /cookies/
```

## Reglas de enlazado interno
- Cada artículo enlaza a su hub y a 2–3 hermanos.
- Toda guía informacional enlaza una vez a la comparativa (Art. 04) con texto natural ("si tienes que elegir programa…").
- Bloque "Fechas clave" centralizado (un único include) para actualizar todos los artículos cuando cambie la normativa.

## SEO on-page (por plantilla)
- `title` ≤ 60 caracteres con palabra clave + año cuando aplique.
- Primer párrafo responde a la pregunta en 2 frases (fragmento destacado).
- Caja "Última revisión: fecha · Fuentes oficiales" al principio.
- Datos estructurados: `Article` + `FAQPage` en guías; `ItemList` en comparativas.
- Enlaces de afiliado con `rel="sponsored nofollow"`.

## Pila técnica recomendada (coste 0 €)
- Sitio estático (HTML/Markdown con Astro o Hugo, o el HTML de `landing/`) en Cloudflare Pages o Netlify.
- Analítica sin cookies (Cloudflare Web Analytics, gratis) para evitar banner obligatorio.
- Formulario de newsletter de MailerLite/beehiiv incrustado (doble opt-in).
