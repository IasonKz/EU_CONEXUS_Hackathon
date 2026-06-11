const LEVEL_CONFIG = window.LEVEL_CONFIG;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");
const topFactBox = document.getElementById("topFactBox");
const npcDialogueBox = document.getElementById("npcDialogueBox");
const introBox = document.getElementById("introBox");

const PROGRESS_KEY = "floraUnlockedLevel";
const COMPLETED_KEY = "floraCompletedLevels";
const NOTEBOOK_KEY = "floraNotebookEntries";

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
        // localStorage can be unavailable in some file/browser privacy modes.
    }
}

function getUnlockedLevel(){
    const stored = Number(storageGet(PROGRESS_KEY, "1"));
    const base = Number.isFinite(stored) ? stored : 1;
    const completedMax = getCompletedLevels().reduce((max, level) => Math.max(max, Number(level) || 0), 0);
    const migrated = Math.max(base, completedMax + 1);
    return Math.max(1, Math.min(5, migrated));
}

function getCompletedLevels(){
    try{
        const parsed = JSON.parse(storageGet(COMPLETED_KEY, "[]"));
        return Array.isArray(parsed) ? parsed.map(Number) : [];
    }
    catch(error){
        return [];
    }
}


function getStoredNotebookEntries(){
    try{
        const parsed = JSON.parse(storageGet(NOTEBOOK_KEY, "{}"));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }
    catch(error){
        return {};
    }
}

function buildNotebookEntry(levelNumber){
    const facts = (LEVEL_CONFIG.facts || []).map(fact => ({
        title: fact.title || "Bee Fact",
        text: fact.text || ""
    }));

    const npcsForNotebook = (LEVEL_CONFIG.npcs || []).map(npc => ({
        name: npc.name || "NPC",
        accent: npc.accent || "#ffd166",
        lines: Array.isArray(npc.lines) ? npc.lines.slice() : []
    }));

    return {
        number: Number(levelNumber),
        title: LEVEL_CONFIG.title || `Level ${levelNumber}`,
        region: LEVEL_CONFIG.weatherLocation?.region || "",
        theme: LEVEL_CONFIG.theme || "",
        beeName: LEVEL_CONFIG.beeName || LEVEL_CONFIG.npcName || "Level bee",
        beeImage: `assets/bee-level-${Number(levelNumber)}.png`,
        achievement: LEVEL_CONFIG.achievement || null,
        collectedAt: new Date().toISOString(),
        facts,
        npcs: npcsForNotebook,
        weather: {
            description: weatherState.description || "",
            conditionLabel: weatherState.conditionLabel || "",
            temperature: weatherState.temperature,
            windSpeed: weatherState.windSpeed
        }
    };
}

function saveNotebookEntry(levelNumber){
    const entries = getStoredNotebookEntries();
    entries[String(levelNumber)] = buildNotebookEntry(levelNumber);
    storageSet(NOTEBOOK_KEY, JSON.stringify(entries));
}

function markLevelComplete(levelNumber){
    const completed = new Set(getCompletedLevels());
    completed.add(Number(levelNumber));
    storageSet(COMPLETED_KEY, JSON.stringify(Array.from(completed).sort((a,b) => a-b)));
    saveNotebookEntry(levelNumber);

    const nextLevel = Math.min(5, Number(levelNumber) + 1);
    if(nextLevel > getUnlockedLevel()){
        storageSet(PROGRESS_KEY, String(nextLevel));
    }
}

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    buildLevelGeometry();
    // Weather particles are not used in the PNG-only level backgrounds.
}

/////////////////////////////////////////////////////
// GAME STATE
/////////////////////////////////////////////////////

let gameOver = false;
let gameWon = false;
let levelLocked = LEVEL_CONFIG.number > getUnlockedLevel();
let returnToLobbyTimer = null;
let introActive = Boolean(LEVEL_CONFIG.intro);

const gravity = 0.7;
const levelWidth = 5000;
const PLATFORM_IMAGE_RATIO = 110 / 704;
const MUSHROOM_FRAME_COUNT = 5;
const MUSHROOM_FRAME_RATIO = 292 / (2048 / MUSHROOM_FRAME_COUNT);
const THORN_IMAGE_RATIO = 0.30;
const STAR_TARGET = 3;
const CURE_COLLECTIBLES = [
    {type: "purification-bead", name: "Purification Bead", shortName: "Bead"},
    {type: "enzyme-drop", name: "Enzyme Drop", shortName: "Enzyme"},
    {type: "dna-pollen", name: "DNA Pollen", shortName: "DNA"}
];

let cameraX = 0;
let topFactTimer = null;
let activeNpc = null;
let activeNpcLine = 0;
let weatherState = {
    condition: "clear",
    conditionLabel: "Clear",
    description: "Default clear background",
    temperature: null,
    windSpeed: null
};
let weatherParticles = [];
let weatherParticleCondition = "";

const CONTROL_HINT = "← → Move | SPACE/↑ Jump | collect 3 cure ingredients | use lifts and bounce mushrooms | R Restart | 🌍 Lobby";

function playAudioCue(name){
    if(window.BeeAudio && typeof window.BeeAudio.play === "function"){
        window.BeeAudio.play(name);
    }
}

function startLevelMusic(){
    if(window.BeeAudio && typeof window.BeeAudio.startMusic === "function"){
        window.BeeAudio.startMusic(LEVEL_CONFIG.musicTrack);
    }
}

/////////////////////////////////////////////////////
// SPRITES
/////////////////////////////////////////////////////

const idleSheet = new Image();
idleSheet.src = "idle.png";

const runLeftSheet = new Image();
runLeftSheet.src = "run-left.png";

const runRightSheet = new Image();
runRightSheet.src = "run-right.png";

const backgroundImage = new Image();
backgroundImage.src = LEVEL_CONFIG.backgroundImage || `background_level_${LEVEL_CONFIG.number || 1}.png`;

const npcSprite = new Image();
npcSprite.src = LEVEL_CONFIG.npcImage || `../assets/bee-level-${LEVEL_CONFIG.number || 1}.png`;

const enemySprite = new Image();
enemySprite.src = LEVEL_CONFIG.enemyImage || "sick_bee_all_levels.png";

const hiveSprite = new Image();
hiveSprite.src = LEVEL_CONFIG.goalImage || "hive.png";

const platformSprite = new Image();
platformSprite.src = LEVEL_CONFIG.platformImage || "platform.png";

const rockSprite = new Image();
rockSprite.src = LEVEL_CONFIG.rockImage || "rock.png";

const logSprite = new Image();
logSprite.src = LEVEL_CONFIG.logImage || "log.png";

const mushroomSprite = new Image();
mushroomSprite.src = LEVEL_CONFIG.mushroomImage || "mushroom.png";

const groundSprite = new Image();
groundSprite.src = LEVEL_CONFIG.groundImage || "ground.png";

const thornSprite = new Image();
thornSprite.src = LEVEL_CONFIG.thornImage || "thorn.png";

function loadSprite(src){
    const image = new Image();
    image.src = src;
    return image;
}

const COLLECTIBLE_SPRITES = {
    "purification-bead": {
        sheet: loadSprite("../assets/collectible-1-frames.png"),
        color: loadSprite("../assets/collectible-1-color.png"),
        grey: loadSprite("../assets/collectible-1-grey.png"),
        frames: 4,
        frameDuration: 150,
        displayWidth: 78,
        displayHeight: 86,
        hudWidth: 54,
        hudHeight: 58
    },
    "enzyme-drop": {
        sheet: loadSprite("../assets/collectible-2-frames.png"),
        color: loadSprite("../assets/collectible-2-color.png"),
        grey: loadSprite("../assets/collectible-2-grey.png"),
        frames: 4,
        frameDuration: 150,
        displayWidth: 68,
        displayHeight: 78,
        hudWidth: 48,
        hudHeight: 58
    },
    "dna-pollen": {
        sheet: loadSprite("../assets/collectible-3-frames.png"),
        color: loadSprite("../assets/collectible-3-color.png"),
        grey: loadSprite("../assets/collectible-3-grey.png"),
        frames: 4,
        frameDuration: 150,
        displayWidth: 78,
        displayHeight: 78,
        hudWidth: 58,
        hudHeight: 58
    }
};

const animations = {

    idle: {
        image: idleSheet,
        frameWidth: 550,
        frameHeight: 880,
        frames: 8,
        drawWidth: 120,
        drawHeight: 192
    },

    runLeft: {
        image: runLeftSheet,
        frameWidth: 800,
        frameHeight: 920,
        frames: 4,
        drawWidth: 145,
        drawHeight: 192
    },

    runRight: {
        image: runRightSheet,
        frameWidth: 800,
        frameHeight: 910,
        frames: 4,
        drawWidth: 145,
        drawHeight: 192
    }
};

let currentAnimation = animations.idle;

/////////////////////////////////////////////////////
// PLAYER
/////////////////////////////////////////////////////

const player = {

    x: 100,
    y: 200,

    width: 120,
    height: 192,

    speed: 5,
    velY: 0,

    jumping: true
};

/////////////////////////////////////////////////////
// ANIMATION
/////////////////////////////////////////////////////

let frameIndex = 0;
let frameTimer = 0;
const frameSpeed = 8;

