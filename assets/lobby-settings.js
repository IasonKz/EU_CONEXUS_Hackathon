(function(){
  "use strict";

  const PROGRESS_KEY = "floraUnlockedLevel";
  const COMPLETED_KEY = "floraCompletedLevels";
  const NOTEBOOK_KEY = "floraNotebookEntries";

  function playSelect(){
    if(window.BeeAudio && typeof window.BeeAudio.play === "function"){
      window.BeeAudio.play("select");
    }
  }

  function storageSet(key, value){
    try{ localStorage.setItem(key, value); }
    catch(error){ /* keep settings panel usable without localStorage */ }
  }

  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn);
    }
    else{
      fn();
    }
  }

  ready(() => {
    const settingsOverlay = document.getElementById("settingsOverlay");
    const settingsButton = document.getElementById("settingsButton");
    const closeSettings = document.getElementById("closeSettings");
    const musicToggle = document.getElementById("musicToggle");
    const sfxToggle = document.getElementById("sfxToggle");
    const audioVolume = document.getElementById("audioVolume");
    const audioVolumeLabel = document.getElementById("audioVolumeLabel");
    const resetProgressSettings = document.getElementById("resetProgressSettings");

    if(!settingsOverlay || !settingsButton || !closeSettings || !musicToggle || !sfxToggle || !audioVolume || !audioVolumeLabel){
      return;
    }

    function syncSettingsUI(){
      const settings = window.BeeAudio
        ? window.BeeAudio.getSettings()
        : { music: false, sfx: false, volume: 0 };

      musicToggle.textContent = settings.music ? "ON" : "OFF";
      sfxToggle.textContent = settings.sfx ? "ON" : "OFF";
      audioVolume.value = Math.round(settings.volume * 100);
      audioVolumeLabel.textContent = `${Math.round(settings.volume * 100)}%`;
    }

    function openSettings(){
      playSelect();
      syncSettingsUI();
      settingsOverlay.style.display = "flex";
      settingsOverlay.setAttribute("aria-hidden", "false");
    }

    function closeSettingsPanel(){
      playSelect();
      settingsOverlay.style.display = "none";
      settingsOverlay.setAttribute("aria-hidden", "true");
    }

    settingsButton.addEventListener("click", openSettings);
    closeSettings.addEventListener("click", closeSettingsPanel);
    settingsOverlay.addEventListener("click", event => {
      if(event.target === settingsOverlay){
        closeSettingsPanel();
      }
    });

    musicToggle.addEventListener("click", () => {
      if(!window.BeeAudio) return;
      const settings = window.BeeAudio.getSettings();
      window.BeeAudio.setMusic(!settings.music);
      playSelect();
      syncSettingsUI();
    });

    sfxToggle.addEventListener("click", () => {
      if(!window.BeeAudio) return;
      const settings = window.BeeAudio.getSettings();
      window.BeeAudio.setSfx(!settings.sfx);
      playSelect();
      syncSettingsUI();
    });

    audioVolume.addEventListener("input", event => {
      if(!window.BeeAudio) return;
      window.BeeAudio.setVolume(Number(event.target.value) / 100);
      syncSettingsUI();
    });

    audioVolume.addEventListener("change", () => playSelect());

    if(resetProgressSettings){
      resetProgressSettings.addEventListener("click", () => {
        playSelect();
        storageSet(PROGRESS_KEY, "1");
        storageSet(COMPLETED_KEY, "[]");
        storageSet(NOTEBOOK_KEY, "{}");
        setTimeout(() => window.location.reload(), 140);
      });
    }

    window.addEventListener("keydown", event => {
      if(event.key === "Escape" && settingsOverlay.style.display === "flex"){
        closeSettingsPanel();
      }
    });

    if(window.BeeAudio){
      window.BeeAudio.onChange(syncSettingsUI);
    }
    syncSettingsUI();
  });
})();
