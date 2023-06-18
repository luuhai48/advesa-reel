selected = null;
localStorage.removeItem("selected");

if (data.length) {
  var filesList = document.getElementById("files");
  var newFiles = [];

  data.forEach((file) => {
    var elem = document.createElement("button");
    elem.setAttribute("onclick", "selectFile(this)");
    elem.dataset.fileId = file.id;
    elem.classList.add("file");
    elem.style.backgroundImage = `url(${file.thumbnailLink})`;

    var icon = document.createElement("img");
    icon.classList.add("icon");
    icon.src = file.iconLink;
    elem.appendChild(icon);

    var title = document.createElement("span");
    title.textContent = file.title;
    elem.appendChild(title);

    newFiles.push(elem);
  });

  filesList.append(...newFiles);
}
