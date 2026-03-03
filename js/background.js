chrome.runtime.onInstalled.addListener(() => {

  chrome.contextMenus.removeAll(() => {

    chrome.contextMenus.create({
      id: 'convert-text',
      title: 'BitShell',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;

  if (!selectedText) {
    return;
  }

  chrome.storage.local.set({ pendingInput: selectedText }, () => {

    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 1100,
      height: 950
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'closeWindow') {

    if (sender.tab && sender.tab.windowId) {
      chrome.windows.remove(sender.tab.windowId);
    }
  } else if (request.action === 'minimizeWindow') {

    if (sender.tab && sender.tab.windowId) {
      chrome.windows.update(sender.tab.windowId, { state: 'minimized' });
    }
  } else if (request.action === 'maximizeWindow') {

    if (sender.tab && sender.tab.windowId) {
      chrome.windows.get(sender.tab.windowId, (win) => {
        if (win.state === 'maximized') {
          chrome.windows.update(sender.tab.windowId, { state: 'normal' });
        } else {
          chrome.windows.update(sender.tab.windowId, { state: 'maximized' });
        }
      });
    }
  } else if (request.action === 'popoutWindow') {

    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 1100,
      height: 950
    });
  }
});

// Handle popout from popup button — already have pendingInput set by popup.js
