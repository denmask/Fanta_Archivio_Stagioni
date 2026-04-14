let fantaData = {};

async function loadData() {
  try {
    const response = await fetch("data.json");
    fantaData = await response.json();
    initApp();
  } catch (e) {
    console.error("Errore nel caricamento dei dati:", e);
  }
}

function initApp() {
  const selector = document.getElementById("seasonSelector");
  selector.innerHTML = "";
  fantaData.stagioni.forEach((s) => {
    let opt = document.createElement("option");
    opt.value = s.anno;
    opt.innerText = s.anno;
    selector.appendChild(opt);
  });
  renderSeason(fantaData.stagioni[0].anno);
  renderPalmares();
  createMisterModal();
}

function renderSeason(anno) {
  const season = fantaData.stagioni.find((s) => s.anno === anno);
  document.getElementById("currentSeasonTitle").innerText =
    `Serie A ${season.anno}`;
  const sponsorImg = document.getElementById("sponsorLogo");
  sponsorImg.src =
    season.sponsor === "TIM"
      ? "images/seriea_tim.png"
      : "images/seriea_enilive.png";
  const tbody = document.getElementById("rankingBody");
  tbody.innerHTML = "";
  const useFasce = anno === "2025-26" || anno === "2024-25";
  let liveStats = null;
  if (anno === "2025-26") liveStats = buildStats2526();

  let classifica = season.classifica.filter(
    (team) => !team.isVice && !team.secondoAllenatore,
  );

  if (liveStats) {
    classifica = classifica.map((team) => {
      const live = liveStats[team.squadra];
      if (live) return { ...team, punti: live.pt, fp: team.fp };
      return team;
    });
    classifica.sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      const la = liveStats[a.squadra];
      const lb = liveStats[b.squadra];
      if (la && lb) return lb.gf - lb.gs - (la.gf - la.gs);
      return 0;
    });
    classifica = classifica.map((team, i) => ({ ...team, pos: i + 1 }));
  }

  classifica.forEach((team, i) => {
    let fasciaClass = "";
    if (useFasce) {
      if (team.pos <= 4) fasciaClass = "f1";
      else if (team.pos <= 6) fasciaClass = "f2";
      else if (team.pos <= 8) fasciaClass = "f3";
    }
    const secondi = season.classifica.filter(
      (t) => t.squadra === team.squadra && t.secondoAllenatore,
    );
    const misterLabel =
      secondi.length > 0
        ? `${team.mister} / ${secondi[0].mister}`
        : team.mister || "N/A";

    tbody.innerHTML += `
      <tr style="animation-delay: ${i * 0.05}s">
        <td>
          ${fasciaClass ? `<div class="fascia-indicator ${fasciaClass}"></div>` : ""}
          ${team.pos}
        </td>
        <td>
          <div class="team-cell">
            <img src="${team.logo}" class="team-logo" onerror="this.src='images/default.png'">
            <div class="team-info">
              <strong>${team.squadra}</strong><br>
              <small>Fantallenatore: ${misterLabel}</small>
            </div>
          </div>
        </td>
        <td class="pts-bold">${team.punti}</td>
        <td class="fp-text">${team.fp || "-"}</td>
      </tr>`;
  });
}

function renderPalmares() {
  const container = document.getElementById("palmaresGrid");
  container.innerHTML = '<h2 class="section-title">Albo d\'Oro</h2>';
  fantaData.palmares.forEach((p, i) => {
    const isTraditional = p.stagione === "2021-22";
    const modalitaClass = isTraditional
      ? "modalita-badge trad"
      : "modalita-badge squadre";
    const modalitaText = isTraditional
      ? "Fanta Tradizionale"
      : "Fanta a Squadre";
    container.innerHTML += `
      <div class="palmares-card" style="animation-delay: ${i * 0.1}s">
        <div class="palmares-info">
          <div class="palmares-season">STAGIONE ${p.stagione}</div>
          <div class="palmares-winner">🏆 ${p.vincitore}</div>
          <div class="palmares-mister">Fantallenatore: <b>${p.allenatore}</b></div>
          <div class="${modalitaClass}">Modalità: ${modalitaText}</div>
        </div>
        <img src="${p.logo}" class="palmares-badge" onerror="this.src='images/default.png'">
      </div>`;
  });
  renderCoppa(container);
  renderTornei(container);
  renderHallOfFame(container);
}

function buildMisterStats() {
  const stats = {};

  fantaData.stagioni.forEach((s) => {
    const annoInizio = parseInt(s.anno.split("-")[0]);
    s.classifica.forEach((t) => {
      const m = t.mister;
      if (!m) return;
      const cleanName = m.split("(")[0].trim();
      if (!stats[cleanName]) stats[cleanName] = { stagioni: [] };

      const alreadyExists = stats[cleanName].stagioni.find(
        (x) =>
          x.anno === s.anno &&
          x.squadra === t.squadra &&
          x.isVice === !!t.isVice,
      );
      if (alreadyExists) return;

      stats[cleanName].stagioni.push({
        anno: s.anno,
        annoInizio,
        squadra: t.squadra,
        logo: t.logo,
        pos: t.pos,
        parziale: t.parziale || false,
        isVice: t.isVice || false,
        secondoAllenatore: t.secondoAllenatore || false,
        uscita: t.uscita || false,
        nota: t.nota || null,
      });
    });
  });

  if (!stats["Valentina Pozzi"]) stats["Valentina Pozzi"] = { stagioni: [] };
  if (
    !stats["Valentina Pozzi"].stagioni.find(
      (x) => x.anno === "2025-26" && x.squadra === "Juventus",
    )
  ) {
    stats["Valentina Pozzi"].stagioni.push({
      anno: "2025-26",
      annoInizio: 2025,
      squadra: "Juventus",
      logo: "images/juventus.png",
      pos: 5,
      parziale: false,
      isVice: true,
      secondoAllenatore: false,
      uscita: false,
      nota: "Viceallenatrice della Juventus",
    });
  }

  if (!stats["Giacomo Bot"]) stats["Giacomo Bot"] = { stagioni: [] };
  if (
    !stats["Giacomo Bot"].stagioni.find(
      (x) => x.anno === "2023-24" && x.squadra === "Napoli",
    )
  ) {
    stats["Giacomo Bot"].stagioni.push({
      anno: "2023-24",
      annoInizio: 2023,
      squadra: "Napoli",
      logo: "images/napoli.png",
      pos: 8,
      parziale: false,
      isVice: true,
      secondoAllenatore: false,
      uscita: false,
      nota: "Viceallenatore di Mattia Minin",
    });
  }
  if (
    !stats["Giacomo Bot"].stagioni.find(
      (x) => x.anno === "2024-25" && x.squadra === "Bologna",
    )
  ) {
    stats["Giacomo Bot"].stagioni.push({
      anno: "2024-25",
      annoInizio: 2024,
      squadra: "Bologna",
      logo: "images/bologna.png",
      pos: 4,
      parziale: false,
      isVice: true,
      secondoAllenatore: false,
      uscita: false,
      nota: "Viceallenatore di Federico Burello",
    });
  }

  if (!stats["Kevin Sandri"]) stats["Kevin Sandri"] = { stagioni: [] };
  if (
    !stats["Kevin Sandri"].stagioni.find(
      (x) => x.anno === "2025-26" && x.squadra === "Bologna",
    )
  ) {
    stats["Kevin Sandri"].stagioni.push({
      anno: "2025-26",
      annoInizio: 2025,
      squadra: "Bologna",
      logo: "images/bologna.png",
      pos: 8,
      parziale: false,
      isVice: true,
      secondoAllenatore: false,
      astaSolo: true,
      uscita: false,
      nota: "Ha svolto l'asta estiva per Nicola Marano (Bologna), lasciando poi la squadra completamente in mano a Nico come 1° allenatore — non ha disputato attivamente il campionato",
    });
  }

  if (!stats["Aidan"]) stats["Aidan"] = { stagioni: [] };
  if (
    !stats["Aidan"].stagioni.find(
      (x) => x.anno === "2025-26" && x.squadra === "Lazio",
    )
  ) {
    stats["Aidan"].stagioni.push({
      anno: "2025-26",
      annoInizio: 2025,
      squadra: "Lazio",
      logo: "images/lazio.png",
      pos: 7,
      parziale: false,
      isVice: true,
      secondoAllenatore: false,
      uscita: false,
      nota: "Ha svolto l'asta estiva alla guida della Lazio, diventando viceallenatore di Cristian Tartaro per la stagione 2025/26",
    });
  }
  if (!stats["Aidan"].stagioni.find((x) => x.anno === "2026-27")) {
    stats["Aidan"].stagioni.push({
      anno: "2026-27",
      annoInizio: 2026,
      squadra: "TBD",
      logo: "images/default.png",
      pos: null,
      parziale: false,
      isVice: false,
      secondoAllenatore: false,
      futuro: true,
      nota: "Confermata presenza come fantallenatore di Serie A — squadra ancora da definire",
    });
  }

  return stats;
}

