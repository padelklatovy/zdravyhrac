// ============================================================
// dataService.js â€” ZdravÃ½ hrÃ¡Ä PRO
// DatovÃ¡ vrstva pro Google Sheets (FÃ¡ze 1)
// VÃ½mÄ›na tohoto souboru = migrace na Supabase (FÃ¡ze 2)
// ============================================================

const DS = (() => {

  // --- KONFIGURACE ---
  // VyplÅˆ po vytvoÅ™enÃ­ Google Sheets + Apps Script Web App
  const SHEET_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  const DEMO_MODE = true; // true = lokÃ¡lnÃ­ demo data, false = live Sheets

  // --- DEMO DATA ---
  const demoData = {
    player: { id: 'hrac_001', nickname: 'HrÃ¡Ä 001', klub: 'Klatovy', createdAt: '2026-01-15' },
    screenings: [
      { id: 's1', date: '2026-05-29', rameno: 4, loket: 2, zada: 0, koleno: 3, kycel: 0, note: 'Po zÃ¡pase, rameno a koleno' },
      { id: 's2', date: '2026-05-27', rameno: 2, loket: 2, zada: 0, koleno: 1, kycel: 0, note: 'Po trÃ©ninku, ok' },
      { id: 's3', date: '2026-05-24', rameno: 7, loket: 4, zada: 2, koleno: 3, kycel: 0, note: 'Rameno 7 po turnaji!' },
      { id: 's4', date: '2026-05-21', rameno: 1, loket: 0, zada: 0, koleno: 0, kycel: 0, note: 'VolnÃ½ den, vÃ½bornÄ›' },
      { id: 's5', date: '2026-05-18', rameno: 3, loket: 2, zada: 1, koleno: 2, kycel: 0, note: '' },
      { id: 's6', date: '2026-05-15', rameno: 5, loket: 3, zada: 0, koleno: 4, kycel: 1, note: 'TÄ›Å¾kÃ½ trÃ©nink' },
    ],
    exercises: [
      { id: 'e1', name: 'RotÃ¡torovÃ¡ manÅ¾eta', area: 'rameno', desc: 'PosilovÃ¡nÃ­ vnitÅ™nÃ­ a vnÄ›jÅ¡Ã­ rotace s gumou', sets: '3 Ã— 15', level: 'lehkÃ©', pillar: 1, img: 'rotatorova-mancheta.jpg' },
      { id: 'e2', name: 'Nordic hamstring', area: 'koleno', desc: 'ExcentrickÃ© posilovÃ¡nÃ­ zadnÃ­ stehennÃ­ skupiny', sets: '3 Ã— 8', level: 'stÅ™ednÃ­', pillar: 1, img: 'nordic-hamstring.jpg' },
      { id: 'e3', name: 'Forearm flexor stretch', area: 'loket', desc: 'ProtaÅ¾enÃ­ flexorÅ¯ pÅ™edloktÃ­', sets: '3 Ã— 30s', level: 'lehkÃ©', pillar: 4, img: 'forearm-flexor.jpg' },
      { id: 'e4', name: 'DiafragmatickÃ½ dech', area: 'dech', desc: 'BÅ™iÅ¡nÃ­ dÃ½chÃ¡nÃ­ pro regeneraci a klid', sets: '5 min', level: 'lehkÃ©', pillar: 2, img: 'diafragmaticky-dech.jpg' },
      { id: 'e5', name: 'Hip flexor stretch', area: 'kycel', desc: 'UvolnÄ›nÃ­ flexorÅ¯ kyÄle po hÅ™e', sets: '2 Ã— 45s', level: 'lehkÃ©', pillar: 4, img: 'hip-flexor.jpg' },
    ],
    tips: [
      { pillar: 1, text: 'PÅ™ed hrou 5 minut dynamickÃ©ho rozcviÄenÃ­ â€” hÃ½Å¾dÄ›, ramena, rotace trupu.' },
      { pillar: 2, text: 'Mezi sety dÃ½chej nosem. 4 vteÅ™iny nÃ¡dech, 6 vÃ½dech â€” okamÅ¾itÄ› sniÅ¾uje kortizol.' },
      { pillar: 3, text: 'Sleduj pÅ™i podÃ¡nÃ­ Å¡vih zÃ¡pÄ›stÃ­ â€” 80 % chyb pochÃ¡zÃ­ odsud, ne z ramene.' },
      { pillar: 4, text: 'SpÃ¡nek pod 7 hodin = o 20 % horÅ¡Ã­ reakÄnÃ­ Äas. Priorita ÄÃ­slo jedna.' },
      { pillar: 5, text: 'KaÅ¾dÃ½ rok hrajeÅ¡ bez zranÄ›nÃ­ = o 2 roky dÃ©le na kurtu ve 60.' },
    ]
  };

  // --- VEÅ˜EJNÃ‰ API ---

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

  // --- INTERNÃ ---
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
