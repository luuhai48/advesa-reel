historyStack = ["id_input", "files_select"];
var file = data.find((f) => f.id === selected);
if (!file) {
  goBack();
} else {
  if (imageMimeTypes.includes(file.mimeType)) {
    var img = document.createElement("img");
    img.src = file.webContentLink;

    document.getElementById("file-display").appendChild(img);
  } else if (videoMimeTypes.includes(file.mimeType)) {
    var vid = document.createElement("video");
    vid.controls = false;
    vid.autoplay = true;
    vid.controls = true;
    vid.preload = "auto";
    vid.loop = true;
    vid.width = 1280;
    vid.height = 720;
    vid.src = file.webContentLink;

    document.getElementById("file-display").appendChild(vid);
    vid.webkitRequestFullScreen();
  } else {
    historyStack = ["id_input"];
    loadComponent("files_select").then(() => {
      notify("error", "Error", "File type not supported: " + file.mimeType);
    });
  }
}
