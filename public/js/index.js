const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login.html';
} else {

    fetch('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    }).catch(() => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}