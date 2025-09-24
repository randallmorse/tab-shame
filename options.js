  // Reset snooze button logic
  document.getElementById("resetSnooze").addEventListener("click", () => {
    chrome.storage.sync.remove("nagSnoozeUntil", () => {
      if (chrome.runtime.lastError) {
        alert("Error resetting snooze: " + chrome.runtime.lastError.message);
      } else {
        alert("Snooze has been reset. The nag screen will reappear as normal.");
      }
    });
  });
document.addEventListener("DOMContentLoaded", () => {
  // Show nag stats (tabs and windows open)
  function updateNagStats() {
    chrome.tabs.query({}, (tabs) => {
      chrome.windows.getAll({}, (windows) => {
        document.getElementById("nagStats").innerText =
          `Tabs open: ${tabs.length} | Windows open: ${windows.length}`;
      });
    });
  }
  updateNagStats();
  setInterval(updateNagStats, 5000);
  // Load saved settings
  chrome.storage.sync.get(["tabLimit", "windowLimit", "muteSounds", "homePage", "darkMode", "nagQuotes"], (data) => {
    document.getElementById("tabLimit").value = data.tabLimit || 10;
    document.getElementById("windowLimit").value = data.windowLimit || 3;
    document.getElementById("muteSounds").checked = data.muteSounds || false;
    document.getElementById("homePage").value = data.homePage || "https://google.com";
    document.getElementById("darkModeToggle").checked = !!data.darkMode;
    setDarkMode(!!data.darkMode);
    document.getElementById("nagQuotes").value = (data.nagQuotes && Array.isArray(data.nagQuotes)) ? data.nagQuotes.join("\n") : "";
  });
  const homePage = document.getElementById("homePage").value.trim() || "https://google.com";

  // Save settings when user clicks "Save"
  document.getElementById("save").addEventListener("click", () => {
    // No redirectUrl logic needed
    const darkMode = document.getElementById("darkModeToggle").checked;
    // Parse nag quotes (ignore empty lines)
    const nagQuotes = document.getElementById("nagQuotes").value
      .split("\n").map(q => q.trim()).filter(q => q.length > 0);
    chrome.storage.sync.set({
      tabLimit: parseInt(document.getElementById("tabLimit").value, 10),
      windowLimit: parseInt(document.getElementById("windowLimit").value, 10),
      muteSounds: document.getElementById("muteSounds").checked,
      homePage: homePage,
      darkMode: darkMode,
      nagQuotes: nagQuotes
    }, () => {
      window.location.href = 'thankyou.html';
    });
  });

  // Toggle dark mode immediately when checkbox is changed
  document.getElementById("darkModeToggle").addEventListener("change", (e) => {
    setDarkMode(e.target.checked);
  });

  function setDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  // Debug: Send message to background when options page loads
  chrome.runtime.sendMessage('debug-options', (response) => {
    console.log('Options page got response:', response);
  });
});