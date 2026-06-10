(function(){
  "use strict";

  const STORAGE_KEY = "beeAudioSettings";
  const DEFAULT_SETTINGS = {
    music: true,
    sfx: true,
    volume: 0.65
  };

  const currentScript = document.currentScript;
  const AUDIO_BASE = window.BEE_AUDIO_BASE || (currentScript ? new URL("audio/", currentScript.src).href : "assets/audio/");

  const TRACKS = {
    lobby: "background_cute_adventure_loop.ogg",
    music: "background_cute_adventure_loop.ogg",
    level1: "level1_blossom.wav",
    level2: "level2_journey.wav",
    level3: "level3_regrowth_wip.wav",
    level4: "level4_boss_battle.wav",
    level5: "level5_town.wav",
    select: "option_select_sfx.ogg",
    complete: "level_complete_sfx.ogg",
    achievement: "achievement_sfx.ogg",
    gameover: "game_over_sfx.ogg",
    wrong: "wrong_choice_sfx.ogg"
  };

  let settings = loadSettings();
  const listeners = new Set();
  let interactionUnlocked = false;
  let currentMusicKey = "lobby";
  let music = createMusic(currentMusicKey);

  function createMusic(key){
    const audio = new Audio(AUDIO_BASE + (TRACKS[key] || TRACKS.lobby));
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    return audio;
  }

  function loadSettings(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        music: typeof saved.music === "boolean" ? saved.music : DEFAULT_SETTINGS.music,
        sfx: typeof saved.sfx === "boolean" ? saved.sfx : DEFAULT_SETTINGS.sfx,
        volume: Number.isFinite(Number(saved.volume)) ? Math.max(0, Math.min(1, Number(saved.volume))) : DEFAULT_SETTINGS.volume
      };
    }
    catch(error){
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    catch(error){
      // Audio settings still work for the current session if localStorage is blocked.
    }
  }

  function emit(){
    listeners.forEach(listener => {
      try{ listener({ ...settings }); }
      catch(error){ /* keep audio stable even if a UI listener fails */ }
    });
  }

  function applyMusicVolume(){
    music.volume = settings.music ? settings.volume * 0.38 : 0;
  }

  function setMusicTrack(trackKey){
    const nextKey = TRACKS[trackKey] ? trackKey : "lobby";
    if(nextKey === currentMusicKey) return;
    const shouldPlay = !music.paused;
    music.pause();
    currentMusicKey = nextKey;
    music = createMusic(currentMusicKey);
    applyMusicVolume();
    if(shouldPlay || interactionUnlocked){
      startMusic(currentMusicKey);
    }
  }

  function startMusic(trackKey){
    if(trackKey){
      setMusicTrack(trackKey);
    }
    applyMusicVolume();
    if(!settings.music){
      music.pause();
      return;
    }
    const playPromise = music.play();
    if(playPromise && typeof playPromise.catch === "function"){
      playPromise.catch(() => {
        // Browsers often block music until the first click/key press; bindFirstInteraction handles that.
      });
    }
  }

  function stopMusic(){
    music.pause();
  }

  function play(name){
    if(!settings.sfx) return;
    const file = TRACKS[name];
    if(!file) return;

    try{
      const effect = new Audio(AUDIO_BASE + file);
      effect.preload = "auto";
      effect.volume = Math.max(0, Math.min(1, settings.volume * 0.72));
      const playPromise = effect.play();
      if(playPromise && typeof playPromise.catch === "function"){
        playPromise.catch(() => {});
      }
    }
    catch(error){
      // Ignore audio decoding/playback failures so the game never breaks.
    }
  }

  function unlockAudio(){
    if(interactionUnlocked) return;
    interactionUnlocked = true;
    startMusic(currentMusicKey);
  }

  function bindFirstInteraction(){
    ["pointerdown", "keydown", "touchstart"].forEach(eventName => {
      window.addEventListener(eventName, unlockAudio, { once: true, passive: true });
    });
  }

  function setMusic(value){
    settings.music = Boolean(value);
    saveSettings();
    applyMusicVolume();
    if(settings.music){ startMusic(currentMusicKey); }
    else{ stopMusic(); }
    emit();
  }

  function setSfx(value){
    settings.sfx = Boolean(value);
    saveSettings();
    emit();
  }

  function setVolume(value){
    settings.volume = Math.max(0, Math.min(1, Number(value)));
    saveSettings();
    applyMusicVolume();
    emit();
  }

  function getSettings(){
    return { ...settings, musicTrack: currentMusicKey };
  }

  function onChange(listener){
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  document.addEventListener("visibilitychange", () => {
    if(document.hidden){
      music.pause();
    }
    else if(interactionUnlocked && settings.music){
      startMusic(currentMusicKey);
    }
  });

  applyMusicVolume();
  bindFirstInteraction();

  window.BeeAudio = {
    startMusic,
    stopMusic,
    play,
    setMusic,
    setSfx,
    setVolume,
    setMusicTrack,
    getSettings,
    onChange
  };
})();