function setAnimation(animation){

    if(currentAnimation !== animation){

        currentAnimation = animation;
        frameIndex = 0;
        frameTimer = 0;
    }
}

function updateAnimation(){

    frameTimer++;

    if(frameTimer >= frameSpeed){

        frameTimer = 0;

        frameIndex++;

        if(frameIndex >= currentAnimation.frames){

            frameIndex = 0;
        }
    }
}

/////////////////////////////////////////////////////
// INPUT
/////////////////////////////////////////////////////

const keys = {};

function isSpaceKey(e){
    return e.code === "Space" || e.key === " ";
}

document.addEventListener("keydown", e => {

    if(isSpaceKey(e)){
        e.preventDefault();
    }

    if(levelLocked){
        return;
    }

    if(introActive){
        if(isSpaceKey(e) || e.key === "Enter"){
            dismissIntroBox();
            playAudioCue("select");
        }
        return;
    }

    if(activeNpc){
        if(isSpaceKey(e) || e.key === "Enter"){
            playAudioCue("select");
            advanceNpcDialogue();
        }
        return;
    }

    keys[e.key] = true;

    if(
        (isSpaceKey(e) || e.key === "ArrowUp")
        && !player.jumping
    ){

        player.velY = -15;
        player.jumping = true;
        playAudioCue("select");
    }

    if(
        (gameWon || gameOver)
        && e.key.toLowerCase() === "r"
    ){

        location.reload();
    }
});

document.addEventListener("keyup", e => {

    keys[e.key] = false;
});

/////////////////////////////////////////////////////
// LEVEL
/////////////////////////////////////////////////////

let platforms = [];
let hazards = [];
let bouncePads = [];
let collectibles = [];
let collectedStars = 0;
let lastStarHintAt = 0;
let enemies = [];
let npcs = [];
let goal = null;


const LEVEL_LAYOUTS = {
    1: {
        // Meadow tutorial: readable spacing, one simple jump section, and a high platform cure ingredient.
        ground: [[0, 5000]],
        platforms: [
            {x: 900, rise: 158, width: 270},
            {x: 1580, rise: 126, width: 280, style: "lift", move: {axis: "y", distance: 42, speed: 0.86, phase: 0.2}},
            {x: 2360, rise: 178, width: 270},
            {x: 3300, rise: 142, width: 290},
            {x: 4100, rise: 118, width: 310}
        ],
        blockers: [
            {x: 690, rise: 60, width: 96, height: 84, style: "rock"},
            {x: 1084, rise: 60, width: 96, height: 84, style: "rock"},
            {x: 2190, rise: 60, width: 96, height: 112, style: "log"},
            {x: 2824, rise: 60, width: 96, height: 112, style: "log"}
        ],
        hazards: [
            {x: 1180, width: 86, type: "thorn"},
            {x: 2920, width: 92, type: "thorn"}
        ],
        bouncePads: [
            {x: 2620, width: 118, power: -18.2}
        ],
        collectibles: [
            {id: "star-1", x: 955, rise: 225},
            {id: "star-2", x: 2440, rise: 246},
            {id: "star-3", x: 3440, rise: 210}
        ],
        enemySpecs: [
            {x: 1760, min: 1670, max: 2040, speed: 1.55, width: 60, height: 50},
            {x: 3860, min: 3660, max: 4240, speed: 1.65, width: 60, height: 50}
        ]
    },
    2: {
        // Mountain route: broken ground, a vertical lift, and a log-to-platform climb.
        ground: [[0, 980], [1160, 2020], [2220, 3180], [3380, 5000]],
        platforms: [
            {x: 780, rise: 170, width: 250},
            {x: 1420, rise: 135, width: 260},
            {x: 2060, rise: 205, width: 245, style: "lift", move: {axis: "y", distance: 62, speed: 0.90, phase: 0.1}},
            {x: 2860, rise: 172, width: 270},
            {x: 3760, rise: 190, width: 260},
            {x: 4320, rise: 130, width: 300}
        ],
        blockers: [
            {x: 590, rise: 60, width: 96, height: 86, style: "rock"},
            {x: 1164, rise: 60, width: 96, height: 86, style: "rock"},
            {x: 2560, rise: 60, width: 98, height: 116, style: "log"},
            {x: 3560, rise: 60, width: 98, height: 88, style: "rock"}
        ],
        hazards: [
            {x: 1260, width: 88, type: "thorn"},
            {x: 3658, width: 94, type: "thorn"}
        ],
        bouncePads: [
            {x: 1760, width: 118, power: -18.6}
        ],
        collectibles: [
            {id: "star-1", x: 820, rise: 238},
            {id: "star-2", x: 2110, rise: 282},
            {id: "star-3", x: 3830, rise: 258}
        ],
        enemySpecs: [
            {x: 1520, min: 1380, max: 1840, speed: 1.65, width: 62, height: 50},
            {x: 3980, min: 3820, max: 4240, speed: 1.75, width: 62, height: 50}
        ]
    },
    3: {
        // Forest route: island sections and a horizontal lift, with rocks/logs used as clear stepping points.
        ground: [[0, 860], [1040, 1660], [1880, 2560], [2780, 3520], [3740, 5000]],
        platforms: [
            {x: 760, rise: 152, width: 255},
            {x: 1540, rise: 190, width: 260, style: "lift", move: {axis: "x", distance: 95, speed: 0.78, phase: 0.7}},
            {x: 2300, rise: 150, width: 270},
            {x: 3160, rise: 218, width: 250, style: "lift", move: {axis: "y", distance: 58, speed: 0.88, phase: 0.2}},
            {x: 4240, rise: 144, width: 300}
        ],
        blockers: [
            {x: 1120, rise: 60, width: 96, height: 114, style: "log"},
            {x: 2040, rise: 60, width: 104, height: 90, style: "rock"},
            {x: 3264, rise: 60, width: 96, height: 90, style: "rock"},
            {x: 3960, rise: 60, width: 96, height: 114, style: "log"}
        ],
        hazards: [
            {x: 2144, width: 90, type: "thorn"},
            {x: 3360, width: 96, type: "thorn"}
        ],
        bouncePads: [
            {x: 1380, width: 118, power: -18.7},
            {x: 2860, width: 118, power: -18.9}
        ],
        collectibles: [
            {id: "star-1", x: 795, rise: 220},
            {id: "star-2", x: 2365, rise: 220},
            {id: "star-3", x: 3230, rise: 292}
        ],
        enemySpecs: [
            {x: 1280, min: 1160, max: 1500, speed: 1.55, width: 62, height: 50},
            {x: 4100, min: 3920, max: 4380, speed: 1.75, width: 62, height: 50}
        ]
    },
    4: {
        // Aloe sanctuary: more vertical movement, but no cluttered obstacle stacks.
        ground: [[0, 1080], [1260, 2180], [2400, 3300], [3500, 5000]],
        platforms: [
            {x: 880, rise: 172, width: 260},
            {x: 1500, rise: 218, width: 250, style: "lift", move: {axis: "y", distance: 66, speed: 0.88, phase: 0.4}},
            {x: 2260, rise: 145, width: 270},
            {x: 3040, rise: 210, width: 255, style: "lift", move: {axis: "x", distance: 110, speed: 0.78, phase: 1.1}},
            {x: 3820, rise: 178, width: 260},
            {x: 4360, rise: 126, width: 310}
        ],
        blockers: [
            {x: 650, rise: 60, width: 96, height: 114, style: "log"},
            {x: 1844, rise: 60, width: 96, height: 114, style: "log"},
            {x: 2660, rise: 60, width: 106, height: 92, style: "rock"},
            {x: 4100, rise: 60, width: 96, height: 114, style: "log"}
        ],
        hazards: [
            {x: 1940, width: 92, type: "thorn"},
            {x: 4196, width: 98, type: "thorn"}
        ],
        bouncePads: [
            {x: 1280, width: 118, power: -18.6},
            {x: 2860, width: 118, power: -19.0}
        ],
        collectibles: [
            {id: "star-1", x: 930, rise: 242},
            {id: "star-2", x: 2320, rise: 212},
            {id: "star-3", x: 3890, rise: 246}
        ],
        enemySpecs: [
            {x: 1980, min: 1840, max: 2140, speed: 1.78, width: 64, height: 50},
            {x: 3660, min: 3520, max: 3980, speed: 1.88, width: 64, height: 50}
        ]
    },
    5: {
        // New Zealand grove: alternating safe ground and elevated paths with a calm final approach.
        ground: [[0, 940], [1140, 2060], [2280, 3160], [3380, 5000]],
        platforms: [
            {x: 820, rise: 168, width: 260},
            {x: 1480, rise: 128, width: 260},
            {x: 1980, rise: 210, width: 250, style: "lift", move: {axis: "y", distance: 58, speed: 0.84, phase: 0.3}},
            {x: 2760, rise: 156, width: 270},
            {x: 3560, rise: 210, width: 255, style: "lift", move: {axis: "x", distance: 100, speed: 0.76, phase: 0.9}},
            {x: 4300, rise: 132, width: 310}
        ],
        blockers: [
            {x: 610, rise: 60, width: 106, height: 90, style: "rock"},
            {x: 1224, rise: 60, width: 96, height: 90, style: "rock"},
            {x: 2480, rise: 60, width: 96, height: 114, style: "log"},
            {x: 3394, rise: 60, width: 106, height: 90, style: "rock"},
            {x: 4100, rise: 60, width: 106, height: 90, style: "rock"}
        ],
        hazards: [
            {x: 1320, width: 90, type: "thorn"},
            {x: 3500, width: 96, type: "thorn"}
        ],
        bouncePads: [
            {x: 2320, width: 118, power: -18.8},
            {x: 2920, width: 118, power: -19.0}
        ],
        collectibles: [
            {id: "star-1", x: 875, rise: 236},
            {id: "star-2", x: 2825, rise: 224},
            {id: "star-3", x: 3620, rise: 286}
        ],
        enemySpecs: [
            {x: 1640, min: 1500, max: 1920, speed: 1.62, width: 62, height: 50},
            {x: 3820, min: 3640, max: 4060, speed: 1.78, width: 62, height: 50}
        ]
    }
};
function buildLevelGeometry(){

    const collectedCollectibleIds = new Set(
        collectibles
            .filter(item => item.collected)
            .map(item => item.id)
    );

    const completedNpcIds = new Set(
        npcs
            .filter(npc => npc.completed)
            .map(npc => npc.id)
    );

    const layout = LEVEL_LAYOUTS[LEVEL_CONFIG.number] || LEVEL_LAYOUTS[1];
    const groundY = canvas.height - 60;

    platforms = [];
    hazards = [];
    bouncePads = [];
    collectibles = [];

    for(const segment of layout.ground){
        addPlatform(segment[0], groundY, segment[1] - segment[0], 60, {style: "ground"});
    }

    for(const spec of layout.platforms){
        const platformHeight = spec.height || Math.max(30, Math.round(spec.width * PLATFORM_IMAGE_RATIO));
        addPlatform(spec.x, groundY - spec.rise, spec.width, platformHeight, spec);
    }

    for(const spec of (layout.blockers || [])){
        addPlatform(spec.x, groundY - spec.rise - spec.height + 60, spec.width, spec.height, {...spec, style: spec.style || "rock"});
    }

    for(const spec of (layout.hazards || [])){
        const height = spec.height || Math.max(34, Math.round(spec.width * THORN_IMAGE_RATIO));
        hazards.push({
            ...spec,
            height,
            y: spec.y ?? groundY - height,
            label: hazardLabel(spec.type)
        });
    }

    for(const spec of (layout.bouncePads || [])){
        const height = spec.height || Math.max(64, Math.round(spec.width * MUSHROOM_FRAME_RATIO));
        bouncePads.push({
            ...spec,
            height,
            y: spec.y ?? groundY - height,
            power: spec.power || -18.5,
            cooldown: 0
        });
    }

    const collectibleSpecs = layout.collectibles || defaultCollectibles();
    collectibles = collectibleSpecs.map((spec, index) => {
        const id = spec.id || `ingredient-${index + 1}`;
        const cureMeta = CURE_COLLECTIBLES[index % CURE_COLLECTIBLES.length];
        const type = spec.type || cureMeta.type;
        const namedMeta = CURE_COLLECTIBLES.find(item => item.type === type) || cureMeta;
        const spriteMeta = COLLECTIBLE_SPRITES[type] || COLLECTIBLE_SPRITES["enzyme-drop"];
        const width = spec.width || 58;
        const height = spec.height || 58;
        const standingTop = findStandingTop(spec.x, width, true) ?? groundY;
        const y = spec.y ?? (Number.isFinite(Number(spec.rise)) ? groundY - Number(spec.rise) : standingTop - 92);
        return {
            ...spec,
            id,
            type,
            ingredientIndex: index,
            name: spec.name || namedMeta.name,
            shortName: spec.shortName || namedMeta.shortName,
            width,
            height,
            displayWidth: spec.displayWidth || spriteMeta.displayWidth || 72,
            displayHeight: spec.displayHeight || spriteMeta.displayHeight || 72,
            y,
            collected: collectedCollectibleIds.has(id)
        };
    });
    collectedStars = collectibles.filter(item => item.collected).length;

    const enemyTypeList = LEVEL_CONFIG.enemyTypes || ["sick-bee"];
    const enemySpecs = layout.enemySpecs || [];

    enemies = enemySpecs.map((enemy, index) => {
        const top = findStandingTop(enemy.x, enemy.width, true) ?? groundY;
        return {
            ...enemy,
            type: enemyTypeList[index % enemyTypeList.length],
            y: top - enemy.height
        };
    });

    npcs = (LEVEL_CONFIG.npcs || []).map((npc, index) => {
        const npcWidth = 104;
        const npcHeight = 104;
        const top = findStandingTop(npc.x, npcWidth, true) ?? groundY;
        return {
            ...npc,
            id: npc.name + "-" + index,
            y: top - npcHeight,
            width: npcWidth,
            height: npcHeight,
            completed: completedNpcIds.has(npc.name + "-" + index)
        };
    });

    const goalTop = findStandingTop(4800, 80, true) ?? groundY;
    goal = {
        x:4760,
        y:goalTop-150,
        width:150,
        height:150
    };
}

