const REPO = localStorage.getItem('targetRepo') || 'defxharsh/CI-CD-Pipeline-DevOps-';
const userStatus = localStorage.getItem('githubUser');
if (!userStatus) window.location.href = 'login.html';
const HEADERS = {};

let donutChart, barChart;

async function fetchPipelineData() {
    try {
        const res = await fetch(`/api/github/repos/${REPO}/actions/runs?per_page=10`, { headers: HEADERS });
        if (!res.ok) return { runs: [], stages: [], history: [] };
        const data = await res.json();

        const workflowRuns = data.workflow_runs;
        let runsArray = [];
        let historyArray = [];

        let allJobs = [];

        // Fetch jobs for each run (in parallel for up to 5 runs)
        const runPromises = workflowRuns.slice(0, 5).map(async (run) => {
            const jobsRes = await fetch(run.jobs_url.replace('https://api.github.com', '/api/github'), { headers: HEADERS });
            if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                allJobs = allJobs.concat(jobsData.jobs);

                let runStatus = 'Running';
                if (run.status === 'completed') runStatus = run.conclusion === 'success' ? 'Passed' : 'Failed';

                const start = new Date(run.created_at).getTime();
                const end = new Date(run.updated_at).getTime();
                const durSecs = Math.floor((end - start) / 1000);
                const mins = Math.floor(durSecs / 60);
                const secs = durSecs % 60;

                const agoSecs = Math.floor((Date.now() - start) / 1000);
                const hrs = Math.floor(agoSecs / 3600);
                const agoStr = hrs > 0 ? hrs + ' hours ago' : Math.floor(agoSecs / 60) + ' mins ago';

                // Map jobs to stages
                const stagesList = jobsData.jobs.map(job => {
                    let jobState = 'running';
                    if (job.status === 'completed') {
                        jobState = job.conclusion === 'success' ? 'pass' : (job.conclusion === 'skipped' ? 'skipped' : 'fail');
                    }
                    return { name: job.name, state: jobState };
                });

                runsArray.push({
                    id: '#' + run.run_number, branch: run.head_branch, by: run.actor.login, ago: agoStr,
                    commit: run.head_sha.substring(0, 7), status: runStatus,
                    stages: stagesList,
                    chips: [`Duration: ${mins}m ${secs}s`, `Workflow: ${run.name}`]
                });

                let failedJob = '—';
                const failedJobs = jobsData.jobs.filter(j => j.conclusion === 'failure');
                if (failedJobs.length > 0) failedJob = failedJobs[0].name;

                historyArray.push({
                    run: '#' + run.run_number, branch: run.head_branch, status: runStatus, duration: `${mins}m ${secs}s`, failed: failedJob
                });
            }
        });

        await Promise.all(runPromises);

        // Compute stage breakdown
        let stageStats = {};
        allJobs.forEach(job => {
            if (!stageStats[job.name]) {
                stageStats[job.name] = { total: 0, failed: 0 };
            }
            stageStats[job.name].total++;
            if (job.conclusion === 'failure') stageStats[job.name].failed++;
        });

        const stagesArray = Object.keys(stageStats).map(name => {
            const stat = stageStats[name];
            const failureRate = (stat.total === 0) ? 0 : ((stat.failed / stat.total) * 100).toFixed(1);
            return {
                name: name,
                rate: parseFloat(failureRate),
                color: parseFloat(failureRate) > 0 ? '#ff4d4d' : '#32e6e2'
            };
        });

        return { runs: runsArray, stages: stagesArray, history: historyArray, rawRuns: workflowRuns };
    } catch (e) {
        console.error("Error fetching pipeline runs:", e);
        return { runs: [], stages: [], history: [], rawRuns: [] };
    }
}

function initCharts(data) {
    const rawRuns = data.rawRuns || [];
    const passed = rawRuns.filter(r => r.conclusion === 'success').length;
    const failed = rawRuns.filter(r => r.conclusion === 'failure').length;
    const running = rawRuns.filter(r => r.status === 'in_progress' || r.status === 'queued').length;

    // Update KPIs based on raw runs
    const statCards = document.querySelectorAll('.stat-number');
    if (statCards.length >= 5) {
        statCards[0].textContent = rawRuns.length;
        const successRate = rawRuns.length > 0 ? ((passed / rawRuns.length) * 100).toFixed(1) : 0;
        statCards[1].textContent = `${successRate}%`;
        statCards[2].textContent = failed;
        statCards[3].textContent = running;
    }

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Running'],
            datasets: [{
                data: [passed, failed, running],
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
            labels: data.stages.map(s => s.name),
            datasets: [{
                label: 'Failure Rate %',
                data: data.stages.map(s => s.rate),
                backgroundColor: data.stages.map(s => s.color),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 11 } }, grid: { color: '#1e2a38' } },
                y: { ticks: { color: '#aaa', font: { size: 12 }, callback: v => v + '%' }, grid: { color: '#1e2a38' } }
            }
        }
    });
}

