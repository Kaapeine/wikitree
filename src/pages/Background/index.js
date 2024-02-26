chrome.action.onClicked.addListener(() => {
  chrome.tabs.query(
    {
      url: [
        'chrome-extension://dccikhgcnpionfmfjcomhhemegfedlhf/wikitree.html',
      ],
    },
    (tabs) => {
      console.log('FOUND', tabs);
      if (tabs.length !== 0) {
        console.log('FOUND', tabs);
        chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('wikitree.html') });
      }
    }
  );
});
