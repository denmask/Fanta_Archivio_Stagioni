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
        container.innerHTML += `
            <div class="palmares-card" style="animation-delay: ${i * 0.1}s">
                <div class="palmares-info">
                    <div class="palmares-season">STAGIONE ${p.stagione}</div>
                    <div class="palmares-winner">🏆 ${p.vincitore}</div>
                    <div class="palmares-mister">Fantallenatore: <b>${p.allenatore}</b></div>
                </div>
                <img src="${p.logo}" class="palmares-badge" onerror="this.src='images/default.png'">
            </div>
        `;
    });

    renderHallOfFame(container);
}

function renderHallOfFame(targetContainer) {
    // Build per-coach data: stagioni array con {anno, squadra, logo, pos}
    const stats = {};

    fantaData.stagioni.forEach(s => {
        const annoInizio = parseInt(s.anno.split('-')[0]);
        
        s.classifica.forEach(t => {
            const m = t.mister;
            if (!m) return;

            const cleanName = m.split('(')[0].trim();

            if (!stats[cleanName]) {
                stats[cleanName] = { stagioni: [] };
            }
            stats[cleanName].stagioni.push({
                anno: s.anno,
                annoInizio,
                squadra: t.squadra,
                logo: t.logo,
                pos: t.pos
            });
        });
    });

    let html = '<h2 class="section-title">Hall of Fame Allenatori</h2>';
    html += '<div class="hall-of-fame-grid">';
    
    Object.keys(stats)
        .sort((a, b) => stats[b].stagioni.length - stats[a].stagioni.length)
        .forEach(m => {
            const data = stats[m];
            const count = data.stagioni.length;
            const stagionLabel = count === 1 ? '1 Stagione' : `${count} Stagioni`;

            // Sort stagioni per anno decrescente
            const stagioni = [...data.stagioni].sort((a, b) => b.annoInizio - a.annoInizio);

            const teamsHtml = stagioni.map(s => `
                <div class="mister-team-entry">
                    <div class="mister-team-season">${s.anno}</div>
                    <div class="mister-team-info">
                        <img src="${s.logo}" class="mister-team-logo" onerror="this.src='images/default.png'" title="${s.squadra}">
                        <span class="mister-team-name">${s.squadra}</span>
                        <span class="mister-team-pos">${getPosLabel(s.pos)}</span>
                    </div>
                </div>
            `).join('');

            html += `
                <div class="mister-card">
                    <div class="mister-card-header">
                        <div class="mister-name">${m}</div>
                        <div class="mister-stats-badge">${stagionLabel}</div>
                    </div>
                    <div class="mister-teams-list">
                        ${teamsHtml}
                    </div>
                </div>
            `;
        });

    html += '</div>';
    targetContainer.innerHTML += html;
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