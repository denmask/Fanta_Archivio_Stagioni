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

  season.classifica
    .filter((team) => !team.vice)
    .forEach((team, i) => {
      let fasciaClass = "";
      if (useFasce) {
        if (team.pos <= 4) fasciaClass = "f1";
        else if (team.pos <= 6) fasciaClass = "f2";
        else if (team.pos <= 8) fasciaClass = "f3";
      }

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
                            <small>Fantallenatore: ${team.mister || "N/A"}</small>
                        </div>
                    </div>
                </td>
                <td class="pts-bold">${team.punti}</td>
                <td class="fp-text">${team.fp || "-"}</td>
            </tr>
        `;
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
            </div>
        `;
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
      stats[cleanName].stagioni.push({
        anno: s.anno,
        annoInizio,
        squadra: t.squadra,
        logo: t.logo,
        pos: t.pos,
        parziale: t.parziale || false,
        vice: t.vice || false,
        uscita: t.uscita || false,
        nota: t.nota || null,
      });
    });
  });
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
            </div>
        `;
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
    const isMondiale = t.tipo === "FantaMundial";
    const cardClass = isMondiale
      ? "coppa-card torneo-mondiale"
      : "coppa-card torneo-europeo";
    const icon = isMondiale ? "🌍" : "⭐";
    const label = `${icon} ${t.tipo} — ${t.edizione}`;

    html += `
            <div class="${cardClass}" style="animation-delay: ${i * 0.12}s">
                <div class="coppa-season-label torneo-label">${label}</div>
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
            </div>
        `;
  });

  html += "</div>";
  targetContainer.innerHTML += html;
}

function renderHallOfFame(targetContainer) {
  const stats = buildMisterStats();

  let html = '<h2 class="section-title">Hall of Fame Allenatori</h2>';
  html += '<div class="hall-of-fame-grid">';

  Object.keys(stats)
    .sort((a, b) => stats[b].stagioni.length - stats[a].stagioni.length)
    .forEach((m) => {
      const data = stats[m];
      const count = data.stagioni.length;
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
                        <span class="mister-team-pos">${s.vice ? '<span class="badge-vice">Vice</span>' : s.parziale ? '<span class="badge-parziale">Parziale</span>' : getPosLabel(s.pos)}</span>
                    </div>
                </div>
            `,
        )
        .join("");

      const misterEncoded = encodeURIComponent(m);

      html += `
                <div class="mister-card" onclick="openMisterModal('${misterEncoded}')" title="Clicca per la scheda di ${m}">
                    <div class="mister-card-header">
                        <div class="mister-name">${m}</div>
                        <div class="mister-stats-badge">${stagionLabel}</div>
                    </div>
                    <div class="mister-teams-list">
                        ${teamsHtml}
                    </div>
                    <div class="mister-card-footer">
                        <span class="mister-card-cta">👤 Vedi Scheda</span>
                    </div>
                </div>
            `;
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
        </div>
    `;
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

  const coppeVinte = (fantaData.coppa || []).filter(
    (c) => c.mister_vincitore.split("(")[0].trim() === name,
  );

  const torneiVinti = (fantaData.tornei || []).filter(
    (t) => t.mister_vincitore.split("(")[0].trim() === name,
  );

  // All coppa participations
  const coppePartecipazioni = (fantaData.coppa || [])
    .map((c) => {
      const entry = (c.classifica || []).find(
        (r) => r.mister.split("(")[0].trim() === name,
      );
      if (!entry) return null;
      return {
        stagione: c.stagione,
        squadra: entry.squadra,
        logo: entry.logo,
        fase: entry.fase,
        pos: entry.pos,
        inCorso: c.risultato === "In corso",
      };
    })
    .filter(Boolean);

  // All tornei participations
  const torneiPartecipazioni = (fantaData.tornei || [])
    .map((t) => {
      const entry = (t.classifica || []).find(
        (r) => r.mister.split("(")[0].trim() === name,
      );
      if (!entry) return null;
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

  const ori = stagioni.filter((s) => s.pos === 1).length;
  const argenti = stagioni.filter((s) => s.pos === 2).length;
  const bronzi = stagioni.filter((s) => s.pos === 3).length;
  const podi = ori + argenti + bronzi;
  const partecipazioni = stagioni.length;

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
        </div>
    `,
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
            <span class="modal-season-pos">${s.vice ? '<span class="badge-vice">Vice</span>' : s.parziale ? '<span class="badge-parziale">Parziale</span>' : getPosLabel(s.pos)}</span>
        </div>
    `,
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
          coppeVinte.length > 0
            ? `
        <div class="modal-section-title coppa-modal-title">🏆 FantaCoppa Italia Frecciarossa</div>
        <div class="modal-trophies-list">${coppeVinte
          .map(
            (c) => `
            <div class="modal-trophy-entry coppa-entry">
                <img src="${c.logo_vincitore}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
                <div>
                    <div class="modal-trophy-season">FantaCoppa Italia Frecciarossa ${c.stagione}</div>
                    <div class="modal-trophy-team coppa-trophy-team">🏆 ${c.vincitore}</div>
                </div>
            </div>
        `,
          )
          .join("")}</div>
        `
            : ""
        }

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
                </div>
                <span class="fase-badge ${faseColor}">${c.fase}</span>
            </div>`;
          })
          .join("")}</div>
        `
            : ""
        }

        ${
          torneiPartecipazioni.length > 0
            ? `
        <div class="modal-section-title tornei-modal-title">🌍 Tornei Internazionali</div>
        <div class="modal-trophies-list">${torneiPartecipazioni
          .map((t) => {
            const icon = t.tipo === "FantaMundial" ? "🌍" : "⭐";
            const tClass =
              t.tipo === "FantaMundial"
                ? "torneo-entry mondiale-entry"
                : "torneo-entry europeo-entry";
            const faseColor =
              t.fase === "Campione"
                ? "fase-campione"
                : t.fase === "Finale"
                  ? "fase-finale"
                  : "fase-eliminato";
            const ptsLabel =
              t.punti !== null && t.punti !== undefined
                ? ` — ${t.punti} pt`
                : "";
            return `
            <div class="modal-trophy-entry ${tClass} partecipazione-entry">
                <img src="${t.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
                <div class="partecipazione-info">
                    <div class="modal-trophy-season">${icon} ${t.tipo} — ${t.edizione}</div>
                    <div class="partecipazione-squadra">${t.nazione}${ptsLabel}</div>
                </div>
                <span class="fase-badge ${faseColor}">${t.fase}</span>
            </div>`;
          })
          .join("")}</div>
        `
            : ""
        }

        <div class="modal-section-title">📋 Storico Stagioni</div>
        <div class="modal-seasons-list">${stagionDetailHtml}</div>
    `;

  const modal = document.getElementById("misterModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMisterModal() {
  const modal = document.getElementById("misterModal");
  modal.classList.remove("active");
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
  const isPalmaresHidden = document
    .getElementById("palmaresSection")
    .classList.contains("hidden");
  resetAllSections();
  if (isPalmaresHidden) {
    document.getElementById("palmaresSection").classList.remove("hidden");
    document.querySelector(".btn-palmares").innerText = "Torna alla Classifica";
  } else {
    document.getElementById("rankingSection").classList.remove("hidden");
  }
}

