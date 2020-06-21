var woolworths = "www.woolworths.com.au";

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: woolworths },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);

    var tokenHeaderName = "__requestverificationtoken";

    chrome.webRequest.onSendHeaders.addListener(
      function (details) {
        console.log("HEADER DETAILS: ", details);
        chrome.storage.sync.get(["addItemBody", "authToken"], function (data) {
          console.log(`ITEM: ${data.addItemBody} --- TOKEN: ${data.authToken}`);
        });
        const authToken = getHeader(details.requestHeaders, tokenHeaderName);
        console.log("Headers: ", authToken);
        if (authToken && authToken != "null") {
          saveItem("authToken", authToken);
        }
      },
      { urls: [`https://${woolworths}/*`, `http://${woolworths}/*`] },
      ["requestHeaders", "extraHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
        console.log("details--> ", details);
        chrome.storage.sync.get(["addItemBody", "authToken"], function (data) {
          console.log(`ITEM:`, data);
        });
        const rawBody = details.requestBody.raw;
        if (rawBody.length > 0) {
          const body = ab2str(rawBody[0].bytes);
          saveItem("addItemBody", body);
          console.log("SAVED BODY: ", body);
        }
      },
      {
        urls: [
          `https://${woolworths}/apis/ui/Trolley/AddItems`,
          `http://${woolworths}/apis/ui/Trolley/AddItems`,
        ],
      },
      ["requestBody"]
    );
  });

  var url = "https://www.woolworths.com.au/apis/ui/Trolley/AddItems";
  chrome.runtime.onConnect.addListener(function (port) {
    if ((port.name = "addList")) {
      port.onMessage.addListener(function (message) {
        if (message.action == "addList") {
          port.postMessage({ loading: true });
          chrome.storage.sync.get(["addItemBody", "authToken"], function (
            data
          ) {
            var body = data.addItemBody;
            var token = data.authToken;
            if (body && token) {
              postData(url, body, token)
                .then((result) => {
                  if (result.status == 200) {
                    port.postMessage({
                      loading: false,
                      success: true,
                      message: "List added successfully",
                    });
                  } else {
                    if (result.status == 400) {
                      port.postMessage({
                        loading: false,
                        success: false,
                        message:
                          "Could not add the list to this account.\nCould be that the list is already added or you may need to log out and login",
                      });
                    } else {
                      port.postMessage({
                        loading: false,
                        success: false,
                        message: "Could not add the list. Please try again",
                      });
                    }
                  }
                  console.log("RESULT ", result);
                })
                .catch((err) => {
                  port.postMessage({
                    loading: false,
                    success: false,
                    message: "An error occurred. Please try again",
                  });
                  console.error("An error ocurred", err);
                });
            } else {
              const message = body
                ? "Cannot detect current account, please perform some actions on the page"
                : "No products";
              console.log(message);
              port.postMessage({
                loading: false,
                success: false,
                message: message,
              });
            }
          });
        }
      });
    }
  });
});

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

function saveItem(key, value) {
  var obj = {};
  obj[key] = value;
  chrome.storage.sync.set(obj, function () {
    console.log(`Saved item: KEY ${key}, VALUE: ${value}`);
    chrome.storage.sync.get([key], function (data) {
      console.log("GET", data);
    });
  });
}

function logHeader(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header.name.toLowerCase() == name.toLowerCase()) {
      console.log("Headers: ", header);
    }
  }
}

function getHeader(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header.name.toLowerCase() == name.toLowerCase()) {
      return header.value;
    }
  }
  return null;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
