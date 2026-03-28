(function () {
  const HEADERS = {};
  let donutChart, barChart;

  function getRepo() {
    return localStorage.getItem("targetRepo") || "defxharsh/CI-CD-Pipeline-DevOps-";
  }

  async function fetchDeployments() {
    try {
      const res = await fetch(`/api/github/repos/${getRepo()}/deployments`, { headers: HEADERS });
      if (!res.ok) return [];
      const deployments = await res.json();
      let deployData = [];
      for (let d of deployments.slice(0, 10)) {
        const statRes = await fetch(d.statuses_url.replace("https://api.github.com", "/api/github"), { headers: HEADERS });
        let statusStr = "Deploying";
        if (statRes.ok) {
          const statuses = await statRes.json();
          if (statuses.length > 0) {
            const st = statuses[0].state;
            if (st === "success") statusStr = "Success";
            else if (st === "failure" || st === "error") statusStr = "Failed";
          }
        }
        const start = new Date(d.created_at).getTime();
        const end   = new Date(d.updated_at).getTime();
        const durationSecs = Math.floor((end - start) / 1000);
        const agoSecs = Math.floor((Date.now() - start) / 1000);
        const hrs = Math.floor(agoSecs / 3600);
        const agoStr = hrs > 24 ? Math.floor(hrs / 24) + "d ago" : hrs > 0 ? hrs + "h ago" : Math.floor(agoSecs / 60) + "m ago";
        deployData.push({ env: d.environment || "Production", version: d.ref, status: statusStr, duration: durationSecs > 0 ? durationSecs : 45, timestamp: agoStr });
      }
      return deployData;
    } catch (e) {
      console.error("Error fetching deployments:", e);
      return [];
    }
  }

  function initCharts(deployments) {
    const success   = deployments.filter((d) => d.status === "Success").length;
    const failed    = deployments.filter((d) => d.status === "Failed").length;
    const deploying = deployments.filter((d) => d.status === "Deploying").length;

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById("deployDonutChart"), {
      type: "doughnut",
      data: {
        labels: ["Success", "Failed", "Deploying"],
        datasets: [{ data: [success, failed, deploying], backgroundColor: ["#0ceb0c", "#ff4d4d", "#f5c518"], borderWidth: 2, borderColor: "#1a2535" }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "55%", plugins: { legend: { position: "bottom", labels: { color: "#ddd", font: { size: 12 }, padding: 12 } } } },
    });

    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById("deployBarChart"), {
      type: "bar",
      data: {
        labels: deployments.map((d, i) => d.env.slice(0, 4) + " #" + (i + 1)),
        datasets: [{
          label: "Duration (s)",
          data: deployments.map((d) => d.duration),
          backgroundColor: deployments.map((d) => d.status === "Failed" ? "#ff4d4d" : d.status === "Deploying" ? "#f5c518" : "#32e6e2"),
          borderRadius: 5,
        }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#aaa", font: { size: 12 } }, grid: { color: "#1e2a38" } }, y: { ticks: { color: "#aaa", font: { size: 12 } }, grid: { color: "#1e2a38" } } } },
    });

    // Update deploy KPI cards using their specific IDs
    const uniqueEnvs = new Set(deployments.map((d) => d.env)).size;
    document.getElementById("deploy-kpi-0").textContent = uniqueEnvs || "0";
    document.getElementById("deploy-kpi-1").textContent = success;
    document.getElementById("deploy-kpi-2").textContent = deploying;
    document.getElementById("deploy-kpi-3").textContent = deployments.length > 0 ? deployments[0].version : "N/A";
    let avgDur = 0;
    if (deployments.length > 0) avgDur = Math.floor(deployments.reduce((sum, d) => sum + d.duration, 0) / deployments.length);
    const mins = Math.floor(avgDur / 60);
    const secs = avgDur % 60;
    document.getElementById("deploy-kpi-4").textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  function buildTable(deployments) {
    const tbody = document.getElementById("deployTableBody");
    tbody.innerHTML = "";
    deployments.forEach((d) => {
      const pill = d.status === "Success" ? "status-success" : d.status === "Failed" ? "status-error" : "status-warning";
      const mins = Math.floor(d.duration / 60);
      const secs = d.duration % 60;
      const dur  = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      tbody.innerHTML += `<tr>
        <td>${d.env}</td>
        <td><span class="branch-tag">${d.version}</span></td>
        <td><span class="status-pill ${pill}">${d.status}</span></td>
        <td>${dur}</td>
        <td><span class="timestamp-cell">${d.timestamp}</span></td>
      </tr>`;
    });
  }

  function toggleDetail(btn) {
    const panel = document.getElementById("deployDetailPanel");
    const open  = panel.classList.toggle("visible");
    btn.innerHTML = open ? "+ Hide Details" : "&#11015; View Details";
  }

  async function init() {
    let deployments = await fetchDeployments();
    if (deployments.length === 0) {
      deployments = [
        { env: "Production", version: "main", status: "Success", duration: 252, timestamp: "2h ago" },
        { env: "Staging",    version: "dev",  status: "Success", duration: 225, timestamp: "3h ago" },
      ];
    }
    initCharts(deployments);
    buildTable(deployments);
  }

  window.initDeploy        = init;
  window.toggleDeployDetail = toggleDetail;
})();