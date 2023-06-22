var main;
var scripts;
var toasts;
var secretCount = 0;
var secretTimer;
var data = [];
var eventListeners = [];
var historyStack = [];
var selectableElements = [];
var gid = localStorage.getItem("gid");
var selected = localStorage.getItem("selected");

var imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
var videoMimeTypes = ["video/mp4", "video/mkv"];

var components = {
  id_input: {
    html: `<form class="input-box" id="id-input-form" method="POST">
<h1>Please enter Google drive public folder ID</h1>
<input
  type="text"
  class="id-input"
  autofocus
  placeholder="e.g: 1ABQWoOABiV140oe-xxxxxxxxxxxxxxxx"
  name="id-input"
  id="id-input"
  required
/>
<button class="id-button" type="submit">Enter</button>
</form>`,
    js: `if (gid && gid !== "") {
  document.getElementById("id-input").value = gid;
}

document.getElementById("id-input-form").onsubmit = function (e) {
  e.preventDefault();
  var gid = document.getElementById("id-input").value;
  fetchFolderInfo(gid);
};
document.addEventListener("keydown", secretInputHandler);
eventListeners.push({ event: "keydown", handler: secretInputHandler });`,
  },

  files_select: {
    html: `<button class="back no-border" title="Go back" onclick="goBack()">
  <i class="gg-chevron-left-o"></i>
</button>

<div id="files"></div>`,
    js: `selected = null;
localStorage.removeItem("selected");

if (data.length) {
  var filesList = document.getElementById("files");
  var newFiles = [];

  data.forEach((file) => {
    var elem = document.createElement("button");
    elem.setAttribute("onclick", "selectFile(this)");
    elem.dataset.fileId = file.id;
    elem.classList.add("file");
    elem.style.backgroundImage = "url(" + file.thumbnailLink + ")";

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
}`,
  },

  file_viewer: {
    html: `
    <button class="back no-border" title="Go back" onclick="goBack()">
      <i class="gg-chevron-left-o"></i>
    </button>

    <div id="file-display"></div>`,
    js: `historyStack = ["id_input", "files_select"];
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
}`,
  },
};

function loading() {
  main.classList.add("loading");
}

function loadDone() {
  main.classList.remove("loading");
}

function getSelectableElements() {
  selectableElements = Array.from(
    document.querySelectorAll("input, button, select, textarea, a[href]")
  );
}

function selectNext() {
  if (!selectableElements.length) {
    return;
  }

  if (!document.activeElement || document.activeElement.tagName === "BODY") {
    document.activeElement.blur();
    selectableElements[0].focus();
    return;
  }

  let idx = selectableElements.indexOf(document.activeElement);
  if (idx < 0) {
    document.activeElement.blur();
    selectableElements[0].focus();
    return;
  }
  if (idx === selectableElements.length - 1) {
    return;
  }
  selectableElements[idx + 1].focus();
}

function selectPrev() {
  if (!selectableElements.length) {
    return;
  }

  if (!document.activeElement || document.activeElement.tagName === "BODY") {
    document.activeElement.blur();
    selectableElements[selectableElements.length - 1].focus();
    return;
  }

  let idx = selectableElements.indexOf(document.activeElement);
  if (idx < 0) {
    document.activeElement.blur();
    selectableElements[selectableElements.length - 1].focus();
    return;
  }
  if (idx === 0) {
    return;
  }
  selectableElements[idx - 1].focus();
}

function loadComponent(name) {
  loading();

  if (eventListeners.length) {
    var i = 0;
    for (i = 0; i < eventListeners.length; i++) {
      var e = eventListeners[i];
      document.removeEventListener(e.event, e.handler);
    }
    eventListeners = [];
  }

  main.innerHTML = components[name].html;
  var elem = document.createElement("script");
  elem.textContent = components[name].js;
  scripts.innerHTML = "";
  scripts.appendChild(elem);

  loadDone();
  historyStack.push(name);

  getSelectableElements();
  if (
    selectableElements.length &&
    (!document.activeElement || document.activeElement.tagName === "BODY")
  ) {
    document.activeElement.blur();
    if (selectableElements[0].classList.contains("back")) {
      if (selectableElements[1]) {
        selectableElements[1].focus();
        return;
      }
    }
    selectableElements[0].focus();
  }
}

function notify(status, title, msg) {
  var toast = document.createElement("div");
  toast.classList.add("toast", "active", status);
  toast.innerHTML = `<div class="toast-content">
  <i class="gg-check-o check"></i>
  <div class="message">
    <span class="text text-1">${title}</span>
    <span class="text text-2">${message}</span>
  </div>
</div>
<i class="gg-close close"></i>
<div class="progress active"></div>`;
  toasts.appendChild(toast);

  setTimeout(function () {
    toast.classList.remove("active");
    setTimeout(function () {
      toasts.removeChild(toast);
    }, 500);
  }, 5000);
}

function fetchFolderInfo(gid) {
  loading();
  try {
    fetch("https://advesa-reel-api.deno.dev/" + gid).then(function (res) {
      res.json().then(function (json) {
        loadDone();

        if (res.status !== 200) {
          notify("error", "Error", json.error || "Failed to get folder info");
          localStorage.removeItem("gid");

          if (historyStack[historyStack.length - 1] !== "id_input") {
            loadComponent("id_input");
          }
          return;
        }

        data = json;
        localStorage.setItem("gid", gid);

        loadComponent("files_select");
      });
    });
  } catch (e) {
    loadDone();
    notify("error", "Error", e.message || "Something went wrong");
    if (historyStack[historyStack.length - 1] !== "id_input") {
      loadComponent("id_input");
    }
  }
}

function goBack() {
  if (historyStack.length <= 1) {
    tizen.application.getCurrentApplication().exit();
    return;
  }
  historyStack.pop();

  if (historyStack.length) {
    var item = historyStack.pop();
    if (item === "files_select") {
      fetchFolderInfo(gid);
    } else {
      loadComponent(item);
      if (item === "id_input") {
        localStorage.removeItem("gid");
      }
    }
  }
}

function secretInputHandler(e) {
  // Press OK or number 0 - 10 times
  if (e.keyCode === 13 || e.keyCode === 48 || e.keyCode === 229) {
    clearTimeout(secretTimer);

    secretCount += 1;

    if (secretCount === 10) {
      fetchFolderInfo("1PXQWoOPXiV140oe-tO0svpjYSGK1Akqk");
      return;
    }

    secretTimer = setTimeout(function () {
      secretCount = 0;
    }, 5000);
  }
}

function selectFile(elem) {
  selected = elem.dataset.fileId;
  localStorage.setItem("selected", selected);
  loadComponent("file_viewer");
}

window.onload = function () {
  main = document.getElementById("main");
  scripts = document.getElementById("scripts");
  toasts = document.getElementById("toasts");

  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: {
        //LEFT arrow
        if (historyStack[historyStack.length - 1] === "id_input") {
          break;
        }
        selectPrev();
        break;
      }
      case 38: //UP arrow
        selectPrev();
        break;
      case 39: {
        //RIGHT arrow
        if (historyStack[historyStack.length - 1] === "id_input") {
          break;
        }
        selectNext();
        break;
      }
      case 40: //DOWN arrow
        selectNext();
        break;
      case 13: //OK button
        console.log("OK");
        break;
      case 10009: //RETURN button
        goBack();
        break;
      default:
        console.log("Key code : " + e.keyCode);
        break;
    }
  });

  if (gid) {
    historyStack.push("id_input");
    return fetchFolderInfo(gid);
  }

  loadComponent("id_input");
};
