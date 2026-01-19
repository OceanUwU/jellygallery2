import { getFileType } from "./shared.js";

let listedPage = 0;
const blankEntry = document.getElementById('entryExample');
blankEntry.remove();
blankEntry.classList.remove('d-none');
blankEntry.removeAttribute('id');
async function loadPage(page) {
    document.getElementById('listedPrev').setAttribute('disabled', '');
    document.getElementById('listedNext').setAttribute('disabled', '');
    document.get
    let data = await (await fetch("/api/entries/" + page + "?")).json();
    document.getElementById('list').innerHTML = '';
    document.getElementById('listedFrom').innerText = data.from;
    document.getElementById('listedTo').innerText = data.to;
    document.getElementById('listedOf').innerText = data.of;
    if (data.from > 1)
        document.getElementById('listedPrev').removeAttribute('disabled');
    if (data.to < data.of)
        document.getElementById('listedNext').removeAttribute('disabled');
    for (let entry of data.entries) {
        let row = blankEntry.cloneNode(true);
        row.href = "/e/" + entry.id;
        let fileType = getFileType(entry.ext);
        row.setAttribute('title', entry.title);
        new bootstrap.Popover(row, { trigger: 'hover focus', placement: 'top', container: 'body' });
        if (fileType != 'audio')
            row.querySelector('.audioHint').remove();
        if (fileType != 'video')
            row.querySelector('.videoHint').remove();
        if (entry.ext != 'gif')
            row.querySelector('.gifHint').remove();
        if (fileType == 'audio' || fileType == 'file') {
            row.querySelector('img').remove();
            let titleContainer = document.createElement('span');
            titleContainer.classList.add('fileTitle');
            let title = document.createElement('span');
            title.innerHTML = entry.title;
            titleContainer.appendChild(title);
            row.insertBefore(titleContainer, row.firstChild);
        } else {
            row.querySelector('img').src = "/thumb/"+entry.id+".png";
        }
        document.getElementById('list').appendChild(row);
    }
}
document.getElementById('listedPrev').onclick = () => loadPage(--listedPage);
document.getElementById('listedNext').onclick = () => loadPage(++listedPage);
loadPage(0);