(function(){
  "use strict";

  const COMPLETED_KEY = "floraCompletedLevels";
  const NOTEBOOK_KEY = "floraNotebookEntries";
  const TOTAL_LEVELS = 5;
  let selectedLevel = 1;
  let selectedPage = "zombee";

  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn);
    }
    else{
      fn();
    }
  }

  function playSelect(){
    if(window.BeeAudio && typeof window.BeeAudio.play === "function"){
      window.BeeAudio.play("select");
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

  function getSavedNotebook(){
    try{
      const parsed = JSON.parse(storageGet(NOTEBOOK_KEY, "{}"));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }
    catch(error){
      return {};
    }
  }

  function normalizeEntry(entry, levelNumber){
    const fallbackNumber = Number(levelNumber) || selectedLevel || 1;
    return {
      number: Number(entry && entry.number) || fallbackNumber,
      title: (entry && entry.title) || `Level ${fallbackNumber}`,
      region: (entry && entry.region) || "",
      theme: (entry && entry.theme) || "",
      beeName: (entry && entry.beeName) || "Level bee",
      beeImage: (entry && entry.beeImage) || `assets/bee-level-${fallbackNumber}.png`,
      achievement: (entry && entry.achievement) || null,
      collectedAt: (entry && (entry.collectedAt || entry.unlockedAt)) || "",
      facts: Array.isArray(entry && entry.facts)
        ? entry.facts.map(fact => ({ title: (fact && fact.title) || "Bee Fact", text: (fact && fact.text) || "" }))
        : [],
      npcs: Array.isArray(entry && entry.npcs)
        ? entry.npcs.map(npc => ({
            name: (npc && npc.name) || "NPC",
            accent: (npc && npc.accent) || "#ffd166",
            lines: Array.isArray(npc && npc.lines) ? npc.lines : []
          }))
        : [],
      weather: (entry && entry.weather) || null
    };
  }

  function getNotebookData(levelNumber){
    const key = String(levelNumber);
    const saved = getSavedNotebook()[key];
    const fallback = window.FloraNotebookData ? window.FloraNotebookData[key] : null;
    return normalizeEntry(saved || fallback || {}, levelNumber);
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeAccent(value){
    const accent = String(value || "#ffd166").trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(accent) ? accent : "#ffd166";
  }

  function formatDate(value){
    if(!value) return "";
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function injectStyles(){
    if(document.getElementById("floraNotebookStyles")) return;
    const style = document.createElement("style");
    style.id = "floraNotebookStyles";
    style.textContent = `
#notebookButton{
  position:fixed;
  left:30px;
  bottom:42px;
  z-index:705;
  width:168px;
  height:130px;
  border:0;
  background:transparent;
  color:#2b2118;
  font-family:"VT323", monospace;
  cursor:pointer;
  padding:0;
  transform:rotate(-4deg);
  transition:.16s ease;
}
#notebookButton:hover{ transform:translateY(-3px) rotate(-2deg) scale(1.03); }
#notebookButton:active{ transform:translateY(4px) rotate(-2deg); }
#notebookButton .notebookIcon{ position:absolute; inset:0; width:100%; height:100%; display:block; object-fit:contain; image-rendering:pixelated; filter:drop-shadow(0 9px 0 rgba(0,0,0,.22)); }
#notebookButton .notebookBadge{ position:absolute; right:-15px; top:-18px; min-width:50px; border:4px solid #2b2118; border-radius:999px; background:#57cc99; padding:4px 9px; font-size:24px; box-shadow:0 5px 0 rgba(0,0,0,.18); }
#notebookOverlay{ position:fixed; inset:0; z-index:9300; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.30); backdrop-filter:blur(4px); font-family:"VT323", monospace; }
#notebookPanel{ width:min(1020px, calc(100vw - 32px)); height:min(760px, calc(100vh - 32px)); display:grid; grid-template-rows:auto 1fr; overflow:hidden; background:#fff8d1; color:#2b2118; border:6px solid #2b2118; border-radius:20px; box-shadow:0 24px 52px rgba(0,0,0,.38); }
#notebookHeader{ display:flex; align-items:center; justify-content:space-between; gap:18px; padding:17px 22px; border-bottom:5px solid #2b2118; background:#ffd166; }
#notebookHeader h2{ margin:0; font-size:48px; line-height:.9; }
#notebookHeader p{ margin:6px 0 0; font-size:22px; line-height:1; }
#closeNotebook{ border:4px solid #2b2118; border-radius:12px; background:#ffadad; color:#2b2118; font-family:inherit; font-size:26px; padding:7px 13px; cursor:pointer; box-shadow:0 5px 0 rgba(0,0,0,.18); }
#notebookBody{ min-height:0; display:grid; grid-template-columns:250px 1fr; background:linear-gradient(90deg, rgba(43,33,24,.18), transparent 18px) 250px 0 / 18px 100% no-repeat, repeating-linear-gradient(0deg, rgba(43,33,24,.045) 0 2px, transparent 2px 38px), #fffbe1; }
#notebookTabs{ padding:18px 14px; border-right:5px solid #2b2118; background:#ffe6a8; overflow:auto; }
.notebookPageTab{ width:100%; border:4px solid #2b2118; border-radius:14px; background:#fff8d1; color:#2b2118; font-family:"VT323", monospace; text-align:left; cursor:pointer; padding:12px; margin-bottom:12px; box-shadow:0 5px 0 rgba(0,0,0,.17); }
.notebookPageTab:hover{ transform:translateY(-2px); }
.notebookPageTab.active{ background:#ffd166; }
.notebookPageTab.locked{ background:#d9d9d9; color:#555; }
.notebookTabLevel{ display:block; font-size:28px; line-height:.9; }
.notebookTabTitle{ display:block; margin-top:6px; font-size:19px; line-height:1; }
.notebookTabStatus{ display:inline-block; margin-top:8px; border:3px solid #2b2118; border-radius:999px; padding:2px 8px; background:#57cc99; color:#2b2118; font-size:18px; }
.notebookPageTab.locked .notebookTabStatus{ background:#9b9b9b; color:#fff; }
#notebookPage{ min-height:0; overflow:auto; padding:24px 30px 34px; }
#notebookPage h3{ margin:0 0 4px; font-size:44px; line-height:.95; }
.notebookMeta{ margin:0 0 18px; font-size:22px; color:#5d4630; }
.beePassport{ display:grid; grid-template-columns:170px 1fr; gap:20px; align-items:center; margin:8px 0 20px; padding:16px; border:4px solid #2b2118; border-radius:18px; background:#fff1a8; box-shadow:0 7px 0 rgba(0,0,0,.14); position:relative; }
.beePassport::before{ content:"📌"; position:absolute; left:14px; top:-18px; font-size:38px; transform:rotate(-15deg); }
.beePhoto{ width:160px; height:130px; object-fit:contain; image-rendering:pixelated; background:#fffbe1; border:5px solid #2b2118; border-radius:12px; box-shadow:6px 6px 0 rgba(254,109,182,.32); }
.beePassport h4{ margin:0 0 4px; font-size:35px; line-height:.95; color:#8f4f19; }
.beePassport p{ margin:0 0 8px; font-size:24px; line-height:1.05; }
.achievementBadge{ display:inline-block; border:4px solid #2b2118; border-radius:999px; background:#57cc99; padding:4px 12px; font-size:24px; line-height:1; }
.notebookSectionTitle{ display:inline-block; margin:20px 0 12px; padding:5px 13px; border:4px solid #2b2118; border-radius:999px; background:#2b2118; color:#fff3b0; font-size:25px; line-height:1; }
.notebookCards{ display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:14px; }
.noteCard, .npcCard, .lockedPage, .emptyPage{ border:4px solid #2b2118; border-radius:16px; background:rgba(255,255,255,.65); box-shadow:0 6px 0 rgba(0,0,0,.14); padding:14px 16px; font-size:23px; line-height:1.12; }
.noteCard strong, .npcCard strong{ display:block; margin-bottom:7px; color:#8f4f19; font-size:25px; }
.npcCard{ background:rgba(255,239,177,.78); border-color:var(--npc-accent, #2b2118); }
.npcLine{ position:relative; margin:10px 0 0; padding-left:22px; }
.npcLine::before{ content:"❯"; position:absolute; left:0; top:0; color:#2b2118; }
.lockedPage, .emptyPage{ max-width:620px; margin:48px auto 0; text-align:center; background:#fff1a8; font-size:28px; }
.lockedPage .bigIcon, .emptyPage .bigIcon{ display:block; font-size:58px; line-height:1; margin-bottom:12px; }
.weatherNote{ margin-top:18px; border:4px dashed rgba(43,33,24,.35); border-radius:14px; background:rgba(255,248,209,.68); padding:10px 14px; font-size:21px; }
.zombeeGuide{ display:grid; grid-template-columns:210px 1fr; gap:22px; align-items:center; margin:8px 0 18px; padding:18px; border:5px solid #2b2118; border-radius:18px; background:#f3e8ff; box-shadow:0 8px 0 rgba(0,0,0,.14); position:relative; }
.zombeeGuide::before{ content:"📌"; position:absolute; left:15px; top:-20px; font-size:40px; transform:rotate(-12deg); }
.zombeePhoto{ width:196px; height:170px; object-fit:contain; image-rendering:pixelated; background:#fffbe1; border:5px solid #2b2118; border-radius:12px; box-shadow:6px 6px 0 rgba(142,68,173,.28); }
.cureIcon{ display:flex; align-items:center; justify-content:center; font-size:82px; line-height:1; padding:8px; box-sizing:border-box; }
.cureIconImage{ width:100%; height:100%; object-fit:contain; image-rendering:pixelated; display:block; }
.zombeeGuide h4{ margin:0 0 5px; font-size:40px; line-height:.95; color:#6f2dbd; }
.zombeeGuide p{ margin:0 0 9px; font-size:25px; line-height:1.08; }
.zombeeBadge{ display:inline-block; border:4px solid #2b2118; border-radius:999px; background:#b98bff; color:#2b2118; padding:4px 13px; font-size:24px; line-height:1; }
.zombeeFacts{ display:grid; grid-template-columns:repeat(auto-fit, minmax(245px, 1fr)); gap:14px; }
.zombeeFact{ border:4px solid #2b2118; border-radius:16px; background:rgba(255,255,255,.72); box-shadow:0 6px 0 rgba(0,0,0,.14); padding:14px 16px; font-size:24px; line-height:1.12; }
@media (max-width:900px){
  #notebookButton{ left:14px; bottom:104px; width:122px; height:94px; }
  #notebookBody{ grid-template-columns:1fr; background:repeating-linear-gradient(0deg, rgba(43,33,24,.045) 0 2px, transparent 2px 38px), #fffbe1; }
  #notebookTabs{ display:flex; gap:10px; border-right:0; border-bottom:5px solid #2b2118; padding:12px; overflow:auto; }
  .notebookPageTab{ min-width:150px; margin-bottom:0; }
  #notebookHeader h2{ font-size:38px; }
  #notebookHeader p{ font-size:19px; }
  #notebookPage{ padding:18px; }
  #notebookPage h3{ font-size:36px; }
  .beePassport{ grid-template-columns:1fr; }
  .zombeeGuide{ grid-template-columns:1fr; }
}
`;
    document.head.appendChild(style);
  }

  function createUi(){
    if(document.getElementById("notebookButton")) return;
    injectStyles();

    const button = document.createElement("button");
    button.id = "notebookButton";
    button.type = "button";
    button.setAttribute("aria-label", "Flora's Notebook");
    button.innerHTML = `
      <img class="notebookIcon" src="assets/notebook.png" alt="">
      <span class="notebookBadge" id="notebookBadge">0/${TOTAL_LEVELS}</span>
    `;

    const overlay = document.createElement("div");
    overlay.id = "notebookOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section id="notebookPanel" role="dialog" aria-modal="true" aria-labelledby="notebookTitle">
        <header id="notebookHeader">
          <div>
            <h2 id="notebookTitle">Flora's Notebook</h2>
            <p>Pages, cure science, and achievements unlock as you explore.</p>
          </div>
          <button id="closeNotebook" type="button">Close</button>
        </header>
        <div id="notebookBody">
          <nav id="notebookTabs" aria-label="Notebook pages"></nav>
          <main id="notebookPage"></main>
        </div>
      </section>
    `;

    document.body.appendChild(button);
    document.body.appendChild(overlay);

    button.addEventListener("click", openNotebook);
    document.getElementById("closeNotebook").addEventListener("click", closeNotebook);
    overlay.addEventListener("click", event => {
      if(event.target === overlay){
        closeNotebook();
      }
    });
    document.getElementById("notebookTabs").addEventListener("click", event => {
      const tab = event.target.closest(".notebookPageTab");
      if(!tab) return;
      const page = tab.dataset.page || "level";
      if(page === "zombee" || page === "cure" || page === "beekeeper"){
        selectedPage = page;
      }
      else{
        selectedPage = "level";
        selectedLevel = Number(tab.dataset.level);
      }
      playSelect();
      renderNotebook();
    });
    window.addEventListener("keydown", event => {
      if(event.key === "Escape" && overlay.style.display === "flex"){
        closeNotebook();
      }
    });

    syncBadge();
  }

  function syncBadge(){
    const badge = document.getElementById("notebookBadge");
    if(badge){
      badge.textContent = `${getCompletedLevels().length}/${TOTAL_LEVELS}`;
    }
  }

  function openNotebook(){
    playSelect();
    syncBadge();
    renderNotebook();
    const overlay = document.getElementById("notebookOverlay");
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeNotebook(){
    playSelect();
    const overlay = document.getElementById("notebookOverlay");
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderNotebook(){
    const completedLevels = getCompletedLevels();
    const completed = new Set(completedLevels);

    if(selectedPage === "level" && !completed.has(selectedLevel)){
      selectedLevel = completedLevels[0] || selectedLevel || 1;
      if(completedLevels.length === 0){
        selectedPage = "zombee";
      }
    }

    document.getElementById("notebookTabs").innerHTML = renderTabs(completed);
    document.getElementById("notebookPage").innerHTML = selectedPage === "zombee"
      ? renderZombeePage()
      : selectedPage === "cure"
        ? renderCurePage()
        : selectedPage === "beekeeper"
          ? renderBeekeeperPage()
          : completed.has(selectedLevel)
            ? renderEntry(getNotebookData(selectedLevel))
            : renderLockedPage(selectedLevel, completedLevels.length === 0);
  }

  function renderTabs(completed){
    let html = `
      <button class="notebookPageTab ${selectedPage === "zombee" ? "active" : ""}" type="button" data-page="zombee">
        <span class="notebookTabLevel">Zombee</span>
        <span class="notebookTabTitle">Infected bee field note</span>
        <span class="notebookTabStatus">GUIDE</span>
      </button>
      <button class="notebookPageTab ${selectedPage === "cure" ? "active" : ""}" type="button" data-page="cure">
        <span class="notebookTabLevel">Cure Lab</span>
        <span class="notebookTabTitle">Healing Nectar process</span>
        <span class="notebookTabStatus">SCIENCE</span>
      </button>
      <button class="notebookPageTab ${selectedPage === "beekeeper" ? "active" : ""}" type="button" data-page="beekeeper">
        <span class="notebookTabLevel">Glenn</span>
        <span class="notebookTabTitle">Bee keeper guide</span>
        <span class="notebookTabStatus">FIELD</span>
      </button>
    `;
    for(let level = 1; level <= TOTAL_LEVELS; level++){
      const cleared = completed.has(level);
      const entry = cleared ? getNotebookData(level) : null;
      html += `
        <button class="notebookPageTab ${selectedPage === "level" && selectedLevel === level ? "active" : ""} ${cleared ? "" : "locked"}" type="button" data-page="level" data-level="${level}">
          <span class="notebookTabLevel">Level ${level}</span>
          <span class="notebookTabTitle">${cleared ? escapeHtml(entry.title) : "Locked page"}</span>
          <span class="notebookTabStatus">${cleared ? "CLEARED" : "LOCKED"}</span>
        </button>
      `;
    }
    return html;
  }

  function renderZombeePage(){
    const data = (window.FloraNotebookExtras && window.FloraNotebookExtras.zombee) || {
      title: "Zombee Field Note",
      name: "Zombee",
      image: "assets/sick-bee-all-levels.png",
      badge: "Infected bee",
      summary: "A Zombee is a sick bee infected by foulbrood. Avoid contact and deliver the cure to the hive.",
      facts: []
    };
    const facts = Array.isArray(data.facts) ? data.facts : [];
    return `
      <h3>${escapeHtml(data.title || "Zombee Field Note")}</h3>
      <p class="notebookMeta">Flora's danger guide · always available</p>
      <section class="zombeeGuide">
        <img class="zombeePhoto" src="${escapeHtml(data.image || "assets/sick-bee-all-levels.png")}" alt="${escapeHtml(data.name || "Zombee")}">
        <div>
          <h4>${escapeHtml(data.name || "Zombee")}</h4>
          <p>${escapeHtml(data.summary || "A sick bee that Flora should avoid during gameplay.")}</p>
          <span class="zombeeBadge">☣ ${escapeHtml(data.badge || "Infected bee")}</span>
        </div>
      </section>
      <div class="notebookSectionTitle">What Flora should remember</div>
      <div class="zombeeFacts">
        ${facts.map((fact, index) => `<article class="zombeeFact"><strong>${index + 1}.</strong> ${escapeHtml(fact)}</article>`).join("") || `<article class="zombeeFact">Avoid infected bees and reach the hive with the cure.</article>`}
      </div>
    `;
  }

  function renderCurePage(){
    const data = (window.FloraNotebookExtras && window.FloraNotebookExtras.cureProcess) || {
      title: "Cure Lab: Healing Nectar",
      name: "Healing Nectar",
      badge: "Cure workflow",
      icon: "🧬",
      summary: "Collect DNA Pollen, Enzyme Drops, and Purification Beads to complete the Healing Nectar.",
      collectables: [],
      steps: [],
      facts: []
    };
    const collectables = Array.isArray(data.collectables) ? data.collectables : [];
    const steps = Array.isArray(data.steps) ? data.steps : [];
    const facts = Array.isArray(data.facts) ? data.facts : [];
    const cureIconHtml = data.iconImage
      ? `<img class="cureIconImage" src="${escapeHtml(data.iconImage)}" alt="">`
      : escapeHtml(data.icon || "🧪");

    return `
      <h3>${escapeHtml(data.title || "Cure Lab: Healing Nectar")}</h3>
      <p class="notebookMeta">Flora's cure science chapter · always available</p>
      <section class="zombeeGuide">
        <div class="zombeePhoto cureIcon" aria-hidden="true">${cureIconHtml}</div>
        <div>
          <h4>${escapeHtml(data.name || "Healing Nectar")}</h4>
          <p>${escapeHtml(data.summary || "A simplified science model for the game cure.")}</p>
          <span class="zombeeBadge">🧪 ${escapeHtml(data.badge || "Cure workflow")}</span>
        </div>
      </section>
      <div class="notebookSectionTitle">What Flora collects</div>
      <div class="zombeeFacts">
        ${collectables.map(item => `<article class="zombeeFact"><strong>${escapeHtml(item.name || "Cure ingredient")}</strong> ${escapeHtml(item.role || "Part of the Healing Nectar.")}</article>`).join("") || `<article class="zombeeFact">Collect DNA Pollen, Enzyme Drops, and Purification Beads.</article>`}
      </div>
      <div class="notebookSectionTitle">From lab idea to hive mission</div>
      <div class="zombeeFacts">
        ${steps.map(step => `<article class="zombeeFact"><strong>${escapeHtml(step.title || "Step")}</strong> ${escapeHtml(step.text || "")}</article>`).join("")}
      </div>
      <div class="notebookSectionTitle">Key science ideas</div>
      <div class="zombeeFacts">
        ${facts.map((fact, index) => `<article class="zombeeFact"><strong>${index + 1}.</strong> ${escapeHtml(fact)}</article>`).join("")}
      </div>
    `;
  }

  function renderBeekeeperPage(){
    const data = (window.FloraNotebookExtras && window.FloraNotebookExtras.beekeeper) || {
      title: "Bee Keeper Guide",
      name: "Glenn the Beekeeper",
      image: "assets/glenn-beekeeper.png",
      badge: "Field guide",
      summary: "Bee keepers watch colony health, weather, food supply, and disease signs so they can support bees responsibly.",
      facts: [],
      foulbrood: []
    };
    const facts = Array.isArray(data.facts) ? data.facts : [];
    const foulbrood = Array.isArray(data.foulbrood) ? data.foulbrood : [];
    return `
      <h3>${escapeHtml(data.title || "Bee Keeper Guide")}</h3>
      <p class="notebookMeta">Flora's field helper chapter · always available</p>
      <section class="zombeeGuide">
        <img class="zombeePhoto" src="${escapeHtml(data.image || "assets/glenn-beekeeper.png")}" alt="${escapeHtml(data.name || "Glenn the Beekeeper")}">
        <div>
          <h4>${escapeHtml(data.name || "Glenn the Beekeeper")}</h4>
          <p>${escapeHtml(data.summary || "Bee keepers care for hives across many changing conditions.")}</p>
          <span class="zombeeBadge">👨‍🌾 ${escapeHtml(data.badge || "Field guide")}</span>
        </div>
      </section>
      <div class="notebookSectionTitle">How bee keepers work in different conditions</div>
      <div class="zombeeFacts">
        ${facts.map(item => `<article class="zombeeFact"><strong>${escapeHtml(item.title || "Bee keeper note")}</strong> ${escapeHtml(item.text || "")}</article>`).join("")}
      </div>
      <div class="notebookSectionTitle">How Glenn responds to foulbrood risk</div>
      <div class="zombeeFacts">
        ${foulbrood.map(item => `<article class="zombeeFact"><strong>${escapeHtml(item.title || "Foulbrood note")}</strong> ${escapeHtml(item.text || "")}</article>`).join("")}
      </div>
    `;
  }

  function renderEntry(entry){
    const achievement = entry.achievement || { title: `Level ${entry.number} cleared`, text: "Achievement unlocked." };
    const factCards = entry.facts.length
      ? entry.facts.map((fact, index) => `
          <article class="noteCard">
            <strong>${index + 1}. ${escapeHtml(fact.title)}</strong>
            <div>${escapeHtml(fact.text)}</div>
          </article>
        `).join("")
      : `<article class="noteCard">No facts were found for this level.</article>`;

    const npcCards = entry.npcs.length
      ? entry.npcs.map(npc => `
          <article class="npcCard" style="--npc-accent:${safeAccent(npc.accent)}">
            <strong>${escapeHtml(npc.name)}</strong>
            ${npc.lines.map(line => `<div class="npcLine">${escapeHtml(line)}</div>`).join("")}
          </article>
        `).join("")
      : `<article class="npcCard">No NPC notes were found for this level.</article>`;

    const region = entry.region ? ` · ${escapeHtml(entry.region)}` : "";
    const date = formatDate(entry.collectedAt);
    const dateText = date ? ` · recorded ${escapeHtml(date)}` : "";
    const weather = entry.weather && entry.weather.description
      ? `<div class="weatherNote"><strong>Weather note:</strong> ${escapeHtml(entry.weather.description)}${entry.weather.conditionLabel ? ` · ${escapeHtml(entry.weather.conditionLabel)}` : ""}</div>`
      : "";

    return `
      <h3>${escapeHtml(entry.title)}</h3>
      <p class="notebookMeta">Level ${escapeHtml(entry.number)}${region}${dateText}</p>
      <section class="beePassport">
        <img class="beePhoto" src="${escapeHtml(entry.beeImage)}" alt="${escapeHtml(entry.beeName)}">
        <div>
          <h4>${escapeHtml(entry.beeName)}</h4>
          <p>${escapeHtml(achievement.text || "Achievement unlocked.")}</p>
          <span class="achievementBadge">🏅 ${escapeHtml(achievement.title || "Achievement unlocked")}</span>
        </div>
      </section>
      <div class="notebookSectionTitle">Bee facts learned in the level</div>
      <div class="notebookCards">${factCards}</div>
      <div class="notebookSectionTitle">Level bee dialogue</div>
      <div class="notebookCards">${npcCards}</div>
      ${weather}
    `;
  }

  function renderLockedPage(level, notebookEmpty){
    if(notebookEmpty){
      return `
        <section class="emptyPage">
          <span class="bigIcon">📓</span>
          Flora's Notebook is still empty.<br>
          Clear Level 1 to unlock the first page.
        </section>
      `;
    }

    return `
      <section class="lockedPage">
        <span class="bigIcon">🔒</span>
        The Level ${escapeHtml(level)} page unlocks only after you clear that level.
      </section>
    `;
  }

  ready(createUi);
})();