function toggleAttivita() {
  const isAttivitaHidden = document
    .getElementById("attivitaSection")
    .classList.contains("hidden");
  resetAllSections();
  if (isAttivitaHidden) {
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

  const ADMIN_ORDER = { "Denis Mascherin": 0, "Kevin Di Bernardo": 1 };

  // Sort: admins first (fixed order), then active alphabetically, then retired alphabetically
  const misterList = Object.keys(stats).sort((a, b) => {
    const aIsAdmin = a in ADMIN_ORDER;
    const bIsAdmin = b in ADMIN_ORDER;
    if (aIsAdmin && bIsAdmin) return ADMIN_ORDER[a] - ADMIN_ORDER[b];
    if (aIsAdmin) return -1;
    if (bIsAdmin) return 1;

    const aMax = [...stats[a].stagioni].sort(
      (x, y) => y.annoInizio - x.annoInizio,
    )[0].anno;
    const bMax = [...stats[b].stagioni].sort(
      (x, y) => y.annoInizio - x.annoInizio,
    )[0].anno;
    const aActive = aMax === CURRENT_SEASON;
    const bActive = bMax === CURRENT_SEASON;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    // Within same group: sort by start year ascending (oldest first),
    // then by number of non-vice seasons descending, then alphabetically
    const aMin = Math.min(...stats[a].stagioni.map((s) => s.annoInizio));
    const bMin = Math.min(...stats[b].stagioni.map((s) => s.annoInizio));
    if (aMin !== bMin) return aMin - bMin;
    const aOwn = stats[a].stagioni.filter((s) => !s.vice).length;
    const bOwn = stats[b].stagioni.filter((s) => !s.vice).length;
    if (aOwn !== bOwn) return bOwn - aOwn;
    return a.localeCompare(b);
  });

  let html = '<div class="attivita-list">';
  let activeHeaderAdded = false;
  let retiredHeaderAdded = false;

  html +=
    '<div class="attivita-group-label attivita-group-admin">⚙️ Staff</div>';

  misterList.forEach((name) => {
    const stagioni = stats[name].stagioni;
    const years = stagioni.map((s) => parseInt(s.anno.split("-")[0]));
    const minYear = Math.min(...years);
    const maxAnno = [...stagioni].sort((a, b) => b.annoInizio - a.annoInizio)[0]
      .anno;
    const isActive = maxAnno === CURRENT_SEASON;
    const isAdmin = name in ADMIN_ORDER;
    const isUscita = isActive && stats[name].stagioni.some((s) => s.uscita);

    if (!isAdmin && !activeHeaderAdded) {
      activeHeaderAdded = true;
      html +=
        '<div class="attivita-group-label attivita-group-active">🟢 Attivi</div>';
    }

    if (!isAdmin && !isActive && !retiredHeaderAdded) {
      retiredHeaderAdded = true;
      html +=
        '<div class="attivita-group-label attivita-group-retired">🔴 Ritirati</div>';
    }

    // End year: second part of last season string (e.g. "2024-25" → 2025)
    const endYearStr = isActive
      ? "in corso"
      : (() => {
          const parts = maxAnno.split("-");
          const y2 = parts[1];
          // Handle short format like "24" → "2024"
          return y2.length === 2 ? "20" + y2 : y2;
        })();

    const periodoLabel = isActive
      ? `${minYear} – in corso`
      : `${minYear} – ${endYearStr}`;
    const statusClass = isActive
      ? "attivita-status active"
      : "attivita-status retired";
    const statusLabel = isActive ? "🟢 Attivo" : "🔴 Ritirato";
    const initiali = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const misterEncoded = encodeURIComponent(name);
    const numStagioni = stagioni.filter((s) => !s.vice).length;
    const isOnlyVice = numStagioni === 0 && stagioni.some((s) => s.vice);

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
        : isUscita
          ? " attivita-card-uscita"
          : "";
    const avatarClass = isAdmin
      ? " attivita-avatar-admin"
      : isOnlyVice
        ? " attivita-avatar-vice"
        : isUscita
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
      ? `${stagioni.length} stagion${stagioni.length === 1 ? "e" : "i"} (solo vice)`
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
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML += html;
}

// ── FASCE ──

function toggleFasce() {
  const isFasceHidden = document
    .getElementById("fasceSection")
    .classList.contains("hidden");
  resetAllSections();
  if (isFasceHidden) {
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

// Dati suddivisione fasce per stagione: fascia di PARTENZA (prima della stagione)
// e fascia di DESTINAZIONE (dopo la stagione / proiezione)
const FASCE_EXTRA = {
  "2024-25": {
    // Prima stagione con le fasce — tutti partono senza fascia (sistema nuovo)
    // Le fasce di partenza non esistevano, le calcoliamo dalla stagione precedente
    startNote:
      "Prima stagione con il sistema a fasce. Le fasce di partenza erano ufficiosamente basate sulla stagione 2023-24.",
    mosse: {}, // nessuna mossa speciale da comunicare
  },
  "2025-26": {
    startNote:
      "Stagione in corso. Fasce di partenza assegnate ufficialmente prima del campionato.",
    fasciaPartenza: {
      "Federico Burello": "f1",
      "Mattia Beltrame": "f1",
      "Kevin Di Bernardo": "f1",
      "Denis Mascherin": "f1",
      "Alex Beltrame": "f2", // ha preso il posto di Kevin Sandri ritirato
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
      "Mattia Beltrame": "f1", // attualmente 2° anche se uscita
      "Kevin Di Bernardo": "f1",
      "Denis Mascherin": "f2", // attualmente 5°
      "Alex Beltrame": "f2", // attualmente 6° → rimane Fascia 2
      "Cristian Tartaro": "f3", // attualmente 7°
      "Lorenzo Moro": "f1", // attualmente 4° — promozione!
      "Nicola Marano": "f3", // rimarrebbe f3
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
                <div class="legenda-card f-campione">
                    <div class="legenda-icon">🏆</div>
                    <div class="legenda-info">
                        <div class="legenda-nome">Campione</div>
                        <div class="legenda-desc">Scudetto Fantacalcio</div>
                        <div class="legenda-posti">1° posto</div>
                    </div>
                </div>
                <div class="legenda-card f1">
                    <div class="legenda-icon">🔵</div>
                    <div class="legenda-info">
                        <div class="legenda-nome">Fascia 1</div>
                        <div class="legenda-desc">Champions League</div>
                        <div class="legenda-posti">Posti 2-3-4</div>
                    </div>
                </div>
                <div class="legenda-card f2">
                    <div class="legenda-icon">🟠</div>
                    <div class="legenda-info">
                        <div class="legenda-nome">Fascia 2</div>
                        <div class="legenda-desc">Europa League</div>
                        <div class="legenda-posti">Posti 5-6</div>
                    </div>
                </div>
            </div>
            <div class="fasce-legenda-row row-bottom">
                <div class="legenda-card f3">
                    <div class="legenda-icon">🟢</div>
                    <div class="legenda-info">
                        <div class="legenda-nome">Fascia 3</div>
                        <div class="legenda-desc">Conference / Salvezza</div>
                        <div class="legenda-posti">Posti 7-8</div>
                    </div>
                </div>
                <div class="legenda-card f-ultimo">
                    <div class="legenda-icon">🔴</div>
                    <div class="legenda-info">
                        <div class="legenda-nome">Ultimo</div>
                        <div class="legenda-desc">Retrocessione</div>
                        <div class="legenda-posti">Ultimo posto</div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Solo stagioni con fasce (dal 2024-25)
  const stagioniFasce = fantaData.stagioni.filter(
    (s) => s.anno === "2024-25" || s.anno === "2025-26",
  );

  stagioniFasce.forEach((stagione) => {
    const extra = FASCE_EXTRA[stagione.anno] || {};
    const inCorso = extra.inCorso || false;
    const classifica = stagione.classifica.filter((t) => !t.vice);
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
                        <th>Pos</th>
                        <th>Fantallenatore</th>
                        <th>Fascia Finale</th>
                        ${extra.fasciaPartenza ? "<th>Partenza</th><th>Proiezione Prossima</th>" : ""}
                        <th>Obiettivo</th>
                    </tr>
                </thead>
                <tbody>
        `;

    classifica.forEach((team, i) => {
      const fascia = getFasciaFromPos(team.pos, total);
      const stripClass = getStripClass(fascia);
      const pillClass = getFasciaPillClass(fascia);
      const isCampione = team.pos === 1;

      // Fascia partenza e destinazione (solo per 2025-26)
      let partenzaHtml = "";
      let destinazioneHtml = "";
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
          ? `
                    <td>
                        <span class="fascia-badge-pill ${getFasciaPillClass(fp)}">${getFasciaLabel(fp)}</span>
                        ${notaPart ? `<div class="fasce-note">${notaPart}</div>` : ""}
                    </td>`
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
          ? `
                    <td>
                        <span class="fascia-badge-pill ${getFasciaPillClass(fd)}">${getFasciaLabel(fd)}</span>
                        ${moveHtml}
                        ${notaDest ? `<div class="fasce-note">${notaDest}</div>` : ""}
                    </td>`
          : "<td>—</td>";
      }

      // Obiettivo minimo: mantenere la fascia di partenza o migliorarla
      let obiettivoHtml = "";
      if (extra.fasciaPartenza) {
        const fp = extra.fasciaPartenza[team.mister];
        const fd = extra.fasciaDestinazione[team.mister];
        if (fp && fd) {
          const ord = { campione: 0, f1: 1, f2: 2, f3: 3, ultimo: 4 };
          const diff = ord[fd] - ord[fp];
          // Caso speciale: promozione di 2+ fasce al primo anno
          if (diff <= -2 && inCorso) {
            obiettivoHtml = `<span class="obiettivo-superato"><span class="dot-obj dot-green"></span> Superato (+2 fasce)</span>`;
          } else if (diff <= -2) {
            obiettivoHtml = `<span class="obiettivo-superato"><span class="dot-obj dot-green"></span> Superato (+2 fasce)</span>`;
          } else if (inCorso) {
            obiettivoHtml =
              diff <= 0
                ? `<span class="obiettivo-in-corso"><span class="dot-obj dot-gold"></span> In linea</span>`
                : `<span class="obiettivo-ko"><span class="dot-obj dot-red"></span> A rischio</span>`;
          } else {
            obiettivoHtml =
              diff <= 0
                ? `<span class="obiettivo-ok"><span class="dot-obj dot-green"></span> Raggiunto</span>`
                : `<span class="obiettivo-ko"><span class="dot-obj dot-red"></span> Non raggiunto</span>`;
          }
        } else {
          obiettivoHtml = "—";
        }
      } else {
        // 2024-25: mostra la fascia raggiunta come obiettivo
        const pillCls = getFasciaPillClass(fascia);
        const fasciaLbl = getFasciaLabel(fascia);
        obiettivoHtml = `<span class="fascia-badge-pill ${pillCls}">${fasciaLbl}</span>`;
      }

      const puntiDisplay =
        team.punti !== null && team.punti !== undefined ? team.punti : "null";

      html += `
                <tr style="animation-delay: ${i * 0.05}s">
                    <td>
                        <span class="fasce-strip ${stripClass}"></span>
                        <span class="fasce-pos ${isCampione ? "campione" : ""}">${team.pos}</span>
                    </td>
                    <td>
                        <div class="fasce-mister">${team.mister}</div>
                        <div class="fasce-squadra">${team.squadra} · ${puntiDisplay} pt</div>
                    </td>
                    <td>
                        <span class="fascia-badge-pill ${pillClass}">${getFasciaLabel(fascia)}</span>
                    </td>
                    ${partenzaHtml}
                    ${destinazioneHtml}
                    <td>${obiettivoHtml}</td>
                </tr>
            `;
    });

    html += `
                </tbody>
            </table>
            </div>
        </div>`;

    if (extra.startNote) {
      html = html.replace(
        '</div>\n        <div class="fasce-table-wrap">',
        `
            </div>
            <div style="padding: 0.6rem 1.5rem; font-size: 0.78rem; color: var(--muted); font-style: italic; border-bottom: 1px solid var(--border);">ℹ️ ${extra.startNote}</div>
            <div class="fasce-table-wrap">`,
      );
    }
  });

  html += "</div>";
  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// SEZIONE STATISTICHE 2025-26: CASA / TRASFERTA / FORMA
// ══════════════════════════════════════════════════════════════

const RISULTATI_2526 = [
  // GIORNATA 1
  { g:1, casa:'Milan',    gC:1, gT:2, tras:'Juventus'  },
  { g:1, casa:'Napoli',   gC:2, gT:0, tras:'Bologna'   },
  { g:1, casa:'Roma',     gC:2, gT:0, tras:'Lazio'     },
  { g:1, casa:'Inter',    gC:4, gT:3, tras:'Atalanta'  },
  // GIORNATA 2
  { g:2, casa:'Milan',    gC:2, gT:1, tras:'Bologna'   },
  { g:2, casa:'Atalanta', gC:0, gT:2, tras:'Napoli'    },
  { g:2, casa:'Inter',    gC:2, gT:1, tras:'Roma'      },
  { g:2, casa:'Lazio',    gC:4, gT:1, tras:'Juventus'  },
  // GIORNATA 3
  { g:3, casa:'Napoli',   gC:4, gT:3, tras:'Inter'     },
  { g:3, casa:'Roma',     gC:2, gT:3, tras:'Juventus'  },
  { g:3, casa:'Milan',    gC:2, gT:0, tras:'Lazio'     },
  { g:3, casa:'Bologna',  gC:0, gT:3, tras:'Atalanta'  },
  // GIORNATA 4
  { g:4, casa:'Roma',     gC:1, gT:3, tras:'Milan'     },
  { g:4, casa:'Atalanta', gC:3, gT:0, tras:'Lazio'     },
  { g:4, casa:'Inter',    gC:3, gT:4, tras:'Bologna'   },
  { g:4, casa:'Napoli',   gC:1, gT:1, tras:'Juventus'  },
  // GIORNATA 5
  { g:5, casa:'Juventus', gC:2, gT:2, tras:'Atalanta'  },
  { g:5, casa:'Bologna',  gC:1, gT:4, tras:'Roma'      },
  { g:5, casa:'Milan',    gC:3, gT:1, tras:'Napoli'    },
  { g:5, casa:'Lazio',    gC:3, gT:1, tras:'Inter'     },
  // GIORNATA 6
  { g:6, casa:'Roma',     gC:2, gT:2, tras:'Atalanta'  },
  { g:6, casa:'Napoli',   gC:3, gT:3, tras:'Lazio'     },
  { g:6, casa:'Juventus', gC:0, gT:5, tras:'Bologna'   },
  { g:6, casa:'Inter',    gC:5, gT:0, tras:'Milan'     },
  // GIORNATA 7
  { g:7, casa:'Napoli',   gC:1, gT:2, tras:'Roma'      },
  { g:7, casa:'Inter',    gC:1, gT:0, tras:'Juventus'  },
  { g:7, casa:'Lazio',    gC:0, gT:2, tras:'Bologna'   },
  { g:7, casa:'Atalanta', gC:0, gT:2, tras:'Milan'     },
  // GIORNATA 8
  { g:8, casa:'Atalanta', gC:1, gT:2, tras:'Inter'     },
  { g:8, casa:'Lazio',    gC:1, gT:1, tras:'Roma'      },
  { g:8, casa:'Bologna',  gC:3, gT:4, tras:'Napoli'    },
  { g:8, casa:'Juventus', gC:0, gT:2, tras:'Milan'     },
  // GIORNATA 9
  { g:9, casa:'Napoli',   gC:2, gT:3, tras:'Atalanta'  },
  { g:9, casa:'Bologna',  gC:0, gT:1, tras:'Milan'     },
  { g:9, casa:'Roma',     gC:1, gT:4, tras:'Inter'     },
  { g:9, casa:'Juventus', gC:4, gT:0, tras:'Lazio'     },
  // GIORNATA 10
  { g:10, casa:'Inter',    gC:1, gT:2, tras:'Napoli'   },
  { g:10, casa:'Atalanta', gC:0, gT:3, tras:'Bologna'  },
  { g:10, casa:'Juventus', gC:2, gT:1, tras:'Roma'     },
  { g:10, casa:'Lazio',    gC:4, gT:3, tras:'Milan'    },
  // GIORNATA 11
  { g:11, casa:'Juventus', gC:0, gT:2, tras:'Napoli'   },
  { g:11, casa:'Milan',    gC:2, gT:0, tras:'Roma'     },
  { g:11, casa:'Bologna',  gC:1, gT:3, tras:'Inter'    },
  { g:11, casa:'Lazio',    gC:0, gT:1, tras:'Atalanta' },
  // GIORNATA 12
  { g:12, casa:'Atalanta', gC:3, gT:3, tras:'Juventus' },
  { g:12, casa:'Roma',     gC:5, gT:2, tras:'Bologna'  },
  { g:12, casa:'Inter',    gC:0, gT:4, tras:'Lazio'    },
  { g:12, casa:'Napoli',   gC:3, gT:1, tras:'Milan'    },
  // GIORNATA 13
  { g:13, casa:'Milan',    gC:2, gT:2, tras:'Inter'    },
  { g:13, casa:'Bologna',  gC:1, gT:3, tras:'Juventus' },
  { g:13, casa:'Lazio',    gC:2, gT:2, tras:'Napoli'   },
  { g:13, casa:'Atalanta', gC:1, gT:0, tras:'Roma'     },
  // GIORNATA 14
  { g:14, casa:'Juventus', gC:2, gT:3, tras:'Inter'    },
  { g:14, casa:'Milan',    gC:2, gT:3, tras:'Atalanta' },
  { g:14, casa:'Roma',     gC:1, gT:3, tras:'Napoli'   },
  { g:14, casa:'Bologna',  gC:1, gT:3, tras:'Lazio'    },
  // GIORNATA 15
  { g:15, casa:'Inter',    gC:1, gT:3, tras:'Atalanta' },
  { g:15, casa:'Milan',    gC:2, gT:0, tras:'Juventus' },
  { g:15, casa:'Roma',     gC:2, gT:1, tras:'Lazio'    },
  { g:15, casa:'Napoli',   gC:0, gT:1, tras:'Bologna'  },
  // GIORNATA 16
  { g:16, casa:'Inter',    gC:0, gT:1, tras:'Roma'     },
  { g:16, casa:'Milan',    gC:0, gT:0, tras:'Bologna'  },
  { g:16, casa:'Lazio',    gC:0, gT:2, tras:'Juventus' },
  { g:16, casa:'Atalanta', gC:3, gT:2, tras:'Napoli'   },
  // GIORNATA 17
  { g:17, casa:'Napoli',   gC:2, gT:1, tras:'Inter'    },
  { g:17, casa:'Milan',    gC:3, gT:1, tras:'Lazio'    },
  { g:17, casa:'Roma',     gC:4, gT:3, tras:'Juventus' },
  { g:17, casa:'Bologna',  gC:0, gT:1, tras:'Atalanta' },
  // GIORNATA 18
  { g:18, casa:'Inter',    gC:3, gT:1, tras:'Bologna'  },
  { g:18, casa:'Roma',     gC:1, gT:2, tras:'Milan'    },
  { g:18, casa:'Napoli',   gC:4, gT:2, tras:'Juventus' },
  { g:18, casa:'Atalanta', gC:1, gT:0, tras:'Lazio'    },
  // GIORNATA 19
  { g:19, casa:'Lazio',    gC:1, gT:2, tras:'Inter'    },
  { g:19, casa:'Milan',    gC:2, gT:3, tras:'Napoli'   },
  { g:19, casa:'Juventus', gC:3, gT:3, tras:'Atalanta' },
  { g:19, casa:'Bologna',  gC:2, gT:1, tras:'Roma'     },
  // GIORNATA 20
  { g:20, casa:'Inter',    gC:3, gT:1, tras:'Milan'    },
  { g:20, casa:'Roma',     gC:2, gT:3, tras:'Atalanta' },
  { g:20, casa:'Juventus', gC:5, gT:2, tras:'Bologna'  },
  { g:20, casa:'Napoli',   gC:2, gT:1, tras:'Lazio'    },
  // GIORNATA 21
  { g:21, casa:'Inter',    gC:1, gT:0, tras:'Juventus' },
  { g:21, casa:'Atalanta', gC:0, gT:1, tras:'Milan'    },
  { g:21, casa:'Napoli',   gC:2, gT:4, tras:'Roma'     },
  { g:21, casa:'Lazio',    gC:1, gT:0, tras:'Bologna'  },
  // GIORNATA 22
  { g:22, casa:'Atalanta', gC:3, gT:5, tras:'Inter'    },
  { g:22, casa:'Juventus', gC:5, gT:1, tras:'Milan'    },
  { g:22, casa:'Lazio',    gC:1, gT:2, tras:'Roma'     },
  { g:22, casa:'Bologna',  gC:2, gT:1, tras:'Napoli'   },
  // GIORNATA 23
  { g:23, casa:'Roma',     gC:0, gT:2, tras:'Inter'    },
  { g:23, casa:'Bologna',  gC:2, gT:3, tras:'Milan'    },
  { g:23, casa:'Juventus', gC:4, gT:5, tras:'Lazio'    },
  { g:23, casa:'Napoli',   gC:2, gT:0, tras:'Atalanta' },
  // GIORNATA 24
  { g:24, casa:'Inter',    gC:4, gT:4, tras:'Napoli'   },
  { g:24, casa:'Lazio',    gC:3, gT:2, tras:'Milan'    },
  { g:24, casa:'Juventus', gC:4, gT:3, tras:'Roma'     },
  { g:24, casa:'Atalanta', gC:3, gT:0, tras:'Bologna'  },
  // GIORNATA 25
  { g:25, casa:'Bologna',  gC:1, gT:2, tras:'Inter'    },
  { g:25, casa:'Milan',    gC:2, gT:3, tras:'Roma'     },
  { g:25, casa:'Juventus', gC:4, gT:2, tras:'Napoli'   },
  { g:25, casa:'Lazio',    gC:0, gT:3, tras:'Atalanta' },
  // GIORNATA 26
  { g:26, casa:'Inter',    gC:3, gT:0, tras:'Lazio'    },
  { g:26, casa:'Napoli',   gC:3, gT:0, tras:'Milan'    },
  { g:26, casa:'Atalanta', gC:1, gT:0, tras:'Juventus' },
  { g:26, casa:'Roma',     gC:2, gT:0, tras:'Bologna'  },
];

// Mappa squadra → fantallenatore
const TEAM_MISTER = {
  'Inter':    'Federico Burello',
  'Napoli':   'Mattia Beltrame',
  'Atalanta': 'Kevin Di Bernardo',
  'Milan':    'Lorenzo Moro',
  'Juventus': 'Denis Mascherin',
  'Roma':     'Alex Beltrame',
  'Lazio':    'Cristian Tartaro',
  'Bologna':  'Nicola Marano',
};

const TEAM_LOGO = {
  'Inter':    'images/inter.png',
  'Napoli':   'images/napoli.png',
  'Atalanta': 'images/atalanta.png',
  'Milan':    'images/milan.png',
  'Juventus': 'images/juventus.png',
  'Roma':     'images/roma.png',
  'Lazio':    'images/lazio.png',
  'Bologna':  'images/bologna.png',
};

function buildStats2526() {
  const teams = Object.keys(TEAM_MISTER);
  const stats = {};

  teams.forEach(t => {
    stats[t] = {
      squadra: t, mister: TEAM_MISTER[t], logo: TEAM_LOGO[t],
      pg:0, v:0, n:0, p:0, pt:0, gf:0, gs:0,
      pgC:0, vC:0, nC:0, pC:0, ptC:0, gfC:0, gsC:0,
      pgT:0, vT:0, nT:0, pT:0, ptT:0, gfT:0, gsT:0,
      ultimi:[],
    };
  });

  // Legge dal data.json se disponibile, altrimenti usa array locale
  const source = (fantaData.risultati2526 && fantaData.risultati2526.length > 0)
    ? fantaData.risultati2526
    : RISULTATI_2526;

  const sorted = [...source].sort((a,b) => a.g - b.g);

  sorted.forEach(r => {
    const c = r.casa;
    const t = r.tras;
    const gC = r.gC;
    const gT = r.gT;

    if (!stats[c] || !stats[t]) return;

    // --- CASA ---
    stats[c].pg++;
    stats[c].pgC++;
    stats[c].gf += gC; stats[c].gfC += gC;
    stats[c].gs += gT; stats[c].gsC += gT;
    if (gC > gT) {
      stats[c].v++; stats[c].vC++; stats[c].pt += 3; stats[c].ptC += 3;
      stats[c].ultimi.push('W');
    } else if (gC === gT) {
      stats[c].n++; stats[c].nC++; stats[c].pt += 1; stats[c].ptC += 1;
      stats[c].ultimi.push('D');
    } else {
      stats[c].p++; stats[c].pC++; stats[c].ultimi.push('L');
    }

    // --- TRASFERTA ---
    stats[t].pg++;
    stats[t].pgT++;
    stats[t].gf += gT; stats[t].gfT += gT;
    stats[t].gs += gC; stats[t].gsT += gC;
    if (gT > gC) {
      stats[t].v++; stats[t].vT++; stats[t].pt += 3; stats[t].ptT += 3;
      stats[t].ultimi.push('W');
    } else if (gT === gC) {
      stats[t].n++; stats[t].nT++; stats[t].pt += 1; stats[t].ptT += 1;
      stats[t].ultimi.push('D');
    } else {
      stats[t].p++; stats[t].pT++; stats[t].ultimi.push('L');
    }
  });

  // Tieni solo gli ultimi 5
  Object.values(stats).forEach(s => {
    s.ultimi5 = s.ultimi.slice(-5);
  });

  return stats;
}

function getStatsRanked(mode) {
  const stats = buildStats2526();
  const arr = Object.values(stats);

  arr.sort((a, b) => {
    if (mode === 'casa') {
      if (b.ptC !== a.ptC) return b.ptC - a.ptC;
      return (b.gfC - b.gsC) - (a.gfC - a.gsC);
    } else if (mode === 'trasferta') {
      if (b.ptT !== a.ptT) return b.ptT - a.ptT;
      return (b.gfT - b.gsT) - (a.gfT - a.gsT);
    } else {
      if (b.pt !== a.pt) return b.pt - a.pt;
      return (b.gf - b.gs) - (a.gf - a.gs);
    }
  });

  return arr;
}

function risultatoBadge(r) {
  if (r === 'W') return `<span class="ris-badge ris-w">W</span>`;
  if (r === 'D') return `<span class="ris-badge ris-d">D</span>`;
  return `<span class="ris-badge ris-l">L</span>`;
}

function renderStats2526(mode) {
  const teams = getStatsRanked(mode);
  const container = document.getElementById('stats2526Body');
  if (!container) return;

  let html = '';

  if (mode === 'forma') {
    teams.forEach((t, i) => {
      const forma = (t.ultimi5 || []).map(risultatoBadge).join('');
      const pts = t.pt;
      html += `
        <tr>
          <td><span class="pos-num-stats">${i+1}</span></td>
          <td>
            <div class="team-cell-stats">
              <img src="${t.logo}" class="team-logo" onerror="this.src='images/default.png'">
              <div>
                <div class="ts-name">${t.squadra}</div>
                <div class="ts-mister">${t.mister}</div>
              </div>
            </div>
          </td>
          <td class="pts-bold">${pts}</td>
          <td>${t.pg}</td>
          <td><div class="forma-cell-wrapper">${forma}</div></td>
        </tr>`;
    });
  } else {
    const isC = mode === 'casa';
    const isT = mode === 'trasferta';
    teams.forEach((t, i) => {
      const pg  = isC ? t.pgC  : isT ? t.pgT  : t.pg;
      const v   = isC ? t.vC   : isT ? t.vT   : t.v;
      const n   = isC ? t.nC   : isT ? t.nT   : t.n;
      const p   = isC ? t.pC   : isT ? t.pT   : t.p;
      const pt  = isC ? t.ptC  : isT ? t.ptT  : t.pt;
      const gf  = isC ? t.gfC  : isT ? t.gfT  : t.gf;
      const gs  = isC ? t.gsC  : isT ? t.gsT  : t.gs;
      const dr  = gf - gs;
      const drHtml = dr > 0 ? `<span class="dr-pos">+${dr}</span>` : dr < 0 ? `<span class="dr-neg">${dr}</span>` : `<span style="color:#888">0</span>`;
      html += `
        <tr>
          <td><span class="pos-num-stats">${i+1}</span></td>
          <td>
            <div class="team-cell-stats">
              <img src="${t.logo}" class="team-logo" onerror="this.src='images/default.png'">
              <div>
                <div class="ts-name">${t.squadra}</div>
                <div class="ts-mister">${t.mister}</div>
              </div>
            </div>
          </td>
          <td class="pts-bold">${pt}</td>
          <td>${pg}</td>
          <td>${v}</td>
          <td>${n}</td>
          <td>${p}</td>
          <td>${gf}</td>
          <td>${gs}</td>
          <td>${drHtml}</td>
        </tr>`;
    });
  }

  container.innerHTML = html;

  // Aggiorna intestazioni colonne
  const thead = document.getElementById('stats2526Head');
  if (!thead) return;
  if (mode === 'forma') {
    thead.innerHTML = `<tr>
      <th>#</th><th style="text-align:left">Squadra</th>
      <th>PT</th><th>PG</th><th>Ultimi 5</th>
    </tr>`;
  } else {
    thead.innerHTML = `<tr>
      <th>#</th><th style="text-align:left">Squadra</th>
      <th>PT</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>GF</th><th>GS</th><th>DR</th>
    </tr>`;
  }
}

let currentStatsMode = 'globale';

function setStatsMode(mode) {
  currentStatsMode = mode;
  document.querySelectorAll('.stats-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('statsTab_' + mode).classList.add('active');
  renderStats2526(mode);
}

function toggleStats2526() {
  const isHidden = document.getElementById('stats2526Section').classList.contains('hidden');
  resetAllSections();
  if (isHidden) {
    document.getElementById('stats2526Section').classList.remove('hidden');
    document.querySelector('.btn-stats2526').innerText = '← Torna alla Classifica';
    renderStats2526(currentStatsMode);
  } else {
    document.getElementById('rankingSection').classList.remove('hidden');
    document.querySelector('.btn-stats2526').innerText = '📈 STATISTICHE 25/26';
  }
}

window.onload = loadData;