(function(){
  "use strict";

  const PAGES = [
    {
      title: "How do I play?",
      tag: "Controls",
      question: "What should Flora do in each level?",
      answer: "Move right, collect the 3 cure ingredients, avoid Zombees and thorns, talk to the level bee, and deliver the Healing Nectar to the hive."
    },
    {
      title: "What is apiconIASIS?",
      tag: "Story",
      question: "Why is Flora travelling?",
      answer: "apiconIASIS is the game's bee-health mission. Flora travels between hives, learns from different bees, and carries the cure before infection spreads."
    },
    {
      title: "Who is Flora?",
      tag: "Hero",
      question: "Who is the main character?",
      answer: "Flora is the bee wanderer. She gathers cure ingredients, records discoveries in her notebook, and helps each hive recover."
    },
    {
      title: "Cure ingredients",
      tag: "Gameplay",
      question: "What must Flora collect before the hive?",
      answer: "Flora now collects DNA Pollen, Enzyme Drops, and Purification Beads. Together they complete the Healing Nectar before she enters the hive."
    },
    {
      title: "DNA Pollen",
      tag: "Cure lab",
      question: "What does DNA Pollen represent?",
      answer: "It represents the genetic recipe: the DNA instructions that tell a cell which useful enzyme or protein to make."
    },
    {
      title: "Enzyme Drop",
      tag: "Cure lab",
      question: "Why is the enzyme important?",
      answer: "An enzyme is a protein that can speed up a specific chemical reaction. In the story, it is the active ingredient Flora needs for the cure."
    },
    {
      title: "Purification Bead",
      tag: "Cure lab",
      question: "Why purify the cure ingredient?",
      answer: "Cells make many proteins at the same time. Purification separates the useful enzyme from the rest, like sorting one bead from a mixed jar."
    },
    {
      title: "Gene to enzyme",
      tag: "Biotech",
      question: "How is the cure made in the game science?",
      answer: "A DNA construct enters bacteria, the bacteria produce the enzyme, and scientists break the cells open and purify the enzyme for the final mixture."
    },
    {
      title: "Why bacteria?",
      tag: "Biotech",
      question: "Why use bacteria as tiny factories?",
      answer: "Bacteria such as E. coli can grow quickly and can be given DNA instructions, so they are useful model systems for producing proteins in a lab."
    },
    {
      title: "What is foulbrood?",
      tag: "Bee disease",
      question: "Why is the infection dangerous?",
      answer: "Foulbrood is a serious brood disease: it attacks young bees and can weaken or destroy a colony if it spreads through the hive."
    },
    {
      title: "Zombees",
      tag: "Disease spread",
      question: "Are Zombees villains?",
      answer: "No. They are sick bees in the story. Flora avoids contact because disease can spread before the Healing Nectar reaches the hive."
    },
    {
      title: "Real hive care",
      tag: "Teacher note",
      question: "Is the game a real treatment protocol?",
      answer: "No. The game turns disease control into a learning quest; real suspected foulbrood needs fast expert action, local rules, and careful hive management."
    },
    {
      title: "Apis mellifera",
      tag: "Level 1",
      question: "What does the Athens bee teach?",
      answer: "Apis mellifera, the western honey bee, lives in a structured colony with queen, workers, and drones that share tasks."
    },
    {
      title: "Meliponini",
      tag: "Level 2",
      question: "What makes stingless bees special?",
      answer: "Meliponini are social stingless bees. They defend nests with teamwork, resin, nest guards, and quick movement rather than a true sting."
    },
    {
      title: "Xylocopa",
      tag: "Level 3",
      question: "Why do carpenter bees need wood?",
      answer: "Many carpenter bees tunnel into dry or dead wood to nest. Leaving safe dead wood can protect important wild bee homes."
    },
    {
      title: "Aloe carpenter bee",
      tag: "Level 4",
      question: "Why do specialist bees matter?",
      answer: "Specialist bees may depend on a small set of plants or habitats. If those disappear, the bee may lose food or nesting material."
    },
    {
      title: "Leioproctus",
      tag: "Level 5",
      question: "What does the New Zealand bee teach?",
      answer: "Leioproctus is a common New Zealand native bee group. New Zealand has about 28 native bee species; many are solitary and need safe soil and native flowers."
    },
    {
      title: "Hylaeus",
      tag: "NZ bees",
      question: "How can a masked bee be recognized?",
      answer: "Hylaeus bees are often slender and dark with pale face or thorax marks. Many nest in hollow stems, twigs, or insect holes."
    },
    {
      title: "Lasioglossum",
      tag: "NZ bees",
      question: "What is special about these small bees?",
      answer: "Lasioglossum bees can be very small and may nest in soil. Some species show simple social behavior with a few females in one nest."
    },
    {
      title: "Bee diversity",
      tag: "Ecology",
      question: "Why learn more than one bee species?",
      answer: "Different bees pollinate different plants and need different homes. Protecting bee diversity protects ecosystems, crops, and wild flowers."
    },
    {
      title: "Temperature",
      tag: "Weather",
      question: "How does temperature affect bees?",
      answer: "Cool weather can slow flight and foraging. Warm weather can help activity, but extreme heat can stress bees and dry flowers."
    },
    {
      title: "Wind and rain",
      tag: "Weather",
      question: "Why are windy or rainy days difficult?",
      answer: "Strong wind makes flying costly and risky. Rain can keep bees inside, so less nectar and pollen may enter the hive that day."
    },
    {
      title: "Humidity and drought",
      tag: "Weather",
      question: "How can water conditions change production?",
      answer: "Plants need suitable water to make nectar. Drought, heat, or very wet weather can reduce flower rewards and change honey production."
    },
    {
      title: "Honey production",
      tag: "Beekeeping",
      question: "What connects weather to honey?",
      answer: "Honey starts with nectar. Good flowering, safe flight weather, and healthy workers give the colony more chances to collect and store it."
    },
    {
      title: "Hive hygiene",
      tag: "Beekeeping",
      question: "What classroom rule matches hive care?",
      answer: "Do not spread contamination. Beekeepers inspect brood, clean tools, and act quickly when disease signs appear."
    },
    {
      title: "Habitat support",
      tag: "Conservation",
      question: "How can people help bees outside the hive?",
      answer: "Plant varied flowers, protect soil and nesting wood, reduce unnecessary pesticides, and leave safe natural patches for wild bees."
    },
    {
      title: "Using weather data",
      tag: "Teacher prompt",
      question: "How could a beekeeper use the Weather Station?",
      answer: "Students can compare temperature, wind, rain, and cloud cover, then predict whether bees will forage, rest, or need extra care."
    },
    {
      title: "Notebook unlocks",
      tag: "Progress",
      question: "What does Flora's Notebook record?",
      answer: "It stores each cleared level, the bee species, learned facts, NPC dialogue, weather context, and the Cure Lab explanation."
    },
    {
      title: "Pin colors",
      tag: "Lobby",
      question: "What do the globe pins mean?",
      answer: "Pink pins are ready to play, green pins are cleared, and gray pins are locked. Clear the previous level to unlock the next pin."
    }
  ];

  let currentPage = 0;

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
    if(document.getElementById("beeBookStyles")) return;
    const style = document.createElement("style");
    style.id = "beeBookStyles";
    style.textContent = `
#beeBookButton{
  position:fixed;
  left:420px;
  bottom:18px;
  z-index:706;
  width:170px;
  height:170px;
  border:0;
  border-radius:0;
  background:transparent;
  color:#2b2118;
  font-family:"VT323", monospace;
  cursor:pointer;
  box-shadow:none;
  padding:0;
  transform:rotate(2deg);
  transition:.16s ease;
  filter:drop-shadow(0 12px 0 rgba(0,0,0,.18));
}
#beeBookButton:hover{ transform:translateY(-4px) rotate(1deg) scale(1.06); }
#beeBookButton:active{ transform:translateY(4px) rotate(1deg) scale(.99); filter:drop-shadow(0 5px 0 rgba(0,0,0,.18)); }
#beeBookButton img{ display:block; width:100%; height:100%; object-fit:contain; image-rendering:pixelated; margin:0; }
#beeBookButton span{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
#beeBookOverlay{
  position:fixed;
  inset:0;
  z-index:9350;
  display:none;
  align-items:center;
  justify-content:center;
  background:rgba(0,0,0,.30);
  backdrop-filter:blur(4px);
  font-family:"VT323", monospace;
}
#beeBookPanel{
  width:min(860px, calc(100vw - 32px));
  height:min(620px, calc(100vh - 32px));
  display:grid;
  grid-template-rows:auto 1fr auto;
  overflow:hidden;
  background:#fff8d1;
  color:#2b2118;
  border:6px solid #2b2118;
  border-radius:20px;
  box-shadow:0 24px 52px rgba(0,0,0,.38);
}
#beeBookHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:15px 20px;
  border-bottom:5px solid #2b2118;
  background:#ffd166;
}
#beeBookTitleWrap{ display:flex; align-items:center; gap:14px; min-width:0; }
#beeBookTitleWrap img{ width:84px; height:84px; object-fit:contain; image-rendering:pixelated; flex:0 0 auto; }
#beeBookHeader h2{ margin:0; font-size:48px; line-height:.9; }
#beeBookHeader p{ margin:5px 0 0; font-size:22px; line-height:1; }
#beeBookClose{
  border:4px solid #2b2118;
  border-radius:12px;
  background:#ffadad;
  color:#2b2118;
  font-family:inherit;
  font-size:26px;
  padding:7px 13px;
  cursor:pointer;
  box-shadow:0 5px 0 rgba(0,0,0,.18);
}
#beeBookPage{
  min-height:0;
  padding:28px 38px;
  background:repeating-linear-gradient(0deg, rgba(43,33,24,.045) 0 2px, transparent 2px 38px), #fffbe1;
  display:flex;
  align-items:center;
  justify-content:center;
}
.bee-book-card{
  width:100%;
  min-height:330px;
  border:5px solid #2b2118;
  border-radius:20px;
  background:rgba(255,255,255,.68);
  box-shadow:8px 8px 0 rgba(254,109,182,.20);
  padding:28px 32px;
  position:relative;
}
.bee-book-tag{
  display:inline-block;
  border:4px solid #2b2118;
  border-radius:999px;
  background:#57cc99;
  padding:3px 12px;
  font-size:24px;
  line-height:1;
  margin-bottom:14px;
}
.bee-book-card h3{ margin:0 0 12px; font-size:52px; line-height:.9; color:#7a4b00; }
.bee-book-question{ margin:0 0 18px; font-size:30px; line-height:1.05; color:#5d4630; }
.bee-book-answer{ margin:0; font-size:34px; line-height:1.1; }
#beeBookNav{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  padding:14px 20px 18px;
  border-top:5px solid #2b2118;
  background:#ffe6a8;
}
#beeBookNav button{
  min-width:120px;
  border:4px solid #2b2118;
  border-radius:12px;
  background:#ffd166;
  color:#2b2118;
  font-family:inherit;
  font-size:30px;
  line-height:1;
  padding:9px 15px;
  cursor:pointer;
  box-shadow:0 5px 0 rgba(0,0,0,.18);
}
#beeBookNav button:hover{ transform:translateY(-2px); }
#beeBookNav button:active{ transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.18); }
#beeBookCounter{ font-size:28px; line-height:1; text-align:center; }
@media (max-width:900px){
  #beeBookButton{ left:226px; bottom:78px; width:118px; height:118px; }
  #beeBookButton img{ width:100%; height:100%; }
  #beeBookHeader h2{ font-size:38px; }
  #beeBookHeader p{ font-size:18px; }
  #beeBookTitleWrap img{ width:52px; height:52px; }
  #beeBookPage{ padding:18px; }
  .bee-book-card{ padding:20px; min-height:300px; }
  .bee-book-card h3{ font-size:40px; }
  .bee-book-question{ font-size:24px; }
  .bee-book-answer{ font-size:27px; }
  #beeBookNav button{ min-width:86px; font-size:24px; }
}
`;
    document.head.appendChild(style);
  }

  function createUi(){
    if(document.getElementById("beeBookButton")) return;
    injectStyles();

    const button = document.createElement("button");
    button.id = "beeBookButton";
    button.type = "button";
    button.setAttribute("aria-label", "Open Bee Book");
    button.innerHTML = `<img src="assets/book.png" alt="" aria-hidden="true"><span>Bee Book</span>`;

    const overlay = document.createElement("div");
    overlay.id = "beeBookOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section id="beeBookPanel" role="dialog" aria-modal="true" aria-labelledby="beeBookTitle">
        <header id="beeBookHeader">
          <div id="beeBookTitleWrap">
            <img src="assets/book.png" alt="" aria-hidden="true">
            <div>
              <h2 id="beeBookTitle">Bee Book</h2>
              <p>Game questions, answers, and mini-wiki pages.</p>
            </div>
          </div>
          <button id="beeBookClose" type="button">Close</button>
        </header>
        <main id="beeBookPage" aria-live="polite"></main>
        <footer id="beeBookNav">
          <button id="beeBookPrev" type="button" aria-label="Previous Bee Book page">‹ Back</button>
          <div id="beeBookCounter"></div>
          <button id="beeBookNext" type="button" aria-label="Next Bee Book page">Next ›</button>
        </footer>
      </section>
    `;

    document.body.appendChild(button);
    document.body.appendChild(overlay);

    button.addEventListener("click", openBook);
    document.getElementById("beeBookClose").addEventListener("click", closeBook);
    document.getElementById("beeBookPrev").addEventListener("click", () => changePage(-1));
    document.getElementById("beeBookNext").addEventListener("click", () => changePage(1));
    overlay.addEventListener("click", event => {
      if(event.target === overlay){
        closeBook();
      }
    });
    window.addEventListener("keydown", event => {
      const overlayOpen = overlay.style.display === "flex";
      if(!overlayOpen) return;
      if(event.key === "Escape") closeBook();
      if(event.key === "ArrowLeft") changePage(-1);
      if(event.key === "ArrowRight") changePage(1);
    });

    renderPage();
  }

  function openBook(){
    playSelect();
    renderPage();
    const overlay = document.getElementById("beeBookOverlay");
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeBook(){
    playSelect();
    const overlay = document.getElementById("beeBookOverlay");
    if(!overlay) return;
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
  }

  function changePage(delta){
    playSelect();
    currentPage = (currentPage + delta + PAGES.length) % PAGES.length;
    renderPage();
  }

  function renderPage(){
    const page = PAGES[currentPage];
    const pageEl = document.getElementById("beeBookPage");
    const counter = document.getElementById("beeBookCounter");
    if(pageEl){
      pageEl.innerHTML = `
        <article class="bee-book-card">
          <span class="bee-book-tag">${escapeHtml(page.tag)}</span>
          <h3>${escapeHtml(page.title)}</h3>
          <p class="bee-book-question"><strong>Q:</strong> ${escapeHtml(page.question)}</p>
          <p class="bee-book-answer"><strong>A:</strong> ${escapeHtml(page.answer)}</p>
        </article>
      `;
    }
    if(counter){
      counter.textContent = `Page ${currentPage + 1} / ${PAGES.length}`;
    }
  }

  ready(createUi);
})();
