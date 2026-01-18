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
        console.log("File selected: ", file);
        let filename = file.name;
        let filenameParts = filename.split('.');
        let extension = '.' + filenameParts[filenameParts.length - 1].toLowerCase();
        filename = filename.substr(0, filename.length - extension.length);
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
    form.append('extension', document.getElementById("entryFileExtension").innerText.substr(1));
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

let editingTag = 0;
async function editTag(id) {
    let tag = await (await fetch("/api/tag/"+id)).json();
    editingTag = id;
    console.log(tag);
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