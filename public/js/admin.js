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
        document.getElementById("entryFileExtension").value = extension;
        document.getElementById("uploadEntryButton").removeAttribute('disabled');
    }
});