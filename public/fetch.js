document.getElementById('fetchBtn').addEventListener('click', async () => {
    let query = document.getElementById('repoInput').value.trim();
    if (!query) return;

    const statusMsg = document.getElementById('statusMsg');
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#32e6e2';
    statusMsg.textContent = 'Fetching data...';

    // Parse the query logic
    // If it's a URL, extract the user/repo part
    if (query.includes('github.com/')) {
        const parts = query.split('github.com/');
        const path = parts[1].split('/');
        if (path.length >= 2) {
            query = `${path[0]}/${path[1]}`;
        } else {
            query = path[0];
        }
    }

    // Determine the API endpoint based on if it's user/repo or just user
    let apiUrl = '';
    if (query.includes('/')) {
        apiUrl = `/api/github/repos/${query}`;
    } else {
        apiUrl = `/api/github/users/${query}`;
    }

    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();

            // Save repo to localStorage for the dashboard graphs
            if (apiUrl.includes('/repos/')) {
                localStorage.setItem('targetRepo', query);
            }

            statusMsg.style.color = 'rgb(12, 235, 12)';
            statusMsg.innerHTML = 'Data fetched successfully! <br><br> <a href="pipeline.html" style="color: #32e6e2; text-decoration: underline; font-weight: bold;">Go to Dashboard</a>';
        } else {
            statusMsg.style.color = '#ff4d4d';
            let errorMsg = 'Repository or User not found.';
            if (response.status === 401) errorMsg = 'Invalid API Token.';
            if (response.status === 403) errorMsg = 'API Limit reached. Add a token in Login page.';
            statusMsg.textContent = errorMsg;
        }
    } catch (error) {
        statusMsg.style.color = '#ff4d4d';
        statusMsg.textContent = 'An error occurred while fetching the data.';
    }
});
