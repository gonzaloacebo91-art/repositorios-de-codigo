# -*- coding: utf-8 -*-
"""Genera la plantilla 'Hucha Fiscal 2027' (.xlsx compatible con Google Sheets y Excel).
Uso: python3 generar_hucha.py <ruta_salida.xlsx> [--demo]
"""
import sys, datetime as dt, random
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.chart import BarChart, Reference

OUT = sys.argv[1]
DEMO = "--demo" in sys.argv
ANIO = 2027
N_ING = 500
N_GAS = 1000
F_ING, L_ING = 5, 5 + N_ING - 1
F_GAS, L_GAS = 5, 5 + N_GAS - 1

VERDE = "1F6F5C"; VERDE_CLARO = "E3F1EC"; GRIS = "F2F2F2"; AMARILLO = "FFF4CC"; ROJO = "C0392B"
H1 = Font(name="Arial", size=16, bold=True, color=VERDE)
H2 = Font(name="Arial", size=12, bold=True, color=VERDE)
B = Font(name="Arial", size=10, bold=True)
N = Font(name="Arial", size=10)
NOTA = Font(name="Arial", size=9, italic=True, color="555555")
HDR_FILL = PatternFill("solid", fgColor=VERDE)
HDR_FONT = Font(name="Arial", size=10, bold=True, color="FFFFFF")
CALC_FILL = PatternFill("solid", fgColor=GRIS)
INPUT_FILL = PatternFill("solid", fgColor=AMARILLO)
KPI_FILL = PatternFill("solid", fgColor=VERDE_CLARO)
thin = Side(style="thin", color="CCCCCC")
BORDE = Border(left=thin, right=thin, top=thin, bottom=thin)
EUR = '#,##0.00 "€";[Red]-#,##0.00 "€"'
PCT = '0%'
FECHA = 'DD/MM/YYYY'

wb = Workbook()

def cabecera(ws, fila, titulos, anchos):
    for i, (t, w) in enumerate(zip(titulos, anchos), start=1):
        c = ws.cell(row=fila, column=i, value=t)
        c.fill = HDR_FILL; c.font = HDR_FONT
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[c.column_letter].width = w
    ws.row_dimensions[fila].height = 32

def pct(ws, rango, msg):
    dv = DataValidation(type="decimal", operator="between", formula1="0", formula2="1", allow_blank=True)
    dv.promptTitle = "Porcentaje"; dv.prompt = msg; dv.errorTitle = "Valor no válido"; dv.error = "Escribe un porcentaje entre 0 % y 100 % (p. ej. 21 %)."
    ws.add_data_validation(dv); dv.add(rango)

def lista(ws, rango, opciones, msg=None):
    dv = DataValidation(type="list", formula1='"' + ",".join(opciones) + '"', allow_blank=True)
    if msg:
        dv.promptTitle = "Elige una opción"; dv.prompt = msg
    ws.add_data_validation(dv); dv.add(rango)

# ---------------------------------------------------------------- Instrucciones
ws = wb.active; ws.title = "Empieza aquí"
ws.column_dimensions["A"].width = 3; ws.column_dimensions["B"].width = 100
ws["B2"] = f"Hucha Fiscal {ANIO} · tus cuentas de autónomo en 10 minutos al mes"; ws["B2"].font = H1
pasos = [
    ("1. Configura (2 min)", "Ve a la pestaña «Configuración» y rellena las celdas amarillas: tu cuota de autónomo, si estás en estimación directa simplificada y el colchón que quieres guardar para la Renta."),
    ("2. Apunta cada factura que emitas", "Pestaña «Ingresos»: una fila por factura (sin agrupar). Solo rellenas las celdas amarillas; el IVA, la retención, el total y el trimestre se calculan solos."),
    ("3. Apunta cada gasto con justificante", "Pestaña «Gastos»: una fila por factura o ticket. Indica si la factura está a tu nombre con tu NIF (si no, el IVA no se deduce) y el % de uso para tu actividad (p. ej. 30 % del móvil)."),
    ("4. Revisa tu cuota de autónomo", "Pestaña «Cuota RETA»: viene rellena con la cuota de la configuración. Cambia el importe del mes si pagaste otra cantidad (no la apuntes también en Gastos)."),
    ("5. Mira cuánto apartar", "Pestaña «Trimestres»: borrador de los modelos 303 (IVA) y 130 (IRPF) y la cifra «HUCHA»: lo que deberías tener apartado. «Panel» te enseña tu beneficio real mes a mes."),
    ("6. No te pases de plazo", "Pestaña «Calendario fiscal»: fechas de presentación de 2027."),
    ("Importante", "Esta hoja es una herramienta de organización y estimación. No presenta impuestos ni sustituye a un asesor fiscal. Revisa siempre los importes antes de presentar tus modelos en la Sede Electrónica de la AEAT. Normativa de referencia: noviembre de 2026."),
    ("Google Sheets", "Archivo › Importar › Subir este .xlsx › «Reemplazar hoja de cálculo». Todas las fórmulas funcionan igual en Google Sheets y en Excel."),
]
r = 4
for t, d in pasos:
    ws.cell(row=r, column=2, value=t).font = H2
    c = ws.cell(row=r + 1, column=2, value=d); c.font = N; c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[r + 1].height = 32
    r += 3
