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
          (function() {
            // Store the voice name safely
            const storedVoiceName = ${JSON.stringify(voiceName)};
            
            const text = window.getSelection().toString();
            if (!text) return;
            
            // First, ensure any existing speech is canceled
            speechSynthesis.cancel();
            
            // Create a new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Create a function to handle the escape key
            const handleEscapeKey = function(e) {
              if (e.key === 'Escape') {
                console.log('Escape key pressed, canceling speech');
                speechSynthesis.cancel();
                // Clean up the event listener
                document.removeEventListener('keydown', handleEscapeKey);
              }
            };
            
            // Function to set up the voice and start speaking
            const setupAndSpeak = () => {
              const voices = speechSynthesis.getVoices();
              
              // Try to set the selected voice
              if (storedVoiceName) {
                const selected = voices.find(v => v.name === storedVoiceName);
                if (selected) {
                  utterance.voice = selected;
                  console.log('Using voice:', selected.name);
                } else {
                  console.log('Selected voice not found, using default');
                }
              }
              
              // Add cleanup for when speech ends or errors
              utterance.onend = function() {
                console.log('Speech ended naturally');
                document.removeEventListener('keydown', handleEscapeKey);
              };
              
              utterance.onerror = function(event) {
                console.log('Speech error:', event.error);
                document.removeEventListener('keydown', handleEscapeKey);
              };
              
              // Add the escape key handler
              document.removeEventListener('keydown', handleEscapeKey); // Remove any existing handler just in case
              document.addEventListener('keydown', handleEscapeKey);
              
              // Start speaking
              speechSynthesis.speak(utterance);
            };
            
            // Check if voices are available or need to wait
            if (speechSynthesis.getVoices().length === 0) {
              speechSynthesis.onvoiceschanged = function() {
                setupAndSpeak();
                // Only run once
                speechSynthesis.onvoiceschanged = null;
              };
            } else {
              setupAndSpeak();
            }
          })(); // Immediately invoke the function to avoid polluting global scope
        `
      });
    });
  }
});