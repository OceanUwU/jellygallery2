import { getFileType } from "./shared.js";

let listedPage = 0;
const blankEntry = document.getElementById('entryExample');
blankEntry.remove();
blankEntry.classList.remove('d-none');
blankEntry.removeAttribute('id');
async function loadEntries(href) {
    document.getElementById('list').innerText = 'Loading entries...';
    document.getElementById('listedPrev').setAttribute('disabled', '');
    document.getElementById('listedNext').setAttribute('disabled', '');
    let url = new URL(href);
    if (url.searchParams.has('p'))
        url.searchParams.set('p', Number.parseInt(url.searchParams.get('p')) - 1);
    let data = await (await fetch("/api/entries" + url.search)).json();
    document.getElementById('list').innerHTML = '';
    document.getElementById('listedFrom').innerText = data.from;
    document.getElementById('listedTo').innerText = data.to;
    document.getElementById('listedOf').innerText = data.of;
    if (data.from > 1)
        document.getElementById('listedPrev').removeAttribute('disabled');
    if (data.to < data.of)
        document.getElementById('listedNext').removeAttribute('disabled');
    for (let entry of data.entries) {
        let link = blankEntry.cloneNode(true);
        link.setAttribute('entry', entry.id);
        link.href = "/e/"+entry.id+location.search;
        let fileType = getFileType(entry.ext);
        link.setAttribute('title', entry.title);
        new bootstrap.Popover(link, { trigger: 'hover focus', placement: 'top', container: 'body' });
        if (fileType != 'audio')
            link.querySelector('.audioHint').remove();
        if (fileType != 'video')
            link.querySelector('.videoHint').remove();
        if (entry.ext != 'gif')
            link.querySelector('.gifHint').remove();
        if (fileType == 'audio' || fileType == 'file') {
            link.querySelector('img').remove();
            let titleContainer = document.createElement('span');
            titleContainer.classList.add('fileTitle');
            let title = document.createElement('span');
            title.innerHTML = entry.title;
            titleContainer.appendChild(title);
            link.insertBefore(titleContainer, link.firstChild);
        } else {
            link.querySelector('img').src = "/thumb/"+entry.id+".png";
        }
        document.getElementById('list').appendChild(link);
    }
}

function getTags() {
    return [...document.querySelectorAll('.tag-list .btn-light')].map(b => b.getAttribute('data-id'))
}

function updateFilterCounter(tags) {
    let count = tags.length;
    if (document.getElementById('liveSearch').value != null && document.getElementById('liveSearch').value.trim().length > 0) count++;
    document.getElementById('filterCounter').innerText = count;
    document.getElementById('filterCounter').classList.add('d-none');
    if (count > 0)
        document.getElementById('filterCounter').classList.remove('d-none');
}

function toggleTag(id) {
    let button = document.querySelector('.tag-list button[data-id="'+id+'"]');
    if (button == null) {
        return;
    }
    let enabled = button.classList.contains('btn-light');
    button.classList.remove('btn-light');
    button.classList.remove('btn-outline-secondary');
    enabled = !enabled;
    button.classList.add(enabled ? 'btn-light' : 'btn-outline-secondary');
    let tags = getTags();
    let url = new URL(location.href);
    updateFilterCounter(tags);
    if (tags.length > 0)
        url.searchParams.set('t', tags.join('-'));
    else
        url.searchParams.delete('t');
    url.searchParams.delete('p');
    history.replaceState({path:url.href},'',url.href);
}

function toggleFav(event) {
    let url = new URL(location.href);
    if (document.getElementById('favsOnly').checked)
        url.searchParams.set('f', '');
    else
        url.searchParams.delete('f');
    history.replaceState({path:url.href},'',url.href);
}
document.getElementById('favsOnly').onchange = toggleFav;
document.getElementById('favsOnly').checked = false;

let liveSearchChangeNum = 0;
document.getElementById('liveSearch').onkeyup = event => {
    let changeNum = ++liveSearchChangeNum;
    setTimeout(() => {
        if (changeNum != liveSearchChangeNum) return;
        let url = new URL(location.href);
        if (event.target.value.trim().length <= 0) {
            if (url.searchParams.has('q')) {
                url.searchParams.delete('q');
                updateFilterCounter(getTags());
                history.replaceState({path:url.href},'',url.href);
            }
        } else if (event.target.value.trim() != url.searchParams.get('q')) {
            url.searchParams.set('q', event.target.value.trim());
            updateFilterCounter(getTags());
            history.replaceState({path:url.href},'',url.href);
        } 
    }, 250);
}

navigation.addEventListener("navigate", (event) => {
    if (!new URL(event.destination.url).pathname.startsWith('/entries')) return;
    loadEntries(event.destination.url);
})

function incrementPage(by) {
    let url = new URL(location.href);
    let page = Number.parseInt(url.searchParams.get('p') ?? 1);
    url.searchParams.set('p', page + by);
    if (page + by == 1)
        url.searchParams.delete('p');
    history.replaceState({path:url.href},'',url.href);
}

document.getElementById('listedPrev').onclick = () => incrementPage(-1);
document.getElementById('listedNext').onclick = () => incrementPage(1);

addEventListener('load', async () => {
    let origURL = new URL(location.href)
    let t = origURL.searchParams.get('t');
    let origTags = t == null ? [] : t.split('-');
    for (let tag of origTags) {
        if (document.querySelector('.tag-list button[data-id="'+tag+'"]') != null) continue;
        let data = await (await fetch("/api/tag/" + tag)).json();
        let elem = document.getElementById('exampleTag').cloneNode();
        elem.classList.remove('d-none');
        elem.innerText = data.name;
        elem.setAttribute('data-id', data.id);
        if (data.description != null)
            elem.setAttribute('data-bs-title', data.description);
        let tagList = document.querySelector('.tag-list[data-type="'+data.type+'"]');
        tagList.appendChild(elem);
        tagList.classList.remove('d-none');
        document.querySelector('.card-title[data-type="'+data.type+'"]').classList.remove('d-none');
    }
    for (let tagGroup of document.querySelectorAll('.tag-list')) {
        let tagType = tagGroup.getAttribute('data-type');
        for (let button of tagGroup.querySelectorAll('button')) {
            let id = button.getAttribute('data-id');
            button.onclick = () => toggleTag(id);
            if (origTags.includes(id)) {
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-light');
            }
        }
    }
    origTags = getTags();
    document.getElementById('liveSearch').value = origURL.searchParams.get('q');

    document.getElementById('favsOnly').checked = origURL.searchParams.has('f');
    if (origTags.length > 0 || document.getElementById('liveSearch').value != '')
        new bootstrap.Collapse(document.getElementById('filters'))
    document.querySelectorAll('[data-bs-title]').forEach(p => new bootstrap.Popover(p, {trigger: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'hover focus' : 'hover', placement: 'bottom'}));
    updateFilterCounter(origTags);
    loadEntries(origURL.href);
});