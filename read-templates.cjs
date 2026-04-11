// Comprehensive analysis of both Excel templates
// Run with: node read-templates.cjs

function decode(str) {
  if (!str) return '(empty)';
  return str;
}

// ---- FILE 1: اذن_اضافة (Add Permission / Goods Receipt) ----
console.log('='.repeat(130));
console.log('TEMPLATE 1: اذن_اضافة.xlsx (Goods Receipt / Add Permission)');
console.log('='.repeat(130));

console.log(`
WORKBOOK:
  - Sheet name: "اذن إضافة"
  - Print area: $A$1:$J$30
  - Orientation: portrait
  - Paper size: 9 (A4)
  - Fit to: 1 page wide x 1 page tall
  - Grid lines: HIDDEN (showGridLines="0")
  - Right-to-left: YES (rightToLeft="1")

COLUMN WIDTHS:
  Col A (1):  4  px (narrow margin)
  Col B (2): 14  px
  Col C (3): 22  px
  Col D (4): 11  px
  Col E (5): 11  px
  Col F (6): 13  px
  Col G (7): 13  px
  Col H (8): 13  px
  Col I (9): 18  px
  Col J (10): 4  px (narrow margin)

ROW HEIGHTS:
  Row  1: 14  (empty spacer row)
  Row  2: 38  (TITLE ROW)
  Row  3: 18  (SER + Company name)
  Row  4: 22  (Date)
  Row  5: 22  (Project)
  Row  6: 22  (Add type + Warehouse)
  Row  7: 22  (Item name)
  Row  8: 22  (PO number + Driver name)
  Row  9: 20  (TABLE HEADER ROW)
  Rows 10-24: 20  (data rows, 15 rows)
  Row 25: 20  (Total row)
  Row 26: 22  (Receipt decision)
  Row 27: 22  (Receipt notes)
  Row 28: 22  (Receipt member + Site accountant)
  Row 29: 28  (Declaration statement)
  Row 30: default (15)  (Signatures: Warehouse admin + Project manager)
`);

console.log(`
MERGED CELLS (28 total):
  B2:I2    -> Title row
  B3:C3    -> "SER: ___________"
  D3:F3    -> Company name
  G3:I3    -> (empty)
  B4:I4    -> Date row
  B5:D5    -> "المشروع:" label
  E5:I5    -> (empty - project value)
  B6:C6    -> "نوع الاضافة:" label
  D6:F6    -> (empty - add type value)
  G6:H6 -> actually H6:I6 -> "المخزن:" label
  H6:I6 -> actually let me check... G6 is "المخزن:" and H6:I6 is merged for value
  B7:C7    -> "اسم المورد:" label
  D7:I7    -> (empty - supplier name value)
  B8:C8    -> "رقم السياسة:" label
  D8:E8    -> (empty - PO number value)
  F8       -> "اسم السائق:" label
  G8:I8    -> (empty - driver name value)
  B25:G25  -> "الاجمالي" (Total) label
  H25:I25  -> (empty - total value)
  B26:I26  -> Receipt decision row
  B27:I27  -> Receipt notes header
  B28:C28  -> "عضو لجنة الفحص:" label
  D28:E28  -> (empty - member value)
  F28:G28  -> "محاسب الموقع:" label
  H28:I28  -> (empty - accountant value)
  B29:I29  -> Declaration statement
  B30:C30  -> "أمين المخزن:" label
  D30:E30  -> (empty - warehouse admin value)
  F30:G30  -> "مدير المشروع:" label
  H30:I30  -> (empty - project manager value)
`);

