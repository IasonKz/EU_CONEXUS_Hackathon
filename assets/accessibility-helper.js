(function(){
  "use strict";

  const SETTINGS_KEY = "beeAccessibilitySettings";
  const PROGRESS_KEY = "floraUnlockedLevel";
  const COMPLETED_KEY = "floraCompletedLevels";
  const TOTAL_LEVELS = 5;

  const state = {
    open: false,
    lastAnswerText: "",
    settings: loadSettings()
  };

  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn);
    }
    else{
      fn();
    }
  }

  function storageGet(key, fallback){
    try{
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    }
    catch(error){
      return fallback;
    }
  }

  function storageSet(key, value){
    try{
      localStorage.setItem(key, value);
    }
    catch(error){
      // Keep the assistant usable even when storage is blocked.
    }
  }

  function loadSettings(){
    try{
      const saved = JSON.parse(storageGet(SETTINGS_KEY, "{}"));
      return {
        largeText: Boolean(saved.largeText),
        highContrast: Boolean(saved.highContrast),
        autoSpeak: Boolean(saved.autoSpeak)
      };
    }
    catch(error){
      return { largeText: false, highContrast: false, autoSpeak: false };
    }
  }

  function saveSettings(){
    storageSet(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function playSelect(){
    if(window.BeeAudio && typeof window.BeeAudio.play === "function"){
      window.BeeAudio.play("select");
    }
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stripHtml(html){
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  function normalize(value){
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .trim();
  }

  function includesAny(text, terms){
    const normalized = normalize(text);
    return terms.some(term => normalized.includes(normalize(term)));
  }

  function getCompletedLevels(){
    try{
      const parsed = JSON.parse(storageGet(COMPLETED_KEY, "[]"));
      if(!Array.isArray(parsed)) return [];
      return Array.from(new Set(parsed.map(Number).filter(level => level >= 1 && level <= TOTAL_LEVELS))).sort((a,b) => a-b);
    }
    catch(error){
      return [];
    }
  }

  function getUnlockedLevel(){
    const stored = Number(storageGet(PROGRESS_KEY, "1"));
    const base = Number.isFinite(stored) ? stored : 1;
    const completedMax = getCompletedLevels().reduce((max, level) => Math.max(max, Number(level) || 0), 0);
    const value = Math.max(1, Math.min(TOTAL_LEVELS, Math.max(base, completedMax + 1)));
    storageSet(PROGRESS_KEY, String(value));
    return value;
  }

  function isLevelPage(){
    return Boolean(window.LEVEL_CONFIG && document.getElementById("gameCanvas"));
  }

  function isLobbyPage(){
    return Boolean(document.getElementById("progressHint") || document.getElementById("pinPopup"));
  }

  function applyPreferenceClasses(){
    document.body.classList.toggle("bee-a11y-large-text", state.settings.largeText);
    document.body.classList.toggle("bee-a11y-high-contrast", state.settings.highContrast);
    document.body.classList.toggle("bee-a11y-level", isLevelPage());
    document.body.classList.toggle("bee-a11y-lobby", !isLevelPage() && isLobbyPage());
  }

  function injectStyles(){
    if(document.getElementById("beeA11yStyles")) return;

    const style = document.createElement("style");
    style.id = "beeA11yStyles";
    style.textContent = `
#beeA11yButton{
  position:fixed;
  right:22px;
  bottom:22px;
  z-index:2500;
  border:5px solid #2b2118;
  border-radius:999px;
  background:#ffd166;
  color:#2b2118;
  font-family:"VT323", "Trebuchet MS", Arial, sans-serif;
  font-size:31px;
  font-weight:900;
  padding:15px 25px;
  cursor:pointer;
  box-shadow:0 8px 0 rgba(0,0,0,.22);
  transition:.16s ease;
}
#beeA11yButton:hover{ transform:translateY(-2px) scale(1.03); }
#beeA11yButton:active{ transform:translateY(4px); box-shadow:0 3px 0 rgba(0,0,0,.22); }
body.bee-a11y-lobby #beeA11yButton{ left:226px; right:auto; bottom:56px; }
#beeA11yLayer{ position:fixed; inset:0; z-index:9400; display:none; pointer-events:none; }
#beeA11yLayer.open{ display:block; }
#beeA11yPanel{
  position:fixed;
  right:22px;
  bottom:92px;
  width:min(430px, calc(100vw - 28px));
  max-height:min(720px, calc(100vh - 118px));
  overflow:auto;
  pointer-events:auto;
  background:#fff8d1;
  color:#2b2118;
  border:6px solid #2b2118;
  border-radius:20px;
  box-shadow:0 20px 48px rgba(0,0,0,.38);
  font-family:"VT323", "Trebuchet MS", Arial, sans-serif;
}
body.bee-a11y-lobby #beeA11yPanel{ left:28px; right:auto; bottom:198px; }
#beeA11yHeader{
  position:sticky;
  top:0;
  z-index:1;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  background:linear-gradient(90deg, #ffd166, #fff3b0);
  border-bottom:5px solid #2b2118;
  padding:13px 15px 12px;
}
#beeA11yHeader h2{ margin:0; font-size:34px; line-height:.92; }
#beeA11yHeader small{ display:block; margin-top:4px; font-size:18px; line-height:1; opacity:.78; }
#beeA11yClose{
  flex:0 0 auto;
  border:4px solid #2b2118;
  border-radius:12px;
  background:#ffadad;
  color:#2b2118;
  font-family:inherit;
  font-size:24px;
  font-weight:900;
  line-height:1;
  padding:6px 10px;
  cursor:pointer;
  box-shadow:0 4px 0 rgba(0,0,0,.18);
}
#beeA11yBody{ padding:14px; }
#beeA11yAnswer{
  min-height:92px;
  border:4px dashed rgba(43,33,24,.28);
  border-radius:15px;
  background:rgba(255,255,255,.58);
  padding:12px 13px;
  font-size:22px;
  line-height:1.13;
}
#beeA11yAnswer p{ margin:0 0 10px; }
#beeA11yAnswer p:last-child{ margin-bottom:0; }
#beeA11yAnswer strong{ color:#7a4b00; }
#beeA11yActions{ display:grid; grid-template-columns:1fr 1fr; gap:9px; margin:12px 0; }
#beeA11yActions button,
#beeA11yForm button,
.bee-a11y-mini-actions button,
.bee-a11y-toggle{
  border:4px solid #2b2118;
  border-radius:12px;
  background:#ffd166;
  color:#2b2118;
  font-family:inherit;
  font-size:20px;
  line-height:1;
  padding:9px 10px;
  cursor:pointer;
  box-shadow:0 4px 0 rgba(0,0,0,.18);
}
#beeA11yActions button:hover,
#beeA11yForm button:hover,
.bee-a11y-mini-actions button:hover,
.bee-a11y-toggle:hover{ transform:translateY(-2px); }
#beeA11yActions button:active,
#beeA11yForm button:active,
.bee-a11y-mini-actions button:active,
.bee-a11y-toggle:active{ transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.18); }
#beeA11yForm{ display:grid; grid-template-columns:1fr auto; gap:8px; margin-top:11px; }
#beeA11yQuestion{
  min-width:0;
  border:4px solid #2b2118;
  border-radius:12px;
  background:#fffef3;
  color:#2b2118;
  font-family:"Trebuchet MS", Arial, sans-serif;
  font-size:16px;
  padding:9px 11px;
}
.bee-a11y-mini-actions{ display:flex; flex-wrap:wrap; gap:8px; margin-top:11px; }
.bee-a11y-settings{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; padding-top:12px; border-top:4px dashed rgba(43,33,24,.22); }
.bee-a11y-toggle[aria-pressed="true"]{ background:#57cc99; }
.bee-a11y-note{ margin:10px 0 0; font-size:17px; line-height:1.08; opacity:.78; }
body.bee-a11y-large-text #beeA11yAnswer,
body.bee-a11y-large-text .fact-box,
body.bee-a11y-large-text .dialogue-box,
body.bee-a11y-large-text #message,
body.bee-a11y-large-text #pinPopup,
body.bee-a11y-large-text #progressHint,
body.bee-a11y-large-text #info{ font-size:calc(1em + 5px) !important; line-height:1.28 !important; }
body.bee-a11y-high-contrast canvas{ filter:contrast(1.28) saturate(1.12); }
body.bee-a11y-high-contrast .fact-box,
body.bee-a11y-high-contrast .dialogue-box,
body.bee-a11y-high-contrast #pinPopup,
body.bee-a11y-high-contrast #progressHint,
body.bee-a11y-high-contrast #beeA11yPanel{ background:#fffbe6 !important; color:#111 !important; border-color:#000 !important; text-shadow:none !important; }
body.bee-a11y-high-contrast #message{ color:#fff !important; text-shadow:3px 3px 0 #000, -2px -2px 0 #000 !important; }
@media (max-width: 760px){
  #beeA11yButton,
  body.bee-a11y-lobby #beeA11yButton{ left:auto; right:14px; bottom:124px; font-size:22px; padding:10px 15px; }
  #beeA11yPanel,
  body.bee-a11y-lobby #beeA11yPanel{ left:14px; right:14px; bottom:190px; width:auto; max-height:calc(100vh - 206px); }
  #beeA11yActions,
  .bee-a11y-settings{ grid-template-columns:1fr; }
}
`;
    document.head.appendChild(style);
  }

  function createUI(){
    if(document.getElementById("beeA11yButton")) return;

    const button = document.createElement("button");
    button.id = "beeA11yButton";
    button.type = "button";
    button.setAttribute("aria-controls", "beeA11yPanel");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open Bee Helper accessibility assistant");
    button.textContent = "🐝 Help";

    const layer = document.createElement("div");
    layer.id = "beeA11yLayer";
    layer.innerHTML = `
      <section id="beeA11yPanel" role="dialog" aria-modal="false" aria-labelledby="beeA11yTitle">
        <header id="beeA11yHeader">
          <div>
            <h2 id="beeA11yTitle">🐝 Bee Helper</h2>
            <small>scripted accessibility assistant</small>
          </div>
          <button id="beeA11yClose" type="button" aria-label="Close Bee Helper">✕</button>
        </header>
        <div id="beeA11yBody">
          <div id="beeA11yAnswer" aria-live="polite"></div>
          <div id="beeA11yActions">
            <button type="button" data-bee-action="read-objective">🔊 Read objective</button>
            <button type="button" data-bee-action="controls">🎮 Controls</button>
            <button type="button" data-bee-action="now">➡️ What now?</button>
            <button type="button" data-bee-action="simplify">✨ Simplify</button>
            <button type="button" data-bee-action="npc">💬 Repeat NPC</button>
            <button type="button" data-bee-action="facts">📓 Bee facts</button>
            <button type="button" data-bee-action="weather">🌦 Weather</button>
            <button type="button" data-bee-action="help">❔ Help</button>
          </div>
          <form id="beeA11yForm">
            <input id="beeA11yQuestion" type="text" autocomplete="off" placeholder="Ask: what now, controls, NPC, facts..." aria-label="Question for Bee Helper">
            <button type="submit">Ask</button>
          </form>
          <div class="bee-a11y-mini-actions">
            <button type="button" id="beeA11ySpeak">Speak answer</button>
            <button type="button" id="beeA11yStop">Stop voice</button>
          </div>
          <div class="bee-a11y-settings">
            <button class="bee-a11y-toggle" type="button" data-setting="largeText" aria-pressed="false">Large text</button>
            <button class="bee-a11y-toggle" type="button" data-setting="highContrast" aria-pressed="false">High contrast</button>
            <button class="bee-a11y-toggle" type="button" data-setting="autoSpeak" aria-pressed="false">Auto read</button>
          </div>
          <p class="bee-a11y-note">Press H to open or close this helper. Voice uses your browser text-to-speech support.</p>
        </div>
      </section>
    `;

    document.body.appendChild(button);
    document.body.appendChild(layer);

    button.addEventListener("click", togglePanel);
    document.getElementById("beeA11yClose").addEventListener("click", closePanel);
    document.getElementById("beeA11yActions").addEventListener("click", event => {
      const actionButton = event.target.closest("button[data-bee-action]");
      if(!actionButton) return;
      playSelect();
      runAction(actionButton.dataset.beeAction);
    });
    document.getElementById("beeA11yForm").addEventListener("submit", event => {
      event.preventDefault();
      const input = document.getElementById("beeA11yQuestion");
      answerQuestion(input.value);
      input.value = "";
    });
    document.getElementById("beeA11ySpeak").addEventListener("click", () => speak(state.lastAnswerText));
    document.getElementById("beeA11yStop").addEventListener("click", stopSpeech);

    layer.querySelectorAll(".bee-a11y-toggle").forEach(toggle => {
      const key = toggle.dataset.setting;
      toggle.setAttribute("aria-pressed", String(Boolean(state.settings[key])));
      toggle.addEventListener("click", () => {
        state.settings[key] = !state.settings[key];
        toggle.setAttribute("aria-pressed", String(Boolean(state.settings[key])));
        saveSettings();
        applyPreferenceClasses();
        playSelect();
      });
    });

    window.addEventListener("keydown", event => {
      if(event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey && !event.altKey){
        const tag = (event.target && event.target.tagName || "").toLowerCase();
        if(tag === "input" || tag === "textarea") return;
        event.preventDefault();
        togglePanel();
      }
      if(event.key === "Escape" && state.open){
        closePanel();
      }
    });

    setAnswer(buildWelcomeAnswer(), false);
  }

  function togglePanel(){
    if(state.open){ closePanel(); }
    else{ openPanel(); }
  }

  function openPanel(){
    state.open = true;
    const layer = document.getElementById("beeA11yLayer");
    const button = document.getElementById("beeA11yButton");
    layer.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    setAnswer(buildWelcomeAnswer(), false);
    playSelect();
  }

  function closePanel(){
    state.open = false;
    const layer = document.getElementById("beeA11yLayer");
    const button = document.getElementById("beeA11yButton");
    if(layer) layer.classList.remove("open");
    if(button) button.setAttribute("aria-expanded", "false");
    playSelect();
  }

  function setAnswer(html, speakNow){
    const answer = document.getElementById("beeA11yAnswer");
    if(answer){
      answer.innerHTML = html;
    }
    state.lastAnswerText = stripHtml(html).replace(/\s+/g, " ").trim();
    if(speakNow || state.settings.autoSpeak){
      speak(state.lastAnswerText);
    }
  }

  function speak(text){
    const clean = String(text || "").trim();
    if(!clean || !("speechSynthesis" in window)) return;
    try{
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "en-US";
      utterance.rate = 0.96;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    }
    catch(error){
      // Browser text-to-speech is optional.
    }
  }

  function stopSpeech(){
    if("speechSynthesis" in window){
      window.speechSynthesis.cancel();
    }
  }

  function textOf(id){
    const el = document.getElementById(id);
    return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  }

  function currentLevelContext(){
    if(typeof window.BeeLevelAccessibilityContext === "function"){
      try{ return window.BeeLevelAccessibilityContext() || {}; }
      catch(error){ return {}; }
    }
    return {
      page: "level",
      title: window.LEVEL_CONFIG ? window.LEVEL_CONFIG.title : "Current level",
      controls: "Arrow keys to move, Space to jump, R to restart, Lobby button to return."
    };
  }

  function currentLobbyContext(){
    const unlocked = getUnlockedLevel();
    const completed = getCompletedLevels();
    const pinPopup = document.getElementById("pinPopup");
    const popupVisible = Boolean(pinPopup && pinPopup.style.display !== "none" && getComputedStyle(pinPopup).display !== "none");
    const nextEntry = window.FloraNotebookData ? window.FloraNotebookData[String(unlocked)] || {} : {};
    return {
      page: "lobby",
      unlocked,
      completed,
      nextLevel: unlocked,
      nextEntry,
      popupVisible,
      pinTitle: textOf("pinTitle"),
      pinDescription: textOf("pinDescription"),
      pinWeather: textOf("pinWeather")
    };
  }

  function buildWelcomeAnswer(){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      return `<p><strong>${escapeHtml(ctx.title || "Level")}</strong></p><p>Ask for <strong>objective</strong>, <strong>controls</strong>, <strong>what now</strong>, <strong>NPC</strong>, <strong>facts</strong>, or <strong>weather</strong>.</p>`;
    }
    const ctx = currentLobbyContext();
    const completedText = ctx.completed.length ? ctx.completed.join(", ") : "none yet";
    return `<p><strong>Lobby objective:</strong> choose an unlocked pin on the globe and play the next level.</p><p><strong>Progress:</strong> unlocked Level ${ctx.unlocked}; completed: ${escapeHtml(completedText)}.</p>`;
  }

  function levelObjectiveText(ctx){
    if(ctx.levelLocked){
      return `${ctx.title} is locked. Return to the lobby and clear the previous level first.`;
    }
    if(ctx.gameWon){
      return `${ctx.title} is complete. Return to the lobby for the next pin.`;
    }
    if(ctx.gameOver){
      return `Restart with R or return to the lobby.`;
    }
    if(ctx.introActive){
      return `Read the mission card, then press Space or Enter to start.`;
    }
    return `Move right, collect all 3 stars, talk to the level bee, avoid Zombees and thorn patches, use platforms or bounce mushrooms, and reach the hive.`;
  }

  function runAction(action){
    switch(action){
      case "read-objective": answerObjective(true); break;
      case "controls": answerControls(false); break;
      case "now": answerWhatNow(false); break;
      case "simplify": answerSimplify(false); break;
      case "npc": answerNpc(false); break;
      case "facts": answerFacts(false); break;
      case "weather": answerWeather(false); break;
      default: answerHelp(false); break;
    }
  }

  function answerQuestion(question){
    const q = normalize(question);
    if(!q){
      answerHelp(false);
      return;
    }
    if(includesAny(q, ["objective", "goal", "mission", "target"])){
      answerObjective(false);
    }
    else if(includesAny(q, ["what now", "where", "next", "hint", "help", "stuck", "go"])){
      answerWhatNow(false);
    }
    else if(includesAny(q, ["control", "keyboard", "jump", "move", "button"])){
      answerControls(false);
    }
    else if(includesAny(q, ["simpl", "easy", "summary", "short"])){
      answerSimplify(false);
    }
    else if(includesAny(q, ["npc", "dialog", "repeat", "said", "says", "talk"])){
      answerNpc(false);
    }
    else if(includesAny(q, ["fact", "bee fact", "bee", "notebook", "achievement"])){
      answerFacts(false);
    }
    else if(includesAny(q, ["weather", "temperature", "wind", "rain"])){
      answerWeather(false);
    }
    else if(includesAny(q, ["read", "speak", "voice", "audio"])){
      speak(state.lastAnswerText || stripHtml(buildWelcomeAnswer()));
    }
    else{
      setAnswer(`<p>I am a small scripted accessibility helper, not a real LLM. I understood your question as: <strong>${escapeHtml(question)}</strong>.</p><p>Try words like <strong>objective</strong>, <strong>what now</strong>, <strong>controls</strong>, <strong>NPC</strong>, <strong>facts</strong>, <strong>weather</strong>, or <strong>simplify</strong>.</p>`, false);
    }
  }

  function answerObjective(speakNow){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      setAnswer(`<p><strong>Current objective:</strong> ${escapeHtml(levelObjectiveText(ctx))}</p>`, speakNow);
      return;
    }
    const ctx = currentLobbyContext();
    const nextTitle = ctx.nextEntry.title || `Level ${ctx.nextLevel}`;
    setAnswer(`<p><strong>Lobby objective:</strong> find the pin for <strong>${escapeHtml(nextTitle)}</strong> and press Play if it is unlocked.</p><p>Gray pins are locked. Green pins are cleared. Pink pins are ready to play.</p>`, speakNow);
  }

  function answerControls(speakNow){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      setAnswer(`<p><strong>Controls:</strong> ${escapeHtml(ctx.controls || "Arrow keys move, Space jumps, R restarts, Lobby returns.")}</p><p>During NPC dialogue, press <strong>Space</strong> or <strong>Enter</strong> for the next line.</p>`, speakNow);
      return;
    }
    setAnswer(`<p><strong>Lobby controls:</strong> drag or rotate the globe with mouse or touch, click a pin, then press <strong>Play</strong>.</p><p>The lower buttons open Info and Weather. Flora's Notebook stores completed level achievements.</p>`, speakNow);
  }

  function answerWhatNow(speakNow){
    if(!isLevelPage()){
      const ctx = currentLobbyContext();
      if(ctx.popupVisible){
        setAnswer(`<p><strong>Open pin:</strong> ${escapeHtml(ctx.pinTitle || "Selected level")}.</p><p>${escapeHtml(ctx.pinDescription || "Press Play if it is available.")}</p>`, speakNow);
      }
      else{
        setAnswer(`<p>Click the unlocked pin for <strong>Level ${ctx.unlocked}</strong>. Then press <strong>Play Level ${ctx.unlocked}</strong>.</p>`, speakNow);
      }
      return;
    }

    const ctx = currentLevelContext();
    if(ctx.levelLocked || ctx.gameWon || ctx.gameOver || ctx.introActive){
      answerObjective(speakNow);
      return;
    }
    if(ctx.activeNpc){
      setAnswer(`<p>You are talking with <strong>${escapeHtml(ctx.activeNpc.name)}</strong>.</p><p>${escapeHtml(ctx.activeNpc.line || "Press Space or Enter to continue.")}</p><p>Press <strong>Space</strong> or <strong>Enter</strong> for the next line.</p>`, speakNow);
      return;
    }

    const progress = Number.isFinite(Number(ctx.progressPercent)) ? `${Math.round(ctx.progressPercent)}%` : "somewhere in the level";
    const parts = [`<p>You are about <strong>${escapeHtml(progress)}</strong> through the level. The safe general direction is <strong>right</strong>.</p>`];
    if(ctx.nextNpc){
      parts.push(`<p>Next NPC: <strong>${escapeHtml(ctx.nextNpc.name)}</strong>, about ${Math.max(0, Math.round(ctx.nextNpc.distance))} px to the right.</p>`);
    }
    if(ctx.nextHazard){
      parts.push(`<p>Careful: <strong>${escapeHtml(ctx.nextHazard.label || "a hazard")}</strong> is ahead. Jump early or use a platform or bounce mushroom.</p>`);
    }
    parts.push(`<p>Stars: <strong>${escapeHtml(ctx.starsCollected ?? 0)}/${escapeHtml(ctx.starsRequired ?? 3)}</strong>. Collect all stars before entering the hive.</p>`);
    parts.push(`<p>Final target: the <strong>hive</strong> at the end of the route.</p>`);
    setAnswer(parts.join(""), speakNow);
  }

  function answerSimplify(speakNow){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      setAnswer(`<p><strong>Simpler:</strong> go right. Collect all 3 stars. Jump over gaps and thorn patches. Do not touch ${escapeHtml(ctx.enemyName || "infected bees")}.</p><p>If you see the level bee with <strong>!</strong>, walk into it and press Space or Enter. You win when Flora has all 3 stars and reaches the hive.</p>`, speakNow);
      return;
    }
    setAnswer(`<p><strong>Simpler:</strong> click a pin on the globe. If it is gray, it is locked. If it is not gray, press Play.</p><p>Play the levels in order: 1 → 2 → 3 → 4 → 5.</p>`, speakNow);
  }

  function answerNpc(speakNow){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      if(ctx.activeNpc){
        setAnswer(`<p><strong>${escapeHtml(ctx.activeNpc.name)} says:</strong> ${escapeHtml(ctx.activeNpc.line || "")}</p>`, speakNow);
        return;
      }
      const npc = ctx.nextNpc || (ctx.npcs && ctx.npcs[0]);
      if(!npc){
        setAnswer(`<p>No NPC context is available on this page.</p>`, speakNow);
        return;
      }
      const lines = Array.isArray(npc.lines) ? npc.lines : [];
      setAnswer(`<p><strong>${escapeHtml(npc.name)}:</strong></p>${lines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}`, speakNow);
      return;
    }
    const ctx = currentLobbyContext();
    const entry = ctx.nextEntry || {};
    const npc = Array.isArray(entry.npcs) ? entry.npcs[0] : null;
    if(!npc){
      setAnswer(`<p>There is no active NPC in the lobby. Open a level to talk to the level bee.</p>`, speakNow);
      return;
    }
    const lines = Array.isArray(npc.lines) ? npc.lines : [];
    setAnswer(`<p><strong>Next level NPC preview — ${escapeHtml(npc.name)}:</strong></p>${lines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}`, speakNow);
  }

  function answerFacts(speakNow){
    const entry = isLevelPage() ? currentLevelContext() : (currentLobbyContext().nextEntry || {});
    const facts = Array.isArray(entry.facts) ? entry.facts : [];
    const achievement = entry.achievement;
    const html = [];
    if(achievement){
      html.push(`<p><strong>Achievement:</strong> ${escapeHtml(achievement.title || "Unlocked achievement")}</p>`);
    }
    if(facts.length){
      html.push(`<p><strong>Bee facts:</strong></p>`);
      facts.slice(0, 4).forEach((fact, index) => {
        html.push(`<p>${index + 1}. ${escapeHtml(fact.text || "")}</p>`);
      });
    }
    else{
      html.push(`<p>No bee facts are available yet.</p>`);
    }
    setAnswer(html.join(""), speakNow);
  }

  function answerWeather(speakNow){
    if(isLevelPage()){
      const ctx = currentLevelContext();
      const weather = ctx.weather || {};
      const weatherText = weather.description
        ? `${weather.description} (${weather.conditionLabel || weather.condition || "weather"})`
        : "The Weather API is loading or unavailable.";
      const temp = Number.isFinite(Number(weather.temperature)) ? ` Temperature: ${Math.round(Number(weather.temperature))}°C.` : "";
      const wind = Number.isFinite(Number(weather.windSpeed)) ? ` Wind: ${Math.round(Number(weather.windSpeed))} km/h.` : "";
      setAnswer(`<p><strong>Weather context:</strong> ${escapeHtml(weatherText)}${escapeHtml(temp)}${escapeHtml(wind)}</p><p>The level art stays on the selected PNG background. The Weather Station shows the live data.</p>`, speakNow);
      return;
    }
    const ctx = currentLobbyContext();
    if(ctx.popupVisible && ctx.pinWeather){
      setAnswer(`<p><strong>Selected pin weather:</strong> ${escapeHtml(ctx.pinWeather)}</p>`, speakNow);
    }
    else{
      setAnswer(`<p>Open a pin on the globe to read the weather box for that level, or press the Weather button for the full station.</p>`, speakNow);
    }
  }

  function answerHelp(speakNow){
    setAnswer(`<p>I can answer small game-help questions:</p><p><strong>what now?</strong> · <strong>objective</strong> · <strong>controls</strong> · <strong>simplify</strong> · <strong>what did the NPC say?</strong> · <strong>facts</strong> · <strong>weather</strong></p>`, speakNow);
  }

  ready(() => {
    injectStyles();
    applyPreferenceClasses();
    createUI();
    if("speechSynthesis" in window && window.speechSynthesis.getVoices){
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  });

  window.BeeAccessibilityHelper = {
    open: openPanel,
    close: closePanel,
    speak,
    stop: stopSpeech,
    answer: answerQuestion
  };
})();
