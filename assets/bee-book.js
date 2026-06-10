(function(){
  "use strict";

  const PAGES = [
    {
      title: "How do I play?",
      tag: "Controls",
      question: "What should Flora do in each level?",
      answer: "Move right, collect all 3 stars, jump over thorn hazards, avoid Zombees, talk to the level bee, and then reach the hive. The level only ends after Flora has all three stars."
    },
    {
      title: "What is apiconIASIS?",
      tag: "Story",
      question: "Why is Flora travelling?",
      answer: "apiconIASIS is the game's bee-health mission. Flora travels between hives, learns from different bees, and delivers a cure before infection spreads."
    },
    {
      title: "Who is Flora?",
      tag: "Hero",
      question: "Who is the main character?",
      answer: "Flora is the bee wanderer. She carries the cure, records discoveries in her notebook, and helps each hive recover."
    },
    {
      title: "What is a Zombee?",
      tag: "Enemy",
      question: "Are the enemies insects or bees?",
      answer: "The moving enemies are only sick bees called Zombees. They are infected by foulbrood, so Flora must avoid contact until the cure reaches the hive."
    },
    {
      title: "What is foulbrood?",
      tag: "Bee disease",
      question: "Why is the infection dangerous?",
      answer: "Foulbrood is a serious brood disease that can weaken or destroy a hive if it spreads. In the game, it is represented by Zombees and contaminated routes."
    },
    {
      title: "Apis mellifera",
      tag: "Level 1",
      question: "What does the Athens bee teach?",
      answer: "Apis mellifera, the western honey bee, lives in a structured colony. Workers, drones, and the queen all support the hive."
    },
    {
      title: "Meliponini",
      tag: "Level 2",
      question: "What makes stingless bees special?",
      answer: "Meliponini are stingless social bees. They defend their nest with teamwork, resin, quick movement, and strong colony behavior."
    },
    {
      title: "Xylocopa",
      tag: "Level 3",
      question: "Why do carpenter bees need dead wood?",
      answer: "Many carpenter bees nest in dry or dead wood. Leaving some safe dead wood in nature can protect important wild bee habitat."
    },
    {
      title: "Aloe carpenter bee",
      tag: "Level 4",
      question: "Why do specialist bees matter?",
      answer: "Specialist bees may depend on specific plants or habitats. If those plants disappear, the bee can lose food, nesting material, or both."
    },
    {
      title: "Leioproctus",
      tag: "Level 5",
      question: "What does the New Zealand bee teach?",
      answer: "Leioproctus represents New Zealand native bees. Many native bees are solitary and need safe soil, wild flowers, and protected habitats."
    },
    {
      title: "Three stars",
      tag: "Gameplay",
      question: "Why do I need stars?",
      answer: "Each level has 3 stars. Flora must collect all of them before entering the hive. If she dies, the stars are lost and must be collected again."
    },
    {
      title: "Weather Station",
      tag: "Live data",
      question: "Why is weather included?",
      answer: "Weather affects bee activity. Temperature, wind, rain, and humidity can change when bees forage and how safely colonies work."
    },
    {
      title: "Notebook unlocks",
      tag: "Progress",
      question: "How do achievements unlock?",
      answer: "Flora's Notebook unlocks a page after each cleared level. Each page stores the level bee, learned facts, NPC dialogue, and the achievement."
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
