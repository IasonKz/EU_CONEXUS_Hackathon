(function(){
  "use strict";

  const CREDIT_SECTIONS = [
    {
      title: "Game",
      items: [
        "Bee Wonderer / apiconIASIS — EU-CONEXUS Hackathon prototype.",
        "Game concept, level design, writing, integration, and pixel-art direction by the project team.",
        "AI-assisted implementation support: OpenAI ChatGPT."
      ]
    },
    {
      title: "Music & sound effects",
      items: [
        "Lobby music, UI feedback, achievement, level-complete, game-over, and wrong-choice sounds: Cute Adventure Audio Pack by Nativica Music.",
        "Level music: cute & silly rpg music pack by chajamakesmusic.",
        "Tracks used from chajamakesmusic: blossom, journey, regrowth wip, boss battle, and town."
      ]
    },
    {
      title: "Visual assets",
      items: [
        "Flora, level bees, Zombees, hives, backgrounds, platforms, ground, thorns, rocks, logs, mushrooms, book icon, and UI icons: project-team pixel art / collaborator-supplied assets for this hackathon build.",
        "World map image: project repository asset used for the 3D globe."
      ]
    },
    {
      title: "Live data & libraries",
      items: [
        "Weather Station live data: wttr.in, with Open-Meteo as fallback for current weather.",
        "Open-Meteo weather data is attributed under the Creative Commons Attribution 4.0 International data licence.",
        "3D globe rendering: three.js and OrbitControls, MIT License.",
        "Pixel font: VT323 by Peter Hull / The VT323 Project Authors, SIL Open Font License 1.1."
      ]
    },
    {
      title: "Educational content",
      items: [
        "Bee facts, NPC explanations, and notebook text were compiled and adapted by the project team for an educational game experience.",
        "New Zealand level notes include native bee facts about Leioproctus, Hylaeus, Lasioglossum, and solitary nesting behavior from the team's research notes."
      ]
    }
  ];

  const LINKS = [
    { label: "Cute Adventure Audio Pack — Nativica Music", url: "https://nativica.itch.io/cute-adventure-audio-pack" },
    { label: "cute & silly rpg music pack — chajamakesmusic", url: "https://chajamakesmusic.itch.io/cute-and-silly-rpg-music-pack" },
    { label: "Creative Commons Attribution 4.0 International", url: "https://creativecommons.org/licenses/by/4.0/" },
    { label: "Open-Meteo", url: "https://open-meteo.com/" },
    { label: "wttr.in", url: "https://wttr.in/" },
    { label: "three.js", url: "https://threejs.org/" },
    { label: "VT323 on Google Fonts", url: "https://fonts.google.com/specimen/VT323" }
  ];

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

  function escapeHtml(value){
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function injectStyles(){
    if(document.getElementById("creditsStyles")) return;
    const style = document.createElement("style");
    style.id = "creditsStyles";
    style.textContent = `
#creditsButton{
  position:fixed;
  top:22px;
  right:382px;
  z-index:700;
  min-width:158px;
  height:76px;
  border:5px solid #2b2118;
  border-radius:18px;
  background:#fff8d1;
  color:#2b2118;
  font-family:"VT323", monospace;
  font-size:34px;
  line-height:1;
  cursor:pointer;
  box-shadow:0 8px 0 rgba(0,0,0,.18);
  transition:.16s ease;
}
#creditsButton:hover{ transform:translateY(-2px) rotate(-1deg); }
#creditsButton:active{ transform:translateY(3px) rotate(-1deg); box-shadow:0 3px 0 rgba(0,0,0,.18); }
#creditsOverlay{
  position:fixed;
  inset:0;
  display:none;
  align-items:center;
  justify-content:center;
  z-index:9400;
  background:rgba(0,0,0,.30);
  backdrop-filter:blur(4px);
  font-family:"VT323", monospace;
}
#creditsPanel{
  width:min(940px, calc(100vw - 32px));
  max-height:min(760px, calc(100vh - 32px));
  display:grid;
  grid-template-rows:auto 1fr auto;
  overflow:hidden;
  background:#fff8d1;
  color:#2b2118;
  border:6px solid #2b2118;
  border-radius:20px;
  box-shadow:0 24px 52px rgba(0,0,0,.38);
}
#creditsHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  padding:18px 22px;
  border-bottom:5px solid #2b2118;
  background:#ffd166;
}
#creditsHeader h2{ margin:0; font-size:50px; line-height:.9; }
#creditsHeader p{ margin:7px 0 0; font-size:23px; line-height:1; }
#creditsClose{
  border:4px solid #2b2118;
  border-radius:12px;
  background:#ffadad;
  color:#2b2118;
  font-family:inherit;
  font-size:27px;
  padding:7px 13px;
  cursor:pointer;
  box-shadow:0 5px 0 rgba(0,0,0,.18);
}
#creditsBody{
  min-height:0;
  overflow:auto;
  padding:22px 26px 26px;
  background:repeating-linear-gradient(0deg, rgba(43,33,24,.045) 0 2px, transparent 2px 38px), #fffbe1;
}
.creditsGrid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(265px, 1fr));
  gap:14px;
}
.creditCard{
  border:4px solid #2b2118;
  border-radius:16px;
  background:rgba(255,255,255,.72);
  box-shadow:0 6px 0 rgba(0,0,0,.14);
  padding:16px 18px;
}
.creditCard h3{
  margin:0 0 10px;
  color:#8f4f19;
  font-size:34px;
  line-height:.95;
}
.creditCard ul{
  margin:0;
  padding-left:24px;
}
.creditCard li{
  margin:0 0 8px;
  font-size:24px;
  line-height:1.08;
}
.creditsLinks{
  margin-top:18px;
  border:4px dashed rgba(43,33,24,.36);
  border-radius:16px;
  padding:14px 16px;
  background:rgba(255,230,168,.72);
}
.creditsLinks h3{
  margin:0 0 10px;
  font-size:32px;
  color:#55602a;
}
.creditsLinks a{
  display:inline-block;
  margin:4px 8px 6px 0;
  border:3px solid #2b2118;
  border-radius:999px;
  background:#fff8d1;
  color:#2b2118;
  padding:5px 12px;
  font-size:22px;
  line-height:1;
  text-decoration:none;
}
.creditsLinks a:hover{ background:#ffd166; transform:translateY(-1px); }
#creditsFooter{
  padding:13px 22px 16px;
  border-top:5px solid #2b2118;
  background:#ffe6a8;
  font-size:23px;
  line-height:1.05;
}
@media (max-width:900px){
  #creditsButton{ top:86px; right:18px; min-width:136px; height:58px; font-size:27px; }
  #creditsPanel{ max-height:calc(100vh - 24px); }
  #creditsHeader h2{ font-size:40px; }
  #creditsHeader p{ font-size:19px; }
  #creditsBody{ padding:16px; }
  .creditCard li{ font-size:22px; }
  .creditsLinks a{ font-size:20px; }
}
`;
    document.head.appendChild(style);
  }

  function createUi(){
    if(document.getElementById("creditsButton")) return;
    injectStyles();

    const button = document.createElement("button");
    button.id = "creditsButton";
    button.type = "button";
    button.setAttribute("aria-label", "Open credits");
    button.textContent = "Credits";

    const overlay = document.createElement("div");
    overlay.id = "creditsOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section id="creditsPanel" role="dialog" aria-modal="true" aria-labelledby="creditsTitle">
        <header id="creditsHeader">
          <div>
            <h2 id="creditsTitle">Credits</h2>
            <p>Music, assets, data, libraries, and acknowledgements.</p>
          </div>
          <button id="creditsClose" type="button">Close</button>
        </header>
        <main id="creditsBody"></main>
        <footer id="creditsFooter">
          Thank you to the artists, toolmakers, and data providers who made this prototype possible.
        </footer>
      </section>
    `;

    document.body.appendChild(button);
    document.body.appendChild(overlay);

    button.addEventListener("click", openCredits);
    document.getElementById("creditsClose").addEventListener("click", closeCredits);
    overlay.addEventListener("click", event => {
      if(event.target === overlay){
        closeCredits();
      }
    });
    window.addEventListener("keydown", event => {
      if(event.key === "Escape" && overlay.style.display === "flex"){
        closeCredits();
      }
    });

    renderCredits();
  }

  function renderCredits(){
    const body = document.getElementById("creditsBody");
    if(!body) return;

    const sectionHtml = CREDIT_SECTIONS.map(section => `
      <article class="creditCard">
        <h3>${escapeHtml(section.title)}</h3>
        <ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    `).join("");

    const linkHtml = LINKS.map(link => `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
    `).join("");

    body.innerHTML = `
      <div class="creditsGrid">${sectionHtml}</div>
      <section class="creditsLinks" aria-label="Credit links">
        <h3>Source links & licences</h3>
        ${linkHtml}
      </section>
    `;
  }

  function openCredits(){
    playSelect();
    renderCredits();
    const overlay = document.getElementById("creditsOverlay");
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeCredits(){
    playSelect();
    const overlay = document.getElementById("creditsOverlay");
    if(!overlay) return;
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  ready(createUi);
})();