function renderCoppa(targetContainer) {
  const coppa = fantaData.coppa;
  if (!coppa || coppa.length === 0) return;
  let html =
    '<h2 class="section-title coppa-title">FantaCoppa Italia <span>Frecciarossa</span></h2>';
  html += '<div class="coppa-list">';
  coppa.forEach((c, i) => {
    if (c.risultato === "In corso") return;
    html += `
      <div class="coppa-card" style="animation-delay: ${i * 0.12}s">
        <div class="coppa-season-label">STAGIONE ${c.stagione}</div>
        <div class="coppa-final-row">
          <div class="coppa-team finalist">
            <img src="${c.logo_finalista}" class="coppa-logo" onerror="this.src='images/default.png'">
            <div class="coppa-team-name">${c.finalista}</div>
            <div class="coppa-mister">🥈 ${c.mister_finalista}</div>
          </div>
          <div class="coppa-score-area">
            <div class="coppa-vs-label">FINALE</div>
            <div class="coppa-score">${c.risultato}</div>
            ${c.marcatore ? `<div class="coppa-marcatore">⚽ ${c.marcatore}</div>` : ""}
          </div>
          <div class="coppa-team winner">
            <img src="${c.logo_vincitore}" class="coppa-logo" onerror="this.src='images/default.png'">
            <div class="coppa-team-name">${c.vincitore}</div>
            <div class="coppa-mister">🥇 ${c.mister_vincitore}</div>
          </div>
        </div>
      </div>`;
  });
  html += "</div>";
  targetContainer.innerHTML += html;
}

function renderTornei(targetContainer) {
  const tornei = fantaData.tornei;
  if (!tornei || tornei.length === 0) return;
  let html =
    '<h2 class="section-title tornei-title">Tornei Internazionali</h2>';
  html += '<div class="coppa-list">';
  tornei.forEach((t, i) => {
    if (t.risultato === "In corso") return;
    const isMondiale = t.tipo === "FantaMundial" || t.tipo === "FantaMundiale";
    const cardClass = isMondiale
      ? "coppa-card torneo-mondiale"
      : "coppa-card torneo-europeo";
    const icon = isMondiale ? "🌍" : "⭐";
    html += `
      <div class="${cardClass}" style="animation-delay: ${i * 0.12}s">
        <div class="coppa-season-label torneo-label">${icon} ${t.tipo} — ${t.edizione}</div>
        <div class="coppa-final-row">
          <div class="coppa-team winner">
            <img src="${t.logo_vincitore}" class="coppa-logo" onerror="this.src='images/default.png'">
            <div class="coppa-team-name">${t.vincitore}</div>
            <div class="coppa-mister">🥇 ${t.mister_vincitore}</div>
          </div>
          <div class="coppa-score-area">
            <div class="coppa-vs-label">FINALE</div>
            <div class="coppa-score">${t.risultato}</div>
          </div>
          <div class="coppa-team finalist">
            <img src="${t.logo_finalista}" class="coppa-logo" onerror="this.src='images/default.png'">
            <div class="coppa-team-name">${t.finalista}</div>
            <div class="coppa-mister">🥈 ${t.mister_finalista}</div>
          </div>
        </div>
      </div>`;
  });
  html += "</div>";
  targetContainer.innerHTML += html;
}

function renderHallOfFame(targetContainer) {
  const stats = buildMisterStats();
  let html = '<h2 class="section-title">Hall of Fame Allenatori</h2>';
  html += '<div class="hall-of-fame-grid">';

  const FIXED_ORDER = [
    "Denis Mascherin",
    "Mattia Beltrame",
    "Kevin Di Bernardo",
    "Federico Burello",
    "Cristian Tartaro",
    "Alex Beltrame",
    "Lorenzo Moro",
    "Nicola Marano",
    "Aidan",
    "Valentina Pozzi",
    "Kevin Sandri",
    "Andrea Campagnolo",
    "Giovanni Bean",
    "Giacomo Bot",
    "Mattia Minin",
    "Riccardo Rella",
    "Michele Picilli",
  ];
  const allNames = Object.keys(stats);
  const orderedNames = [
    ...FIXED_ORDER.filter((n) => allNames.includes(n)),
    ...allNames.filter((n) => !FIXED_ORDER.includes(n)),
  ];

  orderedNames.forEach((m) => {
    const data = stats[m];
    if (!data) return;
    const count = data.stagioni.filter((s) => !s.astaSolo && !s.futuro).length;
    const stagionLabel = count === 1 ? "1 Stagione" : `${count} Stagioni`;
    const stagioni = [...data.stagioni].sort(
      (a, b) => b.annoInizio - a.annoInizio,
    );

    const teamsHtml = stagioni
      .map(
        (s) => `
        <div class="mister-team-entry">
          <div class="mister-team-season">${s.anno}</div>
          <div class="mister-team-info">
            <img src="${s.logo}" class="mister-team-logo" onerror="this.src='images/default.png'" title="${s.squadra}">
            <span class="mister-team-name">${s.squadra}</span>
            <span class="mister-team-pos">${
              s.futuro
                ? '<span class="badge-futuro">🔜 Prossima</span>'
                : s.astaSolo
                  ? '<span class="badge-asta">🎯 Asta</span>'
                  : s.isVice
                    ? '<span class="badge-vice">VICE</span>'
                    : s.parziale
                      ? '<span class="badge-parziale">Parziale</span>'
                      : getPosLabel(s.pos)
            }</span>
          </div>
        </div>`,
      )
      .join("");

    const misterEncoded = encodeURIComponent(m);
    html += `
        <div class="mister-card" onclick="openMisterModal('${misterEncoded}')" title="Clicca per la scheda di ${m}">
          <div class="mister-card-header">
            <div class="mister-name">${m}</div>
            <div class="mister-stats-badge">${stagionLabel}</div>
          </div>
          <div class="mister-teams-list">${teamsHtml}</div>
          <div class="mister-card-footer">
            <span class="mister-card-cta">👤 Vedi Scheda</span>
          </div>
        </div>`;
  });
  html += "</div>";
  targetContainer.innerHTML += html;
}

function createMisterModal() {
  if (document.getElementById("misterModal")) return;
  const modal = document.createElement("div");
  modal.id = "misterModal";
  modal.className = "mister-modal-overlay";
  modal.innerHTML = `
    <div class="mister-modal-box">
      <button class="mister-modal-close" onclick="closeMisterModal()">✕</button>
      <div id="misterModalContent"></div>
    </div>`;
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeMisterModal();
  });
  document.body.appendChild(modal);
}

