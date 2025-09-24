// On Chrome startup, check window count and trigger nag if over limit
chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(() => {
  chrome.windows.getAll({}, (windows) => {
    chrome.storage.sync.get(["windowLimit"], (data) => {
      const limit = data.windowLimit || windowLimit;
      if (windows.length > limit) {
        chrome.windows.getLastFocused((lastWin) => {
          if (lastWin && lastWin.id) {
            triggerNag(lastWin.id, "window");
          }
        });
      }
    });
  });
});
// On extension startup, check window count and trigger nag if over limit
chrome.windows.getAll({}, (windows) => {
  // Get the window limit from storage (or use default)
  chrome.storage.sync.get(["windowLimit"], (data) => {
    const limit = data.windowLimit || windowLimit;
    // If over the window limit, trigger a nag on the most recently focused window
    if (windows.length > limit) {
      chrome.windows.getLastFocused((lastWin) => {
        if (lastWin && lastWin.id) {
          triggerNag(lastWin.id, "window");
        }
      });
    }
  });
});
// Listen for tab updates to skip nag for options page or extension pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ignore updates for options page or extension pages
  const url = changeInfo.url || tab.url || tab.pendingUrl || "";
  if (url.includes("options.html") || url.startsWith("chrome-extension://")) {
    return;
  }
});
// Default limits (will be overwritten by storage values)
let tabLimit = 10;
let windowLimit = 3;



// Load limits and home page from storage at startup
chrome.storage.sync.get(["tabLimit", "windowLimit", "homePage"], (data) => {
  if (data.tabLimit) tabLimit = data.tabLimit;
  if (data.windowLimit) windowLimit = data.windowLimit;
  if (!data.homePage) {
    chrome.storage.sync.set({ homePage: "https://google.com" });
  }
});



// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounced window nag handler
const debouncedWindowNag = debounce((newWindow) => {
  chrome.windows.getAll({}, (windows) => {
    chrome.storage.sync.get(["windowLimit"], (data) => {
      const limit = data.windowLimit || windowLimit;
      if (windows.length > limit) {
        triggerNag(newWindow.id, "window");
      }
    });
  });
}, 500);

chrome.windows.onCreated.addListener(debouncedWindowNag);



// Debounced tab nag handler
const debouncedTabNag = debounce((tab) => {
  // Skip if it's the options page or any extension page
  const url = tab.url || tab.pendingUrl || "";
  if (url.includes("options.html") || url.startsWith("chrome-extension://")) {
    return;
  }
  chrome.tabs.query({}, (tabs) => {
    chrome.storage.sync.get(["tabLimit"], (data) => {
      const limit = data.tabLimit || tabLimit;
      if (tabs.length > limit) {
        triggerNag(tab.id, "tab");
      }
    });
  });
}, 500);

chrome.tabs.onCreated.addListener(debouncedTabNag);

// Listen for keyboard shortcut to open the options page
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-options") {
    chrome.runtime.openOptionsPage();
  }
});

// Triggers the nag screen for a tab or window if over the limit
function triggerNag(targetId, type) {
  chrome.tabs.query({}, (tabs) => {
    const tabCount = tabs.length;
    chrome.windows.getAll({}, (windows) => {
      const windowCount = windows.length;

      // Calculate how much over the limit we are
      let overLimit = type === "tab" ? tabCount - tabLimit : windowCount - windowLimit;
      if (overLimit < 0) overLimit = 0;

    // Exponential delay growth, minimum 5 seconds
    const baseDelay = 5; // seconds
    const growthFactor = 2; // doubles each time
    let delay = Math.floor(baseDelay * Math.pow(growthFactor, overLimit));
    if (isNaN(delay) || delay < 5) delay = 5;

      // Get latest limits and redirect URL from storage
      chrome.storage.sync.get(["tabLimit", "windowLimit", "homePage"], (data) => {
        let homePage = data.homePage || "https://google.com";
        let originalUrl = tabs.find(t => t.id === targetId)?.url;
        // Prevent redirecting to chrome://, extension pages, or options page
        if (!originalUrl || !originalUrl.startsWith("http") || originalUrl.includes("options.html") || originalUrl.startsWith("chrome-extension://")) {
          originalUrl = ""; // treat as no valid originalUrl
        }
        // Build nag.html URL with both originalUrl and fallback homePage
        const params = new URLSearchParams({
          originalUrl: originalUrl,
          delay: delay,
          tabCount: tabCount,
          tabLimit: data.tabLimit || tabLimit,
          windowCount: windowCount,
          windowLimit: data.windowLimit || windowLimit,
          homePage: homePage
        });
        chrome.tabs.update(targetId, {
          url: chrome.runtime.getURL(`nag.html?${params.toString()}`)
        });
      });
    });
  });
}

// Debug: Log when options page is opened (for development)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'debug-options') {
    console.log('Options page message received in background');
    sendResponse('Background received options page message');
  }
});
