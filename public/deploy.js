const REPO = localStorage.getItem('targetRepo') || 'defxharsh/CI-CD-Pipeline-DevOps-';
const userStatus = localStorage.getItem('githubUser');
if (!userStatus) window.location.href = 'login.html';
const HEADERS = {};

let donutChart, barChart;

async function fetchDeployments() {
    try {
        // We map "deploy" jobs or environments using deployments API
        const res = await fetch(`/api/github/repos/${REPO}/deployments`, { headers: HEADERS });
        if (!res.ok) return [];
        const deployments = await res.json();

        let deployData = [];
        for (let d of deployments.slice(0, 10)) {
            const statRes = await fetch(d.statuses_url.replace('https://api.github.com', '/api/github'), { headers: HEADERS });
            let statusStr = "Deploying";
            if (statRes.ok) {
                const statuses = await statRes.json();
                if (statuses.length > 0) {
                    const st = statuses[0].state; // pending, success, failure, error
                    if (st === 'success') statusStr = 'Success';
                    else if (st === 'failure' || st === 'error') statusStr = 'Failed';
                }
            }

            const start = new Date(d.created_at).getTime();
            const end = new Date(d.updated_at).getTime();
            const durationSecs = Math.floor((end - start) / 1000);

            // generate human friendly timestamp
            const agoSecs = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 1000);
            const hrs = Math.floor(agoSecs / 3600);
            let agoStr = hrs > 24 ? Math.floor(hrs / 24) + 'd ago' : (hrs > 0 ? hrs + 'h ago' : Math.floor(agoSecs / 60) + 'm ago');

            deployData.push({
                env: d.environment || 'Production',
                version: d.ref,
                status: statusStr,
                duration: durationSecs > 0 ? durationSecs : 45, // Fallback if 0
                timestamp: agoStr
            });
        }
        return deployData;
    } catch (e) {
        console.error("Error fetching deployments:", e);
        return [];
    }
}

function initCharts(deployments) {
    const success = deployments.filter(d => d.status === 'Success').length;
    const failed = deployments.filter(d => d.status === 'Failed').length;
    const deploying = deployments.filter(d => d.status === 'Deploying').length;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Failed', 'Deploying'],
            datasets: [{
                data: [success, failed, deploying],
                backgroundColor: ['#0ceb0c', '#ff4d4d', '#f5c518'],
                borderWidth: 2, borderColor: '#1a2535'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '55%',
            plugins: { legend: { position: 'bottom', labels: { color: '#ddd', font: { size: 12 }, padding: 12 } } }
        }
    });

    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: deployments.map((d, i) => d.env.slice(0, 4) + ' #' + (i + 1)),
            datasets: [{
                label: 'Duration (s)',
                data: deployments.map(d => d.duration),
                backgroundColor: deployments.map(d =>
                    d.status === 'Failed' ? '#ff4d4d' :
                        d.status === 'Deploying' ? '#f5c518' : '#32e6e2'
                ),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } },
                y: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } }
            }
        }
    });

    // Update KPI counters based on latest API data
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 5) {
        const uniqueEnvs = new Set(deployments.map(d => d.env)).size;
        statNumbers[0].textContent = uniqueEnvs || '0';
        statNumbers[1].textContent = success;
        statNumbers[2].textContent = deploying;
        statNumbers[3].textContent = deployments.length > 0 ? deployments[0].version : 'N/A';

        let avgDur = 0;
        if (deployments.length > 0) {
            avgDur = Math.floor(deployments.reduce((sum, d) => sum + d.duration, 0) / deployments.length);
        }
        const mins = Math.floor(avgDur / 60);
        const secs = avgDur % 60;
        statNumbers[4].textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
}

function buildTable(deployments) {
    const tbody = document.getElementById('deployTableBody');
    tbody.innerHTML = '';
    deployments.forEach(d => {
        const pill = d.status === 'Success' ? 'status-success' :
            d.status === 'Failed' ? 'status-error' : 'status-warning';

        const mins = Math.floor(d.duration / 60);
        const secs = d.duration % 60;
        const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const tsIcon = d.status === 'Deploying' ? '🔄' : '🕐';

        tbody.innerHTML += `
        <tr>
            <td>${d.env}</td>
            <td><span class="branch-tag">${d.version}</span></td>
            <td><span class="status-pill ${pill}">${d.status}</span></td>
            <td>${dur}</td>
            <td><span class="timestamp-cell">${tsIcon} ${d.timestamp}</span></td>
        </tr>`;
    });
}

function toggleDetail(btn) {
    const panel = document.getElementById('detailPanel');
    const open = panel.classList.toggle('visible');
    btn.textContent = open ? '⬆ Hide Details' : '⬇ View Details';
}

async function init() {
    let deployments = await fetchDeployments();
    if (deployments.length === 0) {
        // Fallback to mock data if there are no real deployments in the repo
        deployments = [
            { env: 'Production', version: 'main', status: 'Success', duration: 252, timestamp: '2h ago' },
            { env: 'Staging', version: 'dev', status: 'Success', duration: 225, timestamp: '3h ago' }
        ];
    }
    initCharts(deployments);
    buildTable(deployments);
}

init();