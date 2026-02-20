let fantaData = {};

async function loadData() {
    try {
        const response = await fetch('data.json');
        fantaData = await response.json();
        initApp();
    } catch (e) {
        console.error("Errore nel caricamento dei dati:", e);
    }
}

function initApp() {
    const selector = document.getElementById('seasonSelector');
    selector.innerHTML = '';
    
    fantaData.stagioni.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.anno;
        opt.innerText = s.anno;
        selector.appendChild(opt);
    });

    renderSeason(fantaData.stagioni[0].anno);
    renderPalmares();
    createMisterModal();
}

function renderSeason(anno) {
    const season = fantaData.stagioni.find(s => s.anno === anno);
    document.getElementById('currentSeasonTitle').innerText = `Serie A ${season.anno}`;
    
    const sponsorImg = document.getElementById('sponsorLogo');
    sponsorImg.src = season.sponsor === 'TIM' ? 'images/seriea_tim.png' : 'images/seriea_enilive.png';

    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    const useFasce = (anno === "2025-26" || anno === "2024-25");

    season.classifica.forEach((team, i) => {
        let fasciaClass = "";
        if (useFasce) {
            if (team.pos <= 4) fasciaClass = "f1";
            else if (team.pos <= 6) fasciaClass = "f2";
            else if (team.pos <= 8) fasciaClass = "f3";
        }

        tbody.innerHTML += `
            <tr style="animation-delay: ${i * 0.05}s">
                <td>
                    ${fasciaClass ? `<div class="fascia-indicator ${fasciaClass}"></div>` : ''}
                    ${team.pos}
                </td>
                <td>
                    <div class="team-cell">
                        <img src="${team.logo}" class="team-logo" onerror="this.src='images/default.png'">
                        <div class="team-info">
                            <strong>${team.squadra}</strong><br>
                            <small>Fantallenatore: ${team.mister || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td class="pts-bold">${team.punti}</td>
                <td class="fp-text">${team.fp || '-'}</td>
            </tr>
        `;
    });
}

