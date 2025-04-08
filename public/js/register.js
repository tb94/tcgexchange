
/*
    we've used this dark mode code on two pages now, we should start moving it into a utility file, maybe util.js
    if it gets too big, we can break them apart into a utility folder with several util files
*/
function setTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark);
    document.getElementById('themeToggle').checked = isDark;
}

document.getElementById('themeToggle').addEventListener('change', (e) => {
    setTheme(e.target.checked);
});

const storedTheme = localStorage.getItem('darkMode') === 'true';
setTheme(storedTheme);

/* this might also be a good utility, at least calling the api. maybe we create functions for each http request type */
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
                window.location.href = '/';
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