ws.cell(row=r, column=2, value="Leyenda de colores:").font = B
c = ws.cell(row=r + 1, column=2, value="Amarillo = lo rellenas tú"); c.fill = INPUT_FILL; c.font = N
c = ws.cell(row=r + 2, column=2, value="Gris = se calcula solo (no lo toques)"); c.fill = CALC_FILL; c.font = N
c = ws.cell(row=r + 3, column=2, value="Verde = resultados clave"); c.fill = KPI_FILL; c.font = N

# ---------------------------------------------------------------- Configuración
wc = wb.create_sheet("Configuración")
wc.column_dimensions["A"].width = 52; wc.column_dimensions["B"].width = 20; wc.column_dimensions["C"].width = 70
wc["A1"] = "Configuración"; wc["A1"].font = H1
filas = [
    ("Año fiscal", ANIO, None, "Solo informativo."),
    ("Tu nombre o actividad", "Mi actividad", None, "Aparece en el Panel."),
    ("Cuota mensual de autónomo por defecto (€)", 80, EUR, "Tarifa plana 2026-2027: 80 €/mes. Si ya pagas por tramos, pon tu cuota real (desde ~206 €)."),
    ("¿Estimación directa simplificada?", "Sí", None, "Si es «Sí», se aplica el 5 % de gastos de difícil justificación (máx. 2.000 €/año). La mayoría de autónomos personas físicas están en ella."),
    ("Colchón extra para la Renta (% del beneficio)", 0.05, PCT, "El modelo 130 adelanta el 20 % del beneficio; si tu tipo de IRPF real es mayor, la Renta saldrá a pagar. Recomendado: 5-10 %."),
    ("% IVA habitual en tus facturas", 0.21, PCT, "Recordatorio del tipo que sueles aplicar (escribe 21 % en cada factura)."),
    ("% retención habitual (si facturas a empresas)", 0.15, PCT, "15 % general; 7 % el año de alta y los 2 siguientes (profesionales)."),
]
for i, (et, val, fmt, nota) in enumerate(filas, start=3):
    wc.cell(row=i, column=1, value=et).font = B
    c = wc.cell(row=i, column=2, value=val); c.fill = INPUT_FILL; c.border = BORDE; c.font = N
    if fmt: c.number_format = fmt
    wc.cell(row=i, column=3, value=nota).font = NOTA
    wc.cell(row=i, column=3).alignment = Alignment(wrap_text=True)
    wc.row_dimensions[i].height = 30
lista(wc, "B6", ["Sí", "No"])
CFG_CUOTA = "Configuración!$B$5"; CFG_EDS = "Configuración!$B$6"; CFG_COLCHON = "Configuración!$B$7"; CFG_NOMBRE = "Configuración!$B$4"

# ---------------------------------------------------------------- Ingresos
wi = wb.create_sheet("Ingresos")
wi["A1"] = "Ingresos · una fila por factura emitida"; wi["A1"].font = H1
wi["A2"] = "Rellena solo las columnas amarillas. Base imponible = importe sin IVA."; wi["A2"].font = NOTA
cabecera(wi, 4, ["Fecha factura", "Nº factura", "Cliente", "NIF cliente", "Concepto", "Base imponible (€)", "% IVA", "Cuota IVA (€)",
                 "% retención IRPF", "Retención (€)", "Total factura (€)", "Trimestre", "Mes", "¿Cobrada?"],
         [13, 11, 24, 13, 28, 15, 8, 13, 11, 13, 14, 10, 7, 10])