function renderPalmares() {
    const container = document.getElementById('palmaresGrid');
    container.innerHTML = '<h2 class="section-title">Albo d\'Oro</h2>'; 
    
    fantaData.palmares.forEach((p, i) => {
        const isTraditional = p.stagione === "2021-22";
        const modalitaClass = isTraditional ? "modalita-badge trad" : "modalita-badge squadre";
        const modalitaText = isTraditional ? "Fanta Tradizionale" : "Fanta a Squadre";

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
    fantaData.stagioni.forEach(s => {
        const annoInizio = parseInt(s.anno.split('-')[0]);
        s.classifica.forEach(t => {
            const m = t.mister;
            if (!m) return;
            const cleanName = m.split('(')[0].trim();
            if (!stats[cleanName]) stats[cleanName] = { stagioni: [] };
            stats[cleanName].stagioni.push({
                anno: s.anno,
                annoInizio,
                squadra: t.squadra,
                logo: t.logo,
                pos: t.pos,
                parziale: t.parziale || false,
                vice: t.vice || false,
                nota: t.nota || null
            });
        });
    });
    return stats;
}

function renderCoppa(targetContainer) {
    const coppa = fantaData.coppa;
    if (!coppa || coppa.length === 0) return;

    let html = '<h2 class="section-title coppa-title">FantaCoppa Italia <span>Frecciarossa</span></h2>';
    html += '<div class="coppa-list">';

    coppa.forEach((c, i) => {
        if (c.risultato === 'In corso') return;
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
                        ${c.marcatore ? `<div class="coppa-marcatore">⚽ ${c.marcatore}</div>` : ''}
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

    html += '</div>';
    targetContainer.innerHTML += html;
}

function renderTornei(targetContainer) {
    const tornei = fantaData.tornei;
    if (!tornei || tornei.length === 0) return;

    let html = '<h2 class="section-title tornei-title">Tornei Internazionali</h2>';
    html += '<div class="coppa-list">';

    tornei.forEach((t, i) => {
        const isMondiale = t.tipo === 'FantaMundial';
        const cardClass = isMondiale ? 'coppa-card torneo-mondiale' : 'coppa-card torneo-europeo';
        const icon = isMondiale ? '🌍' : '⭐';
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

    html += '</div>';
    targetContainer.innerHTML += html;
}

function renderHallOfFame(targetContainer) {
    const stats = buildMisterStats();

    let html = '<h2 class="section-title">Hall of Fame Allenatori</h2>';
    html += '<div class="hall-of-fame-grid">';
    
    Object.keys(stats)
        .sort((a, b) => stats[b].stagioni.length - stats[a].stagioni.length)
        .forEach(m => {
            const data = stats[m];
            const count = data.stagioni.length;
            const stagionLabel = count === 1 ? '1 Stagione' : `${count} Stagioni`;
            const stagioni = [...data.stagioni].sort((a, b) => b.annoInizio - a.annoInizio);

            const teamsHtml = stagioni.map(s => `
                <div class="mister-team-entry">
                    <div class="mister-team-season">${s.anno}</div>
                    <div class="mister-team-info">
                        <img src="${s.logo}" class="mister-team-logo" onerror="this.src='images/default.png'" title="${s.squadra}">
                        <span class="mister-team-name">${s.squadra}</span>
                        <span class="mister-team-pos">${s.vice ? '<span class="badge-vice">Vice</span>' : s.parziale ? '<span class="badge-parziale">Parziale</span>' : getPosLabel(s.pos)}</span>
                    </div>
                </div>
            `).join('');

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

    html += '</div>';
    targetContainer.innerHTML += html;
}

function createMisterModal() {
    if (document.getElementById('misterModal')) return;
    const modal = document.createElement('div');
    modal.id = 'misterModal';
    modal.className = 'mister-modal-overlay';
    modal.innerHTML = `
        <div class="mister-modal-box">
            <button class="mister-modal-close" onclick="closeMisterModal()">✕</button>
            <div id="misterModalContent"></div>
        </div>
    `;
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeMisterModal();
    });
    document.body.appendChild(modal);
}

function openMisterModal(encodedName) {
    const name = decodeURIComponent(encodedName);
    const stats = buildMisterStats();
    const data = stats[name];
    if (!data) return;

    const stagioni = [...data.stagioni].sort((a, b) => b.annoInizio - a.annoInizio);
    const titoli = fantaData.palmares.filter(p => {
        const cleanAlle = p.allenatore.split('(')[0].trim();
        return cleanAlle === name && p.vincitore !== 'TBD';
    });

    const coppeVinte = (fantaData.coppa || []).filter(c =>
        c.mister_vincitore.split('(')[0].trim() === name
    );

    const torneiVinti = (fantaData.tornei || []).filter(t =>
        t.mister_vincitore.split('(')[0].trim() === name
    );

    // All coppa participations
    const coppePartecipazioni = (fantaData.coppa || []).map(c => {
        const entry = (c.classifica || []).find(r => r.mister.split('(')[0].trim() === name);
        if (!entry) return null;
        return { stagione: c.stagione, squadra: entry.squadra, logo: entry.logo, fase: entry.fase, pos: entry.pos, inCorso: c.risultato === 'In corso' };
    }).filter(Boolean);

    // All tornei participations
    const torneiPartecipazioni = (fantaData.tornei || []).map(t => {
        const entry = (t.classifica || []).find(r => r.mister.split('(')[0].trim() === name);
        if (!entry) return null;
        return { tipo: t.tipo, edizione: t.edizione, nazione: entry.nazione, logo: entry.logo, fase: entry.fase, punti: entry.punti, pos: entry.pos };
    }).filter(Boolean);

    const ori = stagioni.filter(s => s.pos === 1).length;
    const argenti = stagioni.filter(s => s.pos === 2).length;
    const bronzi = stagioni.filter(s => s.pos === 3).length;
    const podi = ori + argenti + bronzi;
    const partecipazioni = stagioni.length;

    const trofeiHtml = titoli.length > 0 ? titoli.map(t => `
        <div class="modal-trophy-entry">
            <img src="${t.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
            <div>
                <div class="modal-trophy-season">Stagione ${t.stagione}</div>
                <div class="modal-trophy-team">🏆 ${t.vincitore}</div>
            </div>
        </div>
    `).join('') : `<div class="modal-no-trophies">Nessun titolo ancora</div>`;

    const stagionDetailHtml = stagioni.map(s => `
        <div class="modal-season-row">
            <span class="modal-season-year">${s.anno}</span>
            <div class="modal-season-team">
                <img src="${s.logo}" onerror="this.src='images/default.png'" class="modal-season-logo">
                <div>
                    <span>${s.squadra}</span>
                    ${s.nota ? `<div class="modal-season-nota">${s.nota}</div>` : ''}
                </div>
            </div>
            <span class="modal-season-pos">${s.vice ? '<span class="badge-vice">Vice</span>' : s.parziale ? '<span class="badge-parziale">Parziale</span>' : getPosLabel(s.pos)}</span>
        </div>
    `).join('');

    const initiali = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

    document.getElementById('misterModalContent').innerHTML = `
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

        ${coppeVinte.length > 0 ? `
        <div class="modal-section-title coppa-modal-title">🏆 FantaCoppa Italia Frecciarossa</div>
        <div class="modal-trophies-list">${coppeVinte.map(c => `
            <div class="modal-trophy-entry coppa-entry">
                <img src="${c.logo_vincitore}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
                <div>
                    <div class="modal-trophy-season">FantaCoppa Italia Frecciarossa ${c.stagione}</div>
                    <div class="modal-trophy-team coppa-trophy-team">🏆 ${c.vincitore}</div>
                </div>
            </div>
        `).join('')}</div>
        ` : ''}

        ${coppePartecipazioni.length > 0 ? `
        <div class="modal-section-title coppa-modal-title">🏆 FantaCoppa Italia Frecciarossa</div>
        <div class="modal-trophies-list">${coppePartecipazioni.map(c => {
            const faseColor = c.fase === 'Campione' ? 'fase-campione' : c.fase === 'Finale' ? 'fase-finale' : c.inCorso ? 'fase-incorso' : 'fase-eliminato';
            return `
            <div class="modal-trophy-entry coppa-entry partecipazione-entry">
                <img src="${c.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
                <div class="partecipazione-info">
                    <div class="modal-trophy-season">Stagione ${c.stagione}</div>
                    <div class="partecipazione-squadra">${c.squadra}</div>
                </div>
                <span class="fase-badge ${faseColor}">${c.fase}</span>
            </div>`;
        }).join('')}</div>
        ` : ''}

        ${torneiPartecipazioni.length > 0 ? `
        <div class="modal-section-title tornei-modal-title">🌍 Tornei Internazionali</div>
        <div class="modal-trophies-list">${torneiPartecipazioni.map(t => {
            const icon = t.tipo === 'FantaMundial' ? '🌍' : '⭐';
            const tClass = t.tipo === 'FantaMundial' ? 'torneo-entry mondiale-entry' : 'torneo-entry europeo-entry';
            const faseColor = t.fase === 'Campione' ? 'fase-campione' : t.fase === 'Finale' ? 'fase-finale' : 'fase-eliminato';
            const ptsLabel = t.punti !== null && t.punti !== undefined ? ` — ${t.punti} pt` : '';
            return `
            <div class="modal-trophy-entry ${tClass} partecipazione-entry">
                <img src="${t.logo}" class="modal-trophy-logo" onerror="this.src='images/default.png'">
                <div class="partecipazione-info">
                    <div class="modal-trophy-season">${icon} ${t.tipo} — ${t.edizione}</div>
                    <div class="partecipazione-squadra">${t.nazione}${ptsLabel}</div>
                </div>
                <span class="fase-badge ${faseColor}">${t.fase}</span>
            </div>`;
        }).join('')}</div>
        ` : ''}

        <div class="modal-section-title">📋 Storico Stagioni</div>
        <div class="modal-seasons-list">${stagionDetailHtml}</div>
    `;

    const modal = document.getElementById('misterModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMisterModal() {
    const modal = document.getElementById('misterModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function getPosLabel(pos) {
    if (pos === 1) return '🥇 1°';
    if (pos === 2) return '🥈 2°';
    if (pos === 3) return '🥉 3°';
    return `${pos}°`;
}

function changeSeason(val) {
    renderSeason(val);
}

function togglePalmares() {
    const isPalmaresHidden = document.getElementById('palmaresSection').classList.contains('hidden');
    document.getElementById('palmaresSection').classList.toggle('hidden');
    document.getElementById('rankingSection').classList.toggle('hidden');
    const btn = document.querySelector('.btn-palmares');
    btn.innerText = isPalmaresHidden ? "Torna alla Classifica" : "🏆 PALMARÈS";
}

window.onload = loadData;