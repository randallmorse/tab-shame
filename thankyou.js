// thankyou.js
// Handles opening the options page from the thank you page


// Apply dark mode as soon as possible and fix text color
chrome.storage && chrome.storage.sync.get("darkMode", (data) => {
  if (data.darkMode) {
    document.body.classList.add("dark-mode");
    // Fix text color for dark mode
    document.getElementById("thankHeader").style.color = "#fff";
    document.getElementById("thankMsg").style.color = "#ccc";
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // (Dark mode already applied above)
  document.getElementById('backBtn').onclick = function() {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };
});