for r in range(F_ING, L_ING + 1):
    for col in "ABCDEFGIN":
        wi[f"{col}{r}"].fill = INPUT_FILL
    wi[f"A{r}"].number_format = FECHA
    wi[f"F{r}"].number_format = EUR; wi[f"G{r}"].number_format = PCT; wi[f"I{r}"].number_format = PCT
    wi[f"H{r}"] = f'=IF(F{r}="","",ROUND(F{r}*G{r},2))'
    wi[f"J{r}"] = f'=IF(F{r}="","",ROUND(F{r}*I{r},2))'
    wi[f"K{r}"] = f'=IF(F{r}="","",F{r}+H{r}-J{r})'
    wi[f"L{r}"] = f'=IF(A{r}="","",ROUNDUP(MONTH(A{r})/3,0))'
    wi[f"M{r}"] = f'=IF(A{r}="","",MONTH(A{r}))'
    for col in "HJK":
        wi[f"{col}{r}"].number_format = EUR; wi[f"{col}{r}"].fill = CALC_FILL
    for col in "LM":
        wi[f"{col}{r}"].fill = CALC_FILL
pct(wi, f"G{F_ING}:G{L_ING}", "IVA: 21 % general, 10 % reducido, 4 % superreducido, 0 % exento / no sujeto")
pct(wi, f"I{F_ING}:I{L_ING}", "Retención: 15 % general, 7 % nuevos profesionales, 0 % a particulares o si no aplica")
lista(wi, f"N{F_ING}:N{L_ING}", ["Sí", "No"])
wi.freeze_panes = "A5"

# ---------------------------------------------------------------- Gastos
CATS = ["Software y suscripciones", "Material de oficina", "Equipos (<300 €)", "Formación", "Marketing y publicidad",
        "Gestoría y asesoría", "Suministros vivienda", "Teléfono e internet", "Desplazamientos", "Comidas y dietas",
        "Seguros", "Comisiones bancarias y plataformas", "Alquiler de local", "Otros"]
wg = wb.create_sheet("Gastos")
wg["A1"] = "Gastos · una fila por factura o ticket"; wg["A1"].font = H1
wg["A2"] = "No apuntes aquí la cuota de autónomo (va en «Cuota RETA»). Equipos de más de 300 € se amortizan: consulta la guía."; wg["A2"].font = NOTA
cabecera(wg, 4, ["Fecha", "Proveedor", "NIF proveedor", "Nº factura / ticket", "Categoría", "Base imponible (€)", "% IVA", "Cuota IVA (€)",
                 "¿Factura completa a tu nombre?", "% uso para la actividad", "IVA deducible (€)", "Gasto deducible IRPF (€)", "Trimestre", "Mes"],
         [13, 22, 13, 14, 24, 15, 8, 13, 14, 12, 14, 15, 10, 7])
for r in range(F_GAS, L_GAS + 1):
    for col in "ABCDEFGIJ":
        wg[f"{col}{r}"].fill = INPUT_FILL
    wg[f"A{r}"].number_format = FECHA
    wg[f"F{r}"].number_format = EUR; wg[f"G{r}"].number_format = PCT; wg[f"J{r}"].number_format = PCT
    wg[f"H{r}"] = f'=IF(F{r}="","",ROUND(F{r}*G{r},2))'
    wg[f"K{r}"] = f'=IF(F{r}="","",IF(I{r}="Sí",ROUND(H{r}*IF(J{r}="",1,J{r}),2),0))'
    wg[f"L{r}"] = f'=IF(F{r}="","",ROUND((F{r}+IF(I{r}="Sí",0,H{r}))*IF(J{r}="",1,J{r}),2))'
    wg[f"M{r}"] = f'=IF(A{r}="","",ROUNDUP(MONTH(A{r})/3,0))'
    wg[f"N{r}"] = f'=IF(A{r}="","",MONTH(A{r}))'
    for col in "HKL":
        wg[f"{col}{r}"].number_format = EUR; wg[f"{col}{r}"].fill = CALC_FILL
    for col in "MN":
        wg[f"{col}{r}"].fill = CALC_FILL
# lista de categorías en hoja auxiliar para no superar 255 caracteres
wl = wb.create_sheet("Listas")
wl["A1"] = "Categorías de gasto (puedes añadir o renombrar)"; wl["A1"].font = B
for i, c in enumerate(CATS, start=2):
    wl.cell(row=i, column=1, value=c)
