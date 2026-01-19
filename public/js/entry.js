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