console.log(`
CELL VALUES (decoded Arabic):

=== ROW 1 (height=14, spacer) ===
  No content

=== ROW 2 (height=38, TITLE) ===
  B2 [merged B2:I2]: "مستند اضـافـة (مشتراه – محوّلة – ارتجاع)"
    Style: s=1 -> Font #1 (Arial, Bold, White #FFFFFF, 14pt), 
           Fill #2 (Dark navy #0D2B6E), Border #1 (thin navy),
           Alignment: center, center, wrapText

=== ROW 3 (height=18) ===
  B3 [merged B3:C3]: "SER:  ___________"
    Style: s=2 -> Font #2 (Arial, Bold, Black #000000, 10pt),
           Fill #3 (Light blue #EEF2FB), Border #1,
           Alignment: right, center
  D3 [merged D3:F3]: "شركة ديكوان للمقاولات"
    Style: s=3 -> Font #3 (Arial, Bold, Navy #0D2B6E, 12pt),
           Fill #4 (White #FFFFFF), Border #1,
           Alignment: center, center
  G3 [merged G3:I3]: (empty)
    Style: s=4 -> Font #4 (Arial, regular, Black, 11pt),
           Fill #4 (White), Border #1,
           Alignment: center, center

=== ROW 4 (height=22) ===
  B4 [merged B4:I4]: "التاريخ:  ____  /  ____  /  20____"
    Style: s=5 -> Font #5 (Arial, Bold, Black, 11pt),
           Fill #3 (Light blue #EEF2FB), Border #1,
           Alignment: right, center

=== ROW 5 (height=22) ===
  B5 [merged B5:D5]: "المشروع:"
    Style: s=5 -> Font #5 (Arial, Bold, Black, 11pt),
           Fill #3 (Light blue), Border #1,
           Alignment: right, center
  E5 [merged E5:I5]: (empty)
    Style: s=4 -> White fill, center, center

=== ROW 6 (height=22) ===
  B6 [merged B6:C6]: "نوع الاضافة:"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center
  D6 [merged D6:F6]: (empty)
    Style: s=4 -> White fill, center, center
  G6: "المخزن:"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center
  H6 [merged H6:I6]: (empty)
    Style: s=4 -> White fill, center, center

=== ROW 7 (height=22) ===
  B7 [merged B7:C7]: "اسم المورد:"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center
  D7 [merged D7:I7]: (empty)
    Style: s=4 -> White fill, center, center

=== ROW 8 (height=22) ===
  B8 [merged B8:C8]: "رقم السياسة:"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center
  D8 [merged D8:E8]: (empty)
    Style: s=4 -> White fill, center, center
  F8: "اسم السائق:"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center
  G8 [merged G8:I8]: (empty)
    Style: s=4 -> White fill, center, center

=== ROW 9 (height=20) - TABLE HEADER ===
  All cells use Style s=6: Font #6 (Arial, Bold, White #FFFFFF, 10pt),
    Fill #2 (Dark navy #0D2B6E), Border #2 (thin WHITE borders),
    Alignment: center, center

  B9: "م"                    (Row number)
  C9: "كود الصنف"            (Item code)
  D9: "اسم الصنف"            (Item name)
  E9: "الوحدة"               (Unit)
  F9: "الكمية"              (Quantity)
  G9: "سعر الوحدة"          (Unit price)
  H9: "اجمالي السعر"        (Total price)
  I9: "ملاحظات"            (Notes)

=== ROWS 10-24 (height=20) - DATA ROWS ===
  Alternating styles: odd rows s=7, even rows s=9
  B column: row numbers 1-15 (numeric values)
  C-I columns: empty (for data entry)

  Style s=7 (odd data rows 10,12,14,16,18,20,22,24):
    Font #2 (Arial, Bold, Black, 10pt), Fill #4 (White), Border #1, center/center
  
  Style s=8 (odd data row C-I cols):
    Font #7 (Arial, regular, Black, 10pt), Fill #4 (White), Border #1, center/center
  
  Style s=9 (even data rows 11,13,15,17,19,21,23):
    Font #2 (Arial, Bold, Black, 10pt), Fill #3 (Light blue #EEF2FB), Border #1, center/center
  
  Style s=10 (even data row C-I cols):
    Font #7 (Arial, regular, Black, 10pt), Fill #3 (Light blue), Border #1, center/center

=== ROW 25 (height=20) - TOTAL ===
  B25 [merged B25:G25]: "الاجمالي"
    Style: s=11 -> Font #8 (Arial, Bold, White, 11pt), Fill #2 (Dark navy), Border #1, center/center
  H25 [merged H25:I25]: (empty - total value goes here)
    Style: s=12 -> Font #5 (Arial, Bold, Black, 11pt), Fill #5 (Gold #C9A84C), Border #1, center/center

=== ROW 26 (height=22) ===
  B26 [merged B26:I26]: "قرار لجنة الفحص:  □ مطابق     □ غير مطابق"
    Style: s=5 -> Font #5, Fill #3 (Light blue), Border #1, right, center

=== ROW 27 (height=22) ===
  B27 [merged B27:I27]: "ملاحظات لجنة الفحص:"
    Style: s=13 -> Font #5 (Arial, Bold, Black, 11pt), Fill #4 (White), Border #1, right, center

=== ROW 28 (height=22) ===
  B28 [merged B28:C28]: "عضو لجنة الفحص:"
    Style: s=9 -> Font #2, Fill #3 (Light blue), Border #1, center/center
  D28 [merged D28:E28]: (empty)
    Style: s=4 -> White fill, center, center
  F28 [merged F28:G28]: "محاسب الموقع:"
    Style: s=9 -> Font #2, Fill #3 (Light blue), Border #1, center/center
  H28 [merged H28:I28]: (empty)
    Style: s=4 -> White fill, center, center

=== ROW 29 (height=28) ===
  B29 [merged B29:I29]: "استلمت الاصناف اعلاه واصبحت عهدتي"
    Style: s=14 -> Font #9 (Arial, Bold, Navy #0D2B6E, 11pt), Fill #3 (Light blue), Border #1, center/center

=== ROW 30 (height=default=15) ===
  B30 [merged B30:C30]: "امين المخزن:"
    Style: s=9 -> Font #2, Fill #3 (Light blue), Border #1, center/center
  D30 [merged D30:E30]: (empty)
    Style: s=4 -> White fill, center, center
  F30 [merged F30:G30]: "مدير المشروع:"
    Style: s=9 -> Font #2, Fill #3 (Light blue), Border #1, center/center
  H30 [merged H30:I30]: (empty)
    Style: s=4 -> White fill, center, center
`);