function openMisterModal(encodedName) {
  const name = decodeURIComponent(encodedName);
  const stats = buildMisterStats();
  const data = stats[name];
  if (!data) return;

  const stagioni = [...data.stagioni].sort(
    (a, b) => b.annoInizio - a.annoInizio,
  );

  const titoli = fantaData.palmares.filter((p) => {
    const cleanAlle = p.allenatore.split("(")[0].trim();
    return cleanAlle === name && p.vincitore !== "TBD";
  });

  const coppePartecipazioni = (fantaData.coppa || [])
    .map((c) => {
      const entry = (c.classifica || []).find(
        (r) => r.mister && r.mister.split("(")[0].trim() === name,
      );
      if (!entry) return null;
      return {
        stagione: c.stagione,
        squadra: entry.squadra,
        logo: entry.logo,
        fase: entry.fase,
        pos: entry.pos,
        inCorso: c.risultato === "In corso",
        coppaNote: entry.coppaNote || null,
      };
    })
    .filter(Boolean);

  const torneiPartecipazioni = (fantaData.tornei || [])
    .map((t) => {
      const entry = (t.classifica || []).find(
        (r) => r.mister && r.mister.split("(")[0].trim() === name,
      );
      const futuro = (t.partecipanti || []).find((p) => p.mister === name);
      if (!entry && !futuro) return null;
      if (futuro && !entry) {
        return {
          tipo: t.tipo,
          edizione: t.edizione,
          nazione: "TBD",
          logo: "images/default.png",
          fase: "In corso",
          punti: null,
          pos: null,
          futuro: true,
        };
      }
      return {
        tipo: t.tipo,
        edizione: t.edizione,
        nazione: entry.nazione,
        logo: entry.logo,
        fase: entry.fase,
        punti: entry.punti,
        pos: entry.pos,
      };
    })
    .filter(Boolean);

  const stagioniFull = stagioni.filter((s) => !s.isVice && !s.parziale);
  const ori = stagioniFull.filter((s) => s.pos === 1).length;
  const argenti = stagioniFull.filter((s) => s.pos === 2).length;
  const bronzi = stagioniFull.filter((s) => s.pos === 3).length;
  const podi = ori + argenti + bronzi;
  const partecipazioni = stagioni.filter(
    (s) => !s.astaSolo && !s.futuro,
  ).length;

  const trofeiHtml =
    titoli.length > 0
      ? titoli
          .map(
            (t) => `
        <div class="modal-trophy-entry">
          <img src="${t.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
          <div>
            <div class="modal-trophy-season">Stagione ${t.stagione}</div>
            <div class="modal-trophy-team">🏆 ${t.vincitore}</div>
          </div>
        </div>`,
          )
          .join("")
      : `<div class="modal-no-trophies">Nessun titolo ancora</div>`;

  const stagionDetailHtml = stagioni
    .map(
      (s) => `
    <div class="modal-season-row">
      <span class="modal-season-year">${s.anno}</span>
      <div class="modal-season-team">
        <img src="${s.logo}" onerror="this.src='images/default.png'" class="modal-season-logo">
        <div>
          <span>${s.squadra}</span>
          ${s.nota ? `<div class="modal-season-nota">${s.nota}</div>` : ""}
        </div>
      </div>
      <span class="modal-season-pos">${
        s.futuro
          ? '<span class="badge-futuro">🔜 Prossima</span>'
          : s.astaSolo
            ? '<span class="badge-asta">🎯 Asta</span>'
            : s.isVice
              ? '<span class="badge-vice">VICE</span>'
              : getPosLabel(s.pos)
      }</span>
    </div>`,
    )
    .join("");

  const initiali = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  document.getElementById("misterModalContent").innerHTML = `
    <div class="modal-header-area">
      <div class="modal-avatar">${initiali}</div>
      <div class="modal-name-area">
        <h2 class="modal-mister-name">${name}</h2>
        <span class="modal-role">Fantallenatore</span>
      </div>
    </div>
    <div class="modal-stats-row">
      <div class="modal-stat-box">
        <div class="modal-stat-value">${partecipazioni}</div>
        <div class="modal-stat-label">Partecipazioni</div>
      </div>
      <div class="modal-stat-box highlight-gold">
        <div class="modal-stat-value">${titoli.length}</div>
        <div class="modal-stat-label">Titoli Vinti</div>
      </div>
      <div class="modal-stat-box">
        <div class="modal-stat-value">${podi}</div>
        <div class="modal-stat-label">Podi Totali</div>
      </div>
    </div>
    <div class="modal-medals-row">
      <div class="modal-medal">🥇 <span>${ori}</span></div>
      <div class="modal-medal">🥈 <span>${argenti}</span></div>
      <div class="modal-medal">🥉 <span>${bronzi}</span></div>
    </div>
    <div class="modal-section-title">🏆 Titoli</div>
    <div class="modal-trophies-list">${trofeiHtml}</div>
    ${
      coppePartecipazioni.length > 0
        ? `
      <div class="modal-section-title coppa-modal-title">🏆 FantaCoppa Italia Frecciarossa</div>
      <div class="modal-trophies-list">${coppePartecipazioni
        .map((c) => {
          const faseColor =
            c.fase === "Campione"
              ? "fase-campione"
              : c.fase === "Finale"
                ? "fase-finale"
                : c.inCorso
                  ? "fase-incorso"
                  : "fase-eliminato";
          return `
          <div class="modal-trophy-entry coppa-entry partecipazione-entry">
            <img src="${c.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
            <div class="partecipazione-info">
              <div class="modal-trophy-season">Stagione ${c.stagione}</div>
              <div class="partecipazione-squadra">${c.squadra}</div>
              ${c.coppaNote ? `<div class="modal-season-nota">${c.coppaNote}</div>` : ""}
            </div>
            <span class="fase-badge ${faseColor}">${c.fase}</span>
          </div>`;
        })
        .join("")}</div>`
        : ""
    }
    ${
      torneiPartecipazioni.length > 0
        ? `
      <div class="modal-section-title tornei-modal-title">🌍 Tornei Internazionali</div>
      <div class="modal-trophies-list">${torneiPartecipazioni
        .map((t) => {
          const icon =
            t.tipo === "FantaMundial" || t.tipo === "FantaMundiale"
              ? "🌍"
              : "⭐";
          const tClass =
            t.tipo === "FantaMundial" || t.tipo === "FantaMundiale"
              ? "torneo-entry mondiale-entry"
              : "torneo-entry europeo-entry";
          const faseColor =
            t.fase === "Campione"
              ? "fase-campione"
              : t.fase === "Finale"
                ? "fase-finale"
                : t.fase === "In corso"
                  ? "fase-incorso"
                  : "fase-eliminato";
          const ptsLabel =
            t.punti !== null && t.punti !== undefined ? ` — ${t.punti} pt` : "";
          const nazioneLabel = t.futuro
            ? "Partecipazione confermata"
            : `${t.nazione}${ptsLabel}`;
          return `
          <div class="modal-trophy-entry ${tClass} partecipazione-entry">
            <img src="${t.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
            <div class="partecipazione-info">
              <div class="modal-trophy-season">${icon} ${t.tipo} — ${t.edizione}</div>
              <div class="partecipazione-squadra">${nazioneLabel}</div>
            </div>
            <span class="fase-badge ${faseColor}">${t.fase}</span>
          </div>`;
        })
        .join("")}</div>`
        : ""
    }
    <div class="modal-section-title">📋 Storico Stagioni</div>
    <div class="modal-seasons-list">${stagionDetailHtml}</div>`;

  document.getElementById("misterModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMisterModal() {
  document.getElementById("misterModal").classList.remove("active");
  document.body.style.overflow = "";
}

function getPosLabel(pos) {
  if (pos === 1) return "🥇 1°";
  if (pos === 2) return "🥈 2°";
  if (pos === 3) return "🥉 3°";
  return `${pos}°`;
}

function changeSeason(val) {
  renderSeason(val);
}

function resetAllSections() {
  document.getElementById("palmaresSection").classList.add("hidden");
  document.getElementById("attivitaSection").classList.add("hidden");
  document.getElementById("rankingSection").classList.add("hidden");
  document.getElementById("fasceSection").classList.add("hidden");
  const s = document.getElementById("stats2526Section");
  if (s) s.classList.add("hidden");
  document.querySelector(".btn-palmares").innerText = "🏆 PALMARÈS";
  document.querySelector(".btn-attivita").innerText = "👥 ATTIVITÀ";
  document.querySelector(".btn-fasce").innerText = "📊 FASCE";
  const sb = document.querySelector(".btn-stats2526");
  if (sb) sb.innerText = "📈 STATISTICHE 25/26";
}

function togglePalmares() {
  const hidden = document
    .getElementById("palmaresSection")
    .classList.contains("hidden");
  resetAllSections();
  if (hidden) {
    document.getElementById("palmaresSection").classList.remove("hidden");
    document.querySelector(".btn-palmares").innerText = "Torna alla Classifica";
  } else {
    document.getElementById("rankingSection").classList.remove("hidden");
  }
}

function toggleAttivita() {
  const hidden = document
    .getElementById("attivitaSection")
    .classList.contains("hidden");
  resetAllSections();
  if (hidden) {
    document.getElementById("attivitaSection").classList.remove("hidden");
    document.querySelector(".btn-attivita").innerText = "Torna alla Classifica";
    renderAttivita();
  } else {
    document.getElementById("rankingSection").classList.remove("hidden");
  }
}

function renderAttivita() {
  const container = document.getElementById("attivitaGrid");
  container.innerHTML =
    '<h2 class="section-title">Attività Fantallenatori</h2>';
  const CURRENT_SEASON = "2025-26";
  const stats = buildMisterStats();
  const FUTURE_MISTER = ["Aidan", "Aidan Conti"];
  const USCITA_MISTER = ["Mattia Beltrame"];

  const FIXED_ORDER = [
    "Denis Mascherin",
    "Kevin Di Bernardo",
    "Mattia Beltrame",
    "Federico Burello",
    "Cristian Tartaro",
    "Alex Beltrame",
    "Lorenzo Moro",
    "Nicola Marano",
    "Aidan",
    "Valentina Pozzi",
    "Kevin Sandri",
    "Andrea Campagnolo",
    "Giovanni Bean",
    "Giacomo Bot",
    "Mattia Minin",
    "Riccardo Rella",
    "Michele Picilli",
  ];

  const allNames = Object.keys(stats);
  const ordered = [
    ...FIXED_ORDER.filter((n) => allNames.includes(n)),
    ...allNames.filter((n) => !FIXED_ORDER.includes(n)),
  ];

  const ADMIN_SET = new Set(["Denis Mascherin", "Kevin Di Bernardo"]);

  let html = '<div class="attivita-list">';
  let staffDone = false,
    activeDone = false,
    retiredDone = false;

  ordered.forEach((name) => {
    if (!stats[name]) return;
    const stagioni = stats[name].stagioni;
    const years = stagioni.map((s) => parseInt(s.anno.split("-")[0]));
    const minYear = Math.min(...years);
    const stagioniFull = stagioni.filter((s) => !s.astaSolo);
    const stagionForMax = stagioniFull.length > 0 ? stagioniFull : stagioni;
    const maxAnno = [...stagionForMax].sort(
      (a, b) => b.annoInizio - a.annoInizio,
    )[0].anno;
    const isActive = maxAnno === CURRENT_SEASON || FUTURE_MISTER.includes(name);
    const isAdmin = ADMIN_SET.has(name);
    const isUscita = USCITA_MISTER.includes(name);

    if (isAdmin && !staffDone) {
      staffDone = true;
      html +=
        '<div class="attivita-group-label attivita-group-admin">⚙️ Staff</div>';
    }
    if (!isAdmin && isActive && !activeDone) {
      activeDone = true;
      html +=
        '<div class="attivita-group-label attivita-group-active">🟢 Attivi</div>';
    }
    if (!isAdmin && !isActive && !retiredDone) {
      retiredDone = true;
      html +=
        '<div class="attivita-group-label attivita-group-retired">🔴 Ritirati</div>';
    }

    const endYearStr = isActive
      ? "in corso"
      : (() => {
          const parts = maxAnno.split("-");
          const y2 = parts[1];
          return y2.length === 2 ? "20" + y2 : y2;
        })();
    const periodoLabel = `${minYear} – ${endYearStr}`;
    const initiali = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const misterEncoded = encodeURIComponent(name);
    const numStagioni = stagioni.filter(
      (s) => !s.isVice && !s.astaSolo && !s.futuro,
    ).length;
    const isOnlyVice =
      numStagioni === 0 && stagioni.some((s) => s.isVice || s.astaSolo);

    const roleBadge =
      name === "Denis Mascherin"
        ? '<span class="attivita-role-badge admin">👑 SuperAdmin</span>'
        : name === "Kevin Di Bernardo"
          ? '<span class="attivita-role-badge vice">🛡️ ViceAdmin</span>'
          : isOnlyVice
            ? '<span class="attivita-role-badge only-vice">🔁 Solo Vice</span>'
            : "";

    const cardClass = isAdmin
      ? " attivita-card-admin"
      : isOnlyVice
        ? " attivita-card-vice"
        : isUscita && isActive
          ? " attivita-card-uscita"
          : "";

    const avatarClass = isAdmin
      ? " attivita-avatar-admin"
      : isOnlyVice
        ? " attivita-avatar-vice"
        : isUscita && isActive
          ? " attivita-avatar-uscita"
          : "";

    const statusClassFinal = isActive
      ? isOnlyVice
        ? "attivita-status active-vice"
        : isUscita
          ? "attivita-status uscita"
          : "attivita-status active"
      : isOnlyVice
        ? "attivita-status retired-vice"
        : "attivita-status retired";

    const statusText = isActive
      ? isOnlyVice
        ? "🔁 Vice Attivo"
        : isUscita
          ? "🟡 Ultima Stagione"
          : "🟢 Attivo"
      : isOnlyVice
        ? "🔁 Vice Ritirato"
        : "🔴 Ritirato";

    const stagionLabel = isOnlyVice
      ? `${stagioni.filter((s) => !s.futuro).length} stagion${stagioni.filter((s) => !s.futuro).length === 1 ? "e" : "i"} (solo vice)`
      : `${numStagioni} stagion${numStagioni === 1 ? "e" : "i"}`;

    html += `
      <div class="attivita-card${cardClass}" onclick="openMisterModal('${misterEncoded}')" title="Clicca per la scheda di ${name}">
        <div class="attivita-avatar${avatarClass}">${initiali}</div>
        <div class="attivita-info">
          <div class="attivita-name">${name} ${roleBadge}</div>
          <div class="attivita-periodo">📅 ${periodoLabel}</div>
          <div class="attivita-stagioni">${stagionLabel}</div>
        </div>
        <div class="${statusClassFinal}">${statusText}</div>
      </div>`;
  });

  html += "</div>";
  html += buildRankingAccordion(stats);
  container.innerHTML += html;
}

function buildRankingAccordion(stats) {
  const entries = Object.keys(stats).map((name) => {
    const stagioni = stats[name].stagioni;
    const numStagioni = stagioni.filter(
      (s) => !s.isVice && !s.astaSolo && !s.futuro,
    ).length;
    const stagioniFull = stagioni
      .filter((s) => !s.isVice && !s.astaSolo && !s.futuro)
      .sort((a, b) => b.annoInizio - a.annoInizio);
    return { name, numStagioni, stagioniFull, allStagioni: stagioni };
  });

  entries.sort((a, b) =>
    b.numStagioni !== a.numStagioni
      ? b.numStagioni - a.numStagioni
      : a.name.localeCompare(b.name, "it"),
  );

  const groups = {};
  entries.forEach((e) => {
    const k = e.numStagioni;
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });

  let html = `
    <div class="ranking-accordion-wrap">
      <h2 class="section-title" style="margin-top:2rem">📊 Classifica per Stagioni</h2>
      <p class="stats2526-sub" style="margin-bottom:1rem">Clicca su un fantallenatore per vedere le stagioni disputate</p>
      <div class="ranking-accordion">`;

  const sortedKeys = Object.keys(groups)
    .map(Number)
    .sort((a, b) => b - a);

  sortedKeys.forEach((num) => {
    groups[num].forEach((e) => {
      const rank = entries.findIndex((x) => x.name === e.name) + 1;
      const initiali = e.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const misterEncoded = encodeURIComponent(e.name);
      const uid = `acc_${e.name.replace(/\s+/g, "_")}`;

      const stagRows = e.stagioniFull
        .map((s) => {
          const posLabel = getPosLabel(s.pos);
          return `
          <div class="acc-season-row">
            <span class="acc-season-year">${s.anno}</span>
            <img src="${s.logo}" class="acc-season-logo" onerror="this.src='images/default.png'">
            <span class="acc-season-team">${s.squadra}</span>
            <span class="acc-season-pos">${posLabel}</span>
          </div>`;
        })
        .join("");

      const viceRows = e.allStagioni
        .filter((s) => s.isVice || s.astaSolo)
        .map((s) => {
          const badge = s.astaSolo
            ? '<span class="badge-asta">🎯 Asta</span>'
            : '<span class="badge-vice">VICE</span>';
          return `
          <div class="acc-season-row acc-vice-row">
            <span class="acc-season-year">${s.anno}</span>
            <img src="${s.logo}" class="acc-season-logo" onerror="this.src='images/default.png'">
            <span class="acc-season-team">${s.squadra}</span>
            <span class="acc-season-pos">${badge}</span>
          </div>`;
        })
        .join("");

      const totalLabel =
        e.numStagioni === 1 ? "1 stagione" : `${e.numStagioni} stagioni`;

      html += `
        <div class="acc-item">
          <div class="acc-header" onclick="toggleAccordion('${uid}')">
            <div class="acc-rank-num">${rank}</div>
            <div class="acc-avatar">${initiali}</div>
            <div class="acc-name-area">
              <div class="acc-name">${e.name}</div>
              <div class="acc-sub">${totalLabel}</div>
            </div>
            <div class="acc-stagioni-count">${e.numStagioni}</div>
            <div class="acc-chevron" id="chev_${uid}">▼</div>
          </div>
          <div class="acc-body" id="${uid}" style="display:none">
            ${stagRows}
            ${viceRows}
            <div class="acc-scheda-btn" onclick="event.stopPropagation(); openMisterModal('${misterEncoded}')">
              👤 Vedi Scheda Completa
            </div>
          </div>
        </div>`;
    });
  });

  html += `</div></div>`;
  return html;
}

function toggleAccordion(uid) {
  const body = document.getElementById(uid);
  const chev = document.getElementById("chev_" + uid);
  if (!body) return;
  const isOpen = body.style.display !== "none";
  body.style.display = isOpen ? "none" : "block";
  if (chev) chev.textContent = isOpen ? "▼" : "▲";
}

function toggleFasce() {
  const hidden = document
    .getElementById("fasceSection")
    .classList.contains("hidden");
  resetAllSections();
  if (hidden) {
    document.getElementById("fasceSection").classList.remove("hidden");
    document.querySelector(".btn-fasce").innerText = "Torna alla Classifica";
    renderFasce();
  } else {
    document.getElementById("rankingSection").classList.remove("hidden");
  }
}

function getFasciaFromPos(pos, total) {
  if (pos === 1) return "campione";
  if (pos === total) return "ultimo";
  if (pos <= 4) return "f1";
  if (pos <= 6) return "f2";
  return "f3";
}

function getFasciaLabel(fascia) {
  const map = {
    campione: "Campione 🏆",
    f1: "Fascia 1",
    f2: "Fascia 2",
    f3: "Fascia 3",
    ultimo: "Ultimo 🔴",
  };
  return map[fascia] || fascia;
}

function getFasciaPillClass(fascia) {
  const map = {
    campione: "pill-campione",
    f1: "pill-f1",
    f2: "pill-f2",
    f3: "pill-f3",
    ultimo: "pill-ultimo",
  };
  return map[fascia] || "pill-f3";
}

function getStripClass(fascia) {
  const map = {
    campione: "strip-campione",
    f1: "strip-f1",
    f2: "strip-f2",
    f3: "strip-f3",
    ultimo: "strip-ultimo",
  };
  return map[fascia] || "strip-f3";
}

const FASCE_EXTRA = {
  "2024-25": {
    startNote:
      "Prima stagione con il sistema a fasce. Le fasce di partenza erano ufficiosamente basate sulla stagione 2023-24.",
    mosse: {},
  },
  "2025-26": {
    startNote:
      "Stagione in corso. Fasce di partenza assegnate ufficialmente prima del campionato.",
    fasciaPartenza: {
      "Federico Burello": "f1",
      "Mattia Beltrame": "f1",
      "Kevin Di Bernardo": "f1",
      "Denis Mascherin": "f1",
      "Alex Beltrame": "f2",
      "Cristian Tartaro": "f2",
      "Lorenzo Moro": "f3",
      "Nicola Marano": "f3",
    },
    notePartenza: {
      "Alex Beltrame":
        "Subentrato a Kevin Sandri (ritirato). Avrebbe dovuto partire da F3 per il 7° posto 24/25, promosso per subentrare al posto di Sandri.",
      "Lorenzo Moro": "Prima stagione — partito da Fascia 3.",
    },
    fasciaDestinazione: {
      "Federico Burello": "f1",
      "Mattia Beltrame": "f1",
      "Kevin Di Bernardo": "f1",
      "Denis Mascherin": "f2",
      "Alex Beltrame": "f2",
      "Cristian Tartaro": "f3",
      "Lorenzo Moro": "f1",
      "Nicola Marano": "f3",
    },
    noteDestinazione: {
      "Cristian Tartaro": "Al momento 7° con la Lazio → andrebbe in Fascia 3.",
      "Lorenzo Moro": "Al momento 4° con il Milan → promosso in Fascia 1!",
      "Alex Beltrame": "Al momento 6° → rimarrebbe in Fascia 2.",
    },
    inCorso: true,
  },
};

function renderFasce() {
  const container = document.getElementById("fasceGrid");
  container.innerHTML = "";
  let html = `
    <div class="fasce-page">
      <div class="fasce-page-title">📊 SUDDIVISIONE FASCE</div>
      <div class="fasce-page-subtitle">Sistema introdotto dalla stagione 2024-25 · Ispirato alle coppe europee</div>
      <div class="fasce-legenda">
        <div class="fasce-legenda-row row-top">
          <div class="legenda-card f-campione"><div class="legenda-icon">🏆</div><div class="legenda-info"><div class="legenda-nome">Campione</div><div class="legenda-desc">Scudetto Fantacalcio</div><div class="legenda-posti">1° posto</div></div></div>
          <div class="legenda-card f1"><div class="legenda-icon">🔵</div><div class="legenda-info"><div class="legenda-nome">Fascia 1</div><div class="legenda-desc">Champions League</div><div class="legenda-posti">Posti 2-3-4</div></div></div>
          <div class="legenda-card f2"><div class="legenda-icon">🟠</div><div class="legenda-info"><div class="legenda-nome">Fascia 2</div><div class="legenda-desc">Europa League</div><div class="legenda-posti">Posti 5-6</div></div></div>
        </div>
        <div class="fasce-legenda-row row-bottom">
          <div class="legenda-card f3"><div class="legenda-icon">🟢</div><div class="legenda-info"><div class="legenda-nome">Fascia 3</div><div class="legenda-desc">Conference / Salvezza</div><div class="legenda-posti">Posti 7-8</div></div></div>
          <div class="legenda-card f-ultimo"><div class="legenda-icon">🔴</div><div class="legenda-info"><div class="legenda-nome">Ultimo</div><div class="legenda-desc">Retrocessione</div><div class="legenda-posti">Ultimo posto</div></div></div>
        </div>
      </div>`;

  const stagioniFasce = fantaData.stagioni.filter(
    (s) => s.anno === "2024-25" || s.anno === "2025-26",
  );

  stagioniFasce.forEach((stagione) => {
    const extra = FASCE_EXTRA[stagione.anno] || {};
    const inCorso = extra.inCorso || false;
    const classifica = stagione.classifica.filter(
      (t) => !t.isVice && !t.secondoAllenatore,
    );
    const total = classifica.length;

    html += `
      <div class="fasce-season-block" style="animation: fadeInUp 0.4s ease both">
        <div class="fasce-season-header">
          <div class="fasce-season-year">Stagione ${stagione.anno}</div>
          <div class="fasce-season-badge ${inCorso ? "in-corso" : ""}">${inCorso ? "In Corso" : "Conclusa"}</div>
        </div>
        <div class="fasce-table-wrap">
        <table class="fasce-table">
          <thead>
            <tr>
              <th>Pos</th><th>Fantallenatore</th><th>Fascia Finale</th>
              ${extra.fasciaPartenza ? "<th>Partenza</th><th>Proiezione Prossima</th>" : ""}
              <th>Obiettivo</th>
            </tr>
          </thead>
          <tbody>`;

    classifica.forEach((team, i) => {
      const fascia = getFasciaFromPos(team.pos, total);
      const stripClass = getStripClass(fascia);
      const pillClass = getFasciaPillClass(fascia);
      const isCampione = team.pos === 1;
      let partenzaHtml = "",
        destinazioneHtml = "";

      if (extra.fasciaPartenza) {
        const fp = extra.fasciaPartenza[team.mister];
        const fd = extra.fasciaDestinazione[team.mister];
        const notaDest = extra.noteDestinazione
          ? extra.noteDestinazione[team.mister] || ""
          : "";
        const notaPart = extra.notePartenza
          ? extra.notePartenza[team.mister] || ""
          : "";
        partenzaHtml = fp
          ? `<td><span class="fascia-badge-pill ${getFasciaPillClass(fp)}">${getFasciaLabel(fp)}</span>${notaPart ? `<div class="fasce-note">${notaPart}</div>` : ""}</td>`
          : "<td>—</td>";
        let moveHtml = "";
        if (fp && fd) {
          const ord = { campione: 0, f1: 1, f2: 2, f3: 3, ultimo: 4 };
          const diff = ord[fd] - ord[fp];
          if (diff < 0)
            moveHtml = `<span class="fascia-move move-up"><span class="dot-move dot-up"></span> Promozione</span>`;
          else if (diff > 0)
            moveHtml = `<span class="fascia-move move-down"><span class="dot-move dot-down"></span> Retrocessione</span>`;
          else
            moveHtml = `<span class="fascia-move move-same"><span class="dot-move dot-same"></span> Invariata</span>`;
        } else if (!fp && fd) {
          moveHtml = `<span class="fascia-move move-new"><span class="dot-move dot-new"></span> Nuovo</span>`;
        }
        destinazioneHtml = fd
          ? `<td><span class="fascia-badge-pill ${getFasciaPillClass(fd)}">${getFasciaLabel(fd)}</span>${moveHtml}${notaDest ? `<div class="fasce-note">${notaDest}</div>` : ""}</td>`
          : "<td>—</td>";
      }

      let obiettivoHtml = "";
      if (extra.fasciaPartenza) {
        const fp = extra.fasciaPartenza[team.mister];
        const fd = extra.fasciaDestinazione[team.mister];
        if (fp && fd) {
          const ord = { campione: 0, f1: 1, f2: 2, f3: 3, ultimo: 4 };
          const diff = ord[fd] - ord[fp];
          if (diff <= -2)
            obiettivoHtml = `<span class="obiettivo-superato"><span class="dot-obj dot-green"></span> Superato (+2 fasce)</span>`;
          else if (inCorso)
            obiettivoHtml =
              diff <= 0
                ? `<span class="obiettivo-in-corso"><span class="dot-obj dot-gold"></span> In linea</span>`
                : `<span class="obiettivo-ko"><span class="dot-obj dot-red"></span> A rischio</span>`;
          else
            obiettivoHtml =
              diff <= 0
                ? `<span class="obiettivo-ok"><span class="dot-obj dot-green"></span> Raggiunto</span>`
                : `<span class="obiettivo-ko"><span class="dot-obj dot-red"></span> Non raggiunto</span>`;
        } else {
          obiettivoHtml = "—";
        }
      } else {
        obiettivoHtml = `<span class="fascia-badge-pill ${getFasciaPillClass(fascia)}">${getFasciaLabel(fascia)}</span>`;
      }

      const puntiDisplay =
        team.punti !== null && team.punti !== undefined ? team.punti : "null";
      html += `
        <tr style="animation-delay: ${i * 0.05}s">
          <td><span class="fasce-strip ${stripClass}"></span><span class="fasce-pos ${isCampione ? "campione" : ""}">${team.pos}</span></td>
          <td><div class="fasce-mister">${team.mister}</div><div class="fasce-squadra">${team.squadra} · ${puntiDisplay} pt</div></td>
          <td><span class="fascia-badge-pill ${pillClass}">${getFasciaLabel(fascia)}</span></td>
          ${partenzaHtml}${destinazioneHtml}
          <td>${obiettivoHtml}</td>
        </tr>`;
    });

    html += `</tbody></table></div></div>`;
    if (extra.startNote) {
      html = html.replace(
        '</div>\n        <div class="fasce-table-wrap">',
        `</div>\n            <div style="padding: 0.6rem 1.5rem; font-size: 0.78rem; color: var(--muted); font-style: italic; border-bottom: 1px solid var(--border);">ℹ️ ${extra.startNote}</div>\n            <div class="fasce-table-wrap">`,
      );
    }
  });

  html += "</div>";
  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// STATISTICHE 2025-26
// ══════════════════════════════════════════════════════════════

const RISULTATI_2526 = [
  { g: 1, casa: "Milan", gC: 1, gT: 2, tras: "Juventus" },
  { g: 1, casa: "Napoli", gC: 2, gT: 0, tras: "Bologna" },
  { g: 1, casa: "Roma", gC: 2, gT: 0, tras: "Lazio" },
  { g: 1, casa: "Inter", gC: 4, gT: 3, tras: "Atalanta" },
  { g: 2, casa: "Milan", gC: 2, gT: 1, tras: "Bologna" },
  { g: 2, casa: "Atalanta", gC: 0, gT: 2, tras: "Napoli" },
  { g: 2, casa: "Inter", gC: 2, gT: 1, tras: "Roma" },
  { g: 2, casa: "Lazio", gC: 4, gT: 1, tras: "Juventus" },
  { g: 3, casa: "Napoli", gC: 4, gT: 3, tras: "Inter" },
  { g: 3, casa: "Roma", gC: 2, gT: 3, tras: "Juventus" },
  { g: 3, casa: "Milan", gC: 2, gT: 0, tras: "Lazio" },
  { g: 3, casa: "Bologna", gC: 0, gT: 3, tras: "Atalanta" },
  { g: 4, casa: "Roma", gC: 1, gT: 3, tras: "Milan" },
  { g: 4, casa: "Atalanta", gC: 3, gT: 0, tras: "Lazio" },
  { g: 4, casa: "Inter", gC: 3, gT: 4, tras: "Bologna" },
  { g: 4, casa: "Napoli", gC: 1, gT: 1, tras: "Juventus" },
  { g: 5, casa: "Juventus", gC: 2, gT: 2, tras: "Atalanta" },
  { g: 5, casa: "Bologna", gC: 1, gT: 4, tras: "Roma" },
  { g: 5, casa: "Milan", gC: 3, gT: 1, tras: "Napoli" },
  { g: 5, casa: "Lazio", gC: 3, gT: 1, tras: "Inter" },
  { g: 6, casa: "Roma", gC: 2, gT: 2, tras: "Atalanta" },
  { g: 6, casa: "Napoli", gC: 3, gT: 3, tras: "Lazio" },
  { g: 6, casa: "Juventus", gC: 0, gT: 5, tras: "Bologna" },
  { g: 6, casa: "Inter", gC: 5, gT: 0, tras: "Milan" },
  { g: 7, casa: "Napoli", gC: 1, gT: 2, tras: "Roma" },
  { g: 7, casa: "Inter", gC: 1, gT: 0, tras: "Juventus" },
  { g: 7, casa: "Lazio", gC: 0, gT: 2, tras: "Bologna" },
  { g: 7, casa: "Atalanta", gC: 0, gT: 2, tras: "Milan" },
  { g: 8, casa: "Atalanta", gC: 1, gT: 2, tras: "Inter" },
  { g: 8, casa: "Lazio", gC: 1, gT: 1, tras: "Roma" },
  { g: 8, casa: "Bologna", gC: 3, gT: 4, tras: "Napoli" },
  { g: 8, casa: "Juventus", gC: 0, gT: 2, tras: "Milan" },
  { g: 9, casa: "Napoli", gC: 2, gT: 3, tras: "Atalanta" },
  { g: 9, casa: "Bologna", gC: 0, gT: 1, tras: "Milan" },
  { g: 9, casa: "Roma", gC: 1, gT: 4, tras: "Inter" },
  { g: 9, casa: "Juventus", gC: 4, gT: 0, tras: "Lazio" },
  { g: 10, casa: "Inter", gC: 1, gT: 2, tras: "Napoli" },
  { g: 10, casa: "Atalanta", gC: 0, gT: 3, tras: "Bologna" },
  { g: 10, casa: "Juventus", gC: 2, gT: 1, tras: "Roma" },
  { g: 10, casa: "Lazio", gC: 4, gT: 3, tras: "Milan" },
  { g: 11, casa: "Juventus", gC: 0, gT: 2, tras: "Napoli" },
  { g: 11, casa: "Milan", gC: 2, gT: 0, tras: "Roma" },
  { g: 11, casa: "Bologna", gC: 1, gT: 3, tras: "Inter" },
  { g: 11, casa: "Lazio", gC: 0, gT: 1, tras: "Atalanta" },
  { g: 12, casa: "Atalanta", gC: 3, gT: 3, tras: "Juventus" },
  { g: 12, casa: "Roma", gC: 5, gT: 2, tras: "Bologna" },
  { g: 12, casa: "Inter", gC: 0, gT: 4, tras: "Lazio" },
  { g: 12, casa: "Napoli", gC: 3, gT: 1, tras: "Milan" },
  { g: 13, casa: "Milan", gC: 2, gT: 2, tras: "Inter" },
  { g: 13, casa: "Bologna", gC: 1, gT: 3, tras: "Juventus" },
  { g: 13, casa: "Lazio", gC: 2, gT: 2, tras: "Napoli" },
  { g: 13, casa: "Atalanta", gC: 1, gT: 0, tras: "Roma" },
  { g: 14, casa: "Juventus", gC: 2, gT: 3, tras: "Inter" },
  { g: 14, casa: "Milan", gC: 2, gT: 3, tras: "Atalanta" },
  { g: 14, casa: "Roma", gC: 1, gT: 3, tras: "Napoli" },
  { g: 14, casa: "Bologna", gC: 1, gT: 3, tras: "Lazio" },
  { g: 15, casa: "Inter", gC: 1, gT: 3, tras: "Atalanta" },
  { g: 15, casa: "Milan", gC: 2, gT: 0, tras: "Juventus" },
  { g: 15, casa: "Roma", gC: 2, gT: 1, tras: "Lazio" },
  { g: 15, casa: "Napoli", gC: 0, gT: 1, tras: "Bologna" },
  { g: 16, casa: "Inter", gC: 2, gT: 1, tras: "Roma" },
  { g: 16, casa: "Milan", gC: 3, gT: 3, tras: "Bologna" },
  { g: 16, casa: "Lazio", gC: 0, gT: 2, tras: "Juventus" },
  { g: 16, casa: "Atalanta", gC: 3, gT: 2, tras: "Napoli" },
  { g: 17, casa: "Napoli", gC: 2, gT: 1, tras: "Inter" },
  { g: 17, casa: "Milan", gC: 3, gT: 1, tras: "Lazio" },
  { g: 17, casa: "Roma", gC: 4, gT: 3, tras: "Juventus" },
  { g: 17, casa: "Bologna", gC: 0, gT: 1, tras: "Atalanta" },
  { g: 18, casa: "Inter", gC: 3, gT: 1, tras: "Bologna" },
  { g: 18, casa: "Roma", gC: 1, gT: 2, tras: "Milan" },
  { g: 18, casa: "Napoli", gC: 4, gT: 2, tras: "Juventus" },
  { g: 18, casa: "Atalanta", gC: 1, gT: 0, tras: "Lazio" },
  { g: 19, casa: "Lazio", gC: 1, gT: 2, tras: "Inter" },
  { g: 19, casa: "Milan", gC: 2, gT: 3, tras: "Napoli" },
  { g: 19, casa: "Juventus", gC: 3, gT: 3, tras: "Atalanta" },
  { g: 19, casa: "Bologna", gC: 2, gT: 1, tras: "Roma" },
  { g: 20, casa: "Inter", gC: 3, gT: 1, tras: "Milan" },
  { g: 20, casa: "Roma", gC: 2, gT: 3, tras: "Atalanta" },
  { g: 20, casa: "Juventus", gC: 5, gT: 2, tras: "Bologna" },
  { g: 20, casa: "Napoli", gC: 2, gT: 1, tras: "Lazio" },
  { g: 21, casa: "Inter", gC: 1, gT: 0, tras: "Juventus" },
  { g: 21, casa: "Atalanta", gC: 0, gT: 1, tras: "Milan" },
  { g: 21, casa: "Napoli", gC: 2, gT: 4, tras: "Roma" },
  { g: 21, casa: "Lazio", gC: 1, gT: 0, tras: "Bologna" },
  { g: 22, casa: "Atalanta", gC: 3, gT: 5, tras: "Inter" },
  { g: 22, casa: "Juventus", gC: 5, gT: 1, tras: "Milan" },
  { g: 22, casa: "Lazio", gC: 1, gT: 2, tras: "Roma" },
  { g: 22, casa: "Bologna", gC: 2, gT: 1, tras: "Napoli" },
  { g: 23, casa: "Roma", gC: 0, gT: 2, tras: "Inter" },
  { g: 23, casa: "Bologna", gC: 2, gT: 3, tras: "Milan" },
  { g: 23, casa: "Juventus", gC: 4, gT: 5, tras: "Lazio" },
  { g: 23, casa: "Napoli", gC: 2, gT: 0, tras: "Atalanta" },
  { g: 24, casa: "Inter", gC: 4, gT: 4, tras: "Napoli" },
  { g: 24, casa: "Lazio", gC: 3, gT: 2, tras: "Milan" },
  { g: 24, casa: "Juventus", gC: 4, gT: 3, tras: "Roma" },
  { g: 24, casa: "Atalanta", gC: 3, gT: 0, tras: "Bologna" },
  { g: 25, casa: "Bologna", gC: 1, gT: 2, tras: "Inter" },
  { g: 25, casa: "Milan", gC: 2, gT: 3, tras: "Roma" },
  { g: 25, casa: "Juventus", gC: 4, gT: 2, tras: "Napoli" },
  { g: 25, casa: "Lazio", gC: 0, gT: 3, tras: "Atalanta" },
  { g: 26, casa: "Inter", gC: 3, gT: 0, tras: "Lazio" },
  { g: 26, casa: "Napoli", gC: 3, gT: 0, tras: "Milan" },
  { g: 26, casa: "Atalanta", gC: 1, gT: 0, tras: "Juventus" },
  { g: 26, casa: "Roma", gC: 2, gT: 0, tras: "Bologna" },
  { g: 27, casa: "Milan", gC: 2, gT: 2, tras: "Inter" },
  { g: 27, casa: "Atalanta", gC: 1, gT: 3, tras: "Roma" },
  { g: 27, casa: "Lazio", gC: 2, gT: 1, tras: "Napoli" },
  { g: 27, casa: "Bologna", gC: 0, gT: 2, tras: "Juventus" },
  { g: 28, casa: "Roma", gC: 2, gT: 2, tras: "Napoli" },
  { g: 28, casa: "Milan", gC: 3, gT: 3, tras: "Atalanta" },
  { g: 28, casa: "Juventus", gC: 4, gT: 0, tras: "Inter" },
  { g: 28, casa: "Bologna", gC: 0, gT: 5, tras: "Lazio" },
  { g: 29, casa: "Inter", gC: 1, gT: 2, tras: "Atalanta" },
  { g: 29, casa: "Milan", gC: 0, gT: 3, tras: "Juventus" },
  { g: 29, casa: "Roma", gC: 3, gT: 2, tras: "Lazio" },
  { g: 29, casa: "Napoli", gC: 2, gT: 1, tras: "Bologna" },
  { g: 30, casa: "Atalanta", gC: 2, gT: 1, tras: "Napoli" },
  { g: 30, casa: "Milan", gC: 4, gT: 2, tras: "Bologna" },
  { g: 30, casa: "Lazio", gC: 3, gT: 3, tras: "Juventus" },
  { g: 30, casa: "Inter", gC: 2, gT: 2, tras: "Roma" },
  { g: 31, casa: "Bologna", gC: 1, gT: 2, tras: "Atalanta"},
  { g: 31, casa: "Roma", gC: 2, gT: 2, tras: "Juventus"},
  { g: 31, casa: "Napoli", gC: 0, gT: 6, tras:"Inter"},
  { g: 31, casa: "Milan", gC: 0, gT: 2, tras: "Lazio"},
  { g: 32, casa: "Roma", gC: 5, gT: 1, tras: "Milan"},
  { g: 32, casa: "Napoli", gC: 1, gT: 2, tras: "Juventus"},
  { g: 32, casa: "Inter", gC: 5, gT: 3, tras: "Bologna"},
  { g: 32, casa: "Atalanta", gC: 0, gT: 3, tras: "Lazio"},
];

const TEAM_MISTER = {
  Inter: "Federico Burello",
  Napoli: "Mattia Beltrame",
  Atalanta: "Kevin Di Bernardo",
  Juventus: "Denis Mascherin",
  Milan: "Lorenzo Moro",
  Roma: "Alex Beltrame",
  Lazio: "Cristian Tartaro",
  Bologna: "Nicola Marano",
};

const TEAM_LOGO = {
  Inter: "images/inter.png",
  Napoli: "images/napoli.png",
  Atalanta: "images/atalanta.png",
  Juventus: "images/juventus.png",
  Milan: "images/milan.png",
  Roma: "images/roma.png",
  Lazio: "images/lazio.png",
  Bologna: "images/bologna.png",
};

function buildStats2526() {
  const teams = Object.keys(TEAM_MISTER);
  const stats = {};
  teams.forEach((t) => {
    stats[t] = {
      squadra: t,
      mister: TEAM_MISTER[t],
      logo: TEAM_LOGO[t],
      pg: 0,
      v: 0,
      n: 0,
      p: 0,
      pt: 0,
      gf: 0,
      gs: 0,
      pgC: 0,
      vC: 0,
      nC: 0,
      pC: 0,
      ptC: 0,
      gfC: 0,
      gsC: 0,
      pgT: 0,
      vT: 0,
      nT: 0,
      pT: 0,
      ptT: 0,
      gfT: 0,
      gsT: 0,
      ultimi: [],
    };
  });
  const source =
    fantaData.risultati2526 && fantaData.risultati2526.length > 0
      ? fantaData.risultati2526
      : RISULTATI_2526;
  [...source]
    .sort((a, b) => a.g - b.g)
    .forEach((r) => {
      const c = r.casa,
        t = r.tras,
        gC = r.gC,
        gT = r.gT;
      if (!stats[c] || !stats[t]) return;
      stats[c].pg++;
      stats[c].pgC++;
      stats[c].gf += gC;
      stats[c].gfC += gC;
      stats[c].gs += gT;
      stats[c].gsC += gT;
      if (gC > gT) {
        stats[c].v++;
        stats[c].vC++;
        stats[c].pt += 3;
        stats[c].ptC += 3;
        stats[c].ultimi.push("W");
      } else if (gC === gT) {
        stats[c].n++;
        stats[c].nC++;
        stats[c].pt += 1;
        stats[c].ptC += 1;
        stats[c].ultimi.push("D");
      } else {
        stats[c].p++;
        stats[c].pC++;
        stats[c].ultimi.push("L");
      }
      stats[t].pg++;
      stats[t].pgT++;
      stats[t].gf += gT;
      stats[t].gfT += gT;
      stats[t].gs += gC;
      stats[t].gsT += gC;
      if (gT > gC) {
        stats[t].v++;
        stats[t].vT++;
        stats[t].pt += 3;
        stats[t].ptT += 3;
        stats[t].ultimi.push("W");
      } else if (gT === gC) {
        stats[t].n++;
        stats[t].nT++;
        stats[t].pt += 1;
        stats[t].ptT += 1;
        stats[t].ultimi.push("D");
      } else {
        stats[t].p++;
        stats[t].pT++;
        stats[t].ultimi.push("L");
      }
    });
  const stagione2526 = (fantaData.stagioni || []).find(
    (s) => s.anno === "2025-26",
  );
  if (stagione2526) {
    stagione2526.classifica
      .filter((t) => !t.isVice && !t.secondoAllenatore)
      .forEach((t) => {
        if (stats[t.squadra] && t.punti !== null && t.punti !== undefined)
          stats[t.squadra].pt = t.punti;
      });
  }
  const penalita = fantaData.penalita2526 || {};
  Object.keys(penalita).forEach((team) => {
    if (stats[team]) stats[team].penalita = penalita[team];
  });
  Object.values(stats).forEach((s) => {
    s.ultimi5 = s.ultimi.slice(-5);
  });
  return stats;
}

function getStatsRanked(mode) {
  const arr = Object.values(buildStats2526());
  arr.sort((a, b) => {
    if (mode === "casa")
      return b.ptC !== a.ptC ? b.ptC - a.ptC : b.gfC - b.gsC - (a.gfC - a.gsC);
    if (mode === "trasferta")
      return b.ptT !== a.ptT ? b.ptT - a.ptT : b.gfT - b.gsT - (a.gfT - a.gsT);
    return b.pt !== a.pt ? b.pt - a.pt : b.gf - b.gs - (a.gf - a.gs);
  });
  return arr;
}

function risultatoBadge(r) {
  if (r === "W") return `<span class="ris-badge ris-w">W</span>`;
  if (r === "D") return `<span class="ris-badge ris-d">D</span>`;
  return `<span class="ris-badge ris-l">L</span>`;
}

function renderStats2526(mode) {
  const teams = getStatsRanked(mode);
  const container = document.getElementById("stats2526Body");
  if (!container) return;
  let html = "";
  if (mode === "forma") {
    teams.forEach((t, i) => {
      const forma = (t.ultimi5 || []).map(risultatoBadge).join("");
      html += `<tr><td><span class="pos-num-stats">${i + 1}</span></td><td><div class="team-cell-stats"><img src="${t.logo}" class="team-logo" onerror="this.src='images/default.png'"><div><div class="ts-name">${t.squadra}</div><div class="ts-mister">${t.mister}</div></div></div></td><td class="pts-bold">${t.pt}</td><td>${t.pg}</td><td><div class="forma-cell-wrapper">${forma}</div></td></tr>`;
    });
  } else {
    const isC = mode === "casa",
      isT = mode === "trasferta";
    teams.forEach((t, i) => {
      const pg = isC ? t.pgC : isT ? t.pgT : t.pg,
        v = isC ? t.vC : isT ? t.vT : t.v,
        n = isC ? t.nC : isT ? t.nT : t.n,
        p = isC ? t.pC : isT ? t.pT : t.p,
        pt = isC ? t.ptC : isT ? t.ptT : t.pt,
        gf = isC ? t.gfC : isT ? t.gfT : t.gf,
        gs = isC ? t.gsC : isT ? t.gsT : t.gs,
        dr = gf - gs;
      const drHtml =
        dr > 0
          ? `<span class="dr-pos">+${dr}</span>`
          : dr < 0
            ? `<span class="dr-neg">${dr}</span>`
            : `<span style="color:#888">0</span>`;
      html += `<tr><td><span class="pos-num-stats">${i + 1}</span></td><td><div class="team-cell-stats"><img src="${t.logo}" class="team-logo" onerror="this.src='images/default.png'"><div><div class="ts-name">${t.squadra}</div><div class="ts-mister">${t.mister}</div></div></div></td><td class="pts-bold">${pt}</td><td>${pg}</td><td>${v}</td><td>${n}</td><td>${p}</td><td>${gf}</td><td>${gs}</td><td>${drHtml}</td></tr>`;
    });
  }
  container.innerHTML = html;
  const thead = document.getElementById("stats2526Head");
  if (!thead) return;
  thead.innerHTML =
    mode === "forma"
      ? `<tr><th>#</th><th style="text-align:left">Squadra</th><th>PT</th><th>PG</th><th>Ultimi 5</th></tr>`
      : `<tr><th>#</th><th style="text-align:left">Squadra</th><th>PT</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th></tr>`;
}

let currentStatsMode = "globale";

function setStatsMode(mode) {
  currentStatsMode = mode;
  document
    .querySelectorAll(".stats-tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("statsTab_" + mode).classList.add("active");
  renderStats2526(mode);
}

function toggleStats2526() {
  const isHidden = document
    .getElementById("stats2526Section")
    .classList.contains("hidden");
  resetAllSections();
  if (isHidden) {
    document.getElementById("stats2526Section").classList.remove("hidden");
    document.querySelector(".btn-stats2526").innerText =
      "← Torna alla Classifica";
    renderStats2526(currentStatsMode);
  } else {
    document.getElementById("rankingSection").classList.remove("hidden");
    document.querySelector(".btn-stats2526").innerText = "📈 STATISTICHE 25/26";
  }
}

window.onload = loadData;
