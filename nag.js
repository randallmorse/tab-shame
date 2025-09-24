// ...existing code...

let currentAudio = null;

let quotes = [
  "Wow... another tab? Bold move.",
  "Your future self is facepalming.",
  "Because clearly, 37 tabs wasnt enough.",
  "This is why we cant have nice things.",
  "Youre not multitasking, youre multi-procrastinating.",
  "Tabs are like rabbits. They multiply when youre not looking."
];

// Load custom quotes from storage if present
chrome.storage.sync.get("nagQuotes", (data) => {
  if (chrome.runtime.lastError) {
    console.error("Error getting nagQuotes:", chrome.runtime.lastError);
    return;
  }
  if (data.nagQuotes && Array.isArray(data.nagQuotes) && data.nagQuotes.length > 0) {
    quotes = data.nagQuotes;
  }
});

const sounds = [
  "sounds/sigh.mp3",
  "sounds/really_need_another.mp3",
  "sounds/future_self_judging.mp3"
];


const urlParams = new URLSearchParams(window.location.search);
const tabCount = urlParams.get("tabCount");
const tabLimit = urlParams.get("tabLimit");
const windowCount = urlParams.get("windowCount");
const windowLimit = urlParams.get("windowLimit");
const delay = parseInt(urlParams.get("delay"), 10);
const originalUrl = urlParams.get("originalUrl");
const homePage = urlParams.get("homePage") || "https://google.com";

// Snooze logic: if snoozed, auto-redirect immediately
chrome.storage.sync.get("nagSnoozeUntil", (data) => {
  if (chrome.runtime.lastError) {
    console.error("Error getting nagSnoozeUntil:", chrome.runtime.lastError);
    return;
  }
  const now = Date.now();
  if (data.nagSnoozeUntil && now < data.nagSnoozeUntil) {
    // Snooze active, redirect immediately
    if (originalUrl && originalUrl.startsWith("http")) {
      window.location.href = originalUrl;
    } else {
      window.location.href = homePage;
    }
  }
});

document.getElementById("tabStats").innerText = `Tabs: ${tabCount} / Limit: ${tabLimit}`;
document.getElementById("windowStats").innerText = `Windows: ${windowCount} / Limit: ${windowLimit}`;

function showRandomQuote() {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").innerText = randomQuote;
}

function playRandomSound() {
  chrome.storage.sync.get("muteSounds", (data) => {
    if (!data.muteSounds) {
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(chrome.runtime.getURL(randomSound));
      currentAudio.volume = 0.8; // not too loud
      currentAudio.play().catch(err => {
        console.warn("Audio playback blocked:", err);
      });
    }
  });
}

function startCountdown(seconds, redirectUrl) {
  let timeLeft = seconds;
  const countdownEl = document.getElementById("countdown");
  countdownEl.innerText = `${timeLeft} seconds`;

  const timer = setInterval(() => {
    timeLeft--;
    countdownEl.innerText = `${timeLeft} seconds`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (redirectUrl && redirectUrl.startsWith("http")) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = homePage;
      }
    }
  }, 1000);
}

document.getElementById("muteBtn").addEventListener("click", () => {
  chrome.storage.sync.get("muteSounds", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting muteSounds:", chrome.runtime.lastError);
      return;
    }
    const newMute = !data.muteSounds;
    chrome.storage.sync.set({ muteSounds: newMute }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting muteSounds:", chrome.runtime.lastError);
        return;
      }
      // Stop any currently playing sound if muting
      if (newMute && currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      // Optionally update button text
      document.getElementById("muteBtn").innerText = newMute ? "Unmute Sounds" : "Mute Sounds";
    });
  });
});


document.getElementById("settingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage(() => {
    if (chrome.runtime.lastError) {
      console.error("Error opening options page:", chrome.runtime.lastError);
    }
  });
});

// Snooze button logic
document.getElementById("snoozeBtn").addEventListener("click", () => {
  // Set snooze for 10 minutes from now
  const snoozeUntil = Date.now() + 10 * 60 * 1000;
  chrome.storage.sync.set({ nagSnoozeUntil: snoozeUntil }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error setting nagSnoozeUntil:", chrome.runtime.lastError);
      return;
    }
    // Redirect immediately
    if (originalUrl && originalUrl.startsWith("http")) {
      window.location.href = originalUrl;
    } else {
      window.location.href = homePage;
    }
  });
});


showRandomQuote();
playRandomSound();
startCountdown(delay, originalUrl);

// Set initial mute button text
chrome.storage.sync.get("muteSounds", (data) => {
  if (chrome.runtime.lastError) {
    console.error("Error getting muteSounds:", chrome.runtime.lastError);
    return;
  }
  document.getElementById("muteBtn").innerText = data.muteSounds ? "Unmute Sounds" : "Mute Sounds";
});