console.log(`
IMAGE:
  - File: xl/media/image1.jpeg
  - Position: oneCellAnchor starting at Column 7 (col index 6), Row 3 (row index 2)
    from: col=6 (column G), colOff=0, row=2, rowOff=0
  - Size: cx=1238250, cy=333375 (in EMUs)
    cx = 1238250 / 914400 = ~1.35 inches wide
    cy = 333375 / 914400 = ~0.36 inches tall
  - Stretch: fillRect (stretched to fill the area)
  - The image sits in the top-right area of the sheet (row 3, around column G)

STYLE REFERENCES (cellXfs index -> style details):
  s=0:  Default - Calibri 11pt, no fill, no border
  s=1:  TITLE - Arial Bold 14pt WHITE on DARK NAVY (#0D2B6E), navy border, center/center, wrapText
  s=2:  SER label - Arial Bold 10pt BLACK on LIGHT BLUE (#EEF2FB), navy border, right/center
  s=3:  COMPANY NAME - Arial Bold 12pt NAVY (#0D2B6E) on WHITE, navy border, center/center
  s=4:  EMPTY VALUE CELLS - Arial 11pt BLACK on WHITE, navy border, center/center
  s=5:  LABEL CELLS (right-aligned) - Arial Bold 11pt BLACK on LIGHT BLUE, navy border, right/center
  s=6:  TABLE HEADER - Arial Bold 10pt WHITE on DARK NAVY, WHITE thin borders, center/center
  s=7:  DATA ROW (odd) - B col: Arial Bold 10pt BLACK on WHITE, navy border, center/center
  s=8:  DATA ROW (odd) - C-I cols: Arial 10pt BLACK on WHITE, navy border, center/center
  s=9:  DATA ROW (even) / LABEL BLUE - Arial Bold 10pt BLACK on LIGHT BLUE, navy border, center/center
  s=10: DATA ROW (even) - C-I cols: Arial 10pt BLACK on LIGHT BLUE, navy border, center/center
  s=11: TOTAL LABEL - Arial Bold 11pt WHITE on DARK NAVY, navy border, center/center
  s=12: TOTAL VALUE - Arial Bold 11pt BLACK on GOLD (#C9A84C), navy border, center/center
  s=13: NOTES HEADER - Arial Bold 11pt BLACK on WHITE, navy border, right/center
  s=14: DECLARATION - Arial Bold 11pt NAVY (#0D2B6E) on LIGHT BLUE, navy border, center/center

FONTS (0-indexed):
  #0: Calibri, 11pt, theme color 1 (default)
  #1: Arial, Bold, White (#FFFFFF), 14pt
  #2: Arial, Bold, Black (#000000), 10pt
  #3: Arial, Bold, Navy (#0D2B6E), 12pt
  #4: Arial, regular, Black (#000000), 11pt
  #5: Arial, Bold, Black (#000000), 11pt
  #6: Arial, Bold, White (#FFFFFF), 10pt
  #7: Arial, regular, Black (#000000), 10pt
  #8: Arial, Bold, White (#FFFFFF), 11pt
  #9: Arial, Bold, Navy (#0D2B6E), 11pt

FILLS:
  #0: None
  #1: gray125 pattern
  #2: SOLID Dark Navy (#0D2B6E)
  #3: SOLID Light Blue (#EEF2FB)
  #4: SOLID White (#FFFFFF)
  #5: SOLID Gold (#C9A84C)

BORDERS:
  #0: None
  #1: Thin borders ALL sides, Navy color (#0D2B6E)
  #2: Thin borders ALL sides, White color (#FFFFFF)
`);