wl.column_dimensions["A"].width = 40
dv = DataValidation(type="list", formula1=f"=Listas!$A$2:$A${len(CATS)+11}", allow_blank=True)
wg.add_data_validation(dv); dv.add(f"E{F_GAS}:E{L_GAS}")
pct(wg, f"G{F_GAS}:G{L_GAS}", "IVA del gasto: 21 %, 10 %, 4 % o 0 %")
pct(wg, f"J{F_GAS}:J{L_GAS}", "Parte del gasto que usas para tu actividad. Vacío = 100 %.")
lista(wg, f"I{F_GAS}:I{L_GAS}", ["Sí", "No"], "«Sí» solo si es factura completa con tu NIF. Un ticket simplificado sin tus datos = «No».")
wg.freeze_panes = "A5"

# ---------------------------------------------------------------- Cuota RETA
wr = wb.create_sheet("Cuota RETA")
wr["A1"] = "Cuota de autónomo pagada"; wr["A1"].font = H1
wr["A2"] = "Cambia el importe si un mes pagaste otra cantidad o no estabas de alta (pon 0)."; wr["A2"].font = NOTA
cabecera(wr, 4, ["Mes", "Importe (€)", "Trimestre"], [14, 16, 12])
MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
for i, m in enumerate(MESES, start=1):
    r = 4 + i
    wr[f"A{r}"] = m
    wr[f"B{r}"] = f"={CFG_CUOTA}"; wr[f"B{r}"].fill = INPUT_FILL; wr[f"B{r}"].number_format = EUR
    wr[f"C{r}"] = (i - 1) // 3 + 1; wr[f"C{r}"].fill = CALC_FILL
    wr[f"D{r}"] = i  # mes numérico (oculto visualmente)
wr["D4"] = "Nº mes"; wr["D4"].font = NOTA
wr["A17"] = "Total año"; wr["A17"].font = B
wr["B17"] = "=SUM(B5:B16)"; wr["B17"].number_format = EUR; wr["B17"].fill = KPI_FILL

# ---------------------------------------------------------------- Trimestres
wt = wb.create_sheet("Trimestres")
wt.column_dimensions["A"].width = 58
for col in "BCDEF":
    wt.column_dimensions[col].width = 16
wt["A1"] = "Trimestres · borrador de modelos 303 y 130 y tu HUCHA"; wt["A1"].font = H1
wt["A2"] = "Estimación orientativa. Comprueba los importes antes de presentar en la AEAT."; wt["A2"].font = NOTA
for j, t in enumerate(["1T", "2T", "3T", "4T", "Total año"]):
    c = wt.cell(row=3, column=2 + j, value=t); c.fill = HDR_FILL; c.font = HDR_FONT; c.alignment = Alignment(horizontal="center")
wt["A3"].fill = HDR_FILL
COLS = ["B", "C", "D", "E"]

def fila(rr, etiqueta, formula_fn, total=None, kpi=False, negrita=False):
    wt[f"A{rr}"] = etiqueta; wt[f"A{rr}"].font = B if negrita else N
    for q, col in enumerate(COLS, start=1):
        wt[f"{col}{rr}"] = formula_fn(q, col)
        wt[f"{col}{rr}"].number_format = EUR
        wt[f"{col}{rr}"].fill = KPI_FILL if kpi else CALC_FILL
        if negrita: wt[f"{col}{rr}"].font = B
    if total:
        wt[f"F{rr}"] = total; wt[f"F{rr}"].number_format = EUR; wt[f"F{rr}"].fill = KPI_FILL if kpi else CALC_FILL
        if negrita: wt[f"F{rr}"].font = B

def prev(col):
    return chr(ord(col) - 1)

ING = f"Ingresos!$F${F_ING}:$F${L_ING}"; ING_IVA = f"Ingresos!$H${F_ING}:$H${L_ING}"; ING_RET = f"Ingresos!$J${F_ING}:$J${L_ING}"
ING_T = f"Ingresos!$L${F_ING}:$L${L_ING}"
GAS_IVA = f"Gastos!$K${F_GAS}:$K${L_GAS}"; GAS_IRPF = f"Gastos!$L${F_GAS}:$L${L_GAS}"; GAS_T = f"Gastos!$M${F_GAS}:$M${L_GAS}"
CUO = "'Cuota RETA'!$B$5:$B$16"; CUO_T = "'Cuota RETA'!$C$5:$C$16"

