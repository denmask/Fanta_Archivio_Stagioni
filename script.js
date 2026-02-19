let fantaData = {};

// Caricamento dati dal file JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        fantaData = await response.json();
        initApp();
    } catch (e) {
        console.error("Errore nel caricamento dei dati:", e);
    }
}

// Inizializzazione App e Selettore Stagioni
function initApp() {
    const selector = document.getElementById('seasonSelector');
    selector.innerHTML = '';
    
    fantaData.stagioni.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.anno;
        opt.innerText = s.anno;
        selector.appendChild(opt);
    });

    // Renderizza la stagione più recente all'avvio
    renderSeason(fantaData.stagioni[0].anno);
    renderPalmares();
}

// Renderizza la classifica della stagione selezionata
function renderSeason(anno) {
    const season = fantaData.stagioni.find(s => s.anno === anno);
    document.getElementById('currentSeasonTitle').innerText = `Serie A ${season.anno}`;
    
    // Gestione Sponsor Logo
    const sponsorImg = document.getElementById('sponsorLogo');
    sponsorImg.src = season.sponsor === 'TIM' ? 'images/seriea_tim.png' : 'images/seriea_enilive.png';

    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    // Attivazione fasce colorate solo per 24/25 e 25/26
    const useFasce = (anno === "2025-26" || anno === "2024-25");

    season.classifica.forEach((team, i) => {
        let fasciaClass = "";
        if (useFasce) {
            if (team.pos <= 4) fasciaClass = "f1";      // Fascia 1: Azzurro
            else if (team.pos <= 6) fasciaClass = "f2"; // Fascia 2: Arancio
            else if (team.pos <= 8) fasciaClass = "f3"; // Fascia 3: Verde
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

// Renderizza l'Albo d'Oro e la Hall of Fame
function renderPalmares() {
    const container = document.getElementById('palmaresGrid');
    container.innerHTML = '<h2 class="section-title">Albo d’Oro</h2>'; 
    
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

    // Aggiunge la sezione Hall of Fame in coda
    renderHallOfFame(container);
}

// Funzione Calcolo Statistiche Allenatori (Hall of Fame)
function renderHallOfFame(targetContainer) {
    const stats = {};
    const currentSeason = "2025-26";

    // Analisi di tutte le stagioni nel JSON
    fantaData.stagioni.forEach(s => {
        const annoInizio = parseInt(s.anno.split('-')[0]);
        
        s.classifica.forEach(t => {
            const m = t.mister;
            if (!m) return;

            // Pulizia nome (rimuove eventuali parentesi per il conteggio unico)
            const cleanName = m.split('(')[0].trim();

            if (!stats[cleanName]) {
                stats[cleanName] = { count: 0, years: [] };
            }
            stats[cleanName].count++;
            stats[cleanName].years.push(annoInizio);
        });
    });

    let html = '<h2 class="section-title">Hall of Fame Allenatori</h2>';
    html += '<div class="hall-of-fame-grid">';
    
    // Ordinamento per numero di stagioni decrescente
    Object.keys(stats).sort((a, b) => stats[b].count - stats[a].count).forEach(m => {
        const startYear = Math.min(...stats[m].years);
        const endYear = Math.max(...stats[m].years);
        
        // Se l'ultima stagione registrata è quella attuale, scrivi "In corso"
        const periodLabel = endYear >= 2025 ? `${startYear} - In corso` : `${startYear} - ${endYear + 1}`;
        
        html += `
            <div class="mister-card">
                <div class="mister-name">${m}</div>
                <div class="mister-stats">${stats[m].count} Stagioni</div>
                <div class="mister-period">${periodLabel}</div>
            </div>
        `;
    });

    html += '</div>';
    targetContainer.innerHTML += html;
}

// Navigazione tra le sezioni
function changeSeason(val) {
    renderSeason(val);
}

function togglePalmares() {
    const isPalmaresHidden = document.getElementById('palmaresSection').classList.contains('hidden');
    
    document.getElementById('palmaresSection').classList.toggle('hidden');
    document.getElementById('rankingSection').classList.toggle('hidden');
    
    // Aggiorna il testo del bottone se necessario
    const btn = document.querySelector('.btn-palmares');
    btn.innerText = isPalmaresHidden ? "Torna alla Classifica" : "Vedi Albo d'Oro";
}

// Avvio al caricamento della pagina
window.onload = loadData;