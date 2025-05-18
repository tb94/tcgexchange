/* this might be a good utility, at least calling the api. maybe we create functions for each http request type */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                window.location.href = '/search.html';
            } else {
                const error = await response.json();
                alert(error.message || 'Signup failed');
            }
        } catch (err) {
            console.error('Signup error:', err);
            alert('Something went wrong.');
        }
    });
});
