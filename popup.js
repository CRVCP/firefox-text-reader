const voiceSelect = document.getElementById('voiceSelect');

function populateVoiceList() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';

  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  // Load saved voice
  browser.storage.local.get('selectedVoice').then(data => {
    if (data.selectedVoice) {
      voiceSelect.value = data.selectedVoice;
    }
  });
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

voiceSelect.addEventListener('change', () => {
  browser.storage.local.set({ selectedVoice: voiceSelect.value });
});
