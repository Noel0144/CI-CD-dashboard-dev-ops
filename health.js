// ─── SERVICE DATA ─────────────────────────────────────────────
const services = [
    { name: 'API Gateway',            metric: 'Uptime (30d)',     status: 'Online',    value: '99.98%  |  45ms avg latency' },
    { name: 'Database Cluster',       metric: 'CPU Utilization',  status: 'Active',    value: '12.5%  |  124 active connections' },
    { name: 'Authentication Service', metric: 'Avg Response',     status: 'Healthy',   value: '18ms  |  All nodes operational' },
    { name: 'Redis Cache',            metric: 'Memory Usage',     status: 'High Load', value: '88.2%  |  Eviction rate 2.1/s' },
];

// ─── ALERT DATA ───────────────────────────────────────────────
const alerts = [
    {
        title:     'Cache Memory Threshold',
        severity:  'warning',
        message:   'Redis-01 memory usage exceeded 85%. Scaling may be required.',
        timestamp: 'Detected: 15 minutes ago',
    },
    {
        title:     'Database Backup Complete',
        severity:  'success',
        message:   'Daily automated backup for DB-Cluster successfully archived to S3.',
        timestamp: 'Timestamp: 2026-02-21 04:00',
    },
];

// ─── CHARTS ──────────────────────────────────────────────────
let donutChart, barChart;

function initCharts() {
    // Donut — healthy / warning / critical
    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Warning', 'Critical'],
            datasets: [{
                data: [3, 1, 0],
                backgroundColor: ['#0ceb0c', '#f5c518', '#ff4d4d'],
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

    // Bar — resource utilization per service
    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: ['API Gateway', 'DB Cluster', 'Auth Service', 'Redis Cache'],
            datasets: [{
                label: 'Utilization %',
                data: [1, 12.5, 9, 88.2],   // normalized/representative values
                backgroundColor: ['#32e6e2', '#32e6e2', '#32e6e2', '#f5c518'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 12 } }, grid: { color: '#1e2a38' } },
                y: {
                    ticks: { color: '#aaa', font: { size: 12 } },
                    grid: { color: '#1e2a38' },
                    max: 100
                }
            }
        }
    });
}

// ─── SERVICE TABLE ────────────────────────────────────────────
function buildServiceTable() {
    const tbody = document.getElementById('serviceTableBody');
    tbody.innerHTML = '';
    services.forEach(s => {
        const pillClass = s.status === 'Online'  || s.status === 'Active' || s.status === 'Healthy'
            ? 'status-success'
            : s.status === 'High Load'
            ? 'status-warning'
            : 'status-error';

        tbody.innerHTML += `
          <tr>
            <td>${s.name}</td>
            <td><span class="branch-tag">${s.metric}</span></td>
            <td><span class="status-pill ${pillClass}">${s.status}</span></td>
            <td>${s.value}</td>
          </tr>`;
    });
}

// ─── ALERTS ───────────────────────────────────────────────────
function buildAlerts() {
    const container = document.getElementById('alertList');
    container.innerHTML = '';
    alerts.forEach(a => {
        const borderColor = a.severity === 'warning' ? '#ffa500' : '#0ceb0c';
        const pillClass   = a.severity === 'warning' ? 'status-warning' : 'status-success';
        const pillLabel   = a.severity === 'warning' ? 'Warning' : 'Info';

        container.innerHTML += `
          <div class="alert-item" style="border-left: 4px solid ${borderColor};">
              <div class="alert-header">
                  <strong>${a.title}</strong>
                  <span class="status-pill ${pillClass}">${pillLabel}</span>
              </div>
              <p class="alert-msg">${a.message}</p>
              <span class="stat-label">${a.timestamp}</span>
          </div>`;
    });
}

// ─── TOGGLE — independent panels ─────────────────────────────
function togglePanel(panelId, btn) {
    const panel = document.getElementById(panelId);
    const open  = panel.classList.toggle('visible');

    if (panelId === 'servicePanel') {
        btn.textContent = open ? '⬆ Service Details' : '⬇ Service Details';
        if (open) btn.innerHTML = '⬆ Service Details';
        else      btn.innerHTML = '&#11015; Service Details';
    } else {
        if (open) btn.innerHTML = '⬆ Active Alerts <span class="alert-badge">2</span>';
        else      btn.innerHTML = '&#9888; Active Alerts <span class="alert-badge">2</span>';
    }
}

// ─── INIT ─────────────────────────────────────────────────────
initCharts();
buildServiceTable();
buildAlerts();