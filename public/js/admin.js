import { getFileType } from "./shared.js";

const entryFilePicker = document.getElementById("entryFile");
const entryImageDisplay = document.getElementById("entryImageDisplay");
const entryVideoDisplay = document.getElementById("entryVideoDisplay");
const entryVideoDisplaySource = document.getElementById("entryVideoDisplaySource");
const entryAudioDisplay = document.getElementById("entryAudioPreview");
const entryAudioDisplaySource = document.getElementById("entryAudioPreviewSource");
const entryThumbnailDisplay = document.getElementById("entryThumbnailDisplay");
const entryGIFFramePicker = document.getElementById("entryGIFFramePicker");
entryFilePicker.value = null;
entryFilePicker.addEventListener("change", () => {
    if (entryFilePicker.files.length === 1) {
        let file = entryFilePicker.files[0];
        let filename = file.name;
        let filenameParts = filename.split('.');
        let extension = '.' + filenameParts[filenameParts.length - 1].toLowerCase();
        filename = filename.substring(0, filename.length - extension.length);
        document.getElementById("entryDetailsChoice").classList.remove("d-none");
        document.getElementById("entryDisplay").classList.add("mb-3");
        entryFilePicker.classList.add("d-none");
        if (file.type.startsWith("image")) {
            entryImageDisplay.setAttribute('src', URL.createObjectURL(file));
            entryImageDisplay.classList.remove("d-none");
            if (file.type == 'image/gif') {
                fetch(entryImageDisplay.src).then(resp => resp.arrayBuffer()).then(buffer => new GifReader(new Uint8Array(buffer))).then(reader => {
                    document.getElementById('entryGIFThumbnailTitle').classList.remove('d-none');
                    let canvas = document.createElement('canvas');
                    let ctx = canvas.getContext("2d");
                    entryGIFFramePicker.setAttribute('max', reader.numFrames() - 1);
                    canvas.style.display = 'inline';
                    entryThumbnailDisplay.classList.remove('d-none');
                    let info = reader.frameInfo(0);
                    canvas.width = info.width;
                    canvas.height = info.height;
                    entryGIFFramePicker.onchange = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        for (let i = 0; i <= entryGIFFramePicker.value; i++) {
                            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            reader.decodeAndBlitFrameRGBA(i, imageData.data);
                            ctx.putImageData(imageData, 0, 0);
                        }
                        entryThumbnailDisplay.src = canvas.toDataURL();
                    };
                    entryGIFFramePicker.value = 0;
                    entryGIFFramePicker.onchange();
                });
            }
        } else if (file.type.startsWith("video")) {
            entryVideoDisplaySource.setAttribute('src', URL.createObjectURL(file));
            entryVideoDisplay.classList.remove("d-none");
            entryVideoDisplay.load();

            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext("2d");

            entryVideoDisplay.addEventListener('loadedmetadata', () => {
                canvas.width = entryVideoDisplay.videoWidth;
                canvas.height = entryVideoDisplay.videoHeight;
                canvas.style.display = 'inline';
                document.getElementById('entryVideoThumbnailTitle').classList.remove('d-none');
                entryThumbnailDisplay.classList.remove('d-none');
            });
            
            entryVideoDisplay.addEventListener('canplay', () => {
                ctx.clearRect(0, 0, canvas.height, canvas.width);
                ctx.drawImage(entryVideoDisplay, 0, 0, entryVideoDisplay.videoWidth, entryVideoDisplay.videoHeight);
                entryThumbnailDisplay.src = canvas.toDataURL();
            });
        } else if (file.type.startsWith("audio")) {
            entryAudioDisplaySource.setAttribute('src', URL.createObjectURL(file));
            entryAudioDisplay.classList.remove('d-none');
            entryAudioDisplay.load();
        }
        document.getElementById("entryFilename").value = filename;
        document.getElementById("entryFileExtension").innerText = extension;
        document.getElementById("uploadEntryButton").removeAttribute('disabled');
    }
});

