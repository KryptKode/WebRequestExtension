var addButton = document.getElementById("add-list");

var viewButton = document.getElementById("view-list");

addButton.addEventListener("click", function () {
  console.log("Add button clicked");
});

viewButton.addEventListener("click", function () {
  console.log("View button clicked");
});

function listExists() {}

function enableOrDisableAddButton() {
  chrome.storage.sync.get(["addItemBody", "authToken"], function (data) {
    var enabled = false;
    if (data.addItemBody && data.authToken) {
      enabled = true;
    }
    addButton.disabled = !enabled;
    console.log("Add button is enabed", enabled);
    console.log("Add button is enabed data", data);
  });
}

function enableOrDisableViewButton() {
  chrome.storage.sync.get("addItemBody", function (data) {
    var enabled = data.addItemBody;
    viewButton.disabled = !enabled;
    console.log("View button is enabed", enabled);
  });
}

function addItemHttpRequest() {}

enableOrDisableAddButton();
enableOrDisableViewButton();
