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
        logHeader(details.requestHeaders, tokenHeaderName);
      },
      { urls: [`https://${woolworths}/*`, `http://${woolworths}/*`] },
      ["requestHeaders", "extraHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener(
      function (details) {
        console.log("BODY: ", ab2str(details.requestBody.raw[0].bytes));
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

function logHeader(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header.name.toLowerCase() == name.toLowerCase()) {
      console.log("Headers: ", header);
    }
  }
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