document.getElementById('uploadEntryButton').onclick = () => {
    document.getElementById("uploadEntryButton").setAttribute('disabled', '');
    document.getElementById('uploadingStatus').classList.remove('d-none');
    document.getElementById('uploadErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/upload", true);
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    let form = new FormData();
    form.append('name', document.getElementById("entryFilename").value);
    form.append('extension', document.getElementById("entryFileExtension").innerText.substring(1));
    form.append('file', entryFilePicker.files[0]);
    if (!entryThumbnailDisplay.classList.contains('d-none')) {
        var byteString = atob(entryThumbnailDisplay.src.split(',')[1]);
        var mimeString = entryThumbnailDisplay.src.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++)
            ia[i] = byteString.charCodeAt(i);
        form.append('thumb', new Blob([ab], {type: mimeString}));
    }
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 201) {
            location.reload();
        } else {
            document.getElementById('uploadingStatus').classList.add('d-none');
            document.getElementById('uploadErrorText').innerText = xhr.responseText;
            document.getElementById("uploadEntryButton").removeAttribute('disabled');
        }
    };
    xhr.send(form);
};


const newTagType = document.getElementById("newTagType");
const newTagName = document.getElementById("newTagName");
newTagType.value = "";
newTagName.value = "";

newTagType.onchange = () => {
    if (newTagType.value != "")
        document.getElementById("createTagButton").removeAttribute('disabled');
};

document.getElementById('createTagButton').onclick = () => {
    document.getElementById("createTagButton").setAttribute('disabled', '');
    document.getElementById('createTagStatus').classList.remove('d-none');
    document.getElementById('createTagErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/create-tag", true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    let body = {
        name: newTagName.value,
        type: Number.parseInt(newTagType.value),
    };
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 201) {
            location.reload();
        } else {
            document.getElementById('createTagStatus').classList.add('d-none');
            document.getElementById('createTagErrorText').innerText = xhr.responseText;
            document.getElementById("createTagButton").removeAttribute('disabled');
        }
    };
    xhr.send(JSON.stringify(body));
};

document.getElementById("tagAdder").innerHTML = document.getElementById("allTags").innerHTML;
document.querySelectorAll("#tagAdder a").forEach(a => a.setAttribute("onclick", "addTag("+a.title+")"));

const entryEditTags = document.getElementById("entryEditTags");
window.addTag = (id) => {
    if (entryEditTags.value == "" || entryEditTags.value == null)
        entryEditTags.value = id;
    else if (entryEditTags.value.split(',').includes(id.toString()))
        return
    else
        entryEditTags.value += "," + id;
    entryEditTags.onchange();
}
entryEditTags.onkeyup = entryEditTags.onchange = () => {
    if (entryEditTags.value == '') {
        document.getElementById("editTagDisplay").innerText = 'No tags yet! Add some by clicking the links below.';
        return;
    }
    document.getElementById("editTagDisplay").innerHTML = entryEditTags.value.split(",").map(i => `<b>${i}</b>: ${document.querySelector(`#allTags a[title='${i}']`) == null ? "UNKNOWN TAG" : document.querySelector(`#allTags a[title='${i}']`).innerText}`).join(', ');
}

let editingEntry = null;
const converter = new showdown.Converter({
    strikethrough: true,
    simpleLineBreaks: true,
    tasklists: true,
    simplifiedAutoLink: true,
    parseImgDimension: true,
    tables: true,
    smoothPreview: true,
});
window.editEntry = async (id) => {
    let entry = await (await fetch("/api/e/"+id)).json();
    editingEntry = id;
    document.getElementById('entryEditFilename').value = entry.id;
    document.getElementById('entryEditFileExtension').innerText = "."+entry.ext;
    document.getElementById('entryEditTitle').value = entry.title;
    document.getElementById('entryEditListed').checked = entry.listed;
    let dateString = new Date(entry.date).toUTCString().substring(5);
    document.getElementById('entryEditDate').value = dateString.substring(0, 17) + dateString.substring(20);
    document.getElementById('entryEditDesc').value = entry.description;
    document.getElementById('entryEditDescPreview').innerHTML = DOMPurify.sanitize(converter.makeHtml(document.getElementById('entryEditDesc').value));
    entryEditTags.value = entry.tags.map(t => t.id).join(',');
    entryEditTags.onchange();
    let type = getFileType(entry.ext);
    let path = '/file/'+entry.id+"."+entry.ext;
    document.getElementById('entryEditVideoDisplay').classList.add('d-none');
    document.getElementById('entryEditAudioPreview').classList.add('d-none');
    document.getElementById('entryEditImageDisplay').classList.add('d-none');
    document.getElementById('entryEditFileDisplay').classList.add('d-none');
    if (type == "video") {
        document.getElementById('entryEditVideoDisplay').classList.remove('d-none');
        document.getElementById('entryEditVideoDisplaySource').setAttribute('src', path);
        document.getElementById('entryEditVideoDisplay').load();
    } else if (type == "audio") {
        document.getElementById('entryEditAudioPreview').classList.remove('d-none');
        document.getElementById('entryEditAudioPreviewSource').setAttribute('src', path);
        document.getElementById('entryEditAudioPreview').load();
    } else if (type == "image") {
        document.getElementById('entryEditImageDisplay').classList.remove('d-none');
        document.getElementById('entryEditImageDisplay').setAttribute('src', path);
    } else {
        document.getElementById('entryEditFileDisplay').classList.remove('d-none');
        document.getElementById('entryEditFileDownload').setAttribute('href', path);
    }
    new bootstrap.Modal(document.getElementById('editEntryModal'), {}).show();
}

document.getElementById("entryEditDesc").onkeyup = () => {
    document.getElementById('entryEditDescPreview').innerHTML = DOMPurify.sanitize(converter.makeHtml(document.getElementById('entryEditDesc').value));
};

document.getElementById('editEntryButton').onclick = () => {
    document.getElementById("editEntryButton").setAttribute('disabled', '');
    document.getElementById('editEntryStatus').classList.remove('d-none');
    document.getElementById('editEntryErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/edit-entry", true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    let body = {
        oldId: editingEntry,
        id: document.getElementById('entryEditFilename').value,
        listed: document.getElementById('entryEditListed').checked,
        title: document.getElementById('entryEditTitle').value,
        date: new Date(document.getElementById('entryEditDate').value).valueOf(),
        tags: document.getElementById('entryEditTags').value,
        description: document.getElementById('entryEditDesc').value,
    };
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 201) {
            location.reload();
        } else {
            document.getElementById('editEntryStatus').classList.add('d-none');
            document.getElementById('editEntryErrorText').innerText = xhr.responseText;
            document.getElementById("editEntryButton").removeAttribute('disabled');
        }
    };
    xhr.send(JSON.stringify(body));
};

