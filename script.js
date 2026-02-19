let fantaData = {};

async function loadData() {
    try {
        const response = await fetch('data.json');
        fantaData = await response.json();
        initApp();
    } catch (e) {
        console.error("Errore caricamento:", e);
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
    container.innerHTML = '';
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
}

function changeSeason(val) {
    renderSeason(val);
}

function togglePalmares() {
    document.getElementById('palmaresSection').classList.toggle('hidden');
    document.getElementById('rankingSection').classList.toggle('hidden');
}

window.onload = loadData;