const token = localStorage.getItem('token');

// check for token and validate // this should go on every page that requires being logged in
if (!token) {
    window.location.href = '/login.html';
} else {
    apiRequest('/auth/validate').catch(() => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

// logout and redirect to login
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
    }
});
