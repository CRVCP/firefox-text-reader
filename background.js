browser.contextMenus.create({
  id: "readText",
  title: "Read selected text",
  contexts: ["selection"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "readText") {
    browser.storage.local.get('selectedVoice').then(data => {
      const voiceName = data.selectedVoice || '';
      browser.tabs.executeScript({
        code: `
          const text = window.getSelection().toString();
          if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            const setVoice = () => {
              const voices = speechSynthesis.getVoices();
              const selected = voices.find(v => v.name === "${voiceName}");
              if (selected) utterance.voice = selected;
              speechSynthesis.speak(utterance);
              
              // Add a simple one-time event listener for Escape key
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                  speechSynthesis.cancel();
                }
              }, { once: true });
            };
            
            if (speechSynthesis.getVoices().length === 0) {
              speechSynthesis.onvoiceschanged = setVoice;
            } else {
              setVoice();
            }
          }
        `
      });
    });
  }
});
