#!/usr/bin/env python3
"""AutoEffortless pricing spreadsheet — generated from pricing_data.py.

Tabs:
  Summary            — headline numbers + how the pricing model works
  Services & Prices  — every item (active + archived): category, service, wording,
                       once-off, 12% maintenance, usage flag, price display,
                       Active + Status dropdowns
  Packages           — Basic site, care lines, bundles
  Wording & Copy     — the customer-facing copy blocks
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

import pricing_data as D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "AutoEffortless-Pricing-Master.xlsx")

GOLD, GOLD_DEEP, GOLD_SOFT, LINE = "C8A34E", "A8863A", "FBF6EA", "ECE9DF"
INK, MUTED = "14142A", "6B6B82"

F_TITLE = Font(name="Outfit", bold=True, size=14, color=INK)
F_SUB = Font(name="Outfit", size=10, italic=True, color=MUTED)
F_HDR = Font(name="Outfit", bold=True, size=10, color="FFFFFF")
F_BODY = Font(name="Outfit", size=10, color=INK)
F_BOLD = Font(name="Outfit", size=10, bold=True, color=INK)
F_GOLD = Font(name="Outfit", size=10, bold=True, color=GOLD_DEEP)
F_SECTION = Font(name="Outfit", size=10, bold=True, color=GOLD_DEEP)
F_MUTED = Font(name="Outfit", size=9, color=MUTED)
FILL_HDR = PatternFill("solid", fgColor=GOLD_DEEP)
FILL_SOFT = PatternFill("solid", fgColor=GOLD_SOFT)
THIN = Side(style="thin", color=LINE)
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
ZAR = '"R"#,##0'


def style_header(ws, row, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row, c)
        cell.font = F_HDR
        cell.fill = FILL_HDR
        cell.alignment = Alignment(vertical="center")
    ws.row_dimensions[row].height = 20


def widths(ws, spec):
    for col, w in spec.items():
        ws.column_dimensions[col].width = w


wb = Workbook()

# ------------------------------------------------------------- Summary -----
ws = wb.active
ws.title = "Summary"
ws.sheet_view.showGridLines = False
ws["A1"] = "AutoEffortless — Website Building Service"
ws["A1"].font = F_TITLE
ws["A2"] = f"Wording & price master ({D.REVISION}) · generated from pricing_data.py"
ws["A2"].font = F_SUB
ws["A3"] = ("Basic site = the complete content-rich website. Add-ons = built once, then "
            "12% of the build fee per month maintenance. AI / WhatsApp items = 12% + tracked usage.")
ws["A3"].font = Font(name="Outfit", size=9, italic=True, color=GOLD_DEEP)

active = D.active_systems()
rows = [
    ("Basic site — once-off build", D.BASIC["setup"], "confirmed by Mr D"),
    ("Basic site — care plan", D.BASIC["monthly"], "per month, confirmed"),
    ("Hosting + domain", D.BASIC["yearly_range"], "per year, confirmed"),
    ("Chargeable add-ons", len(active), "shown in the pricing PDF"),
    ("Add-on maintenance rate", "12%", "of the once-off fee, per month"),
    ("Wording blocks", len(D.WORDING), "'Wording & Copy' tab"),
]
r = 5
ws.cell(r, 1, "Headline numbers").font = F_SECTION
r += 1
for label, val, note in rows:
    ws.cell(r, 1, label).font = F_BODY
    c = ws.cell(r, 2, val)
    c.font = F_GOLD
    if isinstance(val, int) and val >= 100:
        c.number_format = ZAR
    ws.cell(r, 3, note).font = F_MUTED
    r += 1

r += 1
ws.cell(r, 1, "How the model works").font = F_SECTION
r += 1
for line in [D.w("addon_model"), D.w("usage_rule")]:
    ws.cell(r, 1, line).font = F_BODY
    ws.cell(r, 1).alignment = Alignment(wrap_text=True, vertical="top")
    ws.row_dimensions[r].height = 30
    r += 1

r += 1
ws.cell(r, 1, "How to use").font = F_SECTION
r += 1
for line in [
    "1. Edit wording and prices on 'Services & Prices' / 'Packages' / 'Wording & Copy'.",
    "2. Active = yes  →  shows in the pricing PDF and on quotes. Active = no  →  archived but kept.",
    "3. Maintenance is 12% of the once-off fee, per month — the rands are calculated at quote time.",
    "4. Usage = yes  →  AI / WhatsApp-Meta items: 12% plus tracked usage, charged on the relevant areas.",
    "5. Tell Fred when you're done and both the sheet and the PDF are re-issued in minutes.",
    "6. Items we no longer market are NOT in this sheet — see archive/removed-items-2026-09-29.md.",
]:
    ws.cell(r, 1, line).font = F_BODY
    r += 1
widths(ws, {"A": 36, "B": 18, "C": 58})

# --------------------------------------------------- Services & Prices -----
ws = wb.create_sheet("Services & Prices")
hdr = ["Category", "Service", "Wording (customer-facing)", "Once-off (R)",
       "Maintenance", "Usage billed", "Price display", "Active", "Status", "Notes"]
ws.append(hdr)
style_header(ws, 1, len(hdr))
r = 2
inactive_start = None
for cat in D.CATEGORY_ORDER:
    items = [s for s in D.SERVICES + D.CARE + D.BUNDLES if s["cat"] == cat]
    if not items:
        continue
    ws.cell(r, 1, cat.upper()).font = F_SECTION
    for c in range(1, len(hdr) + 1):
        ws.cell(r, c).fill = FILL_SOFT
        ws.cell(r, c).border = BOX
    r += 1
    for s in items:
        ws.cell(r, 1, s["cat"]).font = F_MUTED
        ws.cell(r, 2, s["name"]).font = F_BOLD
        ws.cell(r, 3, s["wording"]).font = F_BODY
        c = ws.cell(r, 4, s.get("once"))
        c.number_format = ZAR
        c.font = F_BODY
        ws.cell(r, 5, D.maint_display(s)).font = F_BOLD
        ws.cell(r, 6, "yes" if s.get("usage") else "no").font = F_BODY
        ws.cell(r, 7, D.price_display(s) or s.get("yearly_range", "")).font = F_GOLD
        ws.cell(r, 8, "yes" if s["active"] else "no").font = F_BODY
        ws.cell(r, 9, s["status"]).font = F_MUTED
        for c in range(1, len(hdr) + 1):
            ws.cell(r, c).border = BOX
            ws.cell(r, c).alignment = Alignment(vertical="top", wrap_text=(c == 3))
        r += 1
ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:{get_column_letter(len(hdr))}{r - 1}"
widths(ws, {"A": 20, "B": 36, "C": 58, "D": 12, "E": 13, "F": 12, "G": 34, "H": 9, "I": 11, "J": 26})

for col, opts in (("H", "yes,no"), ("F", "yes,no")):
    dv = DataValidation(type="list", formula1=f'"{opts}"', allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{col}2:{col}{r - 1}")
dv = DataValidation(type="list", formula1='"confirmed,proposal"', allow_blank=True)
ws.add_data_validation(dv)
dv.add(f"I2:I{r - 1}")

# ----------------------------------------------------------- Packages ------
ws = wb.create_sheet("Packages")
ws["A1"] = "Packages, care lines & bundles"
ws["A1"].font = F_TITLE
hdr = ["Item", "What it covers", "Once-off (R)", "Monthly (R)", "Annual (R)", "Active", "Status"]
ws.append([])
ws.append(hdr)
style_header(ws, 3, len(hdr))
r = 4


def package_row(name, desc, once, monthly, annual, active, status, bold=False):
    global r
    ws.cell(r, 1, name).font = F_BOLD if bold else F_BODY
    ws.cell(r, 2, desc).font = F_BODY
    if once is not None:
        ws.cell(r, 3, once).number_format = ZAR
    if monthly is not None:
        ws.cell(r, 4, monthly).number_format = ZAR
    if annual:
        ws.cell(r, 5, annual).font = F_BODY
    ws.cell(r, 6, "yes" if active else "no").font = F_BODY
    ws.cell(r, 7, status).font = F_MUTED
    for c in range(1, len(hdr) + 1):
        ws.cell(r, c).border = BOX
        ws.cell(r, c).alignment = Alignment(vertical="top", wrap_text=(c == 2))
    r += 1


package_row("Basic Website", D.BASIC["summary"], D.BASIC["setup"], D.BASIC["monthly"],
            D.BASIC["yearly_range"], True, "confirmed", bold=True)
for s in [x for x in D.CARE]:
    package_row(s["name"], s["wording"], s.get("once"), D.monthly_fee(s),
                s.get("yearly_range"), s["active"], s["status"])
r += 1
if D.BUNDLES:
    ws.cell(r, 1, "Bundles").font = F_SECTION
    r += 1
    for s in D.BUNDLES:
        ws.cell(r, 1, s["name"]).font = F_BOLD
        ws.cell(r, 2, s["wording"]).font = F_BODY
        ws.cell(r, 3, s.get("once")).number_format = ZAR
        ws.cell(r, 5, "=C{0}*0.12".format(r)).number_format = ZAR
        ws.cell(r, 6, "yes").font = F_BODY
        ws.cell(r, 7, s["status"]).font = F_MUTED
        for c in range(1, len(hdr) + 1):
            ws.cell(r, c).border = BOX
        r += 1
    r += 1
ws.cell(r, 1, "Note").font = F_SECTION
ws.cell(r, 2, "Bundles were removed from the pricing model (not marketed). Everything we do "
              "market is on 'Services & Prices' with Active = yes.").font = F_BODY
widths(ws, {"A": 30, "B": 62, "C": 13, "D": 12, "E": 13, "F": 9, "G": 11})

# ------------------------------------------------------- Wording & Copy ----
ws = wb.create_sheet("Wording & Copy")
hdr = ["Area", "Where it's used", "Wording"]
ws.append(hdr)
style_header(ws, 1, len(hdr))
r = 2
for area, where, text in D.WORDING.values():
    ws.cell(r, 1, area).font = F_MUTED
    ws.cell(r, 2, where).font = F_BOLD
    ws.cell(r, 3, text).font = F_BODY
    for c in range(1, 4):
        ws.cell(r, c).border = BOX
        ws.cell(r, c).alignment = Alignment(vertical="top", wrap_text=(c == 3))
    r += 1
ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:C{r - 1}"
widths(ws, {"A": 14, "B": 28, "C": 96})

wb.save(OUT)
print("wrote", OUT)
print("tabs:", wb.sheetnames)