// ---- FILE 2: اذن_صرف (Issue Permission / Goods Issue) ----
console.log('\n' + '='.repeat(130));
console.log('TEMPLATE 2: اذن_صرف.xlsx (Goods Issue / Issue Permission)');
console.log('='.repeat(130));

console.log(`
WORKBOOK:
  - Sheet name: "اذن صرف"
  - Print area: $A$1:$J$27
  - Orientation: portrait
  - Paper size: 9 (A4)
  - Fit to: 1 page wide x 1 page tall
  - Grid lines: HIDDEN
  - Right-to-left: YES

COLUMN WIDTHS: (SAME as template 1)
  Col A (1):  4  px
  Col B (2): 14  px
  Col C (3): 22  px
  Col D (4): 11  px
  Col E (5): 11  px
  Col F (6): 13  px
  Col G (7): 13  px
  Col H (8): 13  px
  Col I (9): 18  px
  Col J (10): 4  px

ROW HEIGHTS:
  Row  1: 14  (spacer)
  Row  2: 38  (TITLE)
  Row  3: 18  (SER + Company)
  Row  4: 22  (Date)
  Row  5: 22  (Project)
  Row  6: 22  (Issue type + Warehouse)
  Row  7: 22  (Item/consumable name)
  Row  8: 22  (PO number + Driver name)
  Row  9: 20  (TABLE HEADER)
  Rows 10-24: 20  (15 data rows)
  Row 25: 20  (Total)
  Row 26: 22  (Recipient + Warehouse admin signatures)
  Row 27: 22  (Project manager signature)
  Row 28: 22  (empty spacer)
  Row 29: 28  (empty spacer)

KEY DIFFERENCES from Template 1:
  - Row 2 title: "مستند صـرف (داخلي – خارجي – تكهين – مقاولين)"
  - Row 7 label: "اسم المقاول:" instead of "اسم المورد:"
  - Row 8 label: "رقم السياسة:" (same)
  - TABLE HEADER different columns:
    G9: "الرصيد المتبقي" (Remaining balance) - instead of "سعر الوحدة"
    H9: "سعر الوحدة" (Unit price) - instead of "اجمالي السعر"
    I9: "مكان الصرف" (Issue location) - instead of "ملاحظات"
  - NO declaration statement row (row 29 in template 1)
  - NO receipt committee section (rows 26-28 in template 1)
  - Signature rows are simpler: Row 26 (recipient + warehouse admin), Row 27 (project manager)
  - 23 merged cells (vs 28 in template 1)
  - 13 cellXfs styles (vs 15 in template 1) - missing s=13 and s=14 equivalents
  - 9 fonts (vs 10 in template 1) - missing font #9
`);

console.log(`
CELL VALUES (decoded Arabic) - DIFFERENCES only:

=== ROW 2 (TITLE) ===
  B2 [merged B2:I2]: "مستند صـرف (داخلي – خارجي – تكهين – مقاولين)"

=== ROW 7 ===
  B7 [merged B7:C7]: "اسم المقاول:"
  D7 [merged D7:I7]: (empty)

=== ROW 9 (TABLE HEADER) ===
  B9: "م"                    (Row number)
  C9: "كود الصنف"            (Item code)
  D9: "اسم الصنف"            (Item name)
  E9: "الوحدة"               (Unit)
  F9: "الكمية"              (Quantity)
  G9: "الرصيد المتبقي"       (Remaining balance)  <-- DIFFERENT
  H9: "سعر الوحدة"          (Unit price)          <-- DIFFERENT
  I9: "مكان الصرف"          (Issue location)      <-- DIFFERENT

=== ROW 25 (TOTAL) ===
  Same structure: B25:G25 = "الاجمالي", H25:I25 = empty value

=== ROW 26 ===
  B26 [merged B26:C26]: "المستلم:"
  D26 [merged D26:E26]: (empty)
  F26 [merged F26:G26]: "امين المخزن:"
  H26 [merged H26:I26]: (empty)

=== ROW 27 ===
  B27 [merged B27:C27]: "مدير المشروع:"
  D27 [merged D27:I27]: (empty)

=== ROWS 28-29 ===
  Empty spacer rows (row 28 height=22, row 29 height=28)
`);

