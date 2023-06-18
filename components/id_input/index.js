if (gid && gid !== "") {
  document.getElementById("id-input").value = gid;
}

document.getElementById("id-input-form").onsubmit = async function (e) {
  e.preventDefault();

  const gid = document.getElementById("id-input").value;

  await fetchFolderInfo(gid);
};
document.addEventListener("keydown", secretInputHandler);
eventListeners.push({ event: "keydown", handler: secretInputHandler });
