document.getElementById('searchBox').value = null;
document.getElementById('searchButton').onclick = () => {
    let url = new URL(location.origin);
    url.pathname = '/entries';
    let search = document.getElementById('searchBox').value;
    if (search != null && search.trim().length > 0)
        url.searchParams.set('q', search.trim());
    location.href = url.href;
};