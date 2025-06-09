browser.contextMenus.create({
  id: "readText",
  title: "Read selected text",
  contexts: ["selection"]
});

// Global variable to track if we have an active global escape handler
let globalEscapeHandlerActive = false;

// Global escape handler function that will be used across all instances
function globalEscapeHandler(e) {
  if (e.key === 'Escape') {
    console.log('Global escape handler triggered');
    speechSynthesis.cancel();
    
    // Reset the speech synthesis state completely
    window.speechSynthesis = window.speechSynthesis;
    
    // Remove the global handler
    document.removeEventListener('keydown', globalEscapeHandler);
    globalEscapeHandlerActive = false;
  }
}

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
            // First, ensure any existing speech is canceled and cleaned up
            speechSynthesis.cancel();
            
            // Create a new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
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
                console.log('Speech ended naturally');
                // Remove global escape handler if it exists
                if (globalEscapeHandlerActive) {
                  document.removeEventListener('keydown', globalEscapeHandler);
                  globalEscapeHandlerActive = false;
                }
              };
              
              utterance.onerror = function(event) {
                console.log('Speech error:', event.error);
                // Remove global escape handler if it exists
                if (globalEscapeHandlerActive) {
                  document.removeEventListener('keydown', globalEscapeHandler);
                  globalEscapeHandlerActive = false;
                }
              };
              
              // Set up global escape handler if not already active
              if (!globalEscapeHandlerActive) {
                document.removeEventListener('keydown', globalEscapeHandler); // Remove any existing handler just in case
                document.addEventListener('keydown', globalEscapeHandler);
                globalEscapeHandlerActive = true;
                console.log('Global escape handler added');
              }
              
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
