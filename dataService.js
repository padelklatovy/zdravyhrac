// ============================================================
// dataService.js — Zdravý hráč PRO
// Datová vrstva pro Google Sheets (Fáze 1)
// Výměna tohoto souboru = migrace na Supabase (Fáze 2)
// ============================================================

const DS = (() => {

  // --- KONFIGURACE ---
  // Vyplň po vytvoření Google Sheets + Apps Script Web App
  const SHEET_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  const DEMO_MODE = true; // true = lokální demo data, false = live Sheets

  // --- DEMO DATA ---
  const demoData = {
    player: { id: 'hrac_001', nickname: 'Hráč 001', klub: 'Klatovy', createdAt: '2026-01-15' },
    screenings: [
      { id: 's1', date: '2026-05-29', rameno: 4, loket: 2, zada: 0, koleno: 3, kycel: 0, note: 'Po zápase, rameno a koleno' },
      { id: 's2', date: '2026-05-27', rameno: 2, loket: 2, zada: 0, koleno: 1, kycel: 0, note: 'Po tréninku, ok' },
      { id: 's3', date: '2026-05-24', rameno: 7, loket: 4, zada: 2, koleno: 3, kycel: 0, note: 'Rameno 7 po turnaji!' },
      { id: 's4', date: '2026-05-21', rameno: 1, loket: 0, zada: 0, koleno: 0, kycel: 0, note: 'Volný den, výborně' },
      { id: 's5', date: '2026-05-18', rameno: 3, loket: 2, zada: 1, koleno: 2, kycel: 0, note: '' },
      { id: 's6', date: '2026-05-15', rameno: 5, loket: 3, zada: 0, koleno: 4, kycel: 1, note: 'Těžký trénink' },
    ],
    exercises: [
      { id: 'e1', name: 'Rotátorová manžeta', area: 'rameno', desc: 'Posilování vnitřní a vnější rotace s gumou', sets: '3 × 15', level: 'lehké', pillar: 1, imgData: typeof IMG_EX1 !== 'undefined' ? IMG_EX1 : null },
      { id: 'e2', name: 'Nordic hamstring', area: 'koleno', desc: 'Excentrické posilování zadní stehenní skupiny', sets: '3 × 8', level: 'střední', pillar: 1, imgData: typeof IMG_EX2 !== 'undefined' ? IMG_EX2 : null },
      { id: 'e3', name: 'Forearm flexor stretch', area: 'loket', desc: 'Protažení flexorů předloktí', sets: '3 × 30s', level: 'lehké', pillar: 4, imgData: typeof IMG_EX3 !== 'undefined' ? IMG_EX3 : null },
      { id: 'e4', name: 'Diafragmatický dech', area: 'dech', desc: 'Břišní dýchání pro regeneraci a klid', sets: '5 min', level: 'lehké', pillar: 2, imgData: typeof IMG_EX4 !== 'undefined' ? IMG_EX4 : null },
      { id: 'e5', name: 'Hip flexor stretch', area: 'kycel', desc: 'Uvolnění flexorů kyčle po hře', sets: '2 × 45s', level: 'lehké', pillar: 4, imgData: typeof IMG_EX5 !== 'undefined' ? IMG_EX5 : null },
    ],
    tips: [
      { pillar: 1, text: 'Před hrou 5 minut dynamického rozcvičení — hýždě, ramena, rotace trupu.' },
      { pillar: 2, text: 'Mezi sety dýchej nosem. 4 vteřiny nádech, 6 výdech — okamžitě snižuje kortizol.' },
      { pillar: 3, text: 'Sleduj při podání švih zápěstí — 80 % chyb pochází odsud, ne z ramene.' },
      { pillar: 4, text: 'Spánek pod 7 hodin = o 20 % horší reakční čas. Priorita číslo jedna.' },
      { pillar: 5, text: 'Každý rok hraješ bez zranění = o 2 roky déle na kurtu ve 60.' },
    ]
  };

  // --- VEŘEJNÉ API ---

  async function getPlayer() {
    if (DEMO_MODE) return demoData.player;
    return _fetch('getPlayer');
  }

  async function getLatestScreening() {
    if (DEMO_MODE) return demoData.screenings[0] || null;
    return _fetch('getLatestScreening');
  }

  async function getScreeningHistory(limit = 10) {
    if (DEMO_MODE) return demoData.screenings.slice(0, limit);
    return _fetch('getScreeningHistory', { limit });
  }

  async function saveScreening(data) {
    const record = {
      id: 's' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      rameno: Number(data.rameno) || 0,
      loket: Number(data.loket) || 0,
      zada: Number(data.zada) || 0,
      koleno: Number(data.koleno) || 0,
      kycel: Number(data.kycel) || 0,
      note: data.note || '',
    };
    if (DEMO_MODE) {
      demoData.screenings.unshift(record);
      return { success: true, record };
    }
    return _fetch('saveScreening', record, 'POST');
  }

  async function getRecommendedExercises(screening) {
    const areas = [];
    if ((screening?.rameno || 0) >= 2) areas.push('rameno');
    if ((screening?.loket || 0) >= 2) areas.push('loket');
    if ((screening?.koleno || 0) >= 2) areas.push('koleno');
    if ((screening?.kycel || 0) >= 2) areas.push('kycel');
    if (DEMO_MODE) {
      const filtered = areas.length
        ? demoData.exercises.filter(e => areas.includes(e.area) || e.area === 'dech')
        : demoData.exercises;
      return filtered.slice(0, 4);
    }
    return _fetch('getExercises', { areas });
  }

  function getDailyTip() {
    const idx = new Date().getDate() % demoData.tips.length;
    return demoData.tips[idx];
  }

  function getStats(screenings) {
    if (!screenings || screenings.length === 0) return null;
    const recent = screenings.slice(0, 7);
    const avgPain = recent.reduce((s, r) =>
      s + (r.rameno + r.loket + r.zada + r.koleno + r.kycel) / 5, 0) / recent.length;
    const worstArea = ['rameno','loket','zada','koleno','kycel'].reduce((best, area) => {
      const avg = recent.reduce((s, r) => s + (r[area] || 0), 0) / recent.length;
      return avg > (best.avg || 0) ? { area, avg } : best;
    }, {});
    const trend = screenings.length >= 2
      ? (screenings[0].rameno + screenings[0].koleno) - (screenings[1].rameno + screenings[1].koleno)
      : 0;
    return {
      avgPain: Math.round(avgPain * 10) / 10,
      worstArea: worstArea.area,
      trend,
      sessions: screenings.length,
    };
  }

  // --- INTERNÍ ---
  async function _fetch(action, params = {}, method = 'GET') {
    try {
      const url = method === 'GET'
        ? `${SHEET_ENDPOINT}?action=${action}&${new URLSearchParams(params)}`
        : SHEET_ENDPOINT;
      const opts = method === 'POST'
        ? { method: 'POST', body: JSON.stringify({ action, ...params }) }
        : {};
      const res = await fetch(url, opts);
      return await res.json();
    } catch (err) {
      console.error('dataService error:', err);
      return null;
    }
  }

  return { getPlayer, getLatestScreening, getScreeningHistory, saveScreening, getRecommendedExercises, getDailyTip, getStats };
})();
