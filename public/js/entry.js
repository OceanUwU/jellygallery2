let date = new Date(document.getElementById('date').innerText);
document.getElementById('date').innerText = `${date.getDate()} ${new Intl.DateTimeFormat("en-GB", {month: "long"}).format(date)} ${date.getFullYear()}`;


const converter = new showdown.Converter({
    strikethrough: true,
    simpleLineBreaks: true,
    tasklists: true,
    simplifiedAutoLink: true,
    parseImgDimension: true,
    tables: true,
});
if (document.getElementById('desc') != null)
    document.getElementById('desc').innerHTML = DOMPurify.sanitize(converter.makeHtml(document.getElementById('desc').innerHTML));

for (let arc of document.querySelectorAll('.arc')) {
    fetch("/api/arc/"+arc.getAttribute('data-arc')+"/"+filename).then(data => data.json().then(data => {
        if (data.prev != null) {
            let prev = arc.querySelector('.prevInArc');
            let link = document.createElement('a');
            link.classList = prev.classList;
            link.innerHTML = prev.innerHTML
            link.setAttribute('href', '/e/'+data.prev);
            prev.replaceWith(link);
        }
        if (data.next != null) {
            let next = arc.querySelector('.nextInArc');
            let link = document.createElement('a');
            link.classList = next.classList;
            link.innerHTML = next.innerHTML
            link.setAttribute('href', '/e/'+data.next);
            next.replaceWith(link);
        }
    }));
}

let query = document.getElementById('query');
if (query) query.href += location.search;
let prevInQuery = document.getElementById('prevInQuery');
if (prevInQuery) prevInQuery.href += location.search;
let nextInQuery = document.getElementById('nextInQuery');
if (nextInQuery) nextInQuery.href += location.search;

window.fav = e => {
    document.getElementById('fav').setAttribute('disabled', '');
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/fav/"+filename, true);
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let wasFavved = document.getElementById("favvedIcon").classList.contains('bi-star-fill');
            if (xhr.responseText == "true") {
                document.getElementById("favvedIcon").classList.remove('bi-star');
                document.getElementById("favvedIcon").classList.add('bi-star-fill');
                document.getElementById("favs").innerText = Number.parseInt(document.getElementById("favs").innerText) + (wasFavved ? 0 : 1);
            } else {
                document.getElementById("favvedIcon").classList.add('bi-star');
                document.getElementById("favvedIcon").classList.remove('bi-star-fill');
                document.getElementById("favs").innerText = Number.parseInt(document.getElementById("favs").innerText) + (wasFavved ? -1 : 0);
            }
        }
        document.getElementById("fav").removeAttribute('disabled');
    };
    xhr.send();
}