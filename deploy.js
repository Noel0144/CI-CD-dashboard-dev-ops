// ─── DEPLOYMENT DATA ─────────────────────────────────────────
const allDeployments = [
    { env: 'Production',  version: 'v2.4.0',      status: 'Success',    duration: 252, timestamp: '2h ago' },
    { env: 'Staging',     version: 'v2.4.0',      status: 'Success',    duration: 225, timestamp: '3h ago' },
    { env: 'Production',  version: 'v2.3.9',      status: 'Success',    duration: 245, timestamp: '6h ago' },
    { env: 'QA',          version: 'v2.5.0-beta', status: 'Success',    duration: 198, timestamp: '9h ago' },
    { env: 'Staging',     version: 'v2.5.0-rc1',  status: 'Deploying',  duration: 180, timestamp: 'Just now' },
    { env: 'Production',  version: 'v2.3.8',      status: 'Success',    duration: 260, timestamp: '1d ago' },
    { env: 'QA',          version: 'v2.4.9',      status: 'Failed',     duration: 140, timestamp: '1d ago' },
    { env: 'Staging',     version: 'v2.3.9',      status: 'Success',    duration: 215, timestamp: '2d ago' },
];

// ─── CHARTS ──────────────────────────────────────────────────
let donutChart, barChart;

function initCharts(deployments) {
    const success   = deployments.filter(d => d.status === 'Success').length;
    const failed    = deployments.filter(d => d.status === 'Failed').length;
    const deploying = deployments.filter(d => d.status === 'Deploying').length;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Failed', 'Deploying'],
            datasets: [{
                data: [success, failed, deploying],
                backgroundColor: ['#0ceb0c', '#ff4d4d', '#f5c518'],
                borderWidth: 2,
                borderColor: '#1a2535'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ddd', font: { size: 12 }, padding: 12 }
                }
            }
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
                    d.status === 'Failed'    ? '#ff4d4d' :
                    d.status === 'Deploying' ? '#f5c518' : '#32e6e2'
                ),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } },
                y: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } }
            }
        }
    });
}

// ─── TABLE ───────────────────────────────────────────────────
function buildTable(deployments) {
    const tbody = document.getElementById('deployTableBody');
    tbody.innerHTML = '';
    deployments.forEach(d => {
        const pill = d.status === 'Success'   ? 'status-success' :
                    d.status === 'Failed'    ? 'status-error'   : 'status-warning';

        const mins = Math.floor(d.duration / 60);
        const secs = d.duration % 60;
        const dur  = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

        // Timestamp icon + text
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

// ─── TOGGLE ──────────────────────────────────────────────────
function toggleDetail(btn) {
    const panel = document.getElementById('detailPanel');
    const open  = panel.classList.toggle('visible');
    btn.textContent = open ? '⬆ Hide Details' : '⬇ View Details';
}

// ─── INIT ─────────────────────────────────────────────────────
initCharts(allDeployments);
buildTable(allDeployments);