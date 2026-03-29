// auth.js
function checkAuth() {
    const user = localStorage.getItem('githubUser');
    if (!user) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('githubUser');
    window.location.href = 'index.html';
}

// Call checkAuth on page load if it is a protected page
// The script should be placed in the <head> to prevent flicker
if (window.location.pathname.endsWith('build.html') ||
    window.location.pathname.endsWith('deploy.html') ||
    window.location.pathname.endsWith('health.html') ||
    window.location.pathname.endsWith('pipeline.html')) {
    checkAuth();
}
