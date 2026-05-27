var theme = localStorage.getItem("theme");
if (theme == null) theme = "light";

function changeTheme() {
    document.getElementsByTagName("body")[0].setAttribute("data-bs-theme", theme);
    document.getElementById('themeIcon').classList.remove('bi-moon-stars-fill');
    document.getElementById('themeIcon').classList.remove('bi-sun-fill');
    if (theme == "light")
        document.getElementById('themeIcon').classList.add('bi-sun-fill');
    else
        document.getElementById('themeIcon').classList.add('bi-moon-stars-fill');
}
changeTheme();
document.getElementById('themeToggle').onclick = () => {
    theme = theme == "light" ? "dark" : "light";
    localStorage.setItem("theme", theme);
    changeTheme();
}

document.getElementById('searchBox').value = null;
document.getElementById('searchButton').onclick = () => {
    let url = new URL(location.origin);
    url.pathname = '/entries';
    let search = document.getElementById('searchBox').value;
    if (search != null && search.trim().length > 0)
        url.searchParams.set('q', search.trim());
    location.href = url.href;
};
document.getElementById('searchBox').onkeydown = event => {
    if (event.key == "Enter") document.getElementById('searchButton').onclick();
}

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))