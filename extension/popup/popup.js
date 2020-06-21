var addButton = document.getElementById("add-list");

var viewButton = document.getElementById("view-list");

var errorText = document.getElementById("error-text");
var successText = document.getElementById("success-text");

var loadingIndicator = document.getElementById("loader");
var listContent = document.getElementById("list-content");
var showingList = false;

var port = chrome.runtime.connect({ name: "addList" });
port.onMessage.addListener(function (msg) {
  handleResponse(msg);
});

addButton.addEventListener("click", function () {
  console.log("Add button clicked");
  chrome.storage.sync.get(["addItemBody", "authToken"], function (data) {
    var body = data.addItemBody;
    var token = data.authToken;
    if (body && token) {
      port.postMessage({ action: "addList" });
    } else {
      const message = body
        ? "Cannot detect current account, please perform some actions on the page"
        : "No products";
      showError(message);
    }
  });
});

viewButton.addEventListener("click", function () {
  if (showingList) {
    hideList();
    showingList = false;
  } else {
    showList();
    showingList = true;
  }
});

function handleResponse(response) {
  if (response) {
    if (response.loading) {
      showLoading();
    } else {
      var message = response.message;
      hideLoading();
      showError(message);
    }
  }
}

function enableOrDisableAddButton() {
  chrome.storage.sync.get(["addItemBody", "authToken"], function (data) {
    var enabled = false;
    if (data.addItemBody && data.authToken) {
      enabled = true;
    }
    addButton.disabled = !enabled;
    if (!enabled) {
      addButton.className += " btn-disabled";
      addButton.parentNode.className += " flex-disabled";
    }
    console.log("Add button is enabed", enabled);
  });
}

function enableOrDisableViewButton() {
  chrome.storage.sync.get("addItemBody", function (data) {
    var enabled = data.addItemBody;
    viewButton.disabled = !enabled;
    if (!enabled) {
      viewButton.className += " btn-disabled";
      viewButton.parentNode.className += " flex-disabled";
    }
    console.log("View button is enabed", enabled);
  });
}

async function postData(url = "", data, token = "") {
  console.log("URL: ", url);
  console.log("DATA: ", data);
  console.log("TOKEN: ", token);
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      __requestverificationtoken: token,
      origin: "https://www.woolworths.com.au",
      referrer: "https://www.woolworths.com.au/shop/cart",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data, // body data type must match "Content-Type" header
  });
  console.log("SERVER", response);
  return response;
}

function showError(message) {
  errorText.style.display = "block";
  errorText.innerHTML = message;
}

function hideError() {
  errorText.style.display = "none";
}

function showSuccess(message) {
  successText.style.display = "block";
  successText.innerHTML = message;
}

function hideSuccess() {
  successText.style.display = "none";
}
function showLoading() {
  loadingIndicator.style.display = "flex";
}

function hideLoading() {
  loadingIndicator.style.display = "none";
}

function showList() {
  chrome.storage.sync.get(["addItemBody"], function (data) {
    var body = data.addItemBody;
    if (body) {
      viewButton.innerHTML = "Hide List";
      listContent.style.display = "block";
      listContent.innerHTML = syntaxHighlight(
        JSON.stringify(JSON.parse(body), undefined, 4)
      );
      showingList = true;
    } else {
      showingList = false;
      showError("No list found");
    }
  });
}

function hideList() {
  listContent.style.display = "none";
  viewButton.innerHTML = "View List";
}

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

enableOrDisableAddButton();
enableOrDisableViewButton();