document.getElementById('deleteEntryButton').onclick = async () => {
    let entry = await (await fetch("/api/e/"+editingEntry)).json();
    document.getElementById('deleteEntryName').innerText = entry.id+"."+entry.ext;
    document.getElementById('editEntryModal').style.zIndex = 1050;
    new bootstrap.Modal(document.getElementById('deleteEntryModal'), {}).show();
};
document.getElementById('deleteEntryModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('editEntryModal').style.zIndex = 1055;
})
document.getElementById('deleteEntryConfirm').onclick = async () => {
    document.getElementById("deleteEntryConfirm").setAttribute('disabled', '');
    document.getElementById('deleteEntryStatus').classList.remove('d-none');
    document.getElementById('deleteEntryErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/delete-entry/"+editingEntry, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            location.reload();
        } else {
            document.getElementById('deleteEntryStatus').classList.add('d-none');
            document.getElementById('deleteEntryErrorText').innerText = xhr.responseText;
            document.getElementById("deleteEntryConfirm").removeAttribute('disabled');
        }
    };
    xhr.send();
};

let editingTag = 0;
window.editTag = async (id) => {
    let tag = await (await fetch("/api/tag/"+id)).json();
    editingTag = id;
    document.getElementById('editTagName').value = tag.name;
    document.getElementById('editTagType').value = tag.type;
    document.getElementById('editTagDesc').value = tag.description;
    new bootstrap.Modal(document.getElementById('editTagModal'), {}).show();
}

document.getElementById('editTagButton').onclick = () => {
    document.getElementById("editTagButton").setAttribute('disabled', '');
    document.getElementById('editTagStatus').classList.remove('d-none');
    document.getElementById('editTagErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/edit-tag", true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    let body = {
        id: editingTag,
        name: document.getElementById('editTagName').value,
        type: Number.parseInt(document.getElementById('editTagType').value),
        description: document.getElementById('editTagDesc').value
    };
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 201) {
            location.reload();
        } else {
            document.getElementById('editTagStatus').classList.add('d-none');
            document.getElementById('editTagErrorText').innerText = xhr.responseText;
            document.getElementById("editTagButton").removeAttribute('disabled');
        }
    };
    xhr.send(JSON.stringify(body));
};