wt["A5"] = "IVA · Modelo 303"; wt["A5"].font = H2
fila(6, "Base imponible facturada en el trimestre", lambda q, c: f"=SUMIFS({ING},{ING_T},{q})", "=SUM(B6:E6)")
fila(7, "IVA repercutido (cobrado a clientes)", lambda q, c: f"=SUMIFS({ING_IVA},{ING_T},{q})", "=SUM(B7:E7)")
fila(8, "IVA soportado deducible (pagado en gastos)", lambda q, c: f"=SUMIFS({GAS_IVA},{GAS_T},{q})", "=SUM(B8:E8)")
fila(9, "Diferencia del trimestre", lambda q, c: f"={c}7-{c}8", "=SUM(B9:E9)")
fila(10, "Cuotas a compensar de trimestres anteriores", lambda q, c: "=0" if q == 1 else f"=IF({prev(c)}11<0,-{prev(c)}11,0)")
fila(11, "Resultado 303 (negativo = a compensar / devolver en 4T)", lambda q, c: f"={c}9-{c}10")
fila(12, "IVA A PAGAR este trimestre", lambda q, c: f"=MAX(0,{c}11)", "=SUM(B12:E12)", kpi=True, negrita=True)

wt["A14"] = "IRPF · Modelo 130 (estimación directa, datos acumulados desde enero)"; wt["A14"].font = H2
fila(15, "Ingresos acumulados", lambda q, c: f"=SUMIFS({ING},{ING_T},\"<=\"&{q})")
fila(16, "Gastos deducibles acumulados (facturas y tickets)", lambda q, c: f"=SUMIFS({GAS_IRPF},{GAS_T},\"<=\"&{q})")
fila(17, "Cuota de autónomo acumulada", lambda q, c: f"=SUMIFS({CUO},{CUO_T},\"<=\"&{q})")
fila(18, "Rendimiento antes de difícil justificación", lambda q, c: f"={c}15-{c}16-{c}17")
fila(19, "Gastos de difícil justificación (5 %, máx. 2.000 €)", lambda q, c: f"=IF({CFG_EDS}=\"Sí\",ROUND(MIN(MAX(0,{c}18)*0.05,2000),2),0)")
fila(20, "Rendimiento neto acumulado", lambda q, c: f"={c}18-{c}19")
fila(21, "20 % del rendimiento neto", lambda q, c: f"=MAX(0,ROUND({c}20*0.2,2))")
fila(22, "Retenciones acumuladas (te las adelantaron tus clientes)", lambda q, c: f"=SUMIFS({ING_RET},{ING_T},\"<=\"&{q})")
fila(23, "Pagos fraccionados de trimestres anteriores", lambda q, c: "=0" if q == 1 else f"=SUM($B$24:{prev(c)}24)")
fila(24, "130 A PAGAR este trimestre", lambda q, c: f"=MAX(0,{c}21-{c}22-{c}23)", "=SUM(B24:E24)", kpi=True, negrita=True)
wt["A25"] = "Si el 70 % o más de tus ingresos del año anterior llevó retención, normalmente no presentas el 130 (compruébalo con tu asesor)."
wt["A25"].font = NOTA

wt["A27"] = "HUCHA · lo que deberías tener apartado"; wt["A27"].font = H2
fila(28, "Beneficio del trimestre (rendimiento neto)", lambda q, c: f"={c}20" if q == 1 else f"={c}20-{prev(c)}20", "=SUM(B28:E28)")
fila(29, "Colchón extra para la Renta", lambda q, c: f"=MAX(0,ROUND({c}28*{CFG_COLCHON},2))", "=SUM(B29:E29)")
fila(30, "HUCHA DEL TRIMESTRE (IVA + 130 + colchón)", lambda q, c: f"={c}12+{c}24+{c}29", "=SUM(B30:E30)", kpi=True, negrita=True)
fila(31, "Tu sueldo real del trimestre (beneficio − 130 − colchón)", lambda q, c: f"={c}28-{c}24-{c}29", "=SUM(B31:E31)", kpi=True, negrita=True)
wt.conditional_formatting.add("B11:E11", CellIsRule(operator="lessThan", formula=["0"], font=Font(color=ROJO, bold=True)))

