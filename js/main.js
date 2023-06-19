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
  if (!selectableElements.length) return;

  if (!document.activeElement || document.activeElement.tagName === "BODY") {
    document.activeElement?.blur();
    selectableElements[0].focus();
    return;
  }

  let idx = selectableElements.indexOf(document.activeElement);
  if (idx < 0) {
    document.activeElement?.blur();
    selectableElements[0].focus();
    return;
  }
  if (idx === selectableElements.length - 1) return;
  selectableElements[idx + 1].focus();
}

function selectPrev() {
  if (!selectableElements.length) return;

  if (!document.activeElement || document.activeElement.tagName === "BODY") {
    document.activeElement?.blur();
    selectableElements[selectableElements.length - 1].focus();
    return;
  }

  let idx = selectableElements.indexOf(document.activeElement);
  if (idx < 0) {
    document.activeElement?.blur();
    selectableElements[selectableElements.length - 1].focus();
    return;
  }
  if (idx === 0) return;
  selectableElements[idx - 1].focus();
}

async function loadComponent(name) {
  loading();

  if (eventListeners.length) {
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    eventListeners = [];
  }

  await fetch(`components/${name}/index.html`)
    .then((res) => res.text())
    .then((html) => {
      main.innerHTML = html;
    });
  await fetch(`components/${name}/index.js`)
    .then((res) => res.text())
    .then((js) => {
      var elem = document.createElement("script");
      elem.textContent = js;
      scripts.innerHTML = "";
      scripts.appendChild(elem);
    });

  loadDone();
  historyStack.push(name);

  getSelectableElements();
  if (
    selectableElements.length &&
    (!document.activeElement || document.activeElement.tagName === "BODY")
  ) {
    document.activeElement?.blur();
    selectableElements[0].focus();
  }
}

function notify(status, title, message) {
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

  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => {
      toasts.removeChild(toast);
    }, 500);
  }, 5000);
}

async function fetchFolderInfo(gid) {
  loading();
  try {
    const res = await fetch(`https://advesa-reel-api.deno.dev/${gid}`);
    const json = await res.json();
    loadDone();

    if (res.status !== 200) {
      notify("error", "Error", json?.error || "Failed to get folder info");
      localStorage.removeItem("gid");

      if (historyStack[historyStack.length - 1] !== "id_input") {
        await loadComponent("id_input");
      }
      return;
    }

    data = json;
    localStorage.setItem("gid", gid);

    if (selected) {
      var file = data.find((f) => f.id === selected);
      if (file) {
        historyStack.push("files_select");
        return await loadComponent("file_viewer");
      }
    }

    await loadComponent("files_select");
  } catch (e) {
    loadDone();
    notify("error", "Error", e?.message || "Something went wrong");
    if (historyStack[historyStack.length - 1] !== "id_input") {
      await loadComponent("id_input");
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
  if (e.keyCode === 13 || e.keyCode === 48) {
    clearTimeout(secretTimer);

    secretCount += 1;

    if (secretCount === 10) {
      var id_input = document.getElementById("id-input");
      if (id_input) {
        id_input.disabled = true;
        id_input.value = "1PXQWoOPXiV140oe-tO0svpjYSGK1Akqk";
        setTimeout(() => {
          id_input.removeAttribute("disabled");
        }, 100);
      }
      return;
    }

    secretTimer = setTimeout(() => {
      secretCount = 0;
    }, 5000);
  }
}

function selectFile(elem) {
  selected = elem.dataset.fileId;
  localStorage.setItem("selected", selected);
  loadComponent("file_viewer");
}

window.onload = async function () {
  main = document.getElementById("main");
  scripts = document.getElementById("scripts");
  toasts = document.getElementById("toasts");

  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: {
        //LEFT arrow
        if (historyStack[historyStack.length - 1] === "id_input") break;
        selectPrev();
        break;
      }
      case 38: //UP arrow
        selectPrev();
        break;
      case 39: {
        //RIGHT arrow
        if (historyStack[historyStack.length - 1] === "id_input") break;
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
    return await fetchFolderInfo(gid);
  }

  await loadComponent("id_input");
};
