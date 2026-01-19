const videoTypes = ["mp4", "avi"];
const audioTypes = ["ogg", "wav", "mp4", "opus"];
const imageTypes = ["gif", "png", "jpg"];

export function getFileType(extension) {
    if (videoTypes.includes(extension)) return "video";
    if (audioTypes.includes(extension)) return "audio";
    if (imageTypes.includes(extension)) return "image";
    return "file";
}