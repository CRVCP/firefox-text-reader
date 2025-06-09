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
          // Store the voice name safely
          const storedVoiceName = ${JSON.stringify(voiceName)};
          
          const text = window.getSelection().toString();
          if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Clean up any existing speech and event listeners
            speechSynthesis.cancel();
            
            // Remove any existing escape key listeners
            const escKeyHandler = function(e) {
              if (e.key === 'Escape') {
                speechSynthesis.cancel();
                // Remove the event listener when escape is pressed
                document.removeEventListener('keydown', escKeyHandler);
              }
            };
            
            // Set up the voice and speak
            const setVoice = () => {
              const voices = speechSynthesis.getVoices();
              
              // Only try to set voice if we have a stored voice name
              if (storedVoiceName) {
                const selected = voices.find(v => v.name === storedVoiceName);
                if (selected) {
                  utterance.voice = selected;
                  console.log('Using voice:', selected.name);
                } else {
                  console.log('Selected voice not found, using default');
                }
              }
              
              // Add event listeners for speech events
              utterance.onend = function() {
                // Clean up when speech ends naturally
                document.removeEventListener('keydown', escKeyHandler);
              };
              
              utterance.onerror = function() {
                // Clean up on error
                document.removeEventListener('keydown', escKeyHandler);
              };
              
              // Add the escape key handler
              document.addEventListener('keydown', escKeyHandler);
              
              // Start speaking
              speechSynthesis.speak(utterance);
            };
            
            if (speechSynthesis.getVoices().length === 0) {
              speechSynthesis.onvoiceschanged = function() {
                setVoice();
                // Only run once
                speechSynthesis.onvoiceschanged = null;
              };
            } else {
              setVoice();
            }
          }
        `
      });
    });
  }
});