# ---------------------------------------------------------------- Panel
wp = wb.create_sheet("Panel", 1)
wp.column_dimensions["A"].width = 16
for col in "BCDEFG":
    wp.column_dimensions[col].width = 17
wp["A1"] = f'="Panel "&{CFG_NOMBRE}&" · "&Configuración!$B$3'; wp["A1"].font = H1
kpis = [
    ("Facturado (base)", "=Trimestres!F6"),
    ("Beneficio neto", "=SUM(Trimestres!B28:E28)"),
    ("Para Hacienda (hucha)", "=Trimestres!F30"),
    ("Tu sueldo real", "=Trimestres!F31"),
    ("Pendiente de cobro", f'=SUMIFS(Ingresos!$K${F_ING}:$K${L_ING},Ingresos!$N${F_ING}:$N${L_ING},"<>Sí",Ingresos!$F${F_ING}:$F${L_ING},"<>")'),
]
for j, (t, f) in enumerate(kpis):
    col = chr(ord("B") + j)
    c = wp[f"{col}3"]; c.value = t; c.font = Font(name="Arial", size=9, bold=True, color=VERDE); c.alignment = Alignment(horizontal="center", wrap_text=True)
    c = wp[f"{col}4"]; c.value = f; c.font = Font(name="Arial", size=13, bold=True); c.number_format = EUR; c.fill = KPI_FILL
    c.alignment = Alignment(horizontal="center")
wp.row_dimensions[4].height = 28
cabecera_p = ["Mes", "Ingresos (base)", "Gastos deducibles", "Cuota autónomo", "Beneficio", "IVA neto", "Beneficio acumulado"]
for j, t in enumerate(cabecera_p, start=1):
    c = wp.cell(row=6, column=j, value=t); c.fill = HDR_FILL; c.font = HDR_FONT; c.alignment = Alignment(horizontal="center", wrap_text=True)
ING_M = f"Ingresos!$M${F_ING}:$M${L_ING}"; GAS_M = f"Gastos!$N${F_GAS}:$N${L_GAS}"
GAS_IRPF_ALL = GAS_IRPF; GAS_IVA_ALL = GAS_IVA
for i, m in enumerate(MESES, start=1):
    r = 6 + i
    wp[f"A{r}"] = m
    wp[f"B{r}"] = f"=SUMIFS({ING},{ING_M},{i})"
    wp[f"C{r}"] = f"=SUMIFS({GAS_IRPF_ALL},{GAS_M},{i})"
    wp[f"D{r}"] = f"='Cuota RETA'!B{4+i}"
    wp[f"E{r}"] = f"=B{r}-C{r}-D{r}"
    wp[f"F{r}"] = f"=SUMIFS({ING_IVA},{ING_M},{i})-SUMIFS({GAS_IVA_ALL},{GAS_M},{i})"
    wp[f"G{r}"] = f"=E{r}" if i == 1 else f"=G{r-1}+E{r}"
    for col in "BCDEFG":
        wp[f"{col}{r}"].number_format = EUR; wp[f"{col}{r}"].fill = CALC_FILL
wp["A19"] = "Total"; wp["A19"].font = B
for col in "BCDEF":
    wp[f"{col}19"] = f"=SUM({col}7:{col}18)"; wp[f"{col}19"].number_format = EUR; wp[f"{col}19"].font = B; wp[f"{col}19"].fill = KPI_FILL
wp["A20"] = "Beneficio del Panel = antes del 5 % de difícil justificación. El dato fiscal está en «Trimestres»."; wp["A20"].font = NOTA
ch = BarChart(); ch.type = "col"; ch.title = "Ingresos vs. gastos por mes"; ch.y_axis.title = "€"
data = Reference(wp, min_col=2, max_col=3, min_row=6, max_row=18)
cats = Reference(wp, min_col=1, min_row=7, max_row=18)
ch.add_data(data, titles_from_data=True); ch.set_categories(cats); ch.height = 8; ch.width = 20
wp.add_chart(ch, "A22")

