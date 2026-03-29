document.getElementById("fetchBtn").addEventListener("click", async () => {
  let query = document.getElementById("repoInput").value.trim();
  if (!query) return;

  const statusMsg = document.getElementById("statusMsg");
  statusMsg.style.display = "block";
  statusMsg.style.color   = "#32e6e2";
  statusMsg.textContent   = "Fetching data...";

  if (query.includes("github.com/")) {
    const parts = query.split("github.com/");
    const path  = parts[1].split("/");
    query = path.length >= 2 ? `${path[0]}/${path[1]}` : path[0];
  }

  const apiUrl = query.includes("/") ? `/api/github/repos/${query}` : `/api/github/users/${query}`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      await response.json();
      if (apiUrl.includes("/repos/")) {
        localStorage.setItem("targetRepo", query);
        if (window._spaInit) {
          ["build","deploy","pipeline","health"].forEach(k => { window._spaInit[k] = false; });
        }
      }
      statusMsg.style.color = "rgb(12, 235, 12)";
      statusMsg.innerHTML = `Data fetched successfully!<br><br>
        <button onclick="showSection('dashboard')"
          style="background:none;border:none;color:#32e6e2;text-decoration:underline;
                 font-weight:bold;cursor:pointer;font-size:14px;">
          Go to Dashboard
        </button>`;
    } else {
      statusMsg.style.color = "#ff4d4d";
      let errorMsg = "Repository or User not found.";
      if (response.status === 401) errorMsg = "Invalid API Token.";
      if (response.status === 403) errorMsg = "API Limit reached. Add a token in Login page.";
      statusMsg.textContent = errorMsg;
    }
  } catch (error) {
    statusMsg.style.color = "#ff4d4d";
    statusMsg.textContent = "An error occurred while fetching the data.";
  }
});