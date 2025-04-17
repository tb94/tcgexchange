/**
 * Dark Mode
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
