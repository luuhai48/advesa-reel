function loading() {
  document.getElementById("main").classList.add("loading");
}
function loadDone() {
  document.getElementById("main").classList.remove("loading");
}

window.onload = function () {
  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: //LEFT arrow
        break;
      case 38: //UP arrow
        break;
      case 39: //RIGHT arrow
        break;
      case 40: //DOWN arrow
        break;
      case 13: //OK button
        break;
      case 10009: //RETURN button
        tizen.application.getCurrentApplication().exit();
        break;
      default:
        console.log("Key code : " + e.keyCode);
        break;
    }
  });

  var main = document.getElementById("main");

  var gid = localStorage.getItem("gid");
  if (!gid) {
    fetch("components/id_input.html").then(async (res) => {
      var html = await res.text();
      main.innerHTML = html;
      loadDone();
    });
    return;
  }
};
