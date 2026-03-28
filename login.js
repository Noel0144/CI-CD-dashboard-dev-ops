document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) return;

    const token = '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';
    const headers = { 'Authorization': `token ${token}` };

    try {
        const response = await fetch(`https://api.github.com/users/${username}`, { headers });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('githubUser', JSON.stringify(data));
            window.location.href = 'fetch.html';
        } else {
            let errorMsg = 'User not found.';
            if (response.status === 401) errorMsg = 'Invalid Token provided internally.';
            if (response.status === 403) errorMsg = 'API Limits Reached even with Token.';
            document.getElementById('errorMsg').textContent = errorMsg;
            document.getElementById('errorMsg').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('errorMsg').textContent = 'An error occurred during login.';
        document.getElementById('errorMsg').style.display = 'block';
    }
});

// Optionally, listen to Enter key
document.getElementById('usernameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
