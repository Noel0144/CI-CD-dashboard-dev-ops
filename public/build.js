const REPO = localStorage.getItem('targetRepo') || 'defxharsh/CI-CD-Pipeline-DevOps-';
const userStatus = localStorage.getItem('githubUser');
if (!userStatus) window.location.href = 'login.html';
const HEADERS = {};

let donutChart, barChart;

async function fetchBuilds() {
    try {
        const res = await fetch(`/api/github/repos/${REPO}/actions/runs?per_page=15`, { headers: HEADERS });
        if (!res.ok) return [];
        const data = await res.json();

        return data.workflow_runs.map(run => {
            let status = 'Running';
            if (run.status === 'completed') {
                status = run.conclusion === 'success' ? 'Passed' : 'Failed';
            }
            const start = new Date(run.created_at).getTime();
            const end = new Date(run.updated_at).getTime();
            const durationSecs = Math.floor((end - start) / 1000);

            return {
                id: run.run_number,
                branch: run.head_branch,
                status: status,
                duration: durationSecs > 0 ? durationSecs : 0
            };
        });
    } catch (e) {
        console.error("Error fetching builds:", e);
        return [];
    }
}

function initCharts(builds) {
    const passed = builds.filter(b => b.status === 'Passed').length;
    const failed = builds.filter(b => b.status === 'Failed').length;
    const running = builds.filter(b => b.status === 'Running').length;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Running'],
            datasets: [{
                data: [passed, failed, running],
                backgroundColor: ['#0ceb0c', '#ff4d4d', '#f5c518'],
                borderWidth: 2,
                borderColor: '#1a2535'
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
            labels: builds.map(b => '#' + b.id),
            datasets: [{
                label: 'Duration (s)',
                data: builds.map(b => b.duration),
                backgroundColor: builds.map(b =>
                    b.status === 'Failed' ? '#ff4d4d' :
                        b.status === 'Running' ? '#f5c518' : '#32e6e2'
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
}

function updateKPIs(builds) {
    const passed = builds.filter(b => b.status === 'Passed').length;
    const failed = builds.filter(b => b.status === 'Failed').length;
    const running = builds.filter(b => b.status === 'Running').length;
    let avgDur = 0;
    if (builds.length > 0) {
        avgDur = Math.floor(builds.reduce((sum, b) => sum + b.duration, 0) / builds.length);
    }
    const mins = Math.floor(avgDur / 60);
    const secs = avgDur % 60;

    document.getElementById('kpi-total').textContent = builds.length;
    document.getElementById('kpi-pass').textContent = passed;
    document.getElementById('kpi-fail').textContent = failed;
    document.getElementById('kpi-run').textContent = running;

    // Select the 5th stat card for avg duration
    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 5) {
        statCards[4].textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
}

function buildTable(builds) {
    const tbody = document.getElementById('buildTableBody');
    tbody.innerHTML = '';
    builds.forEach(b => {
        const pill = b.status === 'Passed' ? 'status-success' :
            b.status === 'Failed' ? 'status-error' : 'status-warning';
        const mins = Math.floor(b.duration / 60);
        const secs = b.duration % 60;
        const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

        tbody.innerHTML += `
          <tr>
            <td>#${b.id}</td>
            <td><span class="branch-tag">${b.branch}</span></td>
            <td><span class="status-pill ${pill}">${b.status}</span></td>
            <td>${dur}</td>
          </tr>`;
    });
}

function toggleDetail(btn) {
    const panel = document.getElementById('detailPanel');
    const open = panel.classList.toggle('visible');
    btn.textContent = open ? '⬆ Hide Details' : '⬇ View Details';
}

async function init() {
    const builds = await fetchBuilds();
    if (builds.length > 0) {
        // Reverse so the newest is at the end of the chart, or keep as is
        initCharts(builds);
        updateKPIs(builds);
        buildTable(builds);
    } else {
        // Fallback UI or empty state
        document.getElementById('kpi-total').textContent = "0";
        document.getElementById('kpi-pass').textContent = "0";
        document.getElementById('kpi-fail').textContent = "0";
        document.getElementById('kpi-run').textContent = "0";
    }
}

init();