# ---------------------------------------------------------------- Calendario fiscal
wf = wb.create_sheet("Calendario fiscal")
wf["A1"] = f"Calendario fiscal {ANIO} del autónomo (persona física, régimen general de IVA)"; wf["A1"].font = H1
wf["A2"] = "Fechas habituales; compruébalas cada año en el calendario oficial de la AEAT. Si domicilias el pago, el plazo acaba unos días antes."; wf["A2"].font = NOTA
cabecera(wf, 4, ["Plazo", "Qué se presenta", "Notas", "¿Hecho?"], [30, 50, 60, 10])
cal = [
    ("1 ene – 1 feb 2027", "303 y 130 del 4T de 2026 · 390 (resumen anual IVA 2026)", "El 30 de enero de 2027 cae en sábado: el plazo pasa al lunes 1 de febrero."),
    ("1 – 20 abr 2027", "303 y 130 del 1T de 2027", "Domiciliación: hasta el 15 de abril aprox."),
    ("abril – 30 jun 2027", "Declaración de la Renta 2026", "Fechas exactas de la campaña: publicadas por la AEAT."),
    ("1 jul 2027", "Entrada en vigor de VERI*FACTU para autónomos", "Si facturas con un programa, debe estar adaptado. Esta hoja NO emite facturas (RDL 15/2025)."),
    ("1 – 20 jul 2027", "303 y 130 del 2T de 2027", "Domiciliación: hasta el 15 de julio aprox."),
    ("1 – 20 oct 2027", "303 y 130 del 3T de 2027", "Domiciliación: hasta el 15 de octubre aprox."),
    ("1 – 31 ene 2028", "303 y 130 del 4T de 2027 · 390 de 2027", "El 30 de enero de 2028 cae en domingo: comprobar plazo final."),
    ("Según tu caso", "111 / 190 (retenciones a trabajadores o profesionales) · 115 / 180 (alquiler de local) · 349 (operaciones intracomunitarias)", "Solo si tienes empleados, alquilas local o trabajas con empresas de la UE."),
]
for i, (a, b, c) in enumerate(cal, start=5):
    wf[f"A{i}"] = a; wf[f"A{i}"].font = B
    wf[f"B{i}"] = b; wf[f"C{i}"] = c
    for col in "ABC":
        wf[f"{col}{i}"].alignment = Alignment(wrap_text=True, vertical="top")
    wf[f"D{i}"].fill = INPUT_FILL
    wf.row_dimensions[i].height = 34
lista(wf, "D5:D12", ["Sí", "No"])

# ---------------------------------------------------------------- Datos demo
if DEMO:
    random.seed(7)
    clientes = [("Estudio Norte SL", "B12345678", 0.15), ("Lucía Pérez", "12345678Z", 0), ("Agencia Sur SL", "B87654321", 0.15)]
    fila_i = F_ING
    for mes in range(1, 13):
        for k in range(random.randint(2, 4)):
            cl = random.choice(clientes)
            wi[f"A{fila_i}"] = dt.date(ANIO, mes, random.randint(1, 28))
            wi[f"B{fila_i}"] = f"{ANIO}-{fila_i-F_ING+1:03d}"
            wi[f"C{fila_i}"] = cl[0]; wi[f"D{fila_i}"] = cl[1]
            wi[f"E{fila_i}"] = random.choice(["Diseño web", "Mantenimiento mensual", "Consultoría", "Redes sociales"])
            wi[f"F{fila_i}"] = random.choice([250, 400, 600, 900, 1200])
            wi[f"G{fila_i}"] = 0.21; wi[f"I{fila_i}"] = cl[2]
            wi[f"N{fila_i}"] = "Sí" if mes < 11 else "No"
            fila_i += 1
    gastos_demo = [("Adobe", "Software y suscripciones", 60.49, 0.21, "Sí", 1), ("Movistar", "Teléfono e internet", 41.32, 0.21, "Sí", 0.5),
                   ("Gestoría López", "Gestoría y asesoría", 50, 0.21, "Sí", 1), ("Bar Central", "Comidas y dietas", 18.18, 0.10, "No", 1),
                   ("Iberdrola", "Suministros vivienda", 70, 0.21, "Sí", 0.09)]
    fila_g = F_GAS
    for mes in range(1, 13):
        for g in gastos_demo:
            if g[0] == "Bar Central" and mes % 2: continue
            wg[f"A{fila_g}"] = dt.date(ANIO, mes, 10); wg[f"B{fila_g}"] = g[0]; wg[f"E{fila_g}"] = g[1]
            wg[f"F{fila_g}"] = g[2]; wg[f"G{fila_g}"] = g[3]; wg[f"I{fila_g}"] = g[4]; wg[f"J{fila_g}"] = g[5]
            fila_g += 1
    wc["B4"] = "Ejemplo: diseñadora freelance"

wb.save(OUT)
print("OK", OUT)