function addPlatform(x, y, width, height, options = {}){
    platforms.push({
        x,
        y,
        baseX: x,
        baseY: y,
        prevX: x,
        prevY: y,
        dx: 0,
        dy: 0,
        width,
        height,
        style: options.style || "platform",
        move: options.move || null,
        phase: options.move?.phase || options.phase || 0
    });
}

function updateDynamicPlatforms(){
    const time = performance.now() / 1000;

    for(const platform of platforms){
        platform.prevX = platform.x;
        platform.prevY = platform.y;

        if(platform.move){
            const wave = Math.sin(time * platform.move.speed + platform.phase);
            if(platform.move.axis === "x"){
                platform.x = platform.baseX + wave * platform.move.distance;
                platform.y = platform.baseY;
            }
            else{
                platform.x = platform.baseX;
                platform.y = platform.baseY + wave * platform.move.distance;
            }
        }
        else{
            platform.x = platform.baseX;
            platform.y = platform.baseY;
        }

        platform.dx = platform.x - platform.prevX;
        platform.dy = platform.y - platform.prevY;
    }

    for(const pad of bouncePads){
        pad.cooldown = Math.max(0, (pad.cooldown || 0) - 1);
    }
}

function findStandingTop(x, width, preferGround){
    let best = null;

    for(const platform of platforms){
        if(platform.move && preferGround) continue;
        const overlaps = x <= platform.x + platform.width && x + width >= platform.x;
        if(overlaps){
            if(best === null || platform.y > best){
                best = platform.y;
            }
        }
    }

    return best;
}

function defaultCollectibles(){
    return [
        {x: 900, rise: 148},
        {x: 2460, rise: 168},
        {x: 4050, rise: 142}
    ];
}

function hazardLabel(type){
    return "thorns";
}

/////////////////////////////////////////////////////
// WEATHER API
/////////////////////////////////////////////////////

function resetWeatherParticles(force){
    if(force){
        weatherParticles = [];
        weatherParticleCondition = "";
        return;
    }

    weatherParticles = [];
    weatherParticleCondition = "";
}

async function loadLevelWeather(){
    if(!window.BeeWeather || !LEVEL_CONFIG.weatherLocation){
        return;
    }

    try{
        const liveWeather = await window.BeeWeather.getCurrentWeather(LEVEL_CONFIG.weatherLocation);
        weatherState = liveWeather;
        // Weather particles are not used in the PNG-only level backgrounds.

        if(!gameOver && !gameWon && !activeNpc){
            const temp = window.BeeWeather.formatTemperature(liveWeather.temperature);
            if(!introActive){ message.innerText = `Weather API: ${liveWeather.description} · ${temp}`; }
            setTimeout(() => {
                if(!gameOver && !gameWon && !activeNpc && !introActive){
                    message.innerText = CONTROL_HINT;
                }
            }, 4200);
        }
    }
    catch(error){
        weatherState = {
            condition: "clear",
            conditionLabel: "Clear",
            description: "Weather API fallback",
            temperature: null,
            windSpeed: null
        };
    }
}

function ensureWeatherParticles(condition){
    let count = 0;

    if(condition === "rain" || condition === "thunder"){
        count = 130;
    }
    else if(condition === "snow"){
        count = 95;
    }

    if(weatherParticleCondition === condition && weatherParticles.length === count){
        return;
    }

    weatherParticles = [];
    weatherParticleCondition = condition;

    for(let i = 0; i < count; i++){
        weatherParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: condition === "snow" ? 1.1 + Math.random() * 2.2 : 11 + Math.random() * 8,
            drift: condition === "snow" ? -0.8 + Math.random() * 1.6 : -2.5 - Math.random() * 2,
            size: condition === "snow" ? 2 + Math.random() * 3.8 : 12 + Math.random() * 18,
            wobble: Math.random() * Math.PI * 2
        });
    }
}

function drawWeatherOverlay(){
    const condition = weatherState.condition || "clear";

    if(condition === "rain" || condition === "thunder"){
        drawRain(condition === "thunder");
    }
    else if(condition === "snow"){
        drawSnow();
    }
    else if(condition === "fog"){
        drawFog();
    }
    else if(condition === "cloudy"){
        drawCloudLayer();
    }
}

