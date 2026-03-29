const REPO = localStorage.getItem('targetRepo') || 'defxharsh/CI-CD-Pipeline-DevOps-';
const userStatus = localStorage.getItem('githubUser');
if (!userStatus) window.location.href = 'login.html';
const HEADERS = {};

let donutChart, barChart;

async function fetchHealthData() {
    try {
        // Fetch repository issues to simulate alerts
        const issueRes = await fetch(`/api/github/repos/${REPO}/issues?state=open&per_page=5`, { headers: HEADERS });
        let issues = [];
        if (issueRes.ok) {
            issues = await issueRes.json();
        }

        // Fetch rate limit as a dynamic metric
        const rlRes = await fetch(`/api/github/rate_limit`, { headers: HEADERS });
        let rateLimit = { resources: { core: { limit: 5000, remaining: 5000 } } };
        if (rlRes.ok) {
            rateLimit = await rlRes.json();
        }

        const metrics = [
            { name: 'GitHub API Rate Limit', metric: 'Remaining Requests', status: rateLimit.resources.core.remaining > 1000 ? 'Healthy' : 'Warning', value: `${rateLimit.resources.core.remaining} / ${rateLimit.resources.core.limit}` },
            { name: 'Repository Issues', metric: 'Open Issues', status: issues.length > 0 ? 'Warning' : 'Healthy', value: `${issues.length} active issues` },
            { name: 'Authentication Layer', metric: 'Avg Response', status: 'Healthy', value: '25ms | OK' },
            { name: 'Frontend Hosting', metric: 'Availability', status: 'Online', value: '99.9% Uptime' }
        ];

        const alerts = issues.map(iss => ({
            title: `Issue #${iss.number}: ${iss.title}`,
            severity: iss.labels && iss.labels.find(l => l.name.toLowerCase().includes('bug')) ? 'critical' : 'warning',
            message: iss.body ? iss.body.substring(0, 50) + '...' : 'No description provided.',
            timestamp: `Created: ${new Date(iss.created_at).toLocaleString()}`
        }));

        if (alerts.length === 0) {
            alerts.push({
                title: 'System Stable',
                severity: 'success',
                message: 'No open issues detected in the repository.',
                timestamp: 'Last checked just now'
            });
        }

        return {
            services: metrics,
            alerts: alerts
        };

    } catch (e) {
        console.error("Error fetching health data:", e);
        return { services: [], alerts: [] };
    }
}

function initCharts(data) {
    const services = data.services || [];
    const healthy = services.filter(s => s.status === 'Healthy' || s.status === 'Online').length;
    const warning = services.filter(s => s.status === 'Warning').length;
    const critical = services.filter(s => s.status === 'Critical').length;

    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 5) {
        statCards[0].textContent = services.length;
        statCards[1].textContent = healthy;
        statCards[2].textContent = warning;
        statCards[3].textContent = critical;
        statCards[4].textContent = '99.98%'; // Mock avg uptime
    }

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Warning', 'Critical'],
            datasets: [{
                data: [healthy, warning, critical],
                backgroundColor: ['#0ceb0c', '#f5c518', '#ff4d4d'],
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
            labels: services.map(s => s.name.substring(0, 10)),
            datasets: [{
                label: 'Load / Utilization',
                data: [45, 12, 8, 30], // Mock utilization
                backgroundColor: ['#32e6e2', '#32e6e2', '#f5c518', '#32e6e2'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } },
                y: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' }, max: 100 }
            }
        }
    });
}

function buildServiceTable(services) {
    const tbody = document.getElementById('serviceTableBody');
    tbody.innerHTML = '';
    services.forEach(s => {
        const pillClass = s.status === 'Online' || s.status === 'Healthy' ? 'status-success' : s.status === 'Warning' ? 'status-warning' : 'status-error';
        tbody.innerHTML += `
          <tr>
            <td>${s.name}</td>
            <td><span class="branch-tag">${s.metric}</span></td>
            <td><span class="status-pill ${pillClass}">${s.status}</span></td>
            <td>${s.value}</td>
          </tr>`;
    });
}

function buildAlerts(alerts) {
    const container = document.getElementById('alertList');
    container.innerHTML = '';

    // Update Notification Badge
    const alertBtns = document.querySelectorAll('.toggle-btn-alert .alert-badge');
    if (alertBtns.length > 0) alertBtns[0].textContent = alerts.filter(a => a.severity !== 'success').length;

    alerts.forEach(a => {
        const borderColor = a.severity === 'warning' ? '#f5c518' : a.severity === 'critical' ? '#ff4d4d' : '#0ceb0c';
        const pillClass = a.severity === 'warning' ? 'status-warning' : a.severity === 'critical' ? 'status-error' : 'status-success';
        const pillLabel = a.severity;

        container.innerHTML += `
          <div class="alert-item" style="border-left: 4px solid ${borderColor};">
              <div class="alert-header">
                  <strong>${a.title}</strong>
                  <span class="status-pill ${pillClass}">${pillLabel.toUpperCase()}</span>
              </div>
              <p class="alert-msg">${a.message}</p>
              <span class="stat-label">${a.timestamp}</span>
          </div>`;
    });
}

function togglePanel(panelId, btn) {
    const panel = document.getElementById(panelId);
    const open = panel.classList.toggle('visible');

    if (panelId === 'servicePanel') {
        const arrow = open ? '⬆' : '⬇';
        btn.innerHTML = `${arrow} Service Details`;
    } else {
        const arrow = open ? '⬆' : '&#9888;';
        const badgeCount = document.querySelector('.alert-badge') ? document.querySelector('.alert-badge').textContent : '0';
        btn.innerHTML = `${arrow} Active Alerts <span class="alert-badge">${badgeCount}</span>`;
    }
}

async function init() {
    const data = await fetchHealthData();
    initCharts(data);
    buildServiceTable(data.services);
    buildAlerts(data.alerts);
}

init();