
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
});
console.log("BACKG")