function drawRain(withThunder){
    ensureWeatherParticles(withThunder ? "thunder" : "rain");

    ctx.save();
    ctx.strokeStyle = "rgba(78, 104, 152, .52)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for(let drop of weatherParticles){
        drop.x += drop.drift;
        drop.y += drop.speed;

        if(drop.y > canvas.height + 30 || drop.x < -40){
            drop.x = Math.random() * canvas.width + 50;
            drop.y = -40 - Math.random() * 180;
        }

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.drift * 1.2, drop.y + drop.size);
        ctx.stroke();
    }

    if(withThunder){
        const pulse = Math.sin(performance.now() / 120);
        if(pulse > .88){
            ctx.fillStyle = "rgba(255,255,255,.22)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawLightning(canvas.width * .68, 50);
        }
    }

    ctx.restore();
}

function drawLightning(x, y){
    ctx.save();
    ctx.strokeStyle = "rgba(255, 248, 180, .88)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 28, y + 72);
    ctx.lineTo(x + 6, y + 72);
    ctx.lineTo(x - 38, y + 155);
    ctx.stroke();
    ctx.restore();
}

function drawSnow(){
    ensureWeatherParticles("snow");

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.86)";

    for(let flake of weatherParticles){
        flake.wobble += .02;
        flake.x += flake.drift + Math.sin(flake.wobble) * .65;
        flake.y += flake.speed;

        if(flake.y > canvas.height + 20 || flake.x < -30 || flake.x > canvas.width + 30){
            flake.x = Math.random() * canvas.width;
            flake.y = -30 - Math.random() * 180;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawFog(){
    const time = performance.now() / 80;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.18)";
    for(let i = 0; i < 6; i++){
        const y = canvas.height * (.28 + i * .09);
        const x = ((time + i * 190) % (canvas.width + 360)) - 180;
        ctx.beginPath();
        ctx.ellipse(x, y, 260, 32, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 190, y + 12, 250, 28, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawCloudLayer(){
    ctx.save();
    ctx.globalAlpha = .58;
    for(let x = -260 - (cameraX * 0.05 % 360); x < canvas.width + 380; x += 300){
        drawCloud(x, 70 + ((x + 500) % 70), 1.18);
    }
    ctx.restore();
}

/////////////////////////////////////////////////////
// DIALOGUE
/////////////////////////////////////////////////////

function escapeHtml(value){
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showTopFact(fact){
    // Facts are saved into Flora's Notebook and delivered through the level bee NPCs.
    // No repeated top fact popups are shown after the initial mission box.
    if(topFactBox){
        topFactBox.classList.add("hidden");
    }
}

function renderIntroBox(){
    if(!introBox || !LEVEL_CONFIG.intro) return;
    const intro = LEVEL_CONFIG.intro;
    const beeName = LEVEL_CONFIG.beeName || LEVEL_CONFIG.npcName || "Level bee";
    introBox.innerHTML =
        `<div class="intro-title">${escapeHtml(intro.title || LEVEL_CONFIG.title || "Mission")}</div>` +
        `<div class="intro-line"><p>${escapeHtml(intro.text || "Reach the hive at the end of the level.")}</p>` +
        `<p><strong>Level bee:</strong> ${escapeHtml(beeName)}</p></div>` +
        `<div class="footer">▶ Press Space or Enter to start</div>`;
}

function showIntroBox(){
    if(!introActive || !introBox) return;
    renderIntroBox();
    introBox.classList.remove("hidden");
    message.innerText = "";
}

function dismissIntroBox(){
    introActive = false;
    if(introBox){
        introBox.classList.add("hidden");
    }
    message.innerText = CONTROL_HINT;
}

function startNpcDialogue(npc){

    activeNpc = npc;
    activeNpcLine = 0;
    setAnimation(animations.idle);
    renderNpcDialogue();
}

function renderNpcDialogue(){

    if(!activeNpc) return;

    const line = activeNpc.lines[activeNpcLine];
    const current = activeNpcLine + 1;
    const total = activeNpc.lines.length;

    npcDialogueBox.innerHTML =
        `<div class="speaker">${escapeHtml(activeNpc.name)}</div>` +
        `<div class="line">${escapeHtml(line)}</div>` +
        `<div class="footer">▶ Space or Enter to continue (${current}/${total})</div>`;

    npcDialogueBox.classList.remove("hidden");
}

function advanceNpcDialogue(){

    if(!activeNpc) return;

    activeNpcLine++;

    if(activeNpcLine >= activeNpc.lines.length){
        activeNpc.completed = true;
        activeNpc = null;
        activeNpcLine = 0;
        npcDialogueBox.classList.add("hidden");
        message.innerText = CONTROL_HINT;
        return;
    }

    renderNpcDialogue();
}

function checkNpcDialogue(){

    if(activeNpc || gameOver || gameWon) return;

    for(let npc of npcs){
        if(!npc.completed && hit(player, npc)){
            startNpcDialogue(npc);
            break;
        }
    }
}

function checkStoryFacts(){

    if(!LEVEL_CONFIG.facts) return;

    for(let fact of LEVEL_CONFIG.facts){
        if(!fact.shown && player.x >= fact.x){
            fact.shown = true;
            showTopFact(fact);
        }
    }
}

function checkCollectibles(){
    for(const star of collectibles){
        if(star.collected) continue;

        const starHitbox = {
            x: star.x + 8,
            y: star.y + 8,
            width: Math.max(10, star.width - 16),
            height: Math.max(10, star.height - 16)
        };

        if(hit(player, starHitbox)){
            star.collected = true;
            collectedStars = collectibles.filter(item => item.collected).length;
            const itemName = star.name || "Cure ingredient";
            message.innerText = collectedStars >= STAR_TARGET
                ? `Healing Nectar complete! Deliver it to the hive.`
                : `${itemName} collected! ${collectedStars}/${STAR_TARGET} cure ingredients`;
            playAudioCue("achievement");
        }
    }
}

function showMissingStarsHint(){
    const now = performance.now();
    if(now - lastStarHintAt < 900) return;
    lastStarHintAt = now;
    message.innerText = `Collect all ${STAR_TARGET} cure ingredients before entering the hive! You have ${collectedStars}/${STAR_TARGET}.`;
    playAudioCue("wrong");
}

function resetCollectiblesAfterDeath(){
    for(const star of collectibles){
        star.collected = false;
    }
    collectedStars = 0;
}

/////////////////////////////////////////////////////
// COLLISION
/////////////////////////////////////////////////////

function hit(a,b){

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/////////////////////////////////////////////////////
// UPDATE
/////////////////////////////////////////////////////


function update(){

    if(levelLocked || gameOver || gameWon) return;

    updateDynamicPlatforms();

    if(introActive || activeNpc){
        setAnimation(animations.idle);
        return;
    }

    /////////////////////////////////////////////////////
    // MOVEMENT
    /////////////////////////////////////////////////////

    if(keys["ArrowRight"]){

        player.x += player.speed;

        setAnimation(
            animations.runRight
        );
    }

    else if(keys["ArrowLeft"]){

        player.x -= player.speed;

        setAnimation(
            animations.runLeft
        );
    }

    else{

        setAnimation(
            animations.idle
        );
    }

    /////////////////////////////////////////////////////
    // GRAVITY
    /////////////////////////////////////////////////////

    const previousBottom = player.y + player.height;
    player.velY += gravity;
    player.y += player.velY;

    player.jumping = true;

    /////////////////////////////////////////////////////
    // PLATFORM COLLISION
    /////////////////////////////////////////////////////

    for(let p of platforms){

        const platformTop = p.y;
        const playerBottom = player.y + player.height;
        const horizontalOverlap = player.x < p.x + p.width && player.x + player.width > p.x;
        const landingFromAbove = previousBottom <= (p.prevY ?? p.y) + 8;
        const closeToTop = playerBottom >= platformTop && playerBottom <= platformTop + 34 + Math.abs(p.dy || 0);

        if(horizontalOverlap && landingFromAbove && closeToTop && player.velY >= (p.dy || 0) - .8){

            player.y = platformTop - player.height;

            player.velY = 0;

            player.jumping = false;

            player.x += p.dx || 0;
        }
    }

    /////////////////////////////////////////////////////
    // BOUNCE PADS
    /////////////////////////////////////////////////////

    for(let pad of bouncePads){
        const padHitbox = {
            x: pad.x + 6,
            y: pad.y,
            width: pad.width - 12,
            height: pad.height + 14
        };

        if(pad.cooldown <= 0 && hit(player, padHitbox) && player.velY >= 0){
            player.y = pad.y - player.height;
            player.velY = pad.power;
            player.jumping = true;
            pad.cooldown = 28;
            playAudioCue("bounce");
        }
    }

    /////////////////////////////////////////////////////
    // HAZARDS
    /////////////////////////////////////////////////////

    for(let hazard of hazards){
        const dangerZone = {
            x: hazard.x + Math.max(12, hazard.width * 0.20),
            y: hazard.y + Math.max(10, hazard.height * 0.34),
            width: Math.max(10, hazard.width * 0.60),
            height: Math.max(10, hazard.height * 0.48)
        };

        if(hit(player, dangerZone)){
            triggerGameOver(`Game Over — watch out for ${hazard.label}! Press R or 🌍 Lobby`, "wrong");
            return;
        }
    }

    /////////////////////////////////////////////////////
    // COLLECTIBLES
    /////////////////////////////////////////////////////

    checkCollectibles();

    /////////////////////////////////////////////////////
    // ENEMIES
    /////////////////////////////////////////////////////

    for(let e of enemies){

        e.x += e.speed;

        if(
            e.x < e.min ||
            e.x > e.max
        ){

            e.speed *= -1;
        }

        if(hit(player,e)){
            triggerGameOver(`Game Over — ${LEVEL_CONFIG.enemyName || "infected bees"} touched Flora! Press R or 🌍 Lobby`, "wrong");
            return;
        }
    }

    /////////////////////////////////////////////////////
    // GOAL
    /////////////////////////////////////////////////////

    if(hit(player,goal)){

        if(collectedStars >= STAR_TARGET){
            finishLevel();
        }
        else{
            showMissingStarsHint();
            player.x = Math.min(player.x, goal.x - player.width - 10);
        }
        return;
    }

    /////////////////////////////////////////////////////
    // FALL
    /////////////////////////////////////////////////////

    if(player.y > canvas.height + 300){

        triggerGameOver("Game Over — Press R or 🌍 Lobby", "gameover");
        return;
    }

    /////////////////////////////////////////////////////
    // BOUNDS
    /////////////////////////////////////////////////////

    if(player.x < 0){

        player.x = 0;
    }

    if(
        player.x >
        levelWidth - player.width
    ){

        player.x =
            levelWidth - player.width;
    }

    /////////////////////////////////////////////////////
    // CAMERA
    /////////////////////////////////////////////////////

    cameraX =
        player.x - canvas.width/3;

    if(cameraX < 0){

        cameraX = 0;
    }

    if(
        cameraX >
        levelWidth - canvas.width
    ){

        cameraX =
            levelWidth - canvas.width;
    }

    checkNpcDialogue();
}

function triggerGameOver(text, cue){
    if(gameOver) return;
    gameOver = true;
    resetCollectiblesAfterDeath();
    message.innerText = `${text} Cure ingredients lost: 0/${STAR_TARGET}.`;
    playAudioCue(cue || "gameover");
}

function finishLevel(){
    if(gameWon) return;

    gameWon = true;
    markLevelComplete(LEVEL_CONFIG.number);
    playAudioCue("complete");

    message.innerText = `🎉 Level ${LEVEL_CONFIG.number} cleared with ${STAR_TARGET}/${STAR_TARGET} cure ingredients! Returning to lobby...`;

    clearTimeout(returnToLobbyTimer);
    returnToLobbyTimer = setTimeout(() => {
        window.location.href = "../globe_3d_pins.html";
    }, 950);
}

/////////////////////////////////////////////////////
// PARALLAX BACKGROUND
/////////////////////////////////////////////////////

function drawBackground(){
    ctx.fillStyle = LEVEL_CONFIG.cssBackground || "#a8d8f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(!backgroundImage.complete || !backgroundImage.naturalWidth){
        return;
    }

    const scale = canvas.height / backgroundImage.height;
    const drawWidth = backgroundImage.width * scale;
    const parallax = cameraX * 0.22;
    const offset = -((parallax % drawWidth) + drawWidth) % drawWidth;

    for(let x = offset - drawWidth; x < canvas.width + drawWidth; x += drawWidth){
        ctx.drawImage(backgroundImage, x, 0, drawWidth, canvas.height);
    }
}

function drawSun(x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawCloud(x, y, scale){
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.beginPath();
    ctx.arc(0, 20, 26, 0, Math.PI * 2);
    ctx.arc(32, 10, 34, 0, Math.PI * 2);
    ctx.arc(72, 20, 28, 0, Math.PI * 2);
    ctx.arc(42, 34, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMeadowBackground(p){

    drawSun(canvas.width - 140 - cameraX * 0.02, 96, 52, "rgba(255, 221, 87, .95)");

    for(let x = -240 - (cameraX * 0.12 % 360); x < canvas.width + 420; x += 360){
        drawCloud(x, 95 + ((x + 400) % 90), 0.9);
    }

    ctx.fillStyle = p.hillFar;
    for(let x = -260 - (cameraX * 0.18 % 430); x < canvas.width + 500; x += 430){
        ctx.beginPath();
        ctx.arc(x, canvas.height - 42, 240, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = p.hillNear;
    for(let x = -220 - (cameraX * 0.30 % 360); x < canvas.width + 420; x += 360){
        ctx.beginPath();
        ctx.arc(x, canvas.height + 20, 220, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlowerField("#ffffff", "#ffd166", 0.65);
    drawFlowerField("#ff8fab", "#ffe66d", 0.92);
}

function drawFlowerField(petalColor, centerColor, speed){
    for(let x = -80 - (cameraX * speed % 180); x < canvas.width + 180; x += 90){
        const y = canvas.height - 88 + ((x * 7) % 24);
        ctx.strokeStyle = "#2d8f45";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 58);
        ctx.lineTo(x + 8, y);
        ctx.stroke();
        ctx.fillStyle = petalColor;
        for(let a=0; a<Math.PI*2; a+=Math.PI/2){
            ctx.beginPath();
            ctx.ellipse(x + 8 + Math.cos(a)*8, y + Math.sin(a)*8, 7, 4, a, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(x + 8, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRainforestBackground(p){

    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(0, canvas.height * .18, canvas.width, canvas.height * .22);

    ctx.fillStyle = p.hillFar;
    for(let x = -180 - (cameraX * 0.12 % 240); x < canvas.width + 260; x += 240){
        ctx.beginPath();
        ctx.arc(x, canvas.height - 20, 240, Math.PI, 0);
        ctx.lineTo(x + 240, canvas.height);
        ctx.lineTo(x - 240, canvas.height);
        ctx.fill();
    }

    for(let x = -120 - (cameraX * 0.22 % 260); x < canvas.width + 260; x += 260){
        ctx.fillStyle = "#5a3b20";
        ctx.fillRect(x, canvas.height - 340, 42, 290);
        ctx.fillStyle = p.hillNear;
        ctx.beginPath();
        ctx.arc(x + 20, canvas.height - 360, 115, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f5132";
        ctx.beginPath();
        ctx.arc(x - 40, canvas.height - 300, 85, 0, Math.PI * 2);
        ctx.arc(x + 75, canvas.height - 310, 90, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = "rgba(23, 77, 38, .85)";
    ctx.lineWidth = 7;
    for(let x = -60 - (cameraX * 0.35 % 220); x < canvas.width + 200; x += 220){
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 40, 120, x - 30, 220, x + 25, 360);
        ctx.stroke();
    }
}

function drawWoodlandBackground(p){

    drawSun(canvas.width - 180 - cameraX * 0.025, 110, 46, "rgba(255, 240, 180, .82)");

    ctx.fillStyle = "rgba(147, 112, 219, .25)";
    for(let x = -160 - (cameraX * 0.12 % 260); x < canvas.width + 320; x += 260){
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 60);
        ctx.lineTo(x + 130, canvas.height - 340);
        ctx.lineTo(x + 300, canvas.height - 60);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = p.hillFar;
    for(let x = -260 - (cameraX * 0.18 % 390); x < canvas.width + 420; x += 390){
        ctx.beginPath();
        ctx.arc(x, canvas.height - 20, 220, 0, Math.PI * 2);
        ctx.fill();
    }

    for(let x = -120 - (cameraX * 0.32 % 310); x < canvas.width + 360; x += 310){
        ctx.fillStyle = "#5a341e";
        ctx.fillRect(x, canvas.height - 270, 44, 220);
        ctx.fillStyle = p.hillNear;
        ctx.beginPath();
        ctx.arc(x + 20, canvas.height - 285, 95, 0, Math.PI * 2);
        ctx.fill();
    }

    for(let x = -90 - (cameraX * 0.72 % 260); x < canvas.width + 260; x += 260){
        ctx.fillStyle = "#6f4e37";
        ctx.save();
        ctx.translate(x, canvas.height - 80);
        ctx.rotate(-0.12);
        ctx.fillRect(0, 0, 190, 28);
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(12, 8, 18, 6);
        ctx.fillRect(60, 5, 20, 8);
        ctx.fillRect(128, 8, 16, 7);
        ctx.restore();
    }

    drawFlowerField("#b98bff", "#ffe66d", 0.8);
}

function drawAridBackground(p){

    drawSun(canvas.width - 125 - cameraX * 0.01, 120, 62, "rgba(255, 213, 79, .95)");

    ctx.fillStyle = p.hillFar;
    for(let x = -220 - (cameraX * 0.18 % 430); x < canvas.width + 520; x += 430){
        ctx.beginPath();
        ctx.ellipse(x, canvas.height - 35, 280, 115, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = p.hillNear;
    for(let x = -160 - (cameraX * 0.35 % 360); x < canvas.width + 440; x += 360){
        ctx.beginPath();
        ctx.ellipse(x, canvas.height + 18, 250, 100, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    for(let x = -90 - (cameraX * 0.65 % 260); x < canvas.width + 260; x += 260){
        drawAloePlant(x, canvas.height - 72, 0.85 + ((x + 1000) % 3) * .1);
    }

    ctx.fillStyle = "rgba(83, 53, 24, .45)";
    for(let x = -80 - (cameraX * 0.8 % 170); x < canvas.width + 170; x += 170){
        ctx.beginPath();
        ctx.ellipse(x, canvas.height - 50, 30, 12, 0, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawAloePlant(x, y, scale){
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "#2d6a4f";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    for(let i = -3; i <= 3; i++){
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(i * 18, -55 - Math.abs(i) * 8);
        ctx.stroke();
    }
    ctx.strokeStyle = "#e76f51";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(0, -120);
    ctx.stroke();
    ctx.fillStyle = "#ffb703";
    for(let i = 0; i < 4; i++){
        ctx.beginPath();
        ctx.ellipse(0, -120 - i*10, 10, 6, 0, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

/////////////////////////////////////////////////////
// DRAW
/////////////////////////////////////////////////////

function draw(){

    drawBackground();

    /////////////////////////////////////////////////////
    // PLATFORMS
    /////////////////////////////////////////////////////


for(let p of platforms){
    drawPlatform(p);
}

for(let pad of bouncePads){
    drawBouncePad(pad);
}

for(let hazard of hazards){
    drawHazard(hazard);
}

for(let collectible of collectibles){
    drawCollectible(collectible);
}

    /////////////////////////////////////////////////////
    // NPCS
    /////////////////////////////////////////////////////

    for(let npc of npcs){
        drawNpc(npc);
    }

    /////////////////////////////////////////////////////
    // ENEMIES
    /////////////////////////////////////////////////////

    for(let e of enemies){
        drawEnemy(e);
    }

    /////////////////////////////////////////////////////
    // GOAL
    /////////////////////////////////////////////////////

    drawGoal();

    /////////////////////////////////////////////////////
    // PLAYER
    /////////////////////////////////////////////////////

    ctx.drawImage(

    currentAnimation.image,

    frameIndex *
    currentAnimation.frameWidth,

    0,

    currentAnimation.frameWidth,
    currentAnimation.frameHeight,

    player.x - cameraX,
    player.y,

    currentAnimation.drawWidth,
    currentAnimation.drawHeight
);

    drawCollectibleHud();

    if(levelLocked){
        drawLockedOverlay();
    }
}


function drawPlatform(p){
    const sx = p.x - cameraX;
    if(sx > canvas.width + 160 || sx + p.width < -160) return;

    ctx.save();

    if(p.style === "ground"){
        drawGroundBlock(sx, p.y, p.width, p.height);
    }
    else if(p.style === "rock"){
        drawRockBlock(sx, p.y, p.width, p.height);
    }
    else if(p.style === "log"){
        drawLogBlock(sx, p.y, p.width, p.height);
    }
    else{
        drawPlatformSprite(sx, p.y, p.width);
    }

    ctx.restore();
}

function drawGroundBlock(x, y, width, height){
    if(groundSprite.complete && groundSprite.naturalWidth){
        const tileWidth = Math.max(1, Math.round(height * (groundSprite.width / groundSprite.height)));
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        for(let drawX = x; drawX < x + width; drawX += tileWidth){
            ctx.drawImage(groundSprite, drawX, y, tileWidth, height);
        }
        ctx.restore();
        return;
    }

    const palette = LEVEL_CONFIG.palette || {};
    const base = palette.platform || "#5ab85f";
    const top = palette.platformTop || "#8ee46b";
    ctx.fillStyle = base;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = top;
    ctx.fillRect(x, y, width, 10);
}

function drawPlatformSprite(x, y, width){
    if(platformSprite.complete && platformSprite.naturalWidth){
        const visualHeight = Math.max(18, Math.round(width * (platformSprite.height / platformSprite.width)));
        ctx.drawImage(platformSprite, x, y, width, visualHeight);
        return;
    }

    roundedRect(x, y, width, Math.max(24, Math.round(width * PLATFORM_IMAGE_RATIO)), 8, "#8ac56b");
}

function drawRockBlock(x, y, width, height){
    if(rockSprite.complete && rockSprite.naturalWidth){
        ctx.drawImage(rockSprite, x, y, width, height);
        return;
    }

    roundedRect(x, y, width, height, 14, "#aaa8a8");
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fillRect(x + width * .18, y + height * .22, width * .42, 6);
}

function drawLogBlock(x, y, width, height){
    if(logSprite.complete && logSprite.naturalWidth){
        ctx.drawImage(logSprite, x, y, width, height);
        return;
    }

    roundedRect(x, y, width, height, 12, "#6b4a37");
    ctx.fillStyle = "#d6a36b";
    ctx.fillRect(x + 4, y, Math.max(0, width - 8), 14);
    ctx.strokeStyle = "rgba(43,33,24,.45)";
    ctx.lineWidth = 4;
    for(let px = x + 12; px < x + width; px += 26){
        ctx.beginPath();
        ctx.moveTo(px, y + 22);
        ctx.lineTo(px - 8, y + height - 10);
        ctx.stroke();
    }
}

function roundedRect(x, y, width, height, radius, fillStyle){
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function drawBouncePad(pad){
    const sx = pad.x - cameraX;
    if(sx > canvas.width + 140 || sx + pad.width < -140) return;

    const frameProgress = pad.cooldown > 0
        ? 1 - Math.max(0, pad.cooldown) / 28
        : (Math.sin(performance.now() / 260 + pad.x * .01) + 1) * .08;
    const frame = Math.max(0, Math.min(MUSHROOM_FRAME_COUNT - 1, Math.floor(frameProgress * MUSHROOM_FRAME_COUNT)));
    const squash = pad.cooldown > 0 ? Math.sin(pad.cooldown / 28 * Math.PI) * 8 : 0;
    const centerX = sx + pad.width / 2;
    const drawHeight = pad.height - squash;
    const drawY = pad.y + (pad.height - drawHeight);

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.20)";
    ctx.beginPath();
    ctx.ellipse(centerX, pad.y + pad.height + 5, pad.width * .43, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if(mushroomSprite.complete && mushroomSprite.naturalWidth){
        const sourceFrameWidth = mushroomSprite.width / MUSHROOM_FRAME_COUNT;
        ctx.drawImage(
            mushroomSprite,
            frame * sourceFrameWidth,
            0,
            sourceFrameWidth,
            mushroomSprite.height,
            sx,
            drawY,
            pad.width,
            drawHeight
        );
    }
    else{
        ctx.fillStyle = "#fefae0";
        ctx.fillRect(centerX - pad.width * .13, drawY + drawHeight * .34, pad.width * .26, drawHeight * .66);
        ctx.fillStyle = "#ef476f";
        ctx.beginPath();
        ctx.ellipse(centerX, drawY + drawHeight * .34, pad.width * .50, drawHeight * .34, 0, Math.PI, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawHazard(hazard){
    const sx = hazard.x - cameraX;
    if(sx > canvas.width + 120 || sx + hazard.width < -120) return;

    ctx.save();
    if(thornSprite.complete && thornSprite.naturalWidth){
        ctx.drawImage(thornSprite, sx, hazard.y, hazard.width, hazard.height);
    }
    else{
        ctx.fillStyle = "#2d6a4f";
        ctx.strokeStyle = "#184e2f";
        ctx.lineWidth = 3;
        const toothWidth = 24;
        for(let x = sx; x < sx + hazard.width; x += toothWidth){
            ctx.beginPath();
            ctx.moveTo(x, hazard.y + hazard.height);
            ctx.lineTo(x + toothWidth/2, hazard.y);
            ctx.lineTo(x + toothWidth, hazard.y + hazard.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    ctx.restore();
}

function getCollectibleSprite(type){
    return COLLECTIBLE_SPRITES[type] || COLLECTIBLE_SPRITES["enzyme-drop"];
}

function drawCollectibleSpriteFrame(star){
    const sprite = getCollectibleSprite(star.type);
    const sheet = sprite.sheet;

    if(!sheet || !sheet.complete || !sheet.naturalWidth){
        drawCureIngredientIcon(star.type || "enzyme-drop", star.width);
        return;
    }

    const frames = Math.max(1, sprite.frames || 1);
    const frameWidth = Math.floor(sheet.naturalWidth / frames);
    const frameHeight = sheet.naturalHeight;
    const phase = (star.ingredientIndex || 0) * .45 + star.x * .002;
    const frame = Math.floor(performance.now() / (sprite.frameDuration || 150) + phase) % frames;
    const maxWidth = star.displayWidth || star.width;
    const maxHeight = star.displayHeight || star.height;
    const scale = Math.min(maxWidth / frameWidth, maxHeight / frameHeight);
    const drawWidth = frameWidth * scale;
    const drawHeight = frameHeight * scale;

    ctx.drawImage(
        sheet,
        frame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
    );
}

function drawStaticCollectibleIcon(type, collected, x, y, maxWidth, maxHeight){
    const sprite = getCollectibleSprite(type);
    const image = collected ? sprite.color : sprite.grey;

    ctx.save();
    if(image && image.complete && image.naturalWidth){
        const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        ctx.drawImage(
            image,
            x + (maxWidth - drawWidth) / 2,
            y + (maxHeight - drawHeight) / 2,
            drawWidth,
            drawHeight
        );
    }
    else{
        ctx.globalAlpha = collected ? 1 : .42;
        ctx.translate(x + maxWidth / 2, y + maxHeight / 2);
        drawCureIngredientIcon(type || "enzyme-drop", Math.min(maxWidth, maxHeight));
    }
    ctx.restore();
}

function drawCollectible(star){
    if(!star || star.collected) return;
    const sx = star.x - cameraX;
    if(sx < -120 || sx > canvas.width + 120) return;

    const pulse = 1 + Math.sin(performance.now() / 420 + star.x * .02) * .035;
    const cx = sx + star.width / 2;
    const cy = star.y + star.height / 2 + Math.sin(performance.now() / 320 + star.x * .01) * 5;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.20)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + (star.displayHeight || star.height) * .46, (star.displayWidth || star.width) * .30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    drawCollectibleSpriteFrame(star);
    ctx.restore();
}

function drawCureIngredientIcon(type, size){
    if(type === "dna-pollen") drawDnaPollen(size);
    else if(type === "purification-bead") drawPurificationBead(size);
    else if(type === "healing-vial") drawHealingVial(size);
    else drawEnzymeDrop(size);
}

function drawDnaPollen(size){
    const r = size * .29;
    ctx.save();
    for(let i = 0; i < 10; i++){
        const angle = i * Math.PI * 2 / 10;
        const px = Math.cos(angle) * r * 1.02;
        const py = Math.sin(angle) * r * .92;
        ctx.fillStyle = "#ffe98a";
        ctx.strokeStyle = "#2b2118";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, size * .095, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.fillStyle = "#ffd166";
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.08, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#2a9d8f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for(let i = 0; i <= 16; i++){
        const t = i / 16;
        const y = -r * .62 + t * r * 1.24;
        const x = Math.sin(t * Math.PI * 2.4) * r * .28;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#fff8d1";
    ctx.lineWidth = 2;
    for(let i = 2; i <= 14; i += 3){
        const t = i / 16;
        const y = -r * .62 + t * r * 1.24;
        const x = Math.sin(t * Math.PI * 2.4) * r * .28;
        ctx.beginPath();
        ctx.moveTo(x - r * .20, y);
        ctx.lineTo(x + r * .20, y);
        ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    ctx.arc(-r * .34, -r * .30, r * .18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawEnzymeDrop(size){
    const r = size * .34;
    ctx.save();
    ctx.fillStyle = "#7bdff2";
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * .86, -r * .18, r * .70, r * .92, 0, r * .98);
    ctx.bezierCurveTo(-r * .70, r * .92, -r * .86, -r * .18, 0, -r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#57cc99";
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 2.5;
    for(const dot of [[-.22,-.04,.12],[.18,.10,.10],[0,.28,.08]]){
        ctx.beginPath();
        ctx.arc(dot[0] * size, dot[1] * size, dot[2] * size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * .10, size * .03);
    ctx.lineTo(size * .10, size * .11);
    ctx.lineTo(size * .02, size * .24);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.62)";
    ctx.beginPath();
    ctx.ellipse(-r * .30, -r * .12, r * .16, r * .27, -.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawPurificationBead(size){
    const beads = [
        [-.18, -.18, "#b98bff"], [.18, -.16, "#ffadad"],
        [-.25, .18, "#ffd166"], [.12, .18, "#57cc99"], [.00, .00, "#f3e8ff"]
    ];
    ctx.save();
    for(const bead of beads){
        ctx.fillStyle = bead[2];
        ctx.strokeStyle = "#2b2118";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bead[0] * size, bead[1] * size, size * .16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath();
        ctx.arc(bead[0] * size - size * .045, bead[1] * size - size * .045, size * .042, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = "rgba(43,33,24,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * .34, size * .34);
    ctx.lineTo(size * .34, -size * .34);
    ctx.stroke();
    ctx.restore();
}

function drawHealingVial(size){
    const w = size * .46;
    const h = size * .72;
    ctx.save();
    ctx.translate(0, size * .02);
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 4;
    ctx.fillStyle = "#fff8d1";
    roundedRect(-w / 2, -h / 2, w, h, 6, "#fff8d1");
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#7bdff2";
    ctx.fillRect(-w / 2 + 5, -h * .02, w - 10, h * .43);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-w * .32, -h * .65, w * .64, h * .17);
    ctx.strokeRect(-w * .32, -h * .65, w * .64, h * .17);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    ctx.ellipse(-w * .16, -h * .20, w * .12, h * .18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawStarShape(cx, cy, outerRadius, innerRadius, fillStyle, strokeStyle){
    ctx.beginPath();
    for(let i = 0; i < 10; i++){
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
}

function drawCollectibleHud(){
    ctx.save();
    const slot = 58;
    const gap = 10;
    const panelPaddingX = 10;
    const panelPaddingY = 8;
    const x = 18;
    const y = 84;
    const panelWidth = STAR_TARGET * slot + (STAR_TARGET - 1) * gap + panelPaddingX * 2;
    const panelHeight = slot + panelPaddingY * 2;

    ctx.fillStyle = "rgba(255,248,209,.88)";
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 3;
    roundedRect(x, y, panelWidth, panelHeight, 13, "rgba(255,248,209,.88)");
    ctx.strokeRect(x, y, panelWidth, panelHeight);

    for(let index = 0; index < STAR_TARGET; index++){
        const star = collectibles[index];
        const meta = CURE_COLLECTIBLES[index % CURE_COLLECTIBLES.length];
        const type = star?.type || meta.type;
        const sprite = getCollectibleSprite(type);
        const iconWidth = sprite.hudWidth || slot;
        const iconHeight = sprite.hudHeight || slot;
        const slotX = x + panelPaddingX + index * (slot + gap);
        const slotY = y + panelPaddingY;
        drawStaticCollectibleIcon(
            type,
            Boolean(star?.collected),
            slotX + (slot - iconWidth) / 2,
            slotY + (slot - iconHeight) / 2,
            iconWidth,
            iconHeight
        );
    }
    ctx.restore();
}

function drawGoal(){
    if(!goal) return;
    const sx = goal.x - cameraX;
    if(sx < -220 || sx > canvas.width + 220) return;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(sx + goal.width / 2, goal.y + goal.height - 10, goal.width * .42, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    if(hiveSprite.complete && hiveSprite.naturalWidth){
        ctx.drawImage(hiveSprite, sx, goal.y, goal.width, goal.height);
    }
    else{
        ctx.fillStyle = LEVEL_CONFIG.palette.goal || "#f4c430";
        ctx.fillRect(sx, goal.y, goal.width, goal.height);
        ctx.fillStyle = "rgba(0,0,0,.36)";
        ctx.beginPath();
        ctx.arc(sx + goal.width / 2, goal.y + goal.height * .72, 18, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = "30px VT323";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(43,33,24,.70)";
    ctx.fillText("HIVE", sx + goal.width / 2 + 2, goal.y - 12 + 2);
    ctx.fillStyle = "#fff8d1";
    ctx.fillText("HIVE", sx + goal.width / 2, goal.y - 12);
    ctx.restore();
}

function drawEnemy(e){
    const sx = e.x - cameraX;
    if(sx < -180 || sx > canvas.width + 180) return;

    const bob = Math.sin(performance.now() / 155 + e.x * .035) * 4;
    const cx = sx + e.width / 2;
    const cy = e.y + e.height / 2 + bob;

    ctx.save();
    ctx.translate(cx, cy);
    if(e.speed > 0){
        ctx.scale(-1, 1);
    }

    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(0, e.height * .48, e.width * .46, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if(enemySprite.complete && enemySprite.naturalWidth){
        const drawW = e.width * 1.9;
        const drawH = e.height * 1.9;
        ctx.drawImage(enemySprite, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    else{
        ctx.fillStyle = "#8e44ad";
        ctx.beginPath();
        ctx.ellipse(0, 0, e.width * .55, e.height * .42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2b2118";
        ctx.beginPath();
        ctx.arc(-12, -4, 5, 0, Math.PI * 2);
        ctx.arc(12, -4, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawWaspEnemy(isHornet){
    const bodyColor = isHornet ? "#e76f51" : "#f4c430";

    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = .65;
    ctx.fillStyle = "#d8f3ff";
    ctx.beginPath();
    ctx.ellipse(-12, -15, 18, 30, -0.7, 0, Math.PI * 2);
    ctx.ellipse(12, -15, 18, 30, 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 4, isHornet ? 33 : 28, isHornet ? 20 : 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    for(let x = -18; x <= 14; x += 14){
        ctx.fillRect(x, -13, 6, 34);
    }

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(29, -2, isHornet ? 15 : 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(39, -12);
    ctx.lineTo(54, -26);
    ctx.moveTo(39, -7);
    ctx.lineTo(57, -10);
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(-31, 4);
    ctx.lineTo(-47, -4);
    ctx.lineTo(-31, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(33, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(34, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();
}

function drawAntEnemy(){
    ctx.strokeStyle = "#17120e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for(let x = -20; x <= 20; x += 20){
        ctx.beginPath();
        ctx.moveTo(x, 3);
        ctx.lineTo(x - 12, 22);
        ctx.moveTo(x, 3);
        ctx.lineTo(x + 10, 22);
        ctx.stroke();
    }

    ctx.fillStyle = "#3d2c1d";
    ctx.beginPath();
    ctx.arc(-24, 2, 15, 0, Math.PI * 2);
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(26, -2, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#17120e";
    ctx.beginPath();
    ctx.moveTo(36, -9);
    ctx.quadraticCurveTo(54, -25, 60, -10);
    ctx.moveTo(37, -3);
    ctx.quadraticCurveTo(56, -8, 64, 8);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(31, -7, 3.8, 0, Math.PI * 2);
    ctx.fill();
}

function drawMosquitoEnemy(){
    ctx.strokeStyle = "#272727";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    ctx.globalAlpha = .64;
    ctx.fillStyle = "#d8f3ff";
    ctx.beginPath();
    ctx.ellipse(-4, -14, 13, 30, -0.6, 0, Math.PI * 2);
    ctx.ellipse(14, -14, 13, 30, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#5a4e70";
    ctx.beginPath();
    ctx.ellipse(-6, 0, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#241f31";
    ctx.beginPath();
    ctx.arc(25, -2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(33, -2);
    ctx.lineTo(62, -9);
    ctx.stroke();

    for(let x = -20; x <= 16; x += 12){
        ctx.beginPath();
        ctx.moveTo(x, 5);
        ctx.lineTo(x - 8, 24);
        ctx.moveTo(x, 5);
        ctx.lineTo(x + 8, 22);
        ctx.stroke();
    }
}

function drawBeetleEnemy(isDesert){
    const shell = isDesert ? "#8d5524" : "#5e3023";

    ctx.strokeStyle = "#21150f";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for(let x = -24; x <= 24; x += 16){
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x - 12, 25);
        ctx.moveTo(x, 8);
        ctx.lineTo(x + 12, 25);
        ctx.stroke();
    }

    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(0, 1, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 22);
    ctx.stroke();

    ctx.fillStyle = "#21150f";
    ctx.beginPath();
    ctx.arc(33, -1, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#21150f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(42, -9);
    ctx.quadraticCurveTo(57, -24, 63, -9);
    ctx.moveTo(43, 4);
    ctx.quadraticCurveTo(59, 14, 64, 1);
    ctx.stroke();
}

function drawLocustEnemy(){
    ctx.strokeStyle = "#4b3b22";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    ctx.fillStyle = "#8ab17d";
    ctx.beginPath();
    ctx.ellipse(-4, 1, 32, 15, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6b8e23";
    ctx.beginPath();
    ctx.arc(28, -3, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = .55;
    ctx.fillStyle = "#d8f3ff";
    ctx.beginPath();
    ctx.ellipse(-10, -13, 34, 9, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(-15, 9);
    ctx.lineTo(-38, 30);
    ctx.lineTo(-52, 17);
    ctx.moveTo(6, 9);
    ctx.lineTo(-3, 31);
    ctx.moveTo(20, 8);
    ctx.lineTo(40, 28);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(32, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(33, -6, 1.7, 0, Math.PI * 2);
    ctx.fill();
}

function drawNpc(npc){
    const sx = npc.x - cameraX;
    if(sx < -190 || sx > canvas.width + 190) return;

    const cx = sx + npc.width / 2;
    const cy = npc.y + npc.height / 2;
    const float = Math.sin(performance.now() / 280 + npc.x * 0.01) * 4;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(cx, npc.y + npc.height + 8, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if(npcSprite.complete && npcSprite.naturalWidth){
        const size = 132;
        ctx.drawImage(npcSprite, cx - size / 2, cy - size / 2 + float, size, size);
    }
    else{
        ctx.fillStyle = npc.accent || "#ffd166";
        ctx.beginPath();
        ctx.ellipse(cx, cy + float, 42, 52, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    if(!npc.completed){
        ctx.fillStyle = "#fff8d6";
        ctx.strokeStyle = "#2d2312";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, npc.y - 18 + float, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2d2312";
        ctx.font = "30px VT323";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", cx, npc.y - 17 + float);
    }

    ctx.font = "26px VT323";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(43,33,24,.58)";
    ctx.fillText(npc.name, cx + 2, npc.y - 42 + 2);
    ctx.fillStyle = "#fff8d6";
    ctx.fillText(npc.name, cx, npc.y - 42);
    ctx.restore();
}

function drawLockedOverlay(){
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff8d6";
    ctx.strokeStyle = "#2b2118";
    ctx.lineWidth = 6;
    const boxW = Math.min(620, canvas.width - 48);
    const boxH = 170;
    const x = (canvas.width - boxW) / 2;
    const y = (canvas.height - boxH) / 2;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeRect(x, y, boxW, boxH);
    ctx.fillStyle = "#2b2118";
    ctx.font = "42px VT323";
    ctx.textAlign = "center";
    ctx.fillText(`Level ${LEVEL_CONFIG.number} locked`, canvas.width/2, y + 62);
    ctx.font = "30px VT323";
    ctx.fillText(`Clear Level ${LEVEL_CONFIG.number - 1} first.`, canvas.width/2, y + 108);
    ctx.font = "24px VT323";
    ctx.fillText("Returning to lobby...", canvas.width/2, y + 142);
    ctx.restore();
}

/////////////////////////////////////////////////////
// ACCESSIBILITY CONTEXT
/////////////////////////////////////////////////////

function getUpcomingLevelItem(items, xField){
    return (items || [])
        .filter(item => Number(item[xField]) >= player.x - 40)
        .map(item => ({
            ...item,
            distance: Number(item[xField]) - player.x
        }))
        .sort((a, b) => a.distance - b.distance)[0] || null;
}

window.BeeLevelAccessibilityContext = function(){
    const nextNpc = getUpcomingLevelItem(
        npcs.filter(npc => !npc.completed),
        "x"
    );
    const nextFact = getUpcomingLevelItem(LEVEL_CONFIG.facts || [], "x");
    const nextHazard = getUpcomingLevelItem(hazards || [], "x");

    return {
        page: "level",
        title: LEVEL_CONFIG.title || `Level ${LEVEL_CONFIG.number}`,
        levelNumber: Number(LEVEL_CONFIG.number) || 1,
        theme: LEVEL_CONFIG.theme || "",
        region: LEVEL_CONFIG.weatherLocation?.region || "",
        enemyName: LEVEL_CONFIG.enemyName || "infected bees",
        introActive,
        controls: CONTROL_HINT,
        levelLocked,
        gameOver,
        gameWon,
        playerX: Math.round(player.x),
        levelWidth,
        progressPercent: Math.max(0, Math.min(100, (player.x / Math.max(1, levelWidth - player.width)) * 100)),
        starsCollected: collectedStars,
        starsRequired: STAR_TARGET,
        remainingStars: Math.max(0, STAR_TARGET - collectedStars),
        cureIngredientsCollected: collectedStars,
        cureIngredientsRequired: STAR_TARGET,
        remainingCureIngredients: Math.max(0, STAR_TARGET - collectedStars),
        activeNpc: activeNpc ? {
            name: activeNpc.name || "NPC",
            line: Array.isArray(activeNpc.lines) ? activeNpc.lines[activeNpcLine] || "" : "",
            lineNumber: activeNpcLine + 1,
            totalLines: Array.isArray(activeNpc.lines) ? activeNpc.lines.length : 0
        } : null,
        nextNpc: nextNpc ? {
            name: nextNpc.name || "NPC",
            distance: nextNpc.distance,
            lines: Array.isArray(nextNpc.lines) ? nextNpc.lines.slice() : []
        } : null,
        nextFact: nextFact ? {
            title: nextFact.title || "Bee Fact",
            text: nextFact.text || "",
            distance: nextFact.distance
        } : null,
        nextHazard: nextHazard ? {
            label: nextHazard.label || hazardLabel(nextHazard.type),
            type: nextHazard.type || "hazard",
            distance: nextHazard.distance
        } : null,
        facts: (LEVEL_CONFIG.facts || []).map(fact => ({
            title: fact.title || "Bee Fact",
            text: fact.text || "",
            x: fact.x
        })),
        npcs: (LEVEL_CONFIG.npcs || []).map(npc => ({
            name: npc.name || "NPC",
            lines: Array.isArray(npc.lines) ? npc.lines.slice() : [],
            x: npc.x
        })),
        weather: {
            condition: weatherState.condition || "clear",
            conditionLabel: weatherState.conditionLabel || "Clear",
            description: weatherState.description || "",
            temperature: weatherState.temperature,
            windSpeed: weatherState.windSpeed
        }
    };
};

/////////////////////////////////////////////////////
// LOOP
/////////////////////////////////////////////////////

function loop(){

    update();
    updateAnimation();
    draw();

    requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

if(levelLocked){
    message.innerText = `Level ${LEVEL_CONFIG.number} locked — clear Level ${LEVEL_CONFIG.number - 1} first.`;
    draw();
    setTimeout(() => {
        window.location.href = "../globe_3d_pins.html";
    }, 1500);
}
else{
    message.innerText = introActive ? "" : CONTROL_HINT;
    if(introActive){
        showIntroBox();
    }

    startLevelMusic();
    loadLevelWeather();
    loop();
}