function buildStageBreakdown(stages) {
    const container = document.getElementById('stageBreakdown');
    container.innerHTML = '';
    stages.forEach(s => {
        const isHighest = s.rate > 0 && s.rate === Math.max(...stages.map(x => x.rate));
        container.innerHTML += `
          <div class="stage-stat-card ${isHighest ? 'stage-stat-card--warn' : ''}">
              <div class="stage-stat-value" style="color:${isHighest ? '#ff4d4d' : '#ffffff'};">${s.rate}%</div>
              <div class="stage-stat-label">${s.name}</div>
          </div>`;
    });
}

function buildRuns(runs) {
    const container = document.getElementById('pipelineRuns');
    container.innerHTML = '';
    runs.forEach(r => {
        const borderColor = r.status === 'Passed' ? '#0ceb0c' : r.status === 'Failed' ? '#ff4d4d' : '#ffa500';
        const pillClass = r.status === 'Passed' ? 'status-success' : r.status === 'Failed' ? 'status-error' : 'status-warning';

        const stageHTML = r.stages.map((s, i) => {
            const boxClass = s.state === 'pass' ? 'pl-stage-pass' : s.state === 'fail' ? 'pl-stage-fail' : s.state === 'running' ? 'pl-stage-running' : 'pl-stage-skip';
            const icon = s.state === 'pass' ? '✓ ' : s.state === 'fail' ? '✗ ' : s.state === 'running' ? '⟳ ' : '';
            const arrow = i < r.stages.length - 1 ? '<span class="pl-arrow">→</span>' : '';
            return `<div class="pl-stage-box ${boxClass}">${icon}${s.name}</div>${arrow}`;
        }).join('');

        const chipsHTML = r.chips.map(c => {
            const [label, val] = c.split(': ');
            return `<div class="pl-chip">${label}: <span>${val}</span></div>`;
        }).join('');

        container.innerHTML += `
          <div class="pl-run-card" style="border-left-color:${borderColor};">
              <div class="pl-run-header">
                  <div>
                      <div class="pl-run-title">${r.id} &nbsp;<span class="pl-branch">${r.branch}</span></div>
                      <div class="pl-run-meta">Triggered by ${r.by} · ${r.ago} · Commit <code>${r.commit}</code></div>
                  </div>
                  <span class="status-pill ${pillClass}">${r.status}</span>
              </div>
              <div class="pl-stages">${stageHTML}</div>
              <div class="pl-chips">${chipsHTML}</div>
          </div>`;
    });
}

function buildHistory(history) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    history.forEach(h => {
        const pill = h.status === 'Passed' ? 'status-success' : h.status === 'Failed' ? 'status-error' : 'status-warning';
        tbody.innerHTML += `
          <tr>
              <td>${h.run}</td>
              <td><span class="branch-tag">${h.branch}</span></td>
              <td><span class="status-pill ${pill}">${h.status}</span></td>
              <td>${h.duration}</td>
              <td style="color:${h.failed !== '—' ? '#ff4d4d' : '#aaa'}">${h.failed}</td>
          </tr>`;
    });
}

function togglePanel(panelId, btn, labelClose, labelOpen) {
    const panel = document.getElementById(panelId);
    const open = panel.classList.toggle('visible');
    const badge = btn.querySelector('.run-badge');
    const badgeHTML = badge ? ' ' + badge.outerHTML : '';
    btn.innerHTML = (open ? labelOpen : labelClose) + badgeHTML;
}

async function init() {
    const pipelineData = await fetchPipelineData();
    if (pipelineData.runs.length > 0) {
        initCharts(pipelineData);
        buildStageBreakdown(pipelineData.stages);
        buildRuns(pipelineData.runs);
        buildHistory(pipelineData.history);
    } else {
        document.getElementById('stageBreakdown').innerHTML = '<p>No pipeline runs found.</p>';
    }
}

init();