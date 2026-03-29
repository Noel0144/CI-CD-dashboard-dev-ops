document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        document.getElementById('errorMsg').textContent = 'Username is required.';
        document.getElementById('errorMsg').style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`/api/github/users/${username}`);
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('githubUser', JSON.stringify(data));
            window.location.href = 'fetch.html';
        } else {
            let errorMsg = 'User not found.';
            if (response.status === 401) errorMsg = 'Invalid Backend Token. Check server .env file.';
            if (response.status === 403) errorMsg = 'API Limits Reached even with Token.';
            document.getElementById('errorMsg').textContent = errorMsg;
            document.getElementById('errorMsg').style.display = 'block';
        }
    } catch (error) {
        document.getElementById('errorMsg').textContent = 'An error occurred during login. Is your backend server running?';
        document.getElementById('errorMsg').style.display = 'block';
    }
});

// Optionally, listen to Enter key
document.getElementById('usernameInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
