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
    html:
      '<form class="input-box" id="id-input-form" method="POST">\n' +
      "<h1>Please enter Google drive public folder ID</h1>\n" +
      "<input\n" +
      'type="text"\n' +
      'class="id-input"\n' +
      "autofocus\n" +
      'placeholder="e.g: 1ABQWoOABiV140oe-xxxxxxxxxxxxxxxx"\n' +
      'name="id-input"\n' +
      'id="id-input"\n' +
      "required\n" +
      "/>\n" +
      '<button class="id-button" type="submit">Enter</button>\n' +
      "</form>",
    js:
      'if (gid && gid !== "") {\n' +
      'document.getElementById("id-input").value = gid;\n' +
      "}\n" +
      'document.getElementById("id-input-form").onsubmit = function (e) {\n' +
      "e.preventDefault();\n" +
      'var gid = document.getElementById("id-input").value;\n' +
      "fetchFolderInfo(gid);\n" +
      "};\n" +
      'document.addEventListener("keydown", secretInputHandler);\n' +
      'eventListeners.push({ event: "keydown", handler: secretInputHandler });',
  },

  files_select: {
    html:
      '<button class="back no-border" title="Go back" onclick="goBack()">\n' +
      '<i class="gg-chevron-left-o"></i>\n' +
      "</button>\n" +
      '<div id="files"></div>',
    js:
      "selected = null;\n" +
      'localStorage.removeItem("selected");\n' +
      "if (data.length) {\n" +
      'var filesList = document.getElementById("files");\n' +
      "var i = 0;\n" +
      "for (i = 0; i < data.length; i++) {\n" +
      "var file = data[i];\n" +
      'var elem = document.createElement("button");\n' +
      'elem.setAttribute("onclick", "selectFile(this)");\n' +
      "elem.dataset.fileId = file.id;\n" +
      'elem.classList.add("file");\n' +
      'elem.style.backgroundImage = "url(" + file.thumbnailLink + ")";\n' +
      'var icon = document.createElement("img");\n' +
      'icon.classList.add("icon");\n' +
      "icon.src = file.iconLink;\n" +
      "elem.appendChild(icon);\n" +
      'var title = document.createElement("span");\n' +
      "title.textContent = file.title;\n" +
      "elem.appendChild(title);\n" +
      "filesList.appendChild(elem);\n" +
      "}\n" +
      "}",
  },

  file_viewer: {
    html:
      '<button class="back no-border" title="Go back" onclick="goBack()">\n' +
      '<i class="gg-chevron-left-o"></i>\n' +
      "</button>\n" +
      '<div id="file-display"></div>',
    js:
      'historyStack = ["id_input", "files_select"];\n' +
      "var file = data.find(function (f) {\n" +
      "return f.id === selected;\n" +
      "});\n" +
      "if (!file) {\n" +
      "goBack();\n" +
      "} else {\n" +
      "if (imageMimeTypes.includes(file.mimeType)) {\n" +
      'var img = document.createElement("img");\n' +
      "img.src = file.webContentLink;\n" +
      'document.getElementById("file-display").appendChild(img);\n' +
      "} else if (videoMimeTypes.includes(file.mimeType)) {\n" +
      'var vid = document.createElement("video");\n' +
      "vid.controls = false;\n" +
      "vid.autoplay = true;\n" +
      "vid.controls = true;\n" +
      'vid.preload = "auto";\n' +
      "vid.loop = true;\n" +
      "vid.width = 1280;\n" +
      "vid.height = 720;\n" +
      "vid.src = file.webContentLink;\n" +
      'document.getElementById("file-display").appendChild(vid);\n' +
      "vid.webkitRequestFullScreen();\n" +
      "} else {\n" +
      'historyStack = ["id_input"];\n' +
      'loadComponent("files_select");\n' +
      "}\n" +
      "}",
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
    selectableElements[0].focus();
  }
}

function notify(status, title, msg) {
  var toast = document.createElement("div");
  toast.classList.add("toast", "active", status);

  var content = document.createElement("div");
  content.classList.add("toast-content");

  var iconCheck = document.createElement("i");
  iconCheck.classList.add("gg-check-o check");

  var message = document.createElement("div");
  message.classList.add("message");

  var text1 = document.createElement("span");
  text1.classList.add("text", "text-1");
  text1.textContent = title;

  var text2 = document.createElement("span");
  text2.classList.add("text", "text-2");
  text2.textContent = msg;
  message.append(text1, text2);

  content.append(iconCheck, message);

  var iconClose = document.createElement("i");
  iconClose.classList.add("gg-close", "close");

  var progress = document.createElement("div");
  progress.classList.add("progress", "active");

  toast.append(content, iconClose, progress);

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

        if (selected) {
          var file = data.find(function (f) {
            return f.id === selected;
          });
          if (file) {
            historyStack.push("files_select");
            return loadComponent("file_viewer");
          }
        }

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
    loadComponent(item);
    if (item === "id_input") {
      localStorage.removeItem("gid");
    }
  }
}

function secretInputHandler(e) {
  // Press OK or number 0 - 10 times
  if (e.keyCode === 13 || e.keyCode === 48 || e.keyCode === 229) {
    clearTimeout(secretTimer);

    secretCount += 1;

    if (secretCount === 10) {
      var id_input = document.getElementById("id-input");
      if (id_input) {
        id_input.disabled = true;
        id_input.value = "1PXQWoOPXiV140oe-tO0svpjYSGK1Akqk";
        setTimeout(function () {
          id_input.removeAttribute("disabled");
        }, 100);
      }
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