document.getElementById('deleteTagButton').onclick = async () => {
    let tag = await (await fetch("/api/tag/"+editingTag)).json();
    document.getElementById('deleteTagName').innerText = tag.name;
    document.getElementById('editTagModal').style.zIndex = 1050;
    new bootstrap.Modal(document.getElementById('deleteTagModal'), {}).show();
};
document.getElementById('deleteTagModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('editTagModal').style.zIndex = 1055;
})
document.getElementById('deleteTagConfirm').onclick = async () => {
    document.getElementById("deleteTagConfirm").setAttribute('disabled', '');
    document.getElementById('deleteTagStatus').classList.remove('d-none');
    document.getElementById('deleteTagErrorText').innerText = '';
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/delete-tag/"+editingTag, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            location.reload();
        } else {
            document.getElementById('deleteTagStatus').classList.add('d-none');
            document.getElementById('deleteTagErrorText').innerText = xhr.responseText;
            document.getElementById("deleteTagConfirm").removeAttribute('disabled');
        }
    };
    xhr.send();
};

// Source - https://stackoverflow.com/a/18650828
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

let backupDate = document.getElementById('backupDate');
if (backupDate != null) backupDate.innerText = new Date(Number.parseFloat(backupDate.innerText)).toLocaleString();
let backupSize = document.getElementById('backupSize');
if (backupSize != null) backupSize.innerText = formatBytes(Number.parseInt(backupSize.innerText));


document.getElementById('genBackup').onclick = async () => {
    document.getElementById('genBackup').setAttribute('disabled', '');
    if (document.getElementById('dl-backup') != null)
        document.getElementById('dl-backup').remove();
    document.getElementById('backupProgress').classList.remove('d-none');
    let lastProgress = 0;
    fetch("/admin/generate-backup");
    setInterval(async () => {
        let progress = await (await fetch("/admin/backup-progress")).json();
        if (progress > lastProgress) {
            lastProgress = progress;
            document.getElementById('backupProgressProgress').style.width = progress + "%";
        }
        if (progress > 100)
            location.reload();
    }, 100);
};

let listedPage = 0;
const pageLimit = 10;
const blankRow = document.getElementById('exampleListedRow');
blankRow.remove();
blankRow.removeAttribute('id');
async function loadPage(page) {
    document.getElementById('listedPrev').setAttribute('disabled', '');
    document.getElementById('listedNext').setAttribute('disabled', '');
    let data = await (await fetch("/api/entries?page=" + page + "&limit=" + pageLimit + (search == null ? '' : '&q='+search))).json();
    document.getElementById('listedRows').innerHTML = '';
    document.getElementById('listedFrom').innerText = data.from;
    document.getElementById('listedTo').innerText = data.to;
    document.getElementById('listedOf').innerText = data.of;
    if (data.from > 1)
        document.getElementById('listedPrev').removeAttribute('disabled');
    if (data.to < data.of)
        document.getElementById('listedNext').removeAttribute('disabled');
    for (let entry of data.entries) {
        let row = blankRow.cloneNode(true);
        row.querySelector('td span').innerText = entry.title;
        row.querySelector('td button').setAttribute('onclick', "editEntry('"+entry.id+"')");
        row.querySelector('td img').src = "/thumb/"+entry.id+".png";
        row.children[1].innerHTML = new Date(entry.date).toLocaleDateString();
        document.getElementById('listedRows').appendChild(row);
    }
}
document.getElementById('listedPrev').onclick = () => loadPage(--listedPage);
document.getElementById('listedNext').onclick = () => loadPage(++listedPage);
document.getElementById('titleSearch').value = null;
let liveSearchChangeNum = 0;
let search = null;
document.getElementById('titleSearch').onkeyup = event => {
    let changeNum = ++liveSearchChangeNum;
    setTimeout(() => {
        if (changeNum != liveSearchChangeNum) return;
        let url = new URL(location.href);
        if (event.target.value.trim().length <= 0) {
            if (search != null) {
                search = null;
                listedPage = 0;
                loadPage(listedPage);
            }
        } else if (event.target.value.trim() != url.searchParams.get('q')) {
            search = event.target.value.trim();
            listedPage = 0;
            loadPage(listedPage);
        } 
    }, 250);
}

loadPage(0);