console.log(`
MERGED CELLS (23 total):
  B2:I2    -> Title
  B3:C3    -> SER
  D3:F3    -> Company name
  G3:I3    -> (empty)
  B4:I4    -> Date
  B5:D5    -> "المشروع:"
  E5:I5    -> project value
  B6:C6    -> "نوع الصرف:"
  D6:F6    -> issue type value
  H6:I6    -> warehouse value
  B7:C7    -> "اسم المقاول:"
  D7:I7    -> contractor name value
  B8:C8    -> "رقم السياسة:"
  D8:E8    -> PO number value
  F8       -> "اسم السائق:" (NOT merged)
  G8:I8    -> driver name value
  B25:G25  -> Total label
  H25:I25  -> Total value
  B26:C26  -> "المستلم:"
  D26:E26  -> recipient value
  F26:G26  -> "امين المخزن:"
  H26:I26  -> warehouse admin value
  B27:C27  -> "مدير المشروع:"
  D27:I27  -> project manager value

STYLE REFERENCES (cellXfs):
  s=0:  Default
  s=1:  TITLE - Arial Bold 14pt WHITE on DARK NAVY, navy border, center/center, wrapText
  s=2:  SER label - Arial Bold 10pt BLACK on LIGHT BLUE, navy border, right/center
  s=3:  COMPANY - Arial Bold 12pt NAVY on WHITE, navy border, center/center
  s=4:  EMPTY VALUE - Arial 11pt BLACK on WHITE, navy border, center/center
  s=5:  LABEL (right-aligned) - Arial Bold 11pt BLACK on LIGHT BLUE, navy border, right/center
  s=6:  TABLE HEADER - Arial Bold 10pt WHITE on DARK NAVY, WHITE borders, center/center
  s=7:  DATA ROW (odd) B col - Arial Bold 10pt BLACK on WHITE, navy border, center/center
  s=8:  DATA ROW (odd) C-I cols - Arial 10pt BLACK on WHITE, navy border, center/center
  s=9:  DATA ROW (even) / LABEL - Arial Bold 10pt BLACK on LIGHT BLUE, navy border, center/center
  s=10: DATA ROW (even) C-I cols - Arial 10pt BLACK on LIGHT BLUE, navy border, center/center
  s=11: TOTAL LABEL - Arial Bold 11pt WHITE on DARK NAVY, navy border, center/center
  s=12: TOTAL VALUE - Arial Bold 11pt BLACK on GOLD, navy border, center/center

IMAGE: Same as template 1 - at Column G, Row 3 (oneCellAnchor, col=6, row=2)

FONTS (same as template 1 but only 9):
  #0: Calibri, 11pt, theme color 1
  #1: Arial, Bold, White (#FFFFFF), 14pt
  #2: Arial, Bold, Black (#000000), 10pt
  #3: Arial, Bold, Navy (#0D2B6E), 12pt
  #4: Arial, regular, Black, 11pt
  #5: Arial, Bold, Black, 11pt
  #6: Arial, Bold, White (#FFFFFF), 10pt
  #7: Arial, regular, Black, 10pt
  #8: Arial, Bold, White (#FFFFFF), 11pt

FILLS: Same as template 1
  #0: None
  #1: gray125
  #2: Dark Navy (#0D2B6E)
  #3: Light Blue (#EEF2FB)
  #4: White (#FFFFFF)
  #5: Gold (#C9A84C)

BORDERS: Same as template 1
  #0: None
  #1: Thin navy (#0D2B6E) all sides
  #2: Thin white (#FFFFFF) all sides
`);

console.log('\n' + '='.repeat(130));
console.log('COLOR SUMMARY (hex RGB values):');
console.log('='.repeat(130));
console.log(`
  Dark Navy:     #0D2B6E  (rgb: 13, 43, 110)  - Header backgrounds, borders
  Light Blue:    #EEF2FB  (rgb: 238, 242, 251) - Label cell backgrounds
  White:         #FFFFFF  (rgb: 255, 255, 255) - Data cell backgrounds, text
  Black:         #000000  (rgb: 0, 0, 0)       - Most text
  Gold:          #C9A84C  (rgb: 201, 168, 76)  - Total value cell background
`);

console.log('\n' + '='.repeat(130));
console.log('COMMON PROPERTIES (both templates):');
console.log('='.repeat(130));
console.log(`
  - Sheet view: rightToLeft="1", showGridLines="0"
  - Page setup: portrait, A4 (paperSize=9), fitToPage (1x1)
  - Page margins: left=0.75, right=0.75, top=1, bottom=1, header=0.5, footer=0.5
  - Default row height: 15
  - Base column width: 8
  - Outline: summaryBelow=1, summaryRight=1
  - Active cell: A1, selection: A1
  - Print area defined for full sheet
  - Each sheet has 1 embedded image (company logo) at top-right
  - Image format: JPEG
  - Image position: oneCellAnchor, col=6 (G), row=2, size ~1.35" x 0.36"
`);

console.log('\nDone.');
