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
        const authToken = getHeader(details.requestHeaders, tokenHeaderName);
        console.log("Headers: ", authToken);
        saveItem("authToken", authToken);
      },
      { urls: [`https://${woolworths}/*`, `http://${woolworths}/*`] },
      ["requestHeaders", "extraHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
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
});

function saveItem(key, value) {
  chrome.storage.sync.set({ key: value }, function () {
    console.log(`Saved item: KEY ${key}, VALUE: ${value}`);
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
