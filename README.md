# Zdravý hráč PRO

**Přístup k pohybu, výkonu a dlouhodobému hraní padelu**

---

## Soubory

```
zdravy-hrac/
├── index.html        ← celá aplikace (UI + logika)
└── dataService.js    ← datová vrstva (Sheets → Supabase)
```

---

## Spuštění lokálně (testování)

```bash
# Otevři složku v terminálu
cd zdravy-hrac

# Spusť lokální server (Python 3)
python3 -m http.server 8080

# Otevři v prohlížeči
open http://localhost:8080
```

---

## Nasazení na GitHub Pages

1. Vytvoř repozitář na GitHub: `zdravy-hrac` (nebo `zdravyhrac`)
2. Nahraj oba soubory (`index.html` + `dataService.js`)
3. Jdi do Settings → Pages → Source: **main branch / root**
4. Adresa bude: `https://[tvuj-github].github.io/zdravy-hrac`

### Vlastní subdoména (zdravyhrac.padelon.cz)

1. U DNS providera přidej CNAME záznam:
   - Name: `zdravyhrac`
   - Value: `[tvuj-github].github.io`
2. V GitHub Pages nastav Custom domain: `zdravyhrac.padelon.cz`
3. Zaškrtni **Enforce HTTPS**

---

## Napojení na Google Sheets (Fáze 1)

### 1. Vytvoř Google Sheet se záložkami:

| Záložka | Sloupce |
|---|---|
| `players` | id, nickname, klub, created_at |
| `screenings` | id, player_id, date, rameno, loket, zada, koleno, kycel, note |
| `exercises` | id, name, area, desc, sets, level, pillar |

### 2. Vytvoř Apps Script Web App

V Google Sheets: **Nástroje → Apps Script** → vlož kód:

```javascript
function doGet(e) {
  return handleRequest(e);
}
function doPost(e) {
  return handleRequest(e);
}
function handleRequest(e) {
  const action = e.parameter?.action || JSON.parse(e.postData?.contents || '{}').action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};
  
  if (action === 'getLatestScreening') {
    const sheet = ss.getSheetByName('screenings');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const last = rows[rows.length - 1];
    result = headers.reduce((obj, h, i) => ({ ...obj, [h]: last[i] }), {});
  }
  
  if (action === 'saveScreening') {
    const sheet = ss.getSheetByName('screenings');
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([data.id, 'hrac_001', data.date, data.rameno,
      data.loket, data.zada, data.koleno, data.kycel, data.note]);
    result = { success: true };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Publikuj jako Web App

- Execute as: **Me**
- Who has access: **Anyone**
- Zkopíruj URL

### 4. Nastav v dataService.js

```javascript
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/TVOJE_ID/exec';
const DEMO_MODE = false; // vypni demo
```

---

## Migrace na Supabase (Fáze 2)

Až budeš mít 50+ aktivních hráčů:

1. Vytvoř projekt na [supabase.com](https://supabase.com) (zdarma)
2. Vytvoř stejné tabulky jako výše
3. V `dataService.js` vyměň funkci `_fetch()` za Supabase client
4. **Zbytek aplikace se nemění** — to je smysl datové vrstvy

```javascript
// Příklad výměny v dataService.js:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getLatestScreening() {
  const { data } = await supabase
    .from('screenings')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  return data
}
```

---

## Branding

- Font display: **Bebas Neue** (Google Fonts — zdarma)
- Font body: **DM Sans** (Google Fonts — zdarma)
- Barvy: `#c9a84c` (zlatá), `#7ab648` (zelená), `#0a0a0a` (černá)
- Logo: ZH mark + "Zdravý hráč PRO · Padelon"

---

*Zdravý hráč PRO · by PADELON · Klatovy 2026*
