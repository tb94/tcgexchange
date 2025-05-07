document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    console.log("Attempt login:", { username, password });

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });


    const data = await res.json();
    if (!res.ok) {
        return alert(data.error || 'Login failed');
    }

    // save the jwt
    localStorage.setItem('token', data.token);

    window.location.href = '/search.html';
});
