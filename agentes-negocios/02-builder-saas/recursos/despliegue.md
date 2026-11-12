# Guía de despliegue (preparada, NO ejecutada — requiere autorizaciones A1–A4)

Objetivo: dejar Recadoc en `https://app.<dominio>` en un servidor de la UE en menos de 1 hora.

## Opción recomendada: VPS en la UE (Hetzner CX23 o similar, ~6 €/mes con IPv4)
Motivo: los documentos fiscales de terceros deben quedar en la UE (RGPD) y un VPS barato permite disco
persistente para SQLite y archivos. Las plataformas "gratis" (Render free, Vercel) no sirven: no tienen disco
persistente o duermen la app.

```bash
# 1. En el servidor (Ubuntu 24.04), como root
adduser --disabled-password recadoc
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs caddy
# 2. Copiar el código (scp/rsync o git clone del repo privado)
mkdir -p /opt/recadoc && cp -r mvp/* /opt/recadoc/ && chown -R recadoc /opt/recadoc
# 3. /opt/recadoc/.env  (a partir de .env.ejemplo)
#    BASE_URL=https://app.<dominio>   DATA_DIR=/var/lib/recadoc   MAIL_MODE=bandeja (hasta A4)
mkdir -p /var/lib/recadoc && chown recadoc /var/lib/recadoc
```

`/etc/systemd/system/recadoc.service`:
```ini
[Unit]
Description=Recadoc
After=network.target
[Service]
User=recadoc
WorkingDirectory=/opt/recadoc
ExecStart=/usr/bin/node --disable-warning=ExperimentalWarning --env-file=/opt/recadoc/.env server.js
Restart=always
[Install]
WantedBy=multi-user.target
```

`/etc/caddy/Caddyfile` (HTTPS automático con Let's Encrypt):
```
app.<dominio> {
  request_body { max_size 25MB }
  reverse_proxy localhost:3000
}
```

```bash
systemctl enable --now recadoc caddy
ufw allow 22,80,443/tcp && ufw enable
```

## Copias de seguridad (obligatorio antes del primer cliente real)
```bash
# cron diario 03:00: copia consistente de SQLite + archivos, retención 14 días
0 3 * * * sqlite3 /var/lib/recadoc/recadoc.sqlite ".backup /var/backups/recadoc-$(date +\%F).sqlite" && tar czf /var/backups/uploads-$(date +\%F).tgz -C /var/lib/recadoc uploads && find /var/backups -mtime +14 -delete
```
Además, activar los backups del proveedor (+20 % del precio del VPS) o copiar a un almacenamiento externo en la UE.

## Email (A4)
1. Crear cuenta en Resend (plan gratis: 3.000 emails/mes, máx. 100/día) y verificar el dominio (SPF, DKIM, DMARC).
2. En `.env`: `MAIL_MODE=resend`, `RESEND_API_KEY=...`, `MAIL_FROM="Recadoc <avisos@<dominio>>"`.
3. Al pasar de ~5 despachos activos el límite de 100/día se queda corto en semana de cierre: plan de pago (~20 $/mes).

## Landing
`recursos/landing/index.html` es un único archivo estático: se puede servir desde el mismo Caddy
(`<dominio> { root * /opt/recadoc-landing; file_server }`) o desde Cloudflare Pages/GitHub Pages (gratis).
