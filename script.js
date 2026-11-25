(function () {
            // =========================================================================
            // SECTION 1: CORE CONFIGURATION, ERAS, ISLANDS & SPECIES REGISTRY
            // =========================================================================
            const world3dCanvas = document.getElementById('world3dCanvas');
            const simCanvas = document.getElementById('simCanvas');
            const ctx = simCanvas.getContext('2d');
            const neuralCanvas = document.getElementById('neuralCanvas');
            const neuralCtx = neuralCanvas.getContext('2d');
            const chartCanvas = document.getElementById('chartCanvas');
            const chartCtx = chartCanvas.getContext('2d');
            const cryo3dCanvas = document.getElementById('cryo3dCanvas');
            const modalVitalityCanvas = document.getElementById('modalVitalityCanvas');

            const STARTING_POPULATION = 100000000;
            const POPULATION_PER_AGENT = 1666666;
            const STORAGE_SLOTS_KEY = 'digital_life_evolution_slots_v3';
            const TILE_STEP = 88;
            // Physical scale: the rendered human model is approximately 1.7 m tall.
            // Its current model height is 2.54 x the genome size parameter.
            const HUMAN_BASELINE_METERS = 1.7;
            const HUMAN_MODEL_HEIGHT_UNITS = 10.4 * 2.54;
            const METERS_PER_WORLD_UNIT = HUMAN_BASELINE_METERS / HUMAN_MODEL_HEIGHT_UNITS;
            const worldUnitsFromMeters = meters => meters / METERS_PER_WORLD_UNIT;
            const metersFromWorldUnits = units => units * METERS_PER_WORLD_UNIT;
            const SPECIES_REFERENCE_METERS = {
                human: 1.7, capybara: 0.6, reddeer: 1.4, bison: 1.8, jaguar: 0.75,
                snowleopard: 0.65, woodlouse: 0.015, earthworm: 0.2, armadillo: 0.35,
                pangolin: 0.4, molerat: 0.12, honeybee: 0.012, hummingbird: 0.09,
                albatross: 0.9, falcon: 0.45, flyingsquirrel: 0.22, clownfish: 0.12,
                moonjelly: 0.3, seaotter: 1.2, mantaray: 4.0, seaturtle: 1.0,
                dolphin: 2.5, octopus: 0.6, whale: 25.0, nautilus: 0.2
            };
            let interiorMode = false;
            let combatEvents = 0;

            const HUMAN_ANN_STAGES = [
                { name: "Stage 0: Tabula Rasa (Nothing)", inSize: 2, hidSize: 2, outSize: 2, minXP: 0 },
                { name: "Stage 1: Upright Forager", inSize: 4, hidSize: 4, outSize: 2, minXP: 10 },
                { name: "Stage 2: Toolmaker & Task-Giver", inSize: 6, hidSize: 6, outSize: 3, minXP: 28 },
                { name: "Stage 3: Social & Language", inSize: 8, hidSize: 8, outSize: 3, minXP: 56 },
                { name: "Stage 4: Present-Day Revolutionary", inSize: 10, hidSize: 12, outSize: 4, minXP: 95 }
            ];

            const CULTURAL_STAGES = [
                { name: "Stage 0: Foraging Instincts", minXP: 0, bonusYield: 1.0, bonusDefense: 0.0 },
                { name: "Stage 1: Stone Age Craft", minXP: 18, bonusYield: 1.15, bonusDefense: 0.08 },
                { name: "Stage 2: Bronze Cultivation", minXP: 45, bonusYield: 1.32, bonusDefense: 0.14 },
                { name: "Stage 3: Iron Architecture", minXP: 85, bonusYield: 1.48, bonusDefense: 0.22 },
                { name: "Stage 4: Harmonic Bio-Era", minXP: 140, bonusYield: 1.65, bonusDefense: 0.30 }
            ];

            const HUMAN_REVOLUTIONS = [
                { name: "Pre-Fire Era", short: "Pre-Fire", discovery: "Flint & Gather", structure: "camp", job: "Forager" },
                { name: "Fire & Hearth Revolution", short: "Fire Age", discovery: "Controlled Fire", structure: "campfire", job: "Firekeeper" },
                { name: "Agricultural Revolution", short: "Agrarian", discovery: "Crop Irrigation", structure: "granary", job: "Farmer" },
                { name: "Mining & Metallurgy Rev.", short: "Mining", discovery: "Iron Ore Smelting", structure: "mine", job: "Miner" },
                { name: "Industrial Revolution", short: "Industry", discovery: "Steam Foundry", structure: "industry", job: "Engineer" },
                { name: "Scientific & ANN Rev.", short: "Bio-Tech", discovery: "Neural Grid", structure: "beacon", job: "Scientist" }
            ];
            const COLONY_REGIMES = HUMAN_REVOLUTIONS.map(r => r.name);

            const SHELTER_TYPES = [
                { kind: 'campfire', label: 'Fire Hearth', color: '#fb923c', bonusDesc: '+Warmth & Cooked Food' },
                { kind: 'camp', label: 'Timber House', color: '#fbbf24', bonusDesc: '+Forage Yield' },
                { kind: 'granary', label: 'Farm Granary', color: '#4ade80', bonusDesc: '+Soil Fertility' },
                { kind: 'mine', label: 'Ore Mine Shaft', color: '#94a3b8', bonusDesc: '+Mining Ore' },
                { kind: 'industry', label: 'Brick Foundry', color: '#f97316', bonusDesc: '+Industry Output' },
                { kind: 'tower', label: 'Watchtower', color: '#38bdf8', bonusDesc: '+Threat Radar' },
                { kind: 'beacon', label: 'Research Lab', color: '#c084fc', bonusDesc: '+ANN XP' }
            ];

            const SCENARIO_PRESETS = {
                ice_age: {
                    label: "Ice Age Chill",
                    eraIdx: 5,
                    tempShift: -12,
                    foodRate: 4,
                    mutationRate: 0.42,
                    burnRate: 1.35,
                    weather: "mist",
                    timeOfDay: 7.2,
                    narration: "Glacial chill sweeps the voxel archipelago: predators stalk mist-shrouded ridges while burrowers adapt."
                },
                heatwave: {
                    label: "Heatwave Drought",
                    eraIdx: 0,
                    tempShift: 13,
                    foodRate: 3,
                    mutationRate: 0.35,
                    burnRate: 1.45,
                    weather: "clear",
                    timeOfDay: 14.5,
                    narration: "Scorching aridity tests hydration reserves: organisms converge around fresh mineral springs."
                },
                cambrian_boom: {
                    label: "Cambrian Boom",
                    eraIdx: 3,
                    tempShift: 2,
                    foodRate: 9,
                    mutationRate: 0.52,
                    burnRate: 0.9,
                    weather: "rain",
                    timeOfDay: 11.0,
                    narration: "Nutrient surge & elevated mutation spark rapid diversification across reefs, canopies, and meadows."
                },
                stone_to_iron: {
                    label: "Stone-to-Iron Village",
                    eraIdx: 6,
                    tempShift: 1,
                    foodRate: 8,
                    mutationRate: 0.25,
                    burnRate: 0.95,
                    weather: "clear",
                    timeOfDay: 18.8,
                    narration: "Human commanders assign tasks and raise Minecraft-textured shelters across fertile island terraces."
                },
                people_revolution: {
                    label: "People's Revolution",
                    eraIdx: 6,
                    tempShift: 3,
                    foodRate: 6,
                    mutationRate: 0.45,
                    burnRate: 1.15,
                    weather: "storm",
                    timeOfDay: 20.4,
                    narration: "Revolutionary Humans rally nearby organisms, seize strongholds, and transform colony governance!"
                }
            };

            const params = { tempShift: 0, foodRate: 6, mutationRate: 0.30, burnRate: 1.0 };
            const camera = { x: -1950, y: -1550, zoom: 0.85, isDragging: false, hasMoved: false, dragStartX: 0, dragStartY: 0, lastPointerX: 0, lastPointerY: 0 };
            let hoveredCreature = null;

            const fpvCam = {
                active: false,
                pos: new THREE.Vector3(),
                lookAt: new THREE.Vector3(),
                yawOffset: 0,
                pitchOffset: 0,
                rollAngle: 0,
                prevHeading: 0,
                bobPhase: 0,
                isDraggingLook: false,
                lastLookX: 0,
                lastLookY: 0,
                recenterTimer: 0,
                transitionMix: 0,
                keysDown: new Set()
            };

            const audioEngine = {
                ctx: null,
                masterGain: null,
                ambienceGain: null,
                enabled: false,
                toggle() {
                    try {
                        if (!this.ctx) {
                            const AudioCtx = window.AudioContext || window.webkitAudioContext;
                            if (!AudioCtx) return false;
                            this.ctx = new AudioCtx();
                            this.masterGain = this.ctx.createGain();
                            this.masterGain.gain.value = 0.24;
                            this.masterGain.connect(this.ctx.destination);

                            const bufLen = this.ctx.sampleRate * 2;
                            const buffer = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
                            const data = buffer.getChannelData(0);
                            for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
                            const noise = this.ctx.createBufferSource();
                            noise.buffer = buffer;
                            noise.loop = true;

                            const filter = this.ctx.createBiquadFilter();
                            filter.type = 'lowpass';
                            filter.frequency.value = 260;

                            this.ambienceGain = this.ctx.createGain();
                            this.ambienceGain.gain.value = 0.12;

                            noise.connect(filter);
                            filter.connect(this.ambienceGain);
                            this.ambienceGain.connect(this.masterGain);
                            noise.start();
                        }
                        if (this.ctx.state === 'suspended') this.ctx.resume();
                        this.enabled = !this.enabled;
                        this.masterGain.gain.setTargetAtTime(this.enabled ? 0.24 : 0.0, this.ctx.currentTime, 0.08);
                        const lbl = document.getElementById('hudAudioLabel');
                        if (lbl) lbl.textContent = this.enabled ? 'Audio: ON' : 'Audio: OFF';
                        if (this.enabled) this.playChime(523.25, 0.14);
                        return this.enabled;
                    } catch (e) {
                        return false;
                    }
                },
                playChime(freq = 587.33, duration = 0.18, type = 'sine') {
                    if (!this.enabled || !this.ctx || !this.masterGain) return;
                    try {
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = type;
                        osc.frequency.setValueAtTime(freq, now);
                        osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + duration);
                        gain.gain.setValueAtTime(0.001, now);
                        gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
                        osc.connect(gain);
                        gain.connect(this.masterGain);
                        osc.start(now);
                        osc.stop(now + duration + 0.02);
                    } catch (e) { }
                },
                playPulse(freq = 130, duration = 0.35) {
                    if (!this.enabled || !this.ctx || !this.masterGain) return;
                    try {
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);
                        osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + duration);
                        gain.gain.setValueAtTime(0.18, now);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
                        osc.connect(gain);
                        gain.connect(this.masterGain);
                        osc.start(now);
                        osc.stop(now + duration + 0.02);
                    } catch (e) { }
                }
            };

            let worldSeed = 2026.88;
            let is3DView = true;
            let isExhibitionMode = false;
            let showSensoryOverlay = true;
            let isPaused = false;
            let speedMultiplier = 1;
            let clickMode = 'inspect';
            let chartFilter = 'all';
            let showThoughtBubbles = true;
            let showAtmosphereClouds = true;
            let showZoneLabels = true;
            let currentEraIndex = 0;
            let timeOfDay = 11.5;
            let currentWeather = 'clear';
            let weatherTimer = 0;
            let lightningFlash = 0;
            let activeLightningBolt = null;
            let soilFertility = 1.0;
            let seasonalCyclePhase = 0;
            let tideOffset = 0;
            let compareCreature = null;
            let sustainedAll25ThroughEvent = false;
            let revolutionCount = 0;
            let tasksIssuedTotal = 0;
            let currentRegimeIndex = 0;
            let oreStock = 0;
            let industryOutput = 0;
            let fireCount = 0;
            const revolutionWaves = [];
            const commandBeams = [];
            const matingPulses = [];
            let colonies = [];
            let oreVeins = [];
            let tradeBoats = [];
            let wildfires = [];
            const COLONY_LEVELS = ["Camp", "Hamlet", "Town", "City-State", "Grand Civilization"];
            const COLONY_NAMES = ["Solstice", "Oakhaven", "Basalt", "Aurelia", "Verdant", "Caspian", "Harbor"];

            const raindrops = Array.from({ length: 140 }, () => ({
                x: Math.random() * 1920,
                y: Math.random() * 1080,
                len: 10 + Math.random() * 14,
                spd: 11 + Math.random() * 7
            }));
            let eraProgress = 0;
            let simTick = 0;
            let renderFrame = 0;
            let maxGeneration = 1;
            let totalSpawnCounter = 0;
            let selectedCreature = null;
            let followSelected = false;
            let isFpvMode = false;
            let isModalOpen = false;
            let collectiveKnowledgeXP = 0;
            let culturalStageIndex = 0;
            let builtStructures = [];
            let savedCheckpoint = null;
            let undoCheckpoint = null;
            let milestones = [];

            let latticeYaw = 0.4;
            let latticePitch = 0.28;
            let draggingLattice = false;
            let latticeLastX = 0;
            let latticeLastY = 0;

            const DISCOVERIES = [
                "Flint Spark", "Woven Shelter", "Orchard Mapping",
                "Stone Tool", "Timber House", "Terrace Wall", "Bio-Beacon"
            ];

            const ISLAND_ARCHIPELAGO = [
                { id: 'hadean', name: '1. Hadean Caldera Isle', x: -1950, y: -1550, radius: 860, color: '#fb923c', topTint: '#7a4b38', midTint: '#4a2c22', migrationNext: 1 },
                { id: 'archean', name: '2. Archean Lagoon Atoll', x: 0, y: -2000, radius: 880, color: '#34d399', topTint: '#658540', midTint: '#3e4726', migrationNext: 2 },
                { id: 'proterozoic', name: '3. Proterozoic Reef Isle', x: 1950, y: -1550, radius: 880, color: '#38bdf8', topTint: '#669448', midTint: '#3b572d', migrationNext: 4 },
                { id: 'cambrian', name: '4. Cambrian Trilobite Key', x: -2100, y: 620, radius: 900, color: '#10b981', topTint: '#719e43', midTint: '#3d5c29', migrationNext: 0 },
                { id: 'carboniferous', name: '5. Carboniferous Canopy Isle', x: 2100, y: 620, radius: 920, color: '#4ade80', topTint: '#599e3c', midTint: '#2f5924', migrationNext: 6 },
                { id: 'cretaceous', name: '6. Cretaceous Impact Craton', x: -950, y: 2050, radius: 860, color: '#fb7185', topTint: '#7a634b', midTint: '#473628', migrationNext: 3 },
                { id: 'sanctuary', name: '7. Living Biosphere Sanctuary', x: 220, y: 180, radius: 1080, color: '#2dd4bf', topTint: '#78ad40', midTint: '#3d632c', migrationNext: 5 }
            ];

            const EARTH_ERAS = [
                { name: "Hadean Caldera Isle", years: "4.6-4.0 BYA", subtitle: "Volcanic basalt caldera, steaming mineral pools & early extremophiles", eventName: "Volcanic Surge", oceanColor: "#04111a", atmosphereTint: "rgba(251, 146, 60, 0.08)", nutrientBoost: 0.85, mutationBoost: 1.4, allowedSpecies: ["woodlouse", "earthworm", "nautilus", "moonjelly", "human"] },
                { name: "Archean Lagoon Atoll", years: "4.0-2.5 BYA", subtitle: "Coastal microbial mats & shallow warm lagoons emerge", eventName: "Hydrothermal Bloom", oceanColor: "#041924", atmosphereTint: "rgba(52, 211, 153, 0.05)", nutrientBoost: 1.1, mutationBoost: 1.2, allowedSpecies: ["woodlouse", "earthworm", "clownfish", "moonjelly", "nautilus", "human"] },
                { name: "Proterozoic Reef Isle", years: "2.5 BYA-541 MYA", subtitle: "Oxygenation clears the sky and expands coastal coral shelves", eventName: "Great Oxidation", oceanColor: "#041e2c", atmosphereTint: "rgba(56, 189, 248, 0.06)", nutrientBoost: 1.2, mutationBoost: 1.1, allowedSpecies: ["capybara", "woodlouse", "clownfish", "moonjelly", "mantaray", "nautilus", "human"] },
                { name: "Cambrian Trilobite Key", years: "541-485 MYA", subtitle: "Complex sensory organs, armored burrowers & reef predators", eventName: "Cambrian Radiation", oceanColor: "#042233", atmosphereTint: "rgba(16, 185, 129, 0.06)", nutrientBoost: 1.35, mutationBoost: 1.25, allowedSpecies: ["capybara", "armadillo", "clownfish", "moonjelly", "mantaray", "nautilus", "jaguar", "human"] },
                { name: "Carboniferous Canopy Isle", years: "359-299 MYA", subtitle: "Lush forest groves, canopy gliders & rich orchard humus", eventName: "Forest Canopy Bloom", oceanColor: "#042436", atmosphereTint: "rgba(125, 211, 252, 0.06)", nutrientBoost: 1.55, mutationBoost: 1.0, allowedSpecies: ["capybara", "reddeer", "honeybee", "hummingbird", "flyingsquirrel", "jaguar", "seaotter", "mantaray", "human"] },
                { name: "Cretaceous Impact Craton", years: "66 MYA", subtitle: "Asteroid shockwave tests resilience across land, sea & sky", eventName: "Asteroid Shockwave", oceanColor: "#061522", atmosphereTint: "rgba(244, 63, 94, 0.09)", nutrientBoost: 0.75, mutationBoost: 1.45, allowedSpecies: ["molerat", "armadillo", "woodlouse", "nautilus", "albatross", "snowleopard", "human"] },
                { name: "Living Biosphere Sanctuary", years: "Present-Future", subtitle: "Humans & all 25 species thriving across voxel orchards, springs & reefs", eventName: "Seasonal Fruit Harvest", oceanColor: "#031522", atmosphereTint: "rgba(45, 212, 191, 0.03)", nutrientBoost: 1.35, mutationBoost: 1.0, allowedSpecies: null }
            ];

            const SPECIES_CONFIG = {
                human: { name: "Human (Homo sapiens)", sphere: "LITHOSPHERE", diet: "OMNIVORE / COMMANDER", color: "#fde047", bodyHex: "#f5c28b", accentHex: "#0ea5e9", hueRange: [28, 36], baseSpeed: 2.15, baseVision: 225, baseSize: 10.4, defense: "TOOLS & REVOLUTION", ecology: "Thinking ANN commander assigning tasks to peers, building voxel villages & sparking revolutions" },
                capybara: { name: "Capybara", sphere: "LITHOSPHERE", diet: "FRUGIVORE / GRAZER", color: "#fbbf24", bodyHex: "#b47b44", accentHex: "#f59e0b", hueRange: [28, 38], baseSpeed: 1.85, baseVision: 165, baseSize: 9.8, defense: "GROUP DEFENCE", ecology: "Social meadow grazer & spring swimmer fostering calm colony rings" },
                reddeer: { name: "Red Deer", sphere: "LITHOSPHERE", diet: "HERBIVORE BROWSER", color: "#f97316", bodyHex: "#c25929", accentHex: "#fde68a", hueRange: [18, 28], baseSpeed: 2.25, baseVision: 180, baseSize: 10.4, defense: "AGILE LEAP", ecology: "Browses upper island terraces & alerts herds to predators" },
                bison: { name: "Wild Bison", sphere: "LITHOSPHERE", diet: "HERD GRAZER", color: "#d97706", bodyHex: "#6d3b1e", accentHex: "#fbbf24", hueRange: [20, 30], baseSpeed: 1.75, baseVision: 155, baseSize: 11.6, defense: "HERD WALL", ecology: "Heavy grassland grazer shaping open meadow corridors" },
                jaguar: { name: "Jaguar", sphere: "LITHOSPHERE", diet: "APEX CARNIVORE", color: "#fb7185", bodyHex: "#f59e0b", accentHex: "#9f1239", hueRange: [36, 44], baseSpeed: 2.55, baseVision: 195, baseSize: 10.8, defense: "AMBUSH", ecology: "Apex forest-edge predator regulating herbivore balance" },
                snowleopard: { name: "Snow Leopard", sphere: "LITHOSPHERE", diet: "HIGHLAND PREDATOR", color: "#e2e8f0", bodyHex: "#cbd5e1", accentHex: "#64748b", hueRange: [200, 215], baseSpeed: 2.5, baseVision: 205, baseSize: 10.3, defense: "STEALTH", ecology: "Stalks rocky highland terraces with wide sensory range" },
                woodlouse: { name: "Woodlouse", sphere: "LITHOSPHERE", diet: "DETRITIVORE", color: "#fb923c", bodyHex: "#9a5b3c", accentHex: "#fdba74", hueRange: [20, 32], baseSpeed: 1.4, baseVision: 125, baseSize: 8.4, defense: "CARAPACE", ecology: "Recycles fallen timber & leaf litter into fertile topsoil" },
                earthworm: { name: "Earthworm", sphere: "LITHOSPHERE", diet: "SOIL AERATOR", color: "#f43f5e", bodyHex: "#fb7185", accentHex: "#fda4af", hueRange: [345, 358], baseSpeed: 1.25, baseVision: 115, baseSize: 8.2, defense: "BURROWING", ecology: "Aerates orchard humus & accelerates root nutrient cycling" },
                armadillo: { name: "Armadillo", sphere: "LITHOSPHERE", diet: "INSECTIVORE", color: "#eab308", bodyHex: "#ca8a04", accentHex: "#fef08a", hueRange: [40, 50], baseSpeed: 1.65, baseVision: 140, baseSize: 9.2, defense: "ARMOUR SHELL", ecology: "Armored burrower foraging grubs & fallen orchard fruit" },
                pangolin: { name: "Pangolin", sphere: "LITHOSPHERE", diet: "MYRMECOPHAGE", color: "#a16207", bodyHex: "#b45309", accentHex: "#fcd34d", hueRange: [26, 36], baseSpeed: 1.6, baseVision: 145, baseSize: 9.1, defense: "SCALE CURL", ecology: "Scales protect against predators while foraging forest floors" },
                molerat: { name: "Mole Rat", sphere: "LITHOSPHERE", diet: "SUBTERRANEAN", color: "#d6d3d1", bodyHex: "#e7b8a8", accentHex: "#a8a29e", hueRange: [12, 22], baseSpeed: 1.5, baseVision: 120, baseSize: 8.3, defense: "TUNNEL NETWORK", ecology: "Eusocial burrower thriving in cooperative underground colonies" },
                honeybee: { name: "Honeybee", sphere: "ATMOSPHERE", diet: "POLLINATOR", color: "#facc15", bodyHex: "#eab308", accentHex: "#67e8f9", hueRange: [46, 56], baseSpeed: 2.55, baseVision: 185, baseSize: 8.0, defense: "SWARM SIGNAL", ecology: "Pollinates orchard blossoms & shares vector dances with hive" },
                hummingbird: { name: "Hummingbird", sphere: "ATMOSPHERE", diet: "NECTARIVORE", color: "#2dd4bf", bodyHex: "#10b981", accentHex: "#f43f5e", hueRange: [155, 175], baseSpeed: 2.85, baseVision: 190, baseSize: 7.8, defense: "DART FLIGHT", ecology: "High-metabolism canopy pollinator darting between fruit groves" },
                albatross: { name: "Albatross", sphere: "ATMOSPHERE", diet: "PELAGIC SOARER", color: "#bae6fd", bodyHex: "#f8fafc", accentHex: "#38bdf8", hueRange: [195, 212], baseSpeed: 2.7, baseVision: 225, baseSize: 10.2, defense: "THERMAL GLIDE", ecology: "Soars across all 7 islands tracking ocean currents & migratory corridors" },
                falcon: { name: "Peregrine Falcon", sphere: "ATMOSPHERE", diet: "AERIAL RAPTOR", color: "#ef4444", bodyHex: "#dc2626", accentHex: "#fde047", hueRange: [350, 360], baseSpeed: 3.05, baseVision: 230, baseSize: 9.6, defense: "STOOP DIVE", ecology: "High-speed aerial hunter patrolling island skies" },
                flyingsquirrel: { name: "Flying Squirrel", sphere: "ATMOSPHERE", diet: "CANOPY GLIDER", color: "#38bdf8", bodyHex: "#a16207", accentHex: "#7dd3fc", hueRange: [188, 204], baseSpeed: 2.35, baseVision: 175, baseSize: 8.6, defense: "PATAGIUM GLIDE", ecology: "Glides between orchard tree crowns dispersing nuts & seeds" },
                clownfish: { name: "Clownfish", sphere: "OCEAN", diet: "REEF OMNIVORE", color: "#fb923c", bodyHex: "#f97316", accentHex: "#ffffff", hueRange: [18, 28], baseSpeed: 2.2, baseVision: 155, baseSize: 8.4, defense: "ANEMONE BOND", ecology: "Symbiotic coral-shelf swimmer guarding shallow reef nurseries" },
                moonjelly: { name: "Moon Jelly", sphere: "OCEAN", diet: "FILTER FEEDER", color: "#c084fc", bodyHex: "#a855f7", accentHex: "#f0abfc", hueRange: [268, 292], baseSpeed: 1.35, baseVision: 145, baseSize: 9.5, defense: "BIO-PULSE", ecology: "Drifts along coastal lagoons & tidal corridors filtering plankton blooms" },
                seaotter: { name: "Sea Otter", sphere: "OCEAN", diet: "TOOL FORAGER", color: "#14b8a6", bodyHex: "#784c31", accentHex: "#2dd4bf", hueRange: [172, 188], baseSpeed: 2.3, baseVision: 175, baseSize: 9.6, defense: "STONE TOOL", ecology: "Uses stones to crack shells & preserves coastal kelp forests" },
                mantaray: { name: "Manta Ray", sphere: "OCEAN", diet: "PELAGIC FILTER", color: "#818cf8", bodyHex: "#4f46e5", accentHex: "#67e8f9", hueRange: [222, 242], baseSpeed: 2.4, baseVision: 195, baseSize: 11.4, defense: "WING SWEEP", ecology: "Graceful ocean glider migrating between island reef shelves" },
                seaturtle: { name: "Sea Turtle", sphere: "OCEAN", diet: "REEF GRAZER", color: "#10b981", bodyHex: "#059669", accentHex: "#fde047", hueRange: [145, 165], baseSpeed: 1.85, baseVision: 175, baseSize: 10.4, defense: "CARAPACE SHELL", ecology: "Glides across shallow coral shelves & migratory currents" },
                dolphin: { name: "Dolphin", sphere: "OCEAN", diet: "POD HUNTER", color: "#38bdf8", bodyHex: "#0ea5e9", accentHex: "#e0f2fe", hueRange: [195, 212], baseSpeed: 2.85, baseVision: 215, baseSize: 10.8, defense: "POD SONAR", ecology: "Fast social swimmer coordinating pod patrols between all 7 islands" },
                octopus: { name: "Reef Octopus", sphere: "OCEAN", diet: "BENTHIC FORAGER", color: "#fb7185", bodyHex: "#e11d48", accentHex: "#fcd34d", hueRange: [338, 355], baseSpeed: 1.95, baseVision: 185, baseSize: 9.8, defense: "INK & CAMO", ecology: "Clever 6-armed reef explorer adapting camouflage to coastal rocks" },
                whale: { name: "Blue Whale", sphere: "OCEAN", diet: "PELAGIC FILTER", color: "#6366f1", bodyHex: "#3b82f6", accentHex: "#bae6fd", hueRange: [215, 232], baseSpeed: 1.65, baseVision: 230, baseSize: 15.0, defense: "LEVIATHAN", ecology: "Gentle ocean giant filtering plankton across deep inter-island channels" },
                nautilus: { name: "Nautilus", sphere: "OCEAN", diet: "DEEP SCAVENGER", color: "#e879f9", bodyHex: "#f472b6", accentHex: "#fef08a", hueRange: [295, 320], baseSpeed: 1.55, baseVision: 150, baseSize: 9.2, defense: "CHAMBER SHELL", ecology: "Ancient chambered cephalopod navigating deep inter-island channels" }
            };

            const SPECIES_KEYS = Object.keys(SPECIES_CONFIG);
            EARTH_ERAS[6].allowedSpecies = SPECIES_KEYS;

            const INDIVIDUAL_NAMES = [
                "Aurelia", "Bramble", "Caspian", "Dahlia", "Ember", "Fjord", "Gaia", "Harbor",
                "Indigo", "Juniper", "Kestrel", "Lichen", "Mariner", "Nimbus", "Oakhaven", "Pebble",
                "Quartz", "Ripple", "Solstice", "Tidepool", "Umber", "Verdant", "Willow", "Zephyr",
                "Acorn", "Basalt", "Clover", "Driftwood", "Estuary", "Fern", "Glacier", "Hazel"
            ];
            let nameCursor = 0;
            const PATTERNS = ["Striped", "Spotted", "Core-Ring", "Dorsal-Fin", "Bioluminescent"];
            const spawnedGenomeSignatures = new Set();

            let creatures = [];
            let nutrients = [];
            let springs = [];
            const telemetryHistory = [];
            const eventMarkers = [];
            let researchBaseline = null;
            let researchObservations = [];

            // =========================================================================
            // SECTION 2: TERRAIN, CHRONICLE & NEURAL BRAIN ARCHITECTURE
            // =========================================================================
            function addChronicleEntry(text, accent) {
                const list = document.getElementById('chronicleList');
                const badge = document.getElementById('chronicleTickBadge');
                if (badge) badge.textContent = 'Tick ' + simTick;
                if (!list) return;
                const li = document.createElement('li');
                li.className = accent || 'text-slate-300';
                li.textContent = '[' + simTick + '] ' + text;
                list.prepend(li);
                while (list.children.length > 20) list.removeChild(list.lastChild);
            }

            function recordEventMarker(label, color = '#fbbf24') {
                eventMarkers.push({ tick: simTick, label, color });
                if (eventMarkers.length > 40) eventMarkers.shift();
                const el = document.getElementById('chartEventMarkerCount');
                if (el) el.textContent = `Markers: ${eventMarkers.length} (${label})`;
            }

            function getNearestIsland(x, y) {
                let best = ISLAND_ARCHIPELAGO[6];
                let bestNorm = Infinity;
                for (const isl of ISLAND_ARCHIPELAGO) {
                    const norm = Math.hypot(x - isl.x, y - isl.y) / isl.radius;
                    if (norm < bestNorm) { bestNorm = norm; best = isl; }
                }
                return { island: best, normDist: bestNorm };
            }

            function getWorldElevation(x, y) {
                const { island, normDist } = getNearestIsland(x, y);
                const islandMask = 1.0 - Math.pow(Math.max(0, normDist / 0.92), 3.0);
                const s = worldSeed * 0.01;
                const n1 = Math.sin(x * 0.0022 + s) * Math.cos(y * 0.0022 - s);
                const n2 = Math.sin((x + y) * 0.0038 - s * 1.4) * 0.3;
                const raw = islandMask * 0.85 + (n1 + n2) * 0.18 - tideOffset * 0.05;
                const distPond = Math.hypot(x - (island.x + 70), y - (island.y + 140));
                if (distPond < 175) return -0.18;
                return Math.max(-1, Math.min(1, raw));
            }

            function getTerraceStep(elev) {
                if (elev < -0.05) return -1;
                if (elev < 0.08) return 0;
                if (elev < 0.34) return 1;
                if (elev < 0.62) return 2;
                return 3;
            }

            function terraceHeightY(elev) {
                const step = getTerraceStep(elev);
                if (step === -1) return -22;
                if (step === 0) return -6;
                if (step === 1) return 14;
                if (step === 2) return 34;
                return 54;
            }

            function getTerrainSphereAt(x, y) {
                return getWorldElevation(x, y) > 0.05 ? "LITHOSPHERE" : "OCEAN";
            }

            function clampWorldCoordinate(value) {
                return Number.isFinite(value) ? value : 0;
            }

            function clampCameraToWorld() {
                // Open world panning
            }

            function normalizeAngle(a) {
                return Math.atan2(Math.sin(a), Math.cos(a));
            }

            class NeuralBrain {
                constructor(weights = null, isCognitive = false, isHuman = false, humanStage = 0) {
                    this.isCognitive = isCognitive;
                    this.isHuman = isHuman;
                    this.humanStage = humanStage;
                    this.learningUpdates = 0;
                    this.isNeataptic = Boolean(isHuman && typeof window.neataptic !== 'undefined');

                    if (isHuman) {
                        const st = HUMAN_ANN_STAGES[Math.min(4, Math.max(0, humanStage))];
                        this.inSize = st.inSize;
                        this.hidSize = st.hidSize;
                        this.outSize = st.outSize;
                    } else {
                        this.inSize = isCognitive ? 8 : 5;
                        this.hidSize = isCognitive ? 10 : 6;
                        this.outSize = isCognitive ? 3 : 2;
                    }

                    this.lastInputs = new Array(this.inSize).fill(0);
                    this.lastHidden = new Array(this.hidSize).fill(0);
                    this.lastOutputs = new Array(this.outSize).fill(0);
                    this.memoryState = 0;

                    if (this.isNeataptic) {
                        if (weights && weights.neatJSON) {
                            this.net = window.neataptic.Network.fromJSON(weights.neatJSON);
                            this.learningUpdates = weights.learningUpdates || 0;
                        } else if (humanStage === 0) {
                            this.net = new window.neataptic.Network(2, 2);
                            this.net.connections.forEach((c) => { c.weight = (Math.random() * 2 - 1) * 0.08; });
                        } else {
                            this.net = new window.neataptic.architect.Perceptron(this.inSize, this.hidSize, this.outSize);
                        }
                        this.syncNeatapticStats();
                        return;
                    }

                    if (weights && weights.w1 && weights.w1.length === this.hidSize && weights.w1[0].length === this.inSize) {
                        this.w1 = weights.w1.map(r => [...r]);
                        this.b1 = [...weights.b1];
                        this.w2 = weights.w2.map(r => [...r]);
                        this.b2 = [...weights.b2];
                        this.learningUpdates = weights.learningUpdates || 0;
                    } else if (isHuman && humanStage === 0) {
                        this.w1 = Array.from({ length: this.hidSize }, () => Array.from({ length: this.inSize }, () => (Math.random() * 2 - 1) * 0.06));
                        this.b1 = Array.from({ length: this.hidSize }, () => 0);
                        this.w2 = Array.from({ length: this.outSize }, () => Array.from({ length: this.hidSize }, () => (Math.random() * 2 - 1) * 0.06));
                        this.b2 = Array.from({ length: this.outSize }, () => 0);
                    } else {
                        this.w1 = Array.from({ length: this.hidSize }, () => Array.from({ length: this.inSize }, () => (Math.random() * 2 - 1) * 1.1));
                        this.b1 = Array.from({ length: this.hidSize }, () => (Math.random() * 2 - 1) * 0.3);
                        this.w2 = Array.from({ length: this.outSize }, () => Array.from({ length: this.hidSize }, () => (Math.random() * 2 - 1) * 1.1));
                        this.b2 = Array.from({ length: this.outSize }, () => (Math.random() * 2 - 1) * 0.25);
                    }
                }

                syncNeatapticStats() {
                    if (!this.isNeataptic || !this.net) return;
                    const hidNodes = this.net.nodes.filter(n => n.type === 'hidden');
                    this.hidSize = hidNodes.length;
                    this.inSize = this.net.input;
                    this.outSize = this.net.output;
                }

                mutateStructural(kind) {
                    if (this.isNeataptic && this.net) {
                        try {
                            const mut = window.neataptic.methods.mutation;
                            if (kind === 'ADD_NODE') this.net.mutate(mut.ADD_NODE);
                            else if (kind === 'ADD_CONN') this.net.mutate(mut.ADD_CONN);
                            else this.net.mutate(mut.MOD_WEIGHT);
                            this.syncNeatapticStats();
                            this.lastHidden = new Array(this.hidSize).fill(0);
                            return true;
                        } catch (e) { }
                    }
                    if (kind === 'ADD_NODE' && this.hidSize < 16) {
                        this.hidSize++;
                        this.w1.push(Array.from({ length: this.inSize }, () => (Math.random() * 2 - 1) * 0.9));
                        this.b1.push((Math.random() * 2 - 1) * 0.25);
                        for (let o = 0; o < this.outSize; o++) {
                            this.w2[o].push((Math.random() * 2 - 1) * 0.9);
                        }
                        this.lastHidden.push(0);
                        return true;
                    }
                    if (kind === 'ADD_CONN') {
                        const h = Math.floor(Math.random() * this.hidSize);
                        const i = Math.floor(Math.random() * this.inSize);
                        this.w1[h][i] = Math.max(-2.2, Math.min(2.2, this.w1[h][i] + (Math.random() * 2 - 1) * 0.6));
                        return true;
                    }
                    return false;
                }

                evolveTopology(newStage) {
                    const st = HUMAN_ANN_STAGES[Math.min(4, Math.max(0, newStage))];
                    this.humanStage = newStage;

                    if (this.isNeataptic && this.net) {
                        const mut = window.neataptic.methods.mutation;
                        const prevJSON = this.net.toJSON();
                        const grown = new window.neataptic.architect.Perceptron(st.inSize, st.hidSize, st.outSize);
                        for (let i = 0; i < Math.min(prevJSON.connections.length, grown.connections.length); i++) {
                            grown.connections[i].weight = prevJSON.connections[i].weight;
                        }
                        this.net = grown;
                        try {
                            this.net.mutate(mut.ADD_NODE);
                            this.net.mutate(mut.ADD_CONN);
                        } catch (e) { }
                        this.syncNeatapticStats();
                        this.lastInputs = new Array(this.inSize).fill(0);
                        this.lastHidden = new Array(this.hidSize).fill(0);
                        this.lastOutputs = new Array(this.outSize).fill(0);
                        return;
                    }

                    if (st.inSize <= this.inSize && st.hidSize <= this.hidSize && st.outSize <= this.outSize) return;
                    const newW1 = Array.from({ length: st.hidSize }, (_, h) =>
                        Array.from({ length: st.inSize }, (_, i) => (h < this.hidSize && i < this.inSize) ? this.w1[h][i] : (Math.random() * 2 - 1) * 0.35)
                    );
                    const newB1 = Array.from({ length: st.hidSize }, (_, h) => h < this.hidSize ? this.b1[h] : (Math.random() * 2 - 1) * 0.15);
                    const newW2 = Array.from({ length: st.outSize }, (_, o) =>
                        Array.from({ length: st.hidSize }, (_, h) => (o < this.outSize && h < this.hidSize) ? this.w2[o][h] : (Math.random() * 2 - 1) * 0.35)
                    );
                    const newB2 = Array.from({ length: st.outSize }, (_, o) => o < this.outSize ? this.b2[o] : (Math.random() * 2 - 1) * 0.15);
                    this.inSize = st.inSize;
                    this.hidSize = st.hidSize;
                    this.outSize = st.outSize;
                    this.w1 = newW1; this.b1 = newB1; this.w2 = newW2; this.b2 = newB2;
                    this.lastInputs = new Array(this.inSize).fill(0);
                    this.lastHidden = new Array(this.hidSize).fill(0);
                    this.lastOutputs = new Array(this.outSize).fill(0);
                }

                reinforce(reward) {
                    if (this.isNeataptic && this.net) {
                        const target = this.lastOutputs.map((v, idx) => {
                            return Math.max(0.05, Math.min(0.95, (v + 1) * 0.5 + reward * 0.18 * (idx === 1 ? 1 : 0.4)));
                        });
                        try {
                            this.net.train([{ input: this.lastInputs.map(x => Math.max(0, Math.min(1, (x + 1) * 0.5))), output: target }], {
                                iterations: 1,
                                rate: 0.18,
                                error: 0.001
                            });
                            if (Math.random() < 0.12) this.net.mutate(window.neataptic.methods.mutation.MOD_WEIGHT);
                        } catch (e) { }
                        this.learningUpdates++;
                        return;
                    }

                    const lr = 0.045 * Math.max(-1, Math.min(1, reward));
                    for (let h = 0; h < this.hidSize; h++) {
                        for (let i = 0; i < this.inSize; i++) {
                            const delta = lr * (this.lastInputs[i] || 0) * (this.lastHidden[h] || 0);
                            this.w1[h][i] = Math.max(-2.2, Math.min(2.2, this.w1[h][i] + delta));
                        }
                    }
                    for (let o = 0; o < this.outSize; o++) {
                        for (let h = 0; h < this.hidSize; h++) {
                            const delta = lr * (this.lastHidden[h] || 0) * (this.lastOutputs[o] || 0.1);
                            this.w2[o][h] = Math.max(-2.2, Math.min(2.2, this.w2[o][h] + delta));
                        }
                    }
                    this.learningUpdates++;
                }

                absorbMemeticCulture(peerBrain, blend = 0.16) {
                    if (!peerBrain) return;
                    if (this.isNeataptic && this.net && peerBrain.isNeataptic && peerBrain.net) {
                        try {
                            const myJson = this.net.toJSON();
                            const peerJson = peerBrain.net.toJSON();
                            const n = Math.min(myJson.connections.length, peerJson.connections.length);
                            for (let i = 0; i < n; i++) {
                                myJson.connections[i].weight = myJson.connections[i].weight * (1 - blend) + peerJson.connections[i].weight * blend;
                            }
                            this.net = window.neataptic.Network.fromJSON(myJson);
                            this.syncNeatapticStats();
                            this.learningUpdates++;
                            return;
                        } catch (e) { }
                    }
                    if (this.w1 && peerBrain.w1 && this.w1.length === peerBrain.w1.length && this.w1[0].length === peerBrain.w1[0].length) {
                        for (let h = 0; h < this.hidSize; h++) {
                            this.b1[h] = this.b1[h] * (1 - blend) + peerBrain.b1[h] * blend;
                            for (let i = 0; i < this.inSize; i++) {
                                this.w1[h][i] = this.w1[h][i] * (1 - blend) + peerBrain.w1[h][i] * blend;
                            }
                        }
                        for (let o = 0; o < this.outSize; o++) {
                            if (o < peerBrain.outSize) {
                                this.b2[o] = this.b2[o] * (1 - blend) + peerBrain.b2[o] * blend;
                                for (let h = 0; h < this.hidSize; h++) {
                                    if (h < peerBrain.hidSize) {
                                        this.w2[o][h] = this.w2[o][h] * (1 - blend) + peerBrain.w2[o][h] * blend;
                                    }
                                }
                            }
                        }
                        this.learningUpdates++;
                    }
                }

                forward(inputs) {
                    const padded = Array.from({ length: this.inSize }, (_, i) => Number(inputs[i]) || 0);
                    this.lastInputs = padded;

                    if (this.isNeataptic && this.net) {
                        const normIn = padded.map(v => Math.max(0, Math.min(1, (v + 1) * 0.5)));
                        const rawOut = this.net.activate(normIn);
                        const outputs = rawOut.map(v => Number.isFinite(v) ? (v * 2 - 1) : 0);
                        this.lastOutputs = outputs;
                        this.lastHidden = this.net.nodes.filter(n => n.type === 'hidden').map(n => n.activation * 2 - 1);
                        this.memoryState = this.memoryState * 0.85 + (outputs[2] || 0) * 0.15;
                        return outputs;
                    }

                    const hidden = new Array(this.hidSize);
                    for (let h = 0; h < this.hidSize; h++) {
                        let sum = this.b1[h];
                        for (let i = 0; i < this.inSize; i++) sum += padded[i] * this.w1[h][i];
                        hidden[h] = Math.tanh(sum);
                    }
                    this.lastHidden = hidden;
                    const outputs = new Array(this.outSize);
                    for (let o = 0; o < this.outSize; o++) {
                        let sum = this.b2[o];
                        for (let h = 0; h < this.hidSize; h++) sum += hidden[h] * this.w2[o][h];
                        outputs[o] = Math.tanh(sum);
                    }
                    this.lastOutputs = outputs;
                    if (this.isCognitive || this.isHuman) this.memoryState = this.memoryState * 0.85 + (outputs[2] || 0) * 0.15;
                    return outputs;
                }

                cloneAndMutate(rate, burst = false) {
                    const effRate = burst ? Math.min(0.95, rate * 1.85 + 0.25) : rate;
                    if (this.isNeataptic && this.net) {
                        const clone = new NeuralBrain({ neatJSON: this.net.toJSON(), learningUpdates: this.learningUpdates }, this.isCognitive, this.isHuman, this.humanStage);
                        try {
                            const mut = window.neataptic.methods.mutation;
                            if (Math.random() < effRate) clone.net.mutate(mut.MOD_WEIGHT);
                            if (Math.random() < effRate * 0.5) clone.net.mutate(mut.MOD_BIAS);
                            if ((this.humanStage >= 1 || burst) && Math.random() < effRate * (burst ? 0.75 : 0.35)) clone.net.mutate(mut.ADD_NODE);
                            if ((this.humanStage >= 1 || burst) && Math.random() < effRate * (burst ? 0.85 : 0.45)) clone.net.mutate(mut.ADD_CONN);
                            clone.syncNeatapticStats();
                        } catch (e) { }
                        return clone;
                    }

                    const m = (v) => (Math.random() < effRate ? v + (Math.random() * 2 - 1) * (burst ? 0.65 : 0.35) : v);
                    const brain = new NeuralBrain({
                        w1: this.w1.map(r => r.map(m)),
                        b1: this.b1.map(m),
                        w2: this.w2.map(r => r.map(m)),
                        b2: this.b2.map(m),
                        learningUpdates: this.learningUpdates
                    }, this.isCognitive, this.isHuman, this.humanStage);
                    if (burst && Math.random() < 0.65) {
                        brain.mutateStructural(Math.random() < 0.55 ? 'ADD_NODE' : 'ADD_CONN');
                    }
                    return brain;
                }
            }

            // =========================================================================
            // SECTION 3: HUMAN COMMANDER TASKS, REVOLUTIONS & ORGANISM SIMULATION
            // =========================================================================
            function getOrCreateColonyAt(x, y, founder = null) {
                const { island } = getNearestIsland(x, y);
                let col = colonies.find(cl => Math.hypot(cl.x - x, cl.y - y) < 420);
                if (!col) {
                    const idx = colonies.length;
                    const baseName = COLONY_NAMES[idx % COLONY_NAMES.length];
                    col = {
                        id: `COL-${idx + 1}`,
                        name: `${baseName} Colony`,
                        islandId: island.id,
                        x, y,
                        founder: founder ? founder.realName.split(' (')[0] : baseName,
                        levelIdx: 0,
                        xp: 10,
                        color: island.color
                    };
                    colonies.push(col);
                    addChronicleEntry(`${col.founder} founded ${col.name} on ${island.name}!`, 'text-teal-300');
                    showToast(`New Colony Founded: ${col.name}!`);
                }
                return col;
            }

            function updateColoniesAndTrade(dt) {
                for (const col of colonies) {
                    const citizens = creatures.filter(c => c.isHuman && Math.hypot(c.x - col.x, c.y - col.y) < 460).length;
                    const structs = builtStructures.filter(s => Math.hypot(s.x - col.x, s.y - col.y) < 460).length;
                    col.xp += (citizens * 0.015 + structs * 0.03) * dt;
                    const thresholds = [0, 35, 90, 180, 320];
                    let nextLvl = 0;
                    for (let i = thresholds.length - 1; i >= 0; i--) {
                        if (col.xp >= thresholds[i]) { nextLvl = i; break; }
                    }
                    if (nextLvl > col.levelIdx) {
                        col.levelIdx = nextLvl;
                        const lvlName = COLONY_LEVELS[nextLvl];
                        addChronicleEntry(`${col.name} grew into a ${lvlName}!`, 'text-amber-300');
                        showToast(`${col.name} upgraded to ${lvlName}!`);
                        audioEngine.playChime(659.25, 0.22);
                    }
                }

                if (tradeBoats.length < Math.min(5, Math.max(1, colonies.length)) && (colonies.length >= 2 || oreStock > 5)) {
                    const fromIdx = tradeBoats.length % ISLAND_ARCHIPELAGO.length;
                    const toIdx = (fromIdx + 1) % ISLAND_ARCHIPELAGO.length;
                    const a = ISLAND_ARCHIPELAGO[fromIdx], b = ISLAND_ARCHIPELAGO[toIdx];
                    tradeBoats.push({
                        x: a.x + (b.x - a.x) * 0.25,
                        y: a.y + (b.y - a.y) * 0.25,
                        fromIdx, toIdx, progress: 0.25,
                        cargo: tradeBoats.length % 2 === 0 ? 'Iron Ore' : 'Orchard Food'
                    });
                }
                for (const boat of tradeBoats) {
                    boat.progress += 0.0018 * dt;
                    if (boat.progress >= 1.0) {
                        boat.progress = 0;
                        boat.fromIdx = boat.toIdx;
                        boat.toIdx = (boat.toIdx + 1) % ISLAND_ARCHIPELAGO.length;
                        oreStock += 1;
                        collectiveKnowledgeXP += 0.5;
                    }
                    const a = ISLAND_ARCHIPELAGO[boat.fromIdx], b = ISLAND_ARCHIPELAGO[boat.toIdx];
                    boat.x = a.x + (b.x - a.x) * boat.progress;
                    boat.y = a.y + (b.y - a.y) * boat.progress;
                    boat.angle = Math.atan2(b.y - a.y, b.x - a.x);
                }

                for (let i = wildfires.length - 1; i >= 0; i--) {
                    const wf = wildfires[i];
                    wf.life -= (currentWeather === 'rain' || currentWeather === 'storm') ? 3.5 * dt : 0.4 * dt;
                    for (const c of creatures) {
                        const d = Math.hypot(c.x - wf.x, c.y - wf.y);
                        if (d < 85) {
                            if (c.jobTitle === 'Firekeeper' || c.isHuman) {
                                wf.life -= 2.2 * dt;
                            } else {
                                c.stress = Math.min(0.95, c.stress + 0.02);
                            }
                        }
                    }
                    if (wf.life <= 0) {
                        wildfires.splice(i, 1);
                        rebuildTerracedWorld();
                    }
                }
            }

            function triggerWildfireOrEruption() {
                const isl = ISLAND_ARCHIPELAGO[currentEraIndex % ISLAND_ARCHIPELAGO.length];
                const wx = isl.x + (Math.random() - 0.5) * 420;
                const wy = isl.y + (Math.random() - 0.5) * 420;
                wildfires.push({ x: wx, y: wy, life: 240, radius: 58 });
                emitOceanRipple(wx, wy, 1.3);
                rebuildTerracedWorld();
                recordEventMarker('Wildfire / Eruption', '#f97316');
                addChronicleEntry(`DISASTER: Wildfire sparked on ${isl.name}! Firekeepers & Rain can extinguish it.`, 'text-rose-300');
                showToast(`Wildfire on ${isl.name}!`);
                audioEngine.playPulse(105, 0.45);
            }

            function crossoverOrganismGenes(mother, father) {
                const pick = (a, b) => (Math.random() < 0.5 ? a : b);
                const mut = params.mutationRate * EARTH_ERAS[currentEraIndex].mutationBoost;
                const gA = mother.genome, gB = father.genome;
                return {
                    ...gA,
                    hue: ((gA.hue + gB.hue) * 0.5 + (Math.random() < mut ? (Math.random() * 22 - 11) : 0) + 360) % 360,
                    accentHue: ((gA.accentHue + gB.accentHue) * 0.5 + 360) % 360,
                    speed: Math.max(0.9, Math.min(4.2, pick(gA.speed, gB.speed) + (Math.random() < mut ? (Math.random() * 0.35 - 0.175) : 0))),
                    vision: Math.max(85, Math.min(265, pick(gA.vision, gB.vision) + (Math.random() < mut ? (Math.random() * 18 - 9) : 0))),
                    size: Math.max(7, Math.min(13.8, (gA.size + gB.size) * 0.5)),
                    appendages: pick(gA.appendages, gB.appendages),
                    pattern: pick(gA.pattern, gB.pattern)
                };
            }

            function issueTaskFromHuman(commander, taskName, radius = 480) {
                if (!commander || !creatures.includes(commander)) return 0;
                const taskToGoal = {
                    'Tend Fire': 'Tend Fire',
                    'Mine Ore': 'Mine Ore',
                    'Work Industry': 'Work Industry',
                    'Harvest Fruit': 'Forage & Thrive',
                    'Build Shelter': 'Build & Innovate',
                    'Guard Colony': 'Guard Colony',
                    'Tend Orchard': 'Tend Orchard',
                    'Explore Archipelago': 'Explore Archipelago'
                };
                const jobMap = {
                    'Tend Fire': 'Firekeeper',
                    'Mine Ore': 'Miner',
                    'Work Industry': 'Engineer',
                    'Harvest Fruit': 'Farmer',
                    'Build Shelter': 'Builder',
                    'Guard Colony': 'Guardian',
                    'Tend Orchard': 'Orchardist',
                    'Explore Archipelago': 'Scout'
                };
                const mappedGoal = taskToGoal[taskName] || taskName;
                let assigned = 0;

                const candidates = creatures
                    .filter(c => c !== commander)
                    .map(c => ({ c, d: Math.hypot(c.x - commander.x, c.y - commander.y) }))
                    .filter(item => item.d <= radius)
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 6);

                for (const { c } of candidates) {
                    c.assignedGoal = mappedGoal;
                    c.jobTitle = jobMap[taskName] || c.jobTitle || 'Worker';
                    c.commandedBy = commander.realName.split(' (')[0];
                    c.commandedTask = taskName;
                    c.commandTimer = 340;
                    c.lastThought = `Job (${c.jobTitle}): ${taskName}`;
                    commandBeams.push({
                        from: commander,
                        to: c,
                        label: taskName,
                        color: taskName === 'Join Revolution' ? '#fb7185' : '#38bdf8',
                        life: 95
                    });
                    assigned++;
                }

                if (assigned > 0) {
                    tasksIssuedTotal += assigned;
                    commander.tasksIssued = (commander.tasksIssued || 0) + assigned;
                    commander.humanNeuralXP += 1.6 * assigned;
                    collectiveKnowledgeXP += 1.2 * assigned;
                    commander.brain.reinforce(0.8);
                    commander.lastThought = `Commanded ${assigned} peers: ${taskName}`;
                    addChronicleEntry(`${commander.realName.split(' (')[0]} tasked ${assigned} agents: "${taskName}"`, 'text-cyan-300');
                    showToast(`${commander.realName.split(' (')[0]} assigned "${taskName}" to ${assigned} agents`);
                    audioEngine.playChime(698.46, 0.16);
                }
                return assigned;
            }

            function triggerHumanRevolution(leader = null) {
                const humans = creatures.filter(c => c.isHuman);
                const revLeader = leader && creatures.includes(leader)
                    ? leader
                    : (humans.find(h => h.isCognitiveLeader) || humans[0] || creatures[0]);
                if (!revLeader) return;

                revolutionCount++;
                currentRegimeIndex = Math.min(HUMAN_REVOLUTIONS.length - 1, currentRegimeIndex + 1);
                if (currentRegimeIndex === 0) currentRegimeIndex = 1;
                const revInfo = HUMAN_REVOLUTIONS[currentRegimeIndex];

                revLeader.isCognitiveLeader = true;
                revLeader.revolutionsLed = (revLeader.revolutionsLed || 0) + 1;
                revLeader.jobTitle = revInfo.job;
                if (!revLeader.inventions.includes(revInfo.discovery)) revLeader.inventions.push(revInfo.discovery);
                revLeader.assignedGoal = revInfo.structure === 'mine' ? 'Mine Ore' : (revInfo.structure === 'industry' ? 'Work Industry' : 'Build & Innovate');
                revLeader.lastThought = `Invented ${revInfo.discovery} (${revInfo.name})!`;
                if (revLeader.isHuman) {
                    revLeader.humanNeuralXP += 16;
                    revLeader.brain.reinforce(1.0);
                }

                revolutionWaves.push({
                    x: revLeader.x,
                    y: revLeader.y,
                    radius: 25,
                    maxRadius: 560,
                    alpha: 1.0,
                    label: `${revInfo.name}: ${revInfo.discovery}`
                });
                emitOceanRipple(revLeader.x, revLeader.y, 1.45);

                const taskByRev = {
                    campfire: 'Tend Fire',
                    granary: 'Harvest Fruit',
                    mine: 'Mine Ore',
                    industry: 'Work Industry',
                    beacon: 'Build Shelter'
                };
                const revTask = taskByRev[revInfo.structure] || 'Build Shelter';

                let trained = 0;
                for (const c of creatures) {
                    const d = Math.hypot(c.x - revLeader.x, c.y - revLeader.y);
                    if (d < 620) {
                        if (c.isHuman && c !== revLeader && currentRegimeIndex >= 5 && Math.random() < 0.14) {
                            c.faction = 'REBEL';
                            c.lastThought = 'Joined a rival faction';
                        }
                        c.jobTitle = c.isHuman ? revInfo.job : (c.jobTitle || 'Helper');
                        c.stress = Math.max(0.04, c.stress * 0.5);
                        c.energy = Math.min(c.maxEnergy, c.energy + 34);
                        c.assignedGoal = revTask === 'Tend Fire' ? 'Tend Fire' : (revTask === 'Mine Ore' ? 'Mine Ore' : (revTask === 'Work Industry' ? 'Work Industry' : 'Build & Innovate'));
                        c.commandedBy = revLeader.realName.split(' (')[0];
                        c.commandedTask = revTask;
                        c.commandTimer = 380;
                        commandBeams.push({ from: revLeader, to: c, label: revInfo.job, color: '#fbbf24', life: 110 });
                        trained++;
                    }
                }

                if (getTerrainSphereAt(revLeader.x, revLeader.y) === 'LITHOSPHERE' && builtStructures.length < 56) {
                    const spec = SHELTER_TYPES.find(s => s.kind === revInfo.structure) || SHELTER_TYPES[0];
                    builtStructures.push({
                        x: revLeader.x + 28,
                        y: revLeader.y + 20,
                        stage: culturalStageIndex,
                        kind: spec.kind,
                        shelterName: spec.label,
                        builderName: revLeader.realName,
                        label: revInfo.discovery
                    });
                    if (spec.kind === 'campfire') fireCount++;
                    if (spec.kind === 'mine') oreStock += 25;
                    if (spec.kind === 'industry') industryOutput += 20;
                    rebuildTerracedWorld();
                }

                collectiveKnowledgeXP += 22;
                recordEventMarker(`${revInfo.short}: ${revInfo.discovery}`, '#fbbf24');
                addChronicleEntry(`${revInfo.name}! ${revLeader.realName.split(' (')[0]} discovered ${revInfo.discovery} & opened ${trained} ${revInfo.job} jobs!`, 'text-amber-300');
                addEvolutionMilestone(`${revInfo.short}: ${revInfo.discovery}`);
                showToast(`${revInfo.name}! Discovered ${revInfo.discovery} (+${trained} ${revInfo.job}s)`);
                audioEngine.playChime(783.99, 0.28);
                updateHUD();
                updateInspectorHUD();
            }

            function generateUniqueGenome(speciesKey, parentGenome = null, speciateBurst = false) {
                const cfg = SPECIES_CONFIG[speciesKey] || SPECIES_CONFIG.capybara;
                const mut = Math.min(0.95, params.mutationRate * EARTH_ERAS[currentEraIndex].mutationBoost * (speciateBurst ? 1.85 : 1.0));
                const hueShift = speciateBurst ? (Math.random() > 0.5 ? 24 : -24) : 12;
                for (let attempts = 1; attempts <= 35; attempts++) {
                    const hue = parentGenome
                        ? (parentGenome.hue + (Math.random() < mut ? (Math.random() * hueShift * 2 - hueShift) : 0) + 360) % 360
                        : cfg.hueRange[0] + Math.random() * (cfg.hueRange[1] - cfg.hueRange[0]);
                    const accentHue = parentGenome
                        ? (parentGenome.accentHue + (Math.random() < mut ? (Math.random() * 34 - 17) : 0) + 360) % 360
                        : (hue + 145) % 360;
                    const speed = parentGenome
                        ? Math.max(0.9, Math.min(4.2, parentGenome.speed + (Math.random() < mut ? (Math.random() * (speciateBurst ? 0.72 : 0.4) - (speciateBurst ? 0.36 : 0.2)) : 0)))
                        : cfg.baseSpeed * (0.88 + Math.random() * 0.26);
                    const vision = parentGenome
                        ? Math.max(85, Math.min(265, parentGenome.vision + (Math.random() < mut ? (Math.random() * (speciateBurst ? 36 : 20) - (speciateBurst ? 18 : 10)) : 0)))
                        : cfg.baseVision * (0.9 + Math.random() * 0.25);
                    const referenceSize = 10.4 * ((SPECIES_REFERENCE_METERS[speciesKey] || 1.0) / HUMAN_BASELINE_METERS);
                    const size = parentGenome
                        ? Math.max(0.45, Math.min(170, parentGenome.size + (Math.random() < mut ? (Math.random() - 0.5) * Math.max(0.12, referenceSize * (speciateBurst ? 0.14 : 0.08)) : 0)))
                        : Math.max(0.45, referenceSize * (0.94 + Math.random() * 0.12));
                    const appendages = (parentGenome && !speciateBurst) ? parentGenome.appendages : (2 + Math.floor(Math.random() * 4));
                    const pattern = (parentGenome && !speciateBurst) ? parentGenome.pattern : PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
                    const variantTag = speciateBurst ? `V${Math.floor(Math.random() * 9 + 2)}` : (parentGenome ? (parentGenome.variantTag || 'V1') : 'V1');
                    const sig = `${speciesKey}-${variantTag}-${Math.round(hue)}-${speed.toFixed(2)}-${Math.round(vision)}-${attempts}`;
                    if (!spawnedGenomeSignatures.has(sig) || attempts === 35) {
                        spawnedGenomeSignatures.add(sig);
                        const hex = Math.abs(Math.floor(hue * 43 + vision * 17 + attempts * 31 + (speciateBurst ? 97 : 0))).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
                        return { id: `GEN-${hex}`, signature: sig, variantTag, species: speciesKey, sphereAffinity: cfg.sphere, hue, accentHue, speed, vision, size, appendages, pattern, defense: cfg.defense };
                    }
                }
            }

            class Organism {
                constructor(x, y, speciesKey, generation = 1, parentGenome = null, parentBrain = null, forceCognitive = null, parentMeta = null, speciateBurst = false) {
                    totalSpawnCounter++;
                    this.x = clampWorldCoordinate(x);
                    this.y = clampWorldCoordinate(y);
                    this.species = SPECIES_CONFIG[speciesKey] ? speciesKey : 'capybara';
                    this.generation = generation;
                    this.parentId = parentMeta ? parentMeta.id : null;
                    this.parentName = parentMeta ? parentMeta.name : null;
                    this.resilience = parentMeta
                        ? Math.max(0.15, Math.min(0.95, (parentMeta.resilience || 0.5) + (Math.random() * 0.08 - 0.03)))
                        : (0.42 + Math.random() * 0.25);
                    this.stress = 0.08;
                    this.activeTarget = null;
                    this.isHuman = this.species === 'human';
                    this.humanAnnStage = parentBrain && this.isHuman ? (parentBrain.humanStage || 0) : 0;
                    this.humanNeuralXP = this.isHuman ? HUMAN_ANN_STAGES[this.humanAnnStage].minXP : 0;
                    this.isCognitiveLeader = forceCognitive !== null ? forceCognitive : (this.isHuman ? this.humanAnnStage >= 1 : totalSpawnCounter % 10 === 0);
                    this.faction = 'COLONY';
                    this.combatHealth = 100;
                    this.combatCooldown = Math.floor(Math.random() * 25);
                    this.lastCombatTick = -9999;
                    this.sex = (totalSpawnCounter % 2 === 0) ? 'Female' : 'Male';
                    this.mateCooldown = 140 + Math.floor(Math.random() * 100);
                    this.motherName = parentMeta ? parentMeta.motherName : null;
                    this.fatherName = parentMeta ? parentMeta.fatherName : null;
                    this.domesticatedBy = null;
                    this.jobTitle = this.isHuman ? 'Forager' : 'Wild';
                    this.commandedBy = null;
                    this.commandedTask = null;
                    this.commandTimer = 0;
                    this.tasksIssued = 0;
                    this.revolutionsLed = 0;
                    this.commandCooldown = 60 + Math.floor(Math.random() * 80);

                    const givenName = INDIVIDUAL_NAMES[nameCursor % INDIVIDUAL_NAMES.length];
                    nameCursor++;
                    this.realName = `${givenName} (${SPECIES_CONFIG[this.species].name})`;
                    this.genome = generateUniqueGenome(this.species, parentGenome, speciateBurst);
                    this.brain = parentBrain
                        ? parentBrain.cloneAndMutate(params.mutationRate * EARTH_ERAS[currentEraIndex].mutationBoost, speciateBurst)
                        : new NeuralBrain(null, this.isCognitiveLeader, this.isHuman, this.humanAnnStage);

                    this.angle = Math.random() * Math.PI * 2;
                    this.angularVel = 0;
                    this.currentSpeed = this.genome.speed * 0.75;
                    this.turnRate = 0;
                    this.bankAngle = 0;
                    this.pitchAngle = 0;
                    this.vx = Math.cos(this.angle) * this.currentSpeed;
                    this.vy = Math.sin(this.angle) * this.currentSpeed;
                    this.wanderPhase = Math.random() * Math.PI * 2;
                    this.trail = [{ x: this.x, y: this.y }];
                    this.energy = 128;
                    this.maxEnergy = 220;
                    this.hydration = 100;
                    this.sprintBurst = 0;
                    this.offspring = 0;
                    this.fitness = 10;
                    this.ageTicks = 0;
                    this.growthProgress = generation === 1 ? (0.55 + Math.random() * 0.45) : 0.25;
                    this.lifeStage = this.computeLifeStage();
                    this.walkPhase = Math.random() * Math.PI * 2;
                    this.stateLabel = "FORAGING";
                    this.thoughtIcon = "APPLE";
                    this.successfulEscapes = 0;
                    this.representedPopulation = POPULATION_PER_AGENT;
                    this.mindGrowth = this.isCognitiveLeader ? 1.25 : 0.85;
                    const defaultGoals = this.isHuman ? ["Build & Innovate", "Forage & Thrive", "Explore Archipelago"]
                        : (SPECIES_CONFIG[this.species].sphere === "OCEAN" ? ["Patrol Reef & Currents", "Forage & Thrive", "Explore Archipelago"]
                            : ["Forage & Thrive", "Guard Colony", "Explore Archipelago"]);
                    this.assignedGoal = defaultGoals[totalSpawnCounter % defaultGoals.length];
                    this.goalIslandIdx = (totalSpawnCounter + 2) % ISLAND_ARCHIPELAGO.length;
                    this.lastThought = `Goal: ${this.assignedGoal}`;
                    this.inventions = [];
                    this.buildCooldown = 0;
                    this.vitalityHistory = new Array(24).fill(0.6);

                    if (this.generation > maxGeneration) maxGeneration = this.generation;
                }

                computeFitness() {
                    const survivalScore = Math.min(60, this.ageTicks * 0.045);
                    const resourceScore = (this.energy / this.maxEnergy) * 28 + (this.hydration / 100) * 14;
                    const reproScore = this.offspring * 18 + this.successfulEscapes * 9 + this.tasksIssued * 2;
                    const stressPenalty = this.stress * 12;
                    this.fitness = Math.max(1, Number((survivalScore + resourceScore + reproScore - stressPenalty).toFixed(1)));
                    return this.fitness;
                }

                computeLifeStage() {
                    if (this.growthProgress < 0.40) return "JUVENILE";
                    if (this.growthProgress < 0.72) return "ADOLESCENT";
                    if (this.ageTicks > 2600) return "ELDER";
                    return "MATURE ADULT";
                }

                update() {
                    this.ageTicks++;
                    if (this.commandTimer > 0) {
                        this.commandTimer--;
                        if (this.commandTimer <= 0) {
                            this.commandedBy = null;
                            this.commandedTask = null;
                        }
                    }
                    if (this.commandCooldown > 0) this.commandCooldown--;

                    if (this.growthProgress < 1.0) this.growthProgress = Math.min(1.0, this.growthProgress + 0.00055);
                    this.lifeStage = this.computeLifeStage();
                    this.mindGrowth = Math.min(3.5, (this.isCognitiveLeader ? 1.25 : 0.8) + this.growthProgress * 0.65 + culturalStageIndex * 0.28 + this.inventions.length * 0.14);
                    const stageSpeedMult = this.lifeStage === "JUVENILE" ? 0.78 : this.lifeStage === "ELDER" ? 0.86 : 1.0;
                    const sphere = this.genome.sphereAffinity;

                    let hasWatchtower = false;
                    let nearBeacon = false;
                    let nearGranary = false;
                    let nearCamp = false;
                    for (let sIdx = 0; sIdx < builtStructures.length; sIdx++) {
                        const st = builtStructures[sIdx];
                        const sd = Math.hypot(st.x - this.x, st.y - this.y);
                        if (sd < 240) {
                            if (st.kind === 'tower') hasWatchtower = true;
                            if (st.kind === 'beacon') nearBeacon = true;
                            if (st.kind === 'granary') nearGranary = true;
                            if (st.kind === 'camp') nearCamp = true;
                        }
                    }

                    const vision = this.genome.vision * (0.75 + this.growthProgress * 0.35) * (hasWatchtower ? 1.22 : 1.0);
                    let nearestFood = null, nearestFoodDist = Infinity;
                    const isPredator = this.species === "jaguar" || this.species === "snowleopard" || this.species === "falcon";

                    if (!isPredator) {
                        for (let i = 0; i < nutrients.length; i++) {
                            const n = nutrients[i];
                            const nSphere = getTerrainSphereAt(n.x, n.y);
                            if (sphere === "LITHOSPHERE" && nSphere !== "LITHOSPHERE") continue;
                            if (sphere === "OCEAN" && nSphere !== "OCEAN") continue;
                            const d = Math.hypot(n.x - this.x, n.y - this.y);
                            if (d < vision && d < nearestFoodDist) { nearestFoodDist = d; nearestFood = n; }
                        }
                    }

                    let nearestThreat = null, nearestThreatDist = Infinity;
                    let nearestPrey = null, nearestPreyDist = Infinity;
                    let bestMentor = null, bestMentorFitness = this.computeFitness();
                    let nearbyAllies = 0;
                    let cohesionX = 0, cohesionY = 0, sepX = 0, sepY = 0, alignX = 0, alignY = 0;

                    for (let i = 0; i < creatures.length; i++) {
                        const other = creatures[i];
                        if (other === this) continue;
                        const dx = other.x - this.x;
                        const dy = other.y - this.y;
                        const d = Math.hypot(dx, dy);
                        if (d > vision || d < 0.001) continue;
                        const otherIsPredator = other.species === "jaguar" || other.species === "snowleopard" || other.species === "falcon";
                        if (isPredator && !otherIsPredator) {
                            if (d < nearestPreyDist) { nearestPreyDist = d; nearestPrey = other; }
                        } else if (otherIsPredator && !isPredator) {
                            if (d < nearestThreatDist) { nearestThreatDist = d; nearestThreat = other; }
                        } else {
                            nearbyAllies++;
                            cohesionX += other.x;
                            cohesionY += other.y;
                            alignX += Math.cos(other.angle);
                            alignY += Math.sin(other.angle);
                            const minSep = (this.genome.size + other.genome.size) * 1.85;
                            if (d < minSep) {
                                const push = (minSep - d) / minSep;
                                sepX -= (dx / d) * push;
                                sepY -= (dy / d) * push;
                            }
                            const otherFit = other.computeFitness();
                            if (d < 110 && otherFit > bestMentorFitness + 8) {
                                bestMentorFitness = otherFit;
                                bestMentor = other;
                            }
                            if (this.isCognitiveLeader && d < 95) {
                                if (other.growthProgress < 1.0) other.growthProgress = Math.min(1.0, other.growthProgress + 0.0003);
                                collectiveKnowledgeXP += 0.012;
                            }
                        }
                    }

                    // Resource production from Human Jobs (Fire, Mining, Industry)
                    if (this.isHuman && this.ageTicks % 45 === 0) {
                        if (this.assignedGoal === 'Tend Fire' || this.jobTitle === 'Firekeeper') {
                            fireCount = Math.max(1, fireCount);
                            this.energy = Math.min(this.maxEnergy, this.energy + 3);
                        } else if (this.assignedGoal === 'Mine Ore' || this.jobTitle === 'Miner') {
                            oreStock += 2;
                            collectiveKnowledgeXP += 0.25;
                        } else if (this.assignedGoal === 'Work Industry' || this.jobTitle === 'Engineer') {
                            if (oreStock > 0) { oreStock--; industryOutput += 3; }
                            else industryOutput += 1;
                            collectiveKnowledgeXP += 0.4;
                        }
                    }

                    // Autonomous Human Commander Task-Giving & Revolution Trigger via ANN
                    if (this.isHuman && this.commandCooldown <= 0 && nearbyAllies >= 1) {
                        this.commandCooldown = 190 + Math.floor(Math.random() * 140);
                        const annSignal = (this.brain.lastOutputs[2] || 0);
                        if (this.humanNeuralXP > (currentRegimeIndex + 1) * 26 && currentRegimeIndex < HUMAN_REVOLUTIONS.length - 1 && Math.random() < 0.25) {
                            triggerHumanRevolution(this);
                        } else {
                            const autoTasks = currentRegimeIndex >= 4
                                ? ['Work Industry', 'Mine Ore', 'Build Shelter', 'Harvest Fruit']
                                : currentRegimeIndex >= 3
                                    ? ['Mine Ore', 'Build Shelter', 'Harvest Fruit', 'Tend Fire']
                                    : ['Tend Fire', 'Harvest Fruit', 'Build Shelter', 'Tend Orchard'];
                            const pickTask = autoTasks[Math.floor((Math.abs(annSignal) * 4 + this.ageTicks) % autoTasks.length)];
                            issueTaskFromHuman(this, pickTask, 340);
                        }
                    }

                    if (bestMentor && this.ageTicks % 22 === 0 && (this.isHuman || this.isCognitiveLeader || Math.random() < 0.35)) {
                        this.brain.absorbMemeticCulture(bestMentor.brain, this.isHuman ? 0.22 : 0.12);
                        if (this.isHuman && bestMentor.inventions.length > 0 && !this.inventions.includes(bestMentor.inventions[0])) {
                            this.inventions.push(bestMentor.inventions[0]);
                            this.humanNeuralXP += 1.2;
                        }
                    }

                    if ((this.species === "earthworm" || this.species === "woodlouse" || this.species === "honeybee" || this.species === "hummingbird" || nearGranary || this.assignedGoal === 'Tend Orchard') && this.ageTicks % 25 === 0) {
                        soilFertility = Math.min(1.6, soilFertility + (nearGranary ? 0.009 : 0.0045));
                    }
                    if (nearBeacon && this.isHuman && this.ageTicks % 15 === 0) {
                        this.humanNeuralXP += 0.06;
                        collectiveKnowledgeXP += 0.025;
                    }

                    let target = isPredator ? nearestPrey : nearestFood;
                    let targetDist = isPredator ? nearestPreyDist : nearestFoodDist;
                    const { island: nearIsl, normDist: nearNorm } = getNearestIsland(this.x, this.y);

                    if (!target && sphere === "OCEAN" && this.assignedGoal === "Patrol Reef & Currents") {
                        const patrolAngle = Math.atan2(this.y - nearIsl.y, this.x - nearIsl.x) + 0.65;
                        const patrolR = Math.max(nearIsl.radius * 0.96, Math.min(nearIsl.radius * 1.28, nearIsl.radius * Math.max(0.95, nearNorm)));
                        target = {
                            x: nearIsl.x + Math.cos(patrolAngle) * patrolR,
                            y: nearIsl.y + Math.sin(patrolAngle) * patrolR
                        };
                        targetDist = Math.hypot(target.x - this.x, target.y - this.y);
                    } else if (!target && this.assignedGoal === "Explore Archipelago") {
                        const migIdx = (Math.floor(seasonalCyclePhase * 4) + this.goalIslandIdx) % ISLAND_ARCHIPELAGO.length;
                        const destIsl = ISLAND_ARCHIPELAGO[migIdx];
                        if (Math.hypot(destIsl.x - this.x, destIsl.y - this.y) < 210) {
                            this.goalIslandIdx = (this.goalIslandIdx + 1) % ISLAND_ARCHIPELAGO.length;
                        }
                        target = ISLAND_ARCHIPELAGO[migIdx];
                        targetDist = Math.hypot(target.x - this.x, target.y - this.y);
                    } else if (!target && this.assignedGoal === "Seek Spring & Heal" && springs.length > 0) {
                        target = springs[0];
                        targetDist = Math.hypot(target.x - this.x, target.y - this.y);
                    }

                    // Direct tasked agents to matching structures (Fire, Mine, Industry)
                    if (this.assignedGoal === 'Tend Fire' || this.assignedGoal === 'Mine Ore' || this.assignedGoal === 'Work Industry') {
                        const wantKind = this.assignedGoal === 'Tend Fire' ? 'campfire' : (this.assignedGoal === 'Mine Ore' ? 'mine' : 'industry');
                        let bestSt = null, bestStDist = Infinity;
                        for (const st of builtStructures) {
                            if (st.kind === wantKind) {
                                const sd = Math.hypot(st.x - this.x, st.y - this.y);
                                if (sd < bestStDist) { bestStDist = sd; bestSt = st; }
                            }
                        }
                        if (bestSt) {
                            target = bestSt;
                            targetDist = bestStDist;
                        } else if (this.isHuman && this.buildCooldown <= 0 && getTerrainSphereAt(this.x, this.y) === 'LITHOSPHERE' && builtStructures.length < 56) {
                            const spec = SHELTER_TYPES.find(s => s.kind === wantKind) || SHELTER_TYPES[0];
                            this.buildCooldown = 180;
                            builtStructures.push({ x: this.x, y: this.y, stage: culturalStageIndex, kind: spec.kind, shelterName: spec.label, builderName: this.realName, label: spec.label });
                            if (wantKind === 'campfire') fireCount++;
                            if (wantKind === 'mine') oreStock += 15;
                            if (wantKind === 'industry') industryOutput += 12;
                            rebuildTerracedWorld();
                            addChronicleEntry(`${this.realName.split(' (')[0]} constructed a ${spec.label}!`, 'text-amber-300');
                        }
                    }

                    this.activeTarget = target ? { x: target.x, y: target.y, kind: nearestThreat ? 'threat' : (isPredator ? 'prey' : 'food') } : null;

                    if (nearestThreat) {
                        if (this.sprintBurst <= 0 && this.energy > 45) this.sprintBurst = 28;
                        this.stateLabel = "HERD SPRINT EVADE";
                        this.thoughtIcon = "ALERT";
                        this.lastThought = `Alarm! Sprinting with ${nearbyAllies} herd mates`;
                    } else if (this.commandedTask && this.commandTimer > 0) {
                        this.stateLabel = `TASK: ${this.commandedTask.toUpperCase()}`;
                        this.thoughtIcon = "BUILD";
                        this.lastThought = `Executing "${this.commandedTask}" for ${this.commandedBy}`;
                        if ((this.commandedTask === 'Build Shelter' || this.assignedGoal === 'Build & Innovate') && this.isHuman && this.buildCooldown <= 0 && builtStructures.length < 56 && getTerrainSphereAt(this.x, this.y) === "LITHOSPHERE") {
                            const revStruct = HUMAN_REVOLUTIONS[currentRegimeIndex]?.structure || 'camp';
                            const spec = SHELTER_TYPES.find(s => s.kind === revStruct) || SHELTER_TYPES[builtStructures.length % SHELTER_TYPES.length];
                            const inv = DISCOVERIES[(this.inventions.length + culturalStageIndex) % DISCOVERIES.length];
                            this.inventions.push(inv);
                            this.buildCooldown = 190;
                            builtStructures.push({ x: this.x, y: this.y, stage: culturalStageIndex, kind: spec.kind, shelterName: spec.label, builderName: this.realName, label: inv });
                            if (this.isHuman) { const col = getOrCreateColonyAt(this.x, this.y, this); col.xp += 12; }
                            if (spec.kind === 'campfire') fireCount++;
                            rebuildTerracedWorld();
                            addChronicleEntry(`${this.realName.split(' (')[0]} built a ${spec.label} (${inv})`, 'text-amber-300');
                        }
                    } else if (isPredator && nearestPrey) {
                        if (nearestPreyDist < vision * 0.65 && this.energy > 55 && this.sprintBurst <= 0) this.sprintBurst = 20;
                        this.stateLabel = "FLANKING HUNT";
                        this.thoughtIcon = "PREY";
                        this.lastThought = `Stalking & flanking ${SPECIES_CONFIG[nearestPrey.species].name}`;
                    } else if (this.hydration < 45 && springs.length > 0) {
                        let bestSpring = springs[0], bestSpringDist = Infinity;
                        for (const sp of springs) {
                            const sd = Math.hypot(sp.x - this.x, sp.y - this.y);
                            if (sd < bestSpringDist) { bestSpringDist = sd; bestSpring = sp; }
                        }
                        target = bestSpring;
                        targetDist = bestSpringDist;
                        this.stateLabel = "SEEKING SPRING";
                        this.thoughtIcon = "WATER";
                    } else if (bestMentor && nearbyAllies >= 1 && this.ageTicks % 35 === 0) {
                        this.stateLabel = "CULTURAL LEARNING";
                        this.thoughtIcon = "SOCIAL";
                        this.lastThought = `Adapting strategy from high-fit ${bestMentor.genome.id} (F:${bestMentor.fitness})`;
                    } else if ((this.isHuman || this.isCognitiveLeader) && (nearbyAllies >= 1 || this.assignedGoal === 'Build & Innovate')) {
                        this.stateLabel = `INVENTING (${CULTURAL_STAGES[culturalStageIndex].name.split(': ')[1]})`;
                        this.thoughtIcon = "BUILD";
                        collectiveKnowledgeXP += 0.045 * this.mindGrowth;
                        if (this.isHuman) {
                            this.humanNeuralXP += 0.10;
                            this.brain.reinforce(0.5);
                        }
                        if (this.buildCooldown <= 0 && builtStructures.length < 56 && Math.random() < 0.065 && getTerrainSphereAt(this.x, this.y) === "LITHOSPHERE") {
                            const inv = DISCOVERIES[(this.inventions.length + culturalStageIndex) % DISCOVERIES.length];
                            const spec = SHELTER_TYPES[builtStructures.length % SHELTER_TYPES.length];
                            this.inventions.push(inv);
                            this.buildCooldown = 260;
                            builtStructures.push({ x: this.x, y: this.y, stage: culturalStageIndex, kind: spec.kind, shelterName: spec.label, builderName: this.realName, label: inv, isRebelStronghold: this.faction === 'REBEL' });
                            this.lastThought = `Built ${spec.label} (${inv})!`;
                            rebuildTerracedWorld();
                            addChronicleEntry(`${this.realName} built a voxel ${spec.label} (${inv})`, 'text-amber-300');
                            showToast(`${this.realName} built a ${spec.label} (${inv})`);
                            audioEngine.playChime(659.25, 0.22);
                        } else {
                            this.lastThought = `Thinking: Co-designing ${CULTURAL_STAGES[culturalStageIndex].name.split(': ')[1]}`;
                        }
                    } else if (target) {
                        this.stateLabel = sphere === "OCEAN" ? "PATROLLING REEF" : sphere === "ATMOSPHERE" ? "SOARING FORAGE" : "HARVESTING FRUIT";
                        this.thoughtIcon = "APPLE";
                        this.lastThought = this.isCognitiveLeader ? "Thinking: Routing colony toward nutrients" : "Foraging: Moving toward target";
                    } else {
                        this.stateLabel = sphere === "ATMOSPHERE" ? "THERMAL SOARING" : sphere === "OCEAN" ? "CURRENT DRIFT" : "GATHERING COLONY";
                        this.thoughtIcon = "SOCIAL";
                        this.lastThought = this.isCognitiveLeader ? "Thinking: Synchronizing memory with peers" : "Social: Flowing with colony group";
                    }
                    if (this.buildCooldown > 0) this.buildCooldown--;
                    if (this.sprintBurst > 0) this.sprintBurst--;

                    this.wanderPhase += 0.025 + this.genome.speed * 0.008;
                    const smoothWander = Math.sin(this.wanderPhase) * 0.65 + Math.cos(this.wanderPhase * 0.47) * 0.35;

                    const threatSignal = nearestThreat ? Math.max(0, 1 - nearestThreatDist / vision) : 0;
                    const landMatch = getTerrainSphereAt(this.x, this.y) === sphere ? 1 : -1;

                    if (this.isHuman) {
                        this.humanNeuralXP += 0.025 + (nearbyAllies > 0 ? 0.03 : 0);
                        let nextHStage = this.humanAnnStage;
                        while (nextHStage < 4 && this.humanNeuralXP >= HUMAN_ANN_STAGES[nextHStage + 1].minXP) nextHStage++;
                        if (nextHStage > this.humanAnnStage) {
                            this.humanAnnStage = nextHStage;
                            this.brain.evolveTopology(nextHStage);
                            if (nextHStage >= 1) this.isCognitiveLeader = true;
                            const st = HUMAN_ANN_STAGES[nextHStage];
                            recordEventMarker(`Human ${st.name.split(':')[0]}`, '#fde047');
                            addChronicleEntry(`${this.realName} evolved ANN to ${st.name} (${st.inSize}->${st.hidSize}->${st.outSize})`, 'text-amber-300');
                            showToast(`Human ANN Evolved: ${st.name}!`);
                            audioEngine.playChime(783.99, 0.26);
                        }
                    }

                    const brainOut = this.brain.forward([
                        target ? 1 : 0,
                        target ? Math.max(0, 1 - targetDist / vision) : 0,
                        threatSignal,
                        landMatch,
                        this.energy / this.maxEnergy,
                        Math.min(1, nearbyAllies / 5),
                        this.growthProgress,
                        culturalStageIndex / 4,
                        this.brain.memoryState || 0,
                        this.humanAnnStage / 4
                    ]);

                    let steerX = Math.cos(this.angle + smoothWander * 0.42) * 0.52 + brainOut[0] * 0.24;
                    let steerY = Math.sin(this.angle + smoothWander * 0.42) * 0.52 + brainOut[0] * 0.24;

                    if (target && !nearestThreat) {
                        const tdx = target.x - this.x;
                        const tdy = target.y - this.y;
                        const td = Math.max(1, Math.hypot(tdx, tdy));
                        let aimX = tdx / td;
                        let aimY = tdy / td;
                        if (isPredator && nearestPrey && td > 38) {
                            const flankSign = ((this.ageTicks + this.genome.appendages) % 2 === 0) ? 1 : -1;
                            const flankAngle = Math.atan2(tdy, tdx) + flankSign * 0.34;
                            aimX = Math.cos(flankAngle);
                            aimY = Math.sin(flankAngle);
                        }
                        const seekWeight = Math.min(1.15, 0.55 + (1 - Math.min(1, td / (vision * 1.4))) * 0.65);
                        steerX += aimX * seekWeight;
                        steerY += aimY * seekWeight;
                    }

                    if (nearbyAllies > 0 && !nearestThreat) {
                        const avgX = cohesionX / nearbyAllies - this.x;
                        const avgY = cohesionY / nearbyAllies - this.y;
                        const ad = Math.max(1, Math.hypot(avgX, avgY));
                        const cohWeight = sphere === "OCEAN" && (this.species === "dolphin" || this.species === "clownfish") ? 0.36 : 0.22;
                        steerX += (avgX / ad) * cohWeight + (alignX / nearbyAllies) * 0.22;
                        steerY += (avgY / ad) * cohWeight + (alignY / nearbyAllies) * 0.22;
                    }
                    steerX += sepX * 0.65;
                    steerY += sepY * 0.65;

                    if (nearestThreat) {
                        const awayX = this.x - nearestThreat.x;
                        const awayY = this.y - nearestThreat.y;
                        const ad = Math.max(1, Math.hypot(awayX, awayY));
                        const fleeUrgency = 1.2 + threatSignal * 1.4;
                        steerX += (awayX / ad) * fleeUrgency;
                        steerY += (awayY / ad) * fleeUrgency;
                    }

                    const lookDist = 42 + this.genome.speed * 14;
                    const feelCenterElev = getWorldElevation(this.x + Math.cos(this.angle) * lookDist, this.y + Math.sin(this.angle) * lookDist);
                    const feelLeftElev = getWorldElevation(this.x + Math.cos(this.angle - 0.55) * lookDist, this.y + Math.sin(this.angle - 0.55) * lookDist);
                    const feelRightElev = getWorldElevation(this.x + Math.cos(this.angle + 0.55) * lookDist, this.y + Math.sin(this.angle + 0.55) * lookDist);

                    if (sphere === "LITHOSPHERE") {
                        if (feelCenterElev < 0.08) {
                            const toIslandX = nearIsl.x - this.x;
                            const toIslandY = nearIsl.y - this.y;
                            const id = Math.max(1, Math.hypot(toIslandX, toIslandY));
                            const shorePush = feelCenterElev < -0.02 ? 1.85 : 1.05;
                            steerX += (toIslandX / id) * shorePush;
                            steerY += (toIslandY / id) * shorePush;
                        }
                        if (feelLeftElev < feelRightElev && feelCenterElev < 0.12) {
                            steerX += Math.cos(this.angle + Math.PI * 0.5) * 0.65;
                            steerY += Math.sin(this.angle + Math.PI * 0.5) * 0.65;
                        } else if (feelRightElev < feelLeftElev && feelCenterElev < 0.12) {
                            steerX += Math.cos(this.angle - Math.PI * 0.5) * 0.65;
                            steerY += Math.sin(this.angle - Math.PI * 0.5) * 0.65;
                        }
                    } else if (sphere === "OCEAN") {
                        if (feelCenterElev > 0.04) {
                            const outX = this.x - nearIsl.x;
                            const outY = this.y - nearIsl.y;
                            const od = Math.max(1, Math.hypot(outX, outY));
                            steerX += (outX / od) * 1.65;
                            steerY += (outY / od) * 1.65;
                        }
                    }

                    const desiredAngle = Math.atan2(steerY, steerX);
                    const angleErr = normalizeAngle(desiredAngle - this.angle);
                    const maxTurnAccel = sphere === "ATMOSPHERE" ? 0.024 : sphere === "OCEAN" ? 0.021 : 0.026;
                    const damping = sphere === "ATMOSPHERE" ? 0.86 : sphere === "OCEAN" ? 0.84 : 0.80;

                    this.angularVel = (this.angularVel + Math.max(-maxTurnAccel, Math.min(maxTurnAccel, angleErr * 0.19))) * damping;
                    const maxAngVel = sphere === "ATMOSPHERE" ? 0.11 : sphere === "OCEAN" ? 0.095 : 0.13;
                    this.angularVel = Math.max(-maxAngVel, Math.min(maxAngVel, this.angularVel));
                    this.angle = normalizeAngle(this.angle + this.angularVel);
                    this.turnRate = this.angularVel;

                    let targetSpeed = this.genome.speed * stageSpeedMult * (0.76 + (brainOut[1] + 1) * 0.24);
                    if (this.sprintBurst > 0) targetSpeed *= 1.38;
                    else if (nearestThreat) targetSpeed *= 1.25;
                    else if (Math.abs(angleErr) > 1.1) targetSpeed *= 0.82;
                    if (sphere === "LITHOSPHERE" && feelCenterElev < 0.03) targetSpeed *= 0.72;

                    const accelRate = sphere === "OCEAN" ? 0.075 : sphere === "ATMOSPHERE" ? 0.085 : 0.11;
                    this.currentSpeed += (targetSpeed - this.currentSpeed) * accelRate;

                    const desiredVx = Math.cos(this.angle) * this.currentSpeed;
                    const desiredVy = Math.sin(this.angle) * this.currentSpeed;
                    const velBlend = sphere === "OCEAN" ? 0.22 : 0.30;
                    this.vx += (desiredVx - this.vx) * velBlend;
                    this.vy += (desiredVy - this.vy) * velBlend;

                    this.x = clampWorldCoordinate(this.x + this.vx);
                    this.y = clampWorldCoordinate(this.y + this.vy);

                    const actualSpeed = Math.hypot(this.vx, this.vy);
                    this.walkPhase += 0.14 + actualSpeed * 0.085;

                    const targetBank = Math.max(-0.36, Math.min(0.36, -this.angularVel * (sphere === "ATMOSPHERE" ? 3.2 : sphere === "OCEAN" ? 2.4 : 1.35)));
                    this.bankAngle += (targetBank - this.bankAngle) * 0.16;

                    const nextElev = getWorldElevation(this.x + Math.cos(this.angle) * 24, this.y + Math.sin(this.angle) * 24);
                    const curElev = getWorldElevation(this.x, this.y);
                    const slopePitch = Math.max(-0.24, Math.min(0.24, (nextElev - curElev) * 1.4));
                    this.pitchAngle += (slopePitch - this.pitchAngle) * 0.15;

                    if (simTick % 3 === 0) {
                        this.trail.push({ x: this.x, y: this.y });
                        if (this.trail.length > 10) this.trail.shift();
                    }

                    const thermalPenalty = Math.max(0, Math.abs(params.tempShift) - 6) * 0.025;
                    const crowdStress = nearbyAllies > 7 ? (nearbyAllies - 7) * 0.025 : 0;
                    const shelterRelief = (nearCamp || nearBeacon || nearGranary) ? -0.04 : 0;
                    const targetStress = Math.max(0.02, Math.min(0.98, (thermalPenalty + crowdStress + (threatSignal * 0.45) + shelterRelief) * (1.25 - this.resilience * 0.65)));
                    this.stress += (targetStress - this.stress) * 0.08;
                    if (this.stress > 0.45 && Math.random() < 0.002 * this.resilience) {
                        this.resilience = Math.min(0.95, this.resilience + 0.01);
                    }
                    if (this.isHuman && this.faction === 'COLONY' && this.stress > 0.78 && this.energy < 65 && simTick % 90 === 0 && Math.random() < 0.08) {
                        this.faction = 'REBEL';
                        this.lastThought = 'Defected: founding a rival faction';
                        this.assignedGoal = 'Guard Colony';
                        addChronicleEntry(`${this.realName.split(' (')[0]} defected and joined the REBEL faction.`, 'text-rose-300');
                    }
                    if (this.combatHealth < 100 && this.lastCombatTick < simTick - 180 && simTick % 12 === 0) {
                        this.combatHealth = Math.min(100, this.combatHealth + 1.2);
                    }

                    const thermalFactor = 1 + Math.abs(params.tempShift) * 0.025 * (1.15 - this.resilience * 0.45);
                    const hydrationLoss = (0.06 + Math.max(0, params.tempShift) * 0.004) * params.burnRate;
                    this.energy -= (0.068 + this.genome.speed * 0.019) * params.burnRate * thermalFactor;
                    this.hydration = Math.max(0, this.hydration - hydrationLoss);

                    if (simTick % 10 === 0) {
                        this.vitalityHistory.push(Math.max(0.05, Math.min(1, this.energy / this.maxEnergy)));
                        if (this.vitalityHistory.length > 28) this.vitalityHistory.shift();
                    }

                    for (const sp of springs) {
                        if (Math.hypot(sp.x - this.x, sp.y - this.y) < sp.radius + 18) {
                            this.hydration = Math.min(100, this.hydration + 1.5);
                            this.energy = Math.min(this.maxEnergy, this.energy + 0.15);
                            this.stress = Math.max(0.02, this.stress - 0.03);
                        }
                    }

                    const stageYield = CULTURAL_STAGES[culturalStageIndex].bonusYield * (nearCamp ? 1.2 : 1.0) * (0.7 + soilFertility * 0.35);
                    if (!isPredator) {
                        for (let i = nutrients.length - 1; i >= 0; i--) {
                            const n = nutrients[i];
                            if (Math.hypot(n.x - this.x, n.y - this.y) < this.genome.size + n.size + 4) {
                                this.energy = Math.min(this.maxEnergy, this.energy + n.energy * stageYield);
                                soilFertility = Math.max(0.45, soilFertility - 0.004);
                                if (this.isHuman) {
                                    this.humanNeuralXP += 0.85;
                                    this.brain.reinforce(0.85);
                                }
                                nutrients.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        const defenseBonus = CULTURAL_STAGES[culturalStageIndex].bonusDefense;
                        for (let i = creatures.length - 1; i >= 0; i--) {
                            const prey = creatures[i];
                            const preyIsPredator = prey.species === "jaguar" || prey.species === "snowleopard" || prey.species === "falcon";
                            if (prey === this || preyIsPredator) continue;
                            if (Math.hypot(prey.x - this.x, prey.y - this.y) < this.genome.size + prey.genome.size) {
                                if (Math.random() < 0.38 + defenseBonus) {
                                    prey.successfulEscapes++;
                                    prey.angle = Math.atan2(prey.y - this.y, prey.x - this.x);
                                    prey.angularVel = (Math.random() > 0.5 ? 1 : -1) * 0.08;
                                    continue;
                                }
                                this.energy = Math.min(this.maxEnergy, this.energy + 70);
                                if (selectedCreature === prey) deselectCreature();
                                creatures.splice(i, 1);
                                break;
                            }
                        }
                    }

                    if (this.mateCooldown > 0) this.mateCooldown--;

                    if (this.isHuman && (this.assignedGoal === 'Mine Ore' || this.jobTitle === 'Miner')) {
                        for (const ov of oreVeins) {
                            if (ov.ore > 0 && Math.hypot(ov.x - this.x, ov.y - this.y) < 60 && this.ageTicks % 30 === 0) {
                                ov.ore--;
                                oreStock += 2;
                                this.humanNeuralXP += 0.6;
                                this.lastThought = `Mining Ore Vein (${ov.ore} left)`;
                                break;
                            }
                        }
                    }

                    if (this.isHuman && currentRegimeIndex >= 2 && this.ageTicks % 60 === 0) {
                        for (const other of creatures) {
                            if (!other.domesticatedBy && (other.species === 'capybara' || other.species === 'reddeer' || other.species === 'bison') && Math.hypot(other.x - this.x, other.y - this.y) < 95) {
                                const col = getOrCreateColonyAt(this.x, this.y, this);
                                other.domesticatedBy = col.name;
                                other.jobTitle = 'Tamed Herd';
                                other.assignedGoal = 'Guard Colony';
                                addChronicleEntry(`${this.realName.split(' (')[0]} domesticated a ${SPECIES_CONFIG[other.species].name} for ${col.name}!`, 'text-emerald-300');
                                break;
                            }
                        }
                    }

                    const curFit = this.computeFitness();
                    if (this.energy >= 128 && this.growthProgress >= 0.65 && this.mateCooldown <= 0 && creatures.length < 120) {
                        const mate = creatures.find(o =>
                            o !== this &&
                            o.species === this.species &&
                            o.sex !== this.sex &&
                            o.energy >= 115 &&
                            o.growthProgress >= 0.65 &&
                            o.mateCooldown <= 0 &&
                            Math.hypot(o.x - this.x, o.y - this.y) < 85
                        );
                        if (mate) {
                            const mother = this.sex === 'Female' ? this : mate;
                            const father = this.sex === 'Male' ? this : mate;
                            mother.energy *= 0.58;
                            father.energy *= 0.68;
                            mother.offspring++;
                            father.offspring++;
                            mother.mateCooldown = 360;
                            father.mateCooldown = 360;

                            const crossGenome = crossoverOrganismGenes(mother, father);
                            const speciateBurst = curFit >= 65 && Math.random() < Math.min(0.65, params.mutationRate * 1.15);
                            const child = new Organism(
                                (mother.x + father.x) * 0.5 + (Math.random() - 0.5) * 18,
                                (mother.y + father.y) * 0.5 + (Math.random() - 0.5) * 18,
                                this.species,
                                Math.max(mother.generation, father.generation) + 1,
                                crossGenome,
                                mother.brain,
                                null,
                                {
                                    id: mother.genome.id,
                                    name: mother.realName,
                                    motherName: mother.realName.split(' (')[0],
                                    fatherName: father.realName.split(' (')[0],
                                    resilience: (mother.resilience + father.resilience) * 0.5
                                },
                                speciateBurst
                            );
                            child.brain.absorbMemeticCulture(father.brain, 0.5);
                            child.faction = mother.faction;
                            if (child.isHuman) getOrCreateColonyAt(child.x, child.y, mother);
                            creatures.push(child);
                            matingPulses.push({ x: child.x, y: child.y, radius: 8, alpha: 1.0 });
                            if (child.isHuman) {
                                addChronicleEntry(`${mother.realName.split(' (')[0]} (\u2640) & ${father.realName.split(' (')[0]} (\u2642) had offspring ${child.realName.split(' (')[0]}!`, 'text-pink-300');
                            }
                            if (speciateBurst) {
                                recordEventMarker(`Speciation ${child.genome.id}`, '#c084fc');
                            }
                        }
                    }
                }
            }

            // =========================================================================
            // SECTION 4: GENERATIONAL NEUROEVOLUTION & EVOLUTIONARY CHECKPOINTS
            // =========================================================================
            function runGenerationalNeuroevolution() {
                if (creatures.length < 4) return;
                creatures.forEach(c => c.computeFitness());
                const bySpecies = new Map();
                for (const c of creatures) {
                    if (!bySpecies.has(c.species)) bySpecies.set(c.species, []);
                    bySpecies.get(c.species).push(c);
                }
                let evolvedCount = 0;
                for (const [sp, group] of bySpecies.entries()) {
                    if (group.length < 2) continue;
                    group.sort((a, b) => b.fitness - a.fitness);
                    const elite = group[0];
                    const lowest = group[group.length - 1];
                    if (elite !== lowest && lowest.fitness < elite.fitness * 0.75) {
                        lowest.brain = elite.brain.cloneAndMutate(params.mutationRate, true);
                        lowest.genome = generateUniqueGenome(sp, elite.genome, true);
                        lowest.generation = Math.max(lowest.generation, elite.generation + 1);
                        lowest.parentId = elite.genome.id;
                        lowest.parentName = elite.realName;
                        lowest.energy = Math.max(lowest.energy, 110);
                        lowest.hydration = Math.max(lowest.hydration, 85);
                        if (lowest.generation > maxGeneration) maxGeneration = lowest.generation;
                        evolvedCount++;
                    }
                }
                recordEventMarker(`Gen Selection (${evolvedCount})`, '#2dd4bf');
                addChronicleEntry(`Generational selection refined ${evolvedCount} sub-lineages toward top fitness genomes.`, 'text-teal-300');
                showToast(`Evolved ${evolvedCount} lineages via fitness selection`);
                audioEngine.playChime(698.46, 0.22);
                updateLineageComparePanel();
            }

            function addEvolutionMilestone(title) {
                const snap = captureSimulationSnapshot(title);
                milestones.unshift({
                    id: 'ms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    tick: simTick,
                    era: currentEraIndex,
                    title,
                    snapshot: snap
                });
                if (milestones.length > 8) milestones.pop();
                renderMilestoneStrip();
            }

            function renderMilestoneStrip() {
                const strip = document.getElementById('milestoneStrip');
                if (!strip) return;
                if (!milestones.length) {
                    strip.innerHTML = '<span class="text-slate-500">Milestones appear as lineages evolve...</span>';
                    return;
                }
                strip.innerHTML = milestones.map((m, idx) =>
                    `<button data-milestone-idx="${idx}" title="Restore Tick ${m.tick}: ${m.title}" class="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-teal-500/20 text-teal-200 border border-teal-500/30 shrink-0 transition">T${m.tick} &bull; ${m.title}</button>`
                ).join('');
            }

            function restoreMilestoneByIndex(idx) {
                const m = milestones[idx];
                if (!m || !m.snapshot) return;
                applySimulationSnapshot(m.snapshot, `Milestone T${m.tick} (${m.title})`);
            }

            // =========================================================================
            // SECTION 5: MINECRAFT PIXEL TEXTURES, GLSL SHADERS, FPV & 3D WORLD
            // =========================================================================
            let minecraftTextures = null;
            function getMinecraftTextures() {
                if (minecraftTextures) return minecraftTextures;
                const hsh = (x, y, k = 0) => {
                    const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
                    return v - Math.floor(v);
                };
                const edgeBevel = (g, s) => {
                    g.fillStyle = 'rgba(255,255,255,0.09)';
                    g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s);
                    g.fillStyle = 'rgba(0,0,0,0.18)';
                    g.fillRect(0, s - 1, s, 1); g.fillRect(s - 1, 0, 1, s);
                };
                const makePixelTex = (drawFn, size = 16) => {
                    const cv = document.createElement('canvas');
                    cv.width = size; cv.height = size;
                    const g = cv.getContext('2d');
                    drawFn(g, size);
                    const tex = new THREE.CanvasTexture(cv);
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    return tex;
                };

                const grassTop = makePixelTex((g, s) => {
                    const cols = ['#73a839', '#61932e', '#84bd44', '#568527'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        g.fillStyle = cols[Math.floor(hsh(x, y, 1) * cols.length)];
                        g.fillRect(x, y, 1, 1);
                    }
                    for (let f = 0; f < 6; f++) {
                        g.fillStyle = f % 2 ? '#a2d660' : '#46701f';
                        g.fillRect(Math.floor(hsh(f, 9) * s), Math.floor(hsh(f, 11) * s), 1, 1);
                    }
                    edgeBevel(g, s);
                });

                const grassSide = makePixelTex((g, s) => {
                    const dirt = ['#7d4e2d', '#6b4022', '#8f5d38', '#5c341a'];
                    const grass = ['#73a839', '#61932e', '#84bd44'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        const edge = 3 + ((x * 5) % 3);
                        g.fillStyle = y < edge ? grass[Math.floor(hsh(x, y, 5) * grass.length)] : dirt[Math.floor(hsh(x, y, 6) * dirt.length)];
                        g.fillRect(x, y, 1, 1);
                        if (y >= edge && y < edge + 2) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, y, 1, 1); }
                    }
                    edgeBevel(g, s);
                });

                const sandTex = makePixelTex((g, s) => {
                    const cols = ['#eddba9', '#e2cc94', '#f4e6bb', '#d6bf85'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        g.fillStyle = cols[Math.floor(hsh(x, y, 2) * cols.length)];
                        g.fillRect(x, y, 1, 1);
                    }
                    edgeBevel(g, s);
                });

                const stoneTex = makePixelTex((g, s) => {
                    const cols = ['#7f858d', '#6d737b', '#8d949c', '#5e646c'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        g.fillStyle = cols[Math.floor(hsh(x, y, 7) * cols.length)];
                        g.fillRect(x, y, 1, 1);
                    }
                    edgeBevel(g, s);
                });

                const barkTex = makePixelTex((g, s) => {
                    const cols = ['#5c3d24', '#4b301b', '#6b492d', '#3e2715'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        g.fillStyle = cols[(x * 3 + (y >> 1)) % cols.length];
                        g.fillRect(x, y, 1, 1);
                    }
                    edgeBevel(g, s);
                });

                const leafTex = makePixelTex((g, s) => {
                    const cols = ['#3f7d2c', '#2f6320', '#4f9138', '#254f19'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        g.fillStyle = cols[Math.floor(hsh(x, y, 3) * cols.length)];
                        g.fillRect(x, y, 1, 1);
                    }
                    edgeBevel(g, s);
                });

                const planksTex = makePixelTex((g, s) => {
                    const cols = ['#b8844c', '#a6743f', '#c7935a', '#946534'];
                    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
                        const seam = y % 4 === 0 || (x === ((y >> 2) * 5) % s);
                        g.fillStyle = seam ? '#6b4420' : cols[Math.floor(hsh(x, y >> 2, 8) * cols.length)];
                        g.fillRect(x, y, 1, 1);
                    }
                    edgeBevel(g, s);
                });

                minecraftTextures = { grassTop, grassSide, sandTex, stoneTex, barkTex, leafTex, planksTex };
                return minecraftTextures;
            }

            function syncFpvHudVisibility() {
                const stack = document.getElementById('fpvHudStack');
                const banner = document.getElementById('fpvBanner');
                const active = Boolean(isFpvMode && selectedCreature && creatures.includes(selectedCreature));
                document.body.classList.toggle('fpv-active', active);
                if (stack) stack.classList.toggle('hidden', !active);
                if (banner) banner.classList.toggle('hidden', !active);
            }

            function exitFpvMode(silent = false) {
                isFpvMode = false;
                document.body.classList.remove('fpv-clean-view');
                document.getElementById('fpvRestoreUiButton')?.classList.add('hidden');
                fpvCam.active = false;
                fpvCam.isDraggingLook = false;
                fpvCam.yawOffset = 0;
                fpvCam.pitchOffset = 0;
                fpvCam.rollAngle = 0;
                fpvCam.recenterTimer = 0;
                fpvCam.transitionMix = 0;
                if (threeState.perspCamera) threeState.perspCamera.up.set(0, 1, 0);
                const fpvBtn = document.getElementById('btnFpvBot');
                const fpvText = document.getElementById('textFpvBot');
                if (fpvBtn) { fpvBtn.classList.remove('insp-on'); fpvBtn.setAttribute('aria-pressed', 'false'); }
                if (fpvText) fpvText.textContent = 'FPV: OFF';
                syncFpvHudVisibility();
                if (!silent) showToast('Exited First-Person View');
            }

            function enterFpvForCreature(creature) {
                if (!creature || !creatures.includes(creature)) return;
                selectedCreature = creature;
                isFpvMode = true;
                fpvCam.active = true;
                fpvCam.yawOffset = 0;
                fpvCam.pitchOffset = 0;
                fpvCam.rollAngle = 0;
                fpvCam.prevHeading = creature.angle;
                fpvCam.bobPhase = creature.walkPhase || 0;
                fpvCam.recenterTimer = 0;
                fpvCam.transitionMix = 0.25;

                const elev = getWorldElevation(creature.x, creature.y);
                const gy = terraceHeightY(elev);
                const s = creature.genome.size * (0.65 + creature.growthProgress * 0.42);
                const sphere = creature.genome.sphereAffinity;
                const eyeY = gy + (creature.isHuman ? s * 2.45 : sphere === 'ATMOSPHERE' ? 39 : sphere === 'OCEAN' ? s * 0.85 : s * 1.42);
                fpvCam.pos.set(creature.x + Math.cos(creature.angle) * s * 0.8, eyeY, creature.y + Math.sin(creature.angle) * s * 0.8);
                fpvCam.lookAt.set(creature.x + Math.cos(creature.angle) * 180, eyeY - 8, creature.y + Math.sin(creature.angle) * 180);

                document.getElementById('inspectorCard').classList.remove('hidden');
                const fpvBtn = document.getElementById('btnFpvBot');
                const fpvText = document.getElementById('textFpvBot');
                if (fpvBtn) { fpvBtn.classList.add('insp-on'); fpvBtn.setAttribute('aria-pressed', 'true'); }
                if (fpvText) fpvText.textContent = 'FPV: ON';
                syncFpvHudVisibility();
                updateInspectorHUD();
                updateFpvTelemetryHud();
                showToast(`FPV: ${creature.realName} (Drag or use Arrow keys to look)`);
            }

            function cycleFpvSubject(step) {
                if (!creatures.length) return;
                const currentIdx = selectedCreature ? creatures.indexOf(selectedCreature) : -1;
                const nextIdx = currentIdx >= 0 ? (currentIdx + step + creatures.length) % creatures.length : 0;
                enterFpvForCreature(creatures[nextIdx]);
            }

            function updateFpvCameraAndHud(creature) {
                const elev = getWorldElevation(creature.x, creature.y);
                const gy = terraceHeightY(elev);
                const s = creature.genome.size * (0.65 + creature.growthProgress * 0.42);
                const sphere = creature.genome.sphereAffinity;

                const keyTurnSpeed = 0.032;
                const keyPitchSpeed = 0.022;
                let keyboardMovedLook = false;
                if (fpvCam.keysDown.has('ArrowLeft')) { fpvCam.yawOffset += keyTurnSpeed; keyboardMovedLook = true; }
                if (fpvCam.keysDown.has('ArrowRight')) { fpvCam.yawOffset -= keyTurnSpeed; keyboardMovedLook = true; }
                if (fpvCam.keysDown.has('ArrowUp')) { fpvCam.pitchOffset = Math.min(0.62, fpvCam.pitchOffset + keyPitchSpeed); keyboardMovedLook = true; }
                if (fpvCam.keysDown.has('ArrowDown')) { fpvCam.pitchOffset = Math.max(-0.55, fpvCam.pitchOffset - keyPitchSpeed); keyboardMovedLook = true; }
                if (keyboardMovedLook) fpvCam.recenterTimer = 110;

                fpvCam.yawOffset = Math.max(-1.65, Math.min(1.65, fpvCam.yawOffset));
                fpvCam.pitchOffset = Math.max(-0.55, Math.min(0.62, fpvCam.pitchOffset));

                if (!fpvCam.isDraggingLook && !keyboardMovedLook) {
                    if (fpvCam.recenterTimer > 0) fpvCam.recenterTimer--;
                    else {
                        fpvCam.yawOffset *= 0.965;
                        fpvCam.pitchOffset *= 0.955;
                        if (Math.abs(fpvCam.yawOffset) < 0.002) fpvCam.yawOffset = 0;
                        if (Math.abs(fpvCam.pitchOffset) < 0.002) fpvCam.pitchOffset = 0;
                    }
                }

                const angDelta = Math.atan2(Math.sin(creature.angle - fpvCam.prevHeading), Math.cos(creature.angle - fpvCam.prevHeading));
                fpvCam.prevHeading = creature.angle;
                const bankMultiplier = sphere === 'ATMOSPHERE' ? 1.55 : sphere === 'OCEAN' ? 1.25 : 0.48;
                const maxRoll = sphere === 'ATMOSPHERE' ? 0.34 : sphere === 'OCEAN' ? 0.24 : 0.10;
                const targetRoll = Math.max(-maxRoll, Math.min(maxRoll, -angDelta * 4.2 * bankMultiplier));
                fpvCam.rollAngle += (targetRoll - fpvCam.rollAngle) * 0.14;

                const speedMag = Math.hypot(creature.vx, creature.vy);
                fpvCam.bobPhase += 0.14 + speedMag * 0.065;
                let baseEyeHeight = gy + s * 1.42;
                let bobOffsetY = Math.abs(Math.sin(fpvCam.bobPhase)) * 1.65;
                let bobSideOffset = Math.sin(fpvCam.bobPhase * 0.5) * 0.85;

                if (creature.isHuman) {
                    const hScale = 0.82 + (creature.humanAnnStage || 0) * 0.08;
                    baseEyeHeight = Math.max(gy + 22, gy + s * hScale * 2.65);
                    bobOffsetY = Math.abs(Math.sin(fpvCam.bobPhase)) * 1.4;
                    bobSideOffset = Math.sin(fpvCam.bobPhase * 0.5) * 0.7;
                } else if (sphere === 'ATMOSPHERE') {
                    const hoverOsc = Math.sin(creature.walkPhase * 0.6) * 4.0;
                    baseEyeHeight = gy + 39.5 + hoverOsc;
                    bobOffsetY = Math.sin(fpvCam.bobPhase * 0.8) * 1.3;
                    bobSideOffset = 0;
                } else if (sphere === 'OCEAN') {
                    const waveH = computeOceanWaveHeight(creature.x, creature.y, renderFrame * 0.045, currentWeather);
                    const swimOsc = Math.sin(creature.walkPhase * 0.5) * 2.2;
                    baseEyeHeight = Math.max(gy + s * 0.9, -6.5 + waveH + swimOsc);
                    bobOffsetY = Math.sin(fpvCam.bobPhase * 0.7) * 1.1;
                    bobSideOffset = Math.cos(fpvCam.bobPhase * 0.5) * 0.9;
                }

                const viewYaw = creature.angle + fpvCam.yawOffset;
                const cosV = Math.cos(viewYaw);
                const sinV = Math.sin(viewYaw);
                const perpX = -sinV;
                const perpZ = cosV;

                const forwardLead = creature.isHuman ? s * 0.75 : s * 0.92;
                const desiredPosX = creature.x + Math.cos(creature.angle) * forwardLead + perpX * bobSideOffset;
                const desiredPosY = baseEyeHeight + bobOffsetY;
                const desiredPosZ = creature.y + Math.sin(creature.angle) * forwardLead + perpZ * bobSideOffset;

                fpvCam.transitionMix = Math.min(1, fpvCam.transitionMix + 0.08);
                const posLerp = 0.24 + fpvCam.transitionMix * 0.14;
                fpvCam.pos.x += (desiredPosX - fpvCam.pos.x) * posLerp;
                fpvCam.pos.y += (desiredPosY - fpvCam.pos.y) * posLerp;
                fpvCam.pos.z += (desiredPosZ - fpvCam.pos.z) * posLerp;

                const lookDist = 210;
                const pitchLift = Math.tan(fpvCam.pitchOffset) * lookDist - 10;
                fpvCam.lookAt.x += (fpvCam.pos.x + cosV * lookDist - fpvCam.lookAt.x) * 0.34;
                fpvCam.lookAt.y += (fpvCam.pos.y + pitchLift - fpvCam.lookAt.y) * 0.34;
                fpvCam.lookAt.z += (fpvCam.pos.z + sinV * lookDist - fpvCam.lookAt.z) * 0.34;

                const forwardVec = new THREE.Vector3().subVectors(fpvCam.lookAt, fpvCam.pos).normalize();
                const worldUp = new THREE.Vector3(0, 1, 0);
                const rightVec = new THREE.Vector3().crossVectors(forwardVec, worldUp).normalize();
                const baseUp = new THREE.Vector3().crossVectors(rightVec, forwardVec).normalize();
                const bankedUp = baseUp.clone().multiplyScalar(Math.cos(fpvCam.rollAngle)).addScaledVector(rightVec, Math.sin(fpvCam.rollAngle)).normalize();

                threeState.perspCamera.up.copy(bankedUp);
                threeState.perspCamera.position.copy(fpvCam.pos);
                threeState.perspCamera.lookAt(fpvCam.lookAt);

                camera.x = creature.x;
                camera.y = creature.y;

                updateFpvTelemetryHud(creature, speedMag);
            }

            function updateFpvTelemetryHud(creature = selectedCreature, speedMag = null) {
                if (!isFpvMode || !creature || !creatures.includes(creature)) return;
                const bannerText = document.getElementById('fpvBannerText');
                const sphereBadge = document.getElementById('fpvSphereBadge');
                const statePill = document.getElementById('fpvStatePill');
                const vitalsEl = document.getElementById('fpvVitalsMetric');
                const kinEl = document.getElementById('fpvKinematicsMetric');
                const gazeEl = document.getElementById('fpvGazeMetric');

                if (bannerText) bannerText.textContent = `FPV: ${creature.realName} (${creature.genome.id})`;
                if (sphereBadge) sphereBadge.textContent = creature.genome.sphereAffinity;
                if (statePill) statePill.textContent = creature.stateLabel;
                if (vitalsEl) {
                    const nrgPct = Math.max(0, Math.min(100, Math.round((creature.energy / creature.maxEnergy) * 100)));
                    const hydPct = Math.max(0, Math.min(100, Math.round(creature.hydration)));
                    const strPct = Math.round((creature.stress || 0) * 100);
                    vitalsEl.textContent = `NRG ${nrgPct}% \u2022 HYD ${hydPct}% \u2022 STR ${strPct}%`;
                }
                if (kinEl) {
                    const spd = speedMag !== null ? speedMag : Math.hypot(creature.vx, creature.vy);
                    const deg = Math.round((((creature.angle * 180) / Math.PI) % 360 + 360) % 360);
                    kinEl.textContent = `SPD ${spd.toFixed(1)} \u2022 HDG ${String(deg).padStart(3, '0')}\u00B0`;
                }
                if (gazeEl) {
                    const gazeDeg = Math.round((fpvCam.yawOffset * 180) / Math.PI);
                    const sign = gazeDeg > 0 ? '+' : '';
                    gazeEl.textContent = `GAZE ${sign}${gazeDeg}\u00B0 \u2022 Drag/Arrows to Look`;
                }
            }

            function computeOceanWaveHeight(vx, vz, wt, weather) {
                const ampScale = weather === 'storm' ? 1.85 : weather === 'rain' ? 1.32 : weather === 'mist' ? 0.78 : 1.0;
                const swell1 = Math.sin(vx * 0.0021 + vz * 0.0009 + wt) * 3.8;
                const swell2 = Math.cos(-vx * 0.0014 + vz * 0.0025 - wt * 0.82) * 2.5;
                const chop = Math.sin(vx * 0.0062 - vz * 0.0054 + wt * 1.55) * 1.15;
                const rainBoost = (weather === 'rain' || weather === 'storm') ? 0.75 : 0.35;
                const ripple = Math.cos((vx + vz) * 0.0145 + wt * 2.3) * rainBoost;
                return (swell1 + swell2 + chop + ripple) * ampScale + tideOffset * 4.5;
            }

            function computeShoalFactor(wx, wz) {
                let maxShoal = 0;
                for (let i = 0; i < ISLAND_ARCHIPELAGO.length; i++) {
                    const isl = ISLAND_ARCHIPELAGO[i];
                    const d = Math.hypot(wx - isl.x, wz - isl.y);
                    const shelfBand = 1.0 - Math.min(1.0, Math.abs(d - isl.radius * 0.92) / (isl.radius * 0.55));
                    const innerLagoon = d < isl.radius * 0.92 ? 0.88 : 0.0;
                    const s = Math.max(shelfBand * 0.92, innerLagoon);
                    if (s > maxShoal) maxShoal = s;
                }
                for (let j = 0; j < springs.length; j++) {
                    const sp = springs[j];
                    const sd = Math.hypot(wx - sp.x, wz - sp.y);
                    if (sd < sp.radius * 2.2) maxShoal = Math.max(maxShoal, (1 - sd / (sp.radius * 2.2)) * 0.78);
                }
                return Math.max(0, Math.min(1, maxShoal));
            }

            const MAX_SHADER_RIPPLES = 12;

            function createCustomOceanShaderMaterial(eraColorHex) {
                const rippleArray = Array.from({ length: MAX_SHADER_RIPPLES }, () => new THREE.Vector4(0, 0, -999, 0));
                const uniforms = {
                    uTime: { value: 0 },
                    uShallowColor: { value: new THREE.Color('#2dd4bf') },
                    uDeepColor: { value: new THREE.Color(eraColorHex).lerp(new THREE.Color('#031829'), 0.65) },
                    uSkyReflectColor: { value: new THREE.Color('#bae6fd') },
                    uSunDir: { value: new THREE.Vector3(-0.55, 0.72, 0.42).normalize() },
                    uStormMix: { value: 0.0 },
                    uNightMix: { value: 0.0 },
                    uTideOffset: { value: 0.0 },
                    uRippleCenters: { value: rippleArray }
                };

                const vertexShader = /* glsl */ `
                    attribute float aShoal;
                    uniform float uTime;
                    uniform float uStormMix;
                    uniform float uTideOffset;
                    uniform vec4 uRippleCenters[${MAX_SHADER_RIPPLES}];
                    varying vec3 vWorldPos;
                    varying float vShoal;
                    varying float vWaveCrest;
                    varying float vRippleAmp;

                    float waveField(vec2 p, float t, float storm) {
                        float amp = mix(1.0, 1.82, storm);
                        float w1 = sin(p.x * 0.0021 + p.y * 0.0009 + t) * 3.8;
                        float w2 = cos(-p.x * 0.0014 + p.y * 0.0025 - t * 0.82) * 2.5;
                        float w3 = sin(p.x * 0.0062 - p.y * 0.0054 + t * 1.55) * 1.15;
                        float w4 = cos((p.x + p.y) * 0.0145 + t * 2.3) * mix(0.35, 0.78, storm);
                        return (w1 + w2 + w3 + w4) * amp + uTideOffset * 4.5;
                    }

                    void main() {
                        vShoal = aShoal;
                        vec4 worldBase = modelMatrix * vec4(position, 1.0);
                        float h = waveField(worldBase.xz, uTime, uStormMix);
                        float ripAccum = 0.0;
                        for (int i = 0; i < ${MAX_SHADER_RIPPLES}; i++) {
                            vec4 rc = uRippleCenters[i];
                            float age = uTime - rc.z;
                            if (age > 0.0 && age < 6.5 && rc.w > 0.001) {
                                float dist = distance(worldBase.xz, rc.xy);
                                float front = age * 38.0;
                                float band = exp(-pow((dist - front) * 0.045, 2.0));
                                float decay = exp(-age * 0.55) * rc.w;
                                ripAccum += sin((dist - front) * 0.24) * band * decay * 2.4;
                            }
                        }
                        worldBase.y += h + ripAccum;
                        vWorldPos = worldBase.xyz;
                        vWaveCrest = clamp((h + 5.0) / 11.0, 0.0, 1.0);
                        vRippleAmp = clamp(abs(ripAccum) * 0.55, 0.0, 1.0);
                        gl_Position = projectionMatrix * viewMatrix * worldBase;
                    }
                `;

                const fragmentShader = /* glsl */ `
                    uniform float uTime;
                    uniform vec3 uShallowColor;
                    uniform vec3 uDeepColor;
                    uniform vec3 uSkyReflectColor;
                    uniform vec3 uSunDir;
                    uniform float uStormMix;
                    uniform float uNightMix;
                    uniform vec4 uRippleCenters[${MAX_SHADER_RIPPLES}];
                    varying vec3 vWorldPos;
                    varying float vShoal;
                    varying float vWaveCrest;
                    varying float vRippleAmp;

                    float hash21(vec2 p) {
                        p = fract(p * vec2(123.34, 456.21));
                        p += dot(p, p + 45.32);
                        return fract(p.x * p.y);
                    }

                    float vnoise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        float a = hash21(i);
                        float b = hash21(i + vec2(1.0, 0.0));
                        float c = hash21(i + vec2(0.0, 1.0));
                        float d = hash21(i + vec2(1.0, 1.0));
                        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                    }

                    void main() {
                        vec2 p = vWorldPos.xz;
                        float nA = vnoise(p * 0.011 + vec2(uTime * 0.35, -uTime * 0.22));
                        float nB = vnoise(p * 0.027 - vec2(uTime * 0.48, uTime * 0.31));
                        float r1 = sin(p.x * 0.019 + uTime * 1.6 + nA * 2.4) * cos(p.y * 0.017 - uTime * 1.3 + nB * 2.1);
                        float r2 = cos((p.x - p.y) * 0.031 + uTime * 2.2 - nA * 1.8);

                        float ringSlopeX = 0.0;
                        float ringSlopeZ = 0.0;
                        float ringHighlight = 0.0;
                        for (int i = 0; i < ${MAX_SHADER_RIPPLES}; i++) {
                            vec4 rc = uRippleCenters[i];
                            float age = uTime - rc.z;
                            if (age > 0.0 && age < 6.5 && rc.w > 0.001) {
                                vec2 delta = p - rc.xy;
                                float dist = max(0.001, length(delta));
                                float front = age * 38.0;
                                float band = exp(-pow((dist - front) * 0.045, 2.0));
                                float decay = exp(-age * 0.55) * rc.w;
                                float waveDeriv = cos((dist - front) * 0.24) * band * decay * 0.42;
                                vec2 dir = delta / dist;
                                ringSlopeX += dir.x * waveDeriv;
                                ringSlopeZ += dir.y * waveDeriv;
                                ringHighlight += smoothstep(0.35, 0.95, abs(sin((dist - front) * 0.24))) * band * decay * 0.32;
                            }
                        }

                        vec3 n = normalize(vec3((r1 + r2) * 0.16 + ringSlopeX, 1.0, (r1 - r2) * 0.16 + ringSlopeZ));
                        vec3 viewDir = normalize(cameraPosition - vWorldPos);
                        float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 3.0);

                        vec3 abyssEmerald = vec3(0.015, 0.085, 0.135);
                        vec3 deepCol = mix(uDeepColor, abyssEmerald, clamp(0.45 + uNightMix * 0.45, 0.0, 1.0));
                        vec3 beerTint = exp(-(1.0 - clamp(vShoal, 0.0, 1.0)) * vec3(1.55, 0.68, 0.42));
                        vec3 baseWater = mix(deepCol, uShallowColor, clamp(vShoal * 0.88 + vWaveCrest * 0.22 + (nA - 0.5) * 0.12, 0.0, 1.0)) * mix(vec3(1.0), beerTint, 0.35);
                        vec3 stormTint = vec3(0.16, 0.23, 0.31);
                        baseWater = mix(baseWater, stormTint, uStormMix * 0.68);

                        float spec = pow(max(dot(reflect(-uSunDir, n), viewDir), 0.0), 64.0);
                        float glint = smoothstep(0.62, 0.96, nA * nB) * (1.0 - uNightMix * 0.72) * 0.22;
                        float caustics = smoothstep(0.58, 0.88, 0.5 + 0.5 * sin(p.x * 0.045 + nB * 4.0 + uTime * 1.8) * cos(p.y * 0.045 - nA * 4.0 - uTime * 1.4));
                        float foamBand = smoothstep(0.54, 0.92, vShoal + (nB - 0.5) * 0.14) * (0.5 + 0.5 * sin(vShoal * 24.0 - uTime * 3.4));
                        float crestFoam = smoothstep(0.75, 0.98, vWaveCrest) * mix(0.16, 0.46, uStormMix);

                        float backLight = pow(clamp(dot(-uSunDir, viewDir), 0.0, 1.0), 2.5);
                        float crestSSS = smoothstep(0.48, 0.96, vWaveCrest) * (0.35 + 0.65 * backLight) * (1.0 - uStormMix * 0.45);
                        vec3 sssTint = mix(vec3(0.16, 0.92, 0.82), vec3(1.0, 0.72, 0.32), clamp(1.0 - uSunDir.y * 1.2, 0.0, 1.0));

                        vec3 col = mix(baseWater, uSkyReflectColor, fresnel * (1.0 - uNightMix * 0.52) * 0.56);
                        col += sssTint * crestSSS * 0.42;
                        col += vec3(0.45, 0.96, 0.88) * caustics * vShoal * (1.0 - uStormMix * 0.7) * 0.24;
                        col += vec3(0.65, 0.98, 0.96) * clamp(ringHighlight + vRippleAmp * 0.25, 0.0, 0.65);
                        col += vec3(0.96, 0.99, 1.0) * (spec * 0.82 + glint) * (1.0 - uNightMix * 0.65);
                        col = mix(col, vec3(0.90, 0.99, 1.0), clamp(foamBand * 0.38 + crestFoam, 0.0, 0.68));

                        gl_FragColor = vec4(col, 0.95);
                    }
                `;

                const mat = new THREE.ShaderMaterial({
                    uniforms,
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    depthWrite: true
                });
                mat.userData.isCustomShader = true;
                return mat;
            }

            function injectTerrainAndFoliageShaders(material, opts = {}) {
                if (!material || material.userData.dlShaderPatched) return material;
                material.userData.dlShaderPatched = true;
                const isFoliage = Boolean(opts.isFoliage);
                const isTerrain = Boolean(opts.isTerrain);
                const swayAmp = opts.swayAmp || 0.0;

                material.onBeforeCompile = (shader) => {
                    shader.uniforms.uTime = threeState.sharedShaderUniforms.uTime;
                    shader.uniforms.uStormMix = threeState.sharedShaderUniforms.uStormMix;
                    shader.uniforms.uCloudOpacity = threeState.sharedShaderUniforms.uCloudOpacity;
                    shader.uniforms.uLightningFlash = threeState.sharedShaderUniforms.uLightningFlash;
                    shader.uniforms.uWaterLevel = threeState.sharedShaderUniforms.uWaterLevel;
                    shader.uniforms.uSoilFertility = threeState.sharedShaderUniforms.uSoilFertility;
                    shader.uniforms.uSwayAmp = { value: swayAmp };

                    material.userData.shaderUniforms = shader.uniforms;

                    shader.vertexShader = shader.vertexShader
                        .replace(
                            '#include <common>',
                            /* glsl */ `
                            #include <common>
                            uniform float uTime;
                            uniform float uStormMix;
                            uniform float uSwayAmp;
                            varying vec3 vDlWorldPos;
                            varying vec3 vDlWorldNormal;
                            `
                        )
                        .replace(
                            '#include <begin_vertex>',
                            /* glsl */ `
                            #include <begin_vertex>
                            vec4 instBasePos = vec4(transformed, 1.0);
                            #ifdef USE_INSTANCING
                                instBasePos = instanceMatrix * instBasePos;
                            #endif
                            vec4 dlWorldCheck = modelMatrix * instBasePos;
                            if (uSwayAmp > 0.0001) {
                                float hWeight = clamp((position.y + 8.0) / 28.0, 0.0, 1.0);
                                float gust = sin(dlWorldCheck.x * 0.015 + dlWorldCheck.z * 0.012 + uTime * (1.8 + uStormMix * 2.6))
                                           + 0.45 * cos(dlWorldCheck.z * 0.028 - uTime * 3.1);
                                float disp = gust * hWeight * uSwayAmp * (1.0 + uStormMix * 1.45);
                                transformed.x += disp;
                                transformed.z += disp * 0.65;
                            }
                            `
                        )
                        .replace(
                            '#include <worldpos_vertex>',
                            /* glsl */ `
                            #include <worldpos_vertex>
                            vec4 dlWp = vec4(transformed, 1.0);
                            #ifdef USE_INSTANCING
                                dlWp = instanceMatrix * dlWp;
                            #endif
                            dlWp = modelMatrix * dlWp;
                            vDlWorldPos = dlWp.xyz;
                            vec3 dlWn = objectNormal;
                            #ifdef USE_INSTANCING
                                dlWn = mat3(instanceMatrix) * dlWn;
                            #endif
                            vDlWorldNormal = normalize(mat3(modelMatrix) * dlWn);
                            `
                        );

                    shader.fragmentShader = shader.fragmentShader
                        .replace(
                            '#include <common>',
                            /* glsl */ `
                            #include <common>
                            uniform float uTime;
                            uniform float uStormMix;
                            uniform float uCloudOpacity;
                            uniform float uLightningFlash;
                            uniform float uWaterLevel;
                            uniform float uSoilFertility;
                            varying vec3 vDlWorldPos;
                            varying vec3 vDlWorldNormal;

                            float dlHash(vec2 p) {
                                p = fract(p * vec2(127.1, 311.7));
                                p += dot(p, p + 34.5);
                                return fract(p.x * p.y);
                            }
                            float dlNoise(vec2 p) {
                                vec2 i = floor(p);
                                vec2 f = fract(p);
                                f = f * f * (3.0 - 2.0 * f);
                                return mix(
                                    mix(dlHash(i), dlHash(i + vec2(1.0, 0.0)), f.x),
                                    mix(dlHash(i + vec2(0.0, 1.0)), dlHash(i + vec2(1.0, 1.0)), f.x),
                                    f.y
                                );
                            }
                            `
                        )
                        .replace(
                            '#include <color_fragment>',
                            /* glsl */ `
                            #include <color_fragment>
                            ${isTerrain ? /* glsl */ `
                                float heightAboveWater = vDlWorldPos.y - uWaterLevel;
                                float fertTint = clamp((uSoilFertility - 1.0) * 0.25, -0.14, 0.18);
                                diffuseColor.rgb *= (1.0 + fertTint * vec3(-0.08, 0.18, -0.06));
                                float wetBand = 1.0 - smoothstep(0.0, 7.5, abs(heightAboveWater));
                                diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.58, wetBand * 0.85);
                            ` : ''}
                            float cUv1 = dlNoise(vDlWorldPos.xz * 0.0024 + vec2(uTime * 0.045, uTime * 0.025));
                            float cUv2 = dlNoise(vDlWorldPos.xz * 0.0052 - vec2(uTime * 0.03, -uTime * 0.05));
                            float cloudPattern = smoothstep(0.46, 0.82, cUv1 * 0.65 + cUv2 * 0.35);
                            float cloudShadow = cloudPattern * uCloudOpacity * (${isFoliage ? '0.38' : '0.48'});
                            diffuseColor.rgb *= (1.0 - cloudShadow);
                            diffuseColor.rgb += vec3(0.72, 0.86, 1.0) * uLightningFlash * 0.26;
                            `
                        )
                        .replace(
                            '#include <roughnessmap_fragment>',
                            /* glsl */ `
                            #include <roughnessmap_fragment>
                            ${isTerrain ? /* glsl */ `
                                float wetGloss = 1.0 - smoothstep(0.0, 7.5, abs(vDlWorldPos.y - uWaterLevel));
                                roughnessFactor = mix(roughnessFactor, 0.14, wetGloss * 0.88);
                            ` : ''}
                            `
                        );
                };
                material.customProgramCacheKey = () => `dl_vox_${isTerrain ? 't' : 'o'}_${isFoliage ? 'f' : 's'}_${swayAmp.toFixed(3)}`;
                return material;
            }

            function injectOrganismRimShader(material, opts = {}) {
                if (!material || material.userData.dlRimPatched) return material;
                material.userData.dlRimPatched = true;
                const rimCol = new THREE.Color(opts.rimHex || '#5eead4');
                material.onBeforeCompile = (shader) => {
                    shader.uniforms.uTime = threeState.sharedShaderUniforms.uTime;
                    shader.uniforms.uNightMix = threeState.sharedShaderUniforms.uNightMix;
                    shader.uniforms.uRimColor = { value: rimCol };
                    shader.uniforms.uRimStrength = { value: opts.rimStrength || 0.35 };
                    material.userData.rimUniforms = shader.uniforms;

                    shader.vertexShader = shader.vertexShader
                        .replace(
                            '#include <common>',
                            /* glsl */ `
                            #include <common>
                            varying vec3 vRimWorldPos;
                            varying vec3 vRimWorldNormal;
                            `
                        )
                        .replace(
                            '#include <worldpos_vertex>',
                            /* glsl */ `
                            #include <worldpos_vertex>
                            vec4 rwPos = modelMatrix * vec4(transformed, 1.0);
                            vRimWorldPos = rwPos.xyz;
                            vRimWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
                            `
                        );

                    shader.fragmentShader = shader.fragmentShader
                        .replace(
                            '#include <common>',
                            /* glsl */ `
                            #include <common>
                            uniform float uTime;
                            uniform float uNightMix;
                            uniform vec3 uRimColor;
                            uniform float uRimStrength;
                            varying vec3 vRimWorldPos;
                            varying vec3 vRimWorldNormal;
                            `
                        )
                        .replace(
                            '#include <dithering_fragment>',
                            /* glsl */ `
                            vec3 vDir = normalize(cameraPosition - vRimWorldPos);
                            float fres = pow(1.0 - max(dot(normalize(vRimWorldNormal), vDir), 0.0), 2.6);
                            float pulse = 0.85 + 0.15 * sin(uTime * 3.2);
                            gl_FragColor.rgb += uRimColor * fres * uRimStrength * pulse * (0.75 + uNightMix * 0.75);
                            #include <dithering_fragment>
                            `
                        );
                };
                material.customProgramCacheKey = () => `dl_rim_${rimCol.getHexString()}_${(opts.rimStrength || 0.35).toFixed(2)}`;
                return material;
            }

            const threeState = {
                renderer: null, scene: null, camera: null, worldGroup: null,
                sunLight: null, hemiLight: null, fillLight: null, rimLight: null, cloudGroup: null, houseGlowMat: null,
                beaconSpire: null, ambientDustPoints: null, ambientDustBase: null,
                skyDomeMesh: null, skyDomeMat: null, mistPlaneMesh: null, mistPlaneMat: null,
                sharedShaderUniforms: {
                    uTime: { value: 0 },
                    uStormMix: { value: 0 },
                    uNightMix: { value: 0 },
                    uCloudOpacity: { value: 0.45 },
                    uLightningFlash: { value: 0 },
                    uWaterLevel: { value: -15.5 },
                    uSoilFertility: { value: 1.0 }
                },
                rippleSlots: [],
                rippleCursor: 0,
                oceanMesh: null, oceanBasePos: null, oceanBaseColor: null,
                shimmerMesh: null, shimmerBasePos: null,
                foamRings: [], wakeMesh: null, lightningLine: null,
                creatureMeshes: new Map(), nutrientMesh: null, initialized: false, width: 0, height: 0
            };

            function emitOceanRipple(x, z, strength = 0.65) {
                if (!threeState.rippleSlots.length) return;
                const wt = renderFrame * 0.045;
                const slot = threeState.rippleSlots[threeState.rippleCursor];
                threeState.rippleCursor = (threeState.rippleCursor + 1) % threeState.rippleSlots.length;
                slot.set(x, z, wt, Math.max(0.1, Math.min(1.5, strength)));
            }

            function createSkyDomeShader() {
                const uniforms = {
                    uTime: { value: 0 },
                    uSunDir: { value: new THREE.Vector3(-0.55, 0.72, 0.42).normalize() },
                    uStormMix: { value: 0.0 },
                    uNightMix: { value: 0.0 },
                    uEraTint: { value: new THREE.Color('#2dd4bf') }
                };
                const vertexShader = /* glsl */ `
                    varying vec3 vWorldDir;
                    void main() {
                        vec4 wp = modelMatrix * vec4(position, 1.0);
                        vWorldDir = normalize(position);
                        gl_Position = projectionMatrix * viewMatrix * wp;
                    }
                `;
                const fragmentShader = /* glsl */ `
                    uniform float uTime;
                    uniform vec3 uSunDir;
                    uniform float uStormMix;
                    uniform float uNightMix;
                    uniform vec3 uEraTint;
                    varying vec3 vWorldDir;

                    float hash31(vec3 p) {
                        p = fract(p * vec3(443.897, 441.423, 437.195));
                        p += dot(p, p.yzx + 19.19);
                        return fract((p.x + p.y) * p.z);
                    }

                    void main() {
                        vec3 d = normalize(vWorldDir);
                        float h = clamp(d.y, 0.0, 1.0);

                        vec3 dayZenith = vec3(0.05, 0.24, 0.48);
                        vec3 dayHorizon = vec3(0.45, 0.80, 0.92);
                        vec3 duskHorizon = vec3(0.95, 0.45, 0.25);
                        vec3 nightZenith = vec3(0.01, 0.03, 0.09);
                        vec3 nightHorizon = vec3(0.04, 0.12, 0.22);

                        float twilight = smoothstep(0.0, 0.35, uSunDir.y) * (1.0 - smoothstep(0.35, 0.75, uSunDir.y));
                        vec3 horizonCol = mix(dayHorizon, duskHorizon, twilight * 0.75);
                        vec3 zenithCol = mix(dayZenith, dayZenith * 0.72 + uEraTint * 0.14, 0.35);

                        vec3 sky = mix(horizonCol, zenithCol, pow(h, 0.62));
                        vec3 nightSky = mix(nightHorizon, nightZenith, pow(h, 0.55));
                        sky = mix(sky, nightSky, clamp(uNightMix * 1.15, 0.0, 0.92));

                        vec3 sunN = normalize(uSunDir);
                        float sunAmt = max(dot(d, sunN), 0.0);
                        float mieGlow = pow(sunAmt, 10.0) * (1.0 - uStormMix * 0.75) * (1.0 - uNightMix * 0.85);
                        float sunDisc = smoothstep(0.9985, 0.9996, sunAmt) * (1.0 - uStormMix * 0.85) * (1.0 - uNightMix * 0.9);
                        sky += vec3(1.0, 0.82, 0.52) * mieGlow * 0.42 + vec3(1.0, 0.97, 0.88) * sunDisc * 1.6;

                        float starSeed = hash31(floor(d * 260.0));
                        float stars = step(0.9965, starSeed) * smoothstep(0.12, 0.75, h) * uNightMix * (1.0 - uStormMix);
                        float aurora = sin(d.x * 9.0 + uTime * 0.6 + d.z * 5.0) * 0.5 + 0.5;
                        aurora *= smoothstep(0.15, 0.55, h) * (1.0 - smoothstep(0.55, 0.92, h));
                        sky += vec3(0.9, 0.96, 1.0) * stars * 1.2;
                        sky += mix(vec3(0.15, 0.95, 0.72), vec3(0.45, 0.35, 0.95), aurora) * aurora * uNightMix * 0.22 * (1.0 - uStormMix);

                        vec3 stormSky = vec3(0.13, 0.18, 0.24);
                        sky = mix(sky, stormSky, uStormMix * 0.72);

                        gl_FragColor = vec4(sky, 1.0);
                    }
                `;
                return new THREE.ShaderMaterial({
                    uniforms,
                    vertexShader,
                    fragmentShader,
                    side: THREE.BackSide,
                    depthWrite: false
                });
            }

            function createMistLayerShader() {
                const uniforms = {
                    uTime: { value: 0 },
                    uMistDensity: { value: 0.12 },
                    uSunDir: { value: new THREE.Vector3(-0.55, 0.72, 0.42).normalize() },
                    uMistColor: { value: new THREE.Color('#99f6e4') }
                };
                const vertexShader = /* glsl */ `
                    varying vec2 vUv;
                    varying vec3 vWorldPos;
                    void main() {
                        vUv = uv;
                        vec4 wp = modelMatrix * vec4(position, 1.0);
                        vWorldPos = wp.xyz;
                        gl_Position = projectionMatrix * viewMatrix * wp;
                    }
                `;
                const fragmentShader = /* glsl */ `
                    uniform float uTime;
                    uniform float uMistDensity;
                    uniform vec3 uSunDir;
                    uniform vec3 uMistColor;
                    varying vec2 vUv;
                    varying vec3 vWorldPos;

                    void main() {
                        vec2 centred = vUv * 2.0 - 1.0;
                        float radialFade = 1.0 - smoothstep(0.25, 1.0, length(centred));
                        float band = sin(vWorldPos.x * 0.002 + uTime * 0.25) * cos(vWorldPos.z * 0.002 - uTime * 0.18);
                        float rayBeam = pow(max(0.0, 0.5 + 0.5 * sin(vWorldPos.x * 0.0045 + vWorldPos.z * 0.003 + uTime * 0.35)), 3.0);
                        float sunBoost = 0.65 + 0.35 * max(0.0, uSunDir.y);
                        float alpha = clamp(radialFade * (0.35 + 0.25 * band + 0.4 * rayBeam) * uMistDensity * sunBoost, 0.0, 0.45);
                        vec3 col = mix(uMistColor, vec3(1.0, 0.94, 0.78), rayBeam * 0.45);
                        gl_FragColor = vec4(col, alpha);
                    }
                `;
                return new THREE.ShaderMaterial({
                    uniforms,
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
            }

            function initThreeWorld() {
                if (!world3dCanvas || typeof THREE === 'undefined') return false;
                try {
                    threeState.renderer = new THREE.WebGLRenderer({ canvas: world3dCanvas, antialias: true, powerPreference: 'high-performance' });
                    threeState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                    threeState.renderer.setSize(window.innerWidth, window.innerHeight, false);
                    threeState.renderer.shadowMap.enabled = true;
                    threeState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    threeState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    threeState.renderer.toneMappingExposure = 1.18;

                    threeState.scene = new THREE.Scene();
                    threeState.scene.background = new THREE.Color('#031522');
                    threeState.scene.fog = new THREE.FogExp2('#031522', 0.000095);

                    threeState.skyDomeMat = createSkyDomeShader();
                    const skyDomeMesh = new THREE.Mesh(new THREE.SphereGeometry(7200, 32, 24), threeState.skyDomeMat);
                    threeState.scene.add(skyDomeMesh);
                    threeState.skyDomeMesh = skyDomeMesh;

                    threeState.mistPlaneMat = createMistLayerShader();
                    const mistPlaneMesh = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000), threeState.mistPlaneMat);
                    mistPlaneMesh.rotation.x = -Math.PI / 2;
                    mistPlaneMesh.position.y = 48;
                    threeState.scene.add(mistPlaneMesh);
                    threeState.mistPlaneMesh = mistPlaneMesh;

                    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
                    const frustum = 950;
                    threeState.orthoCamera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 1, 14000);
                    threeState.orthoCamera.up.set(0, 1, 0);
                    threeState.perspCamera = new THREE.PerspectiveCamera(72, aspect, 0.5, 10000);
                    threeState.perspCamera.up.set(0, 1, 0);
                    threeState.camera = threeState.orthoCamera;

                    const hemi = new THREE.HemisphereLight('#e0f2fe', '#0c2738', 1.55);
                    threeState.scene.add(hemi);
                    threeState.hemiLight = hemi;

                    const sun = new THREE.DirectionalLight('#fffbeb', 2.35);
                    sun.position.set(-1400, 2100, 1250);
                    sun.castShadow = true;
                    sun.shadow.mapSize.set(3072, 3072);
                    const sBound = 4200;
                    sun.shadow.camera.near = 200;
                    sun.shadow.camera.far = 7500;
                    sun.shadow.camera.left = -sBound;
                    sun.shadow.camera.right = sBound;
                    sun.shadow.camera.top = sBound;
                    sun.shadow.camera.bottom = -sBound;
                    sun.shadow.bias = -0.0005;
                    threeState.scene.add(sun);
                    threeState.sunLight = sun;

                    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.85);
                    fillLight.position.set(1600, 1200, -1400);
                    threeState.scene.add(fillLight);
                    threeState.fillLight = fillLight;

                    const rimLight = new THREE.DirectionalLight('#5eead4', 0.65);
                    rimLight.position.set(0, 900, 2200);
                    threeState.scene.add(rimLight);
                    threeState.rimLight = rimLight;

                    const oceanGeo = new THREE.PlaneGeometry(12000, 12000, 128, 128);
                    oceanGeo.rotateX(-Math.PI / 2);
                    const oPos = oceanGeo.attributes.position;
                    const shoalArr = new Float32Array(oPos.count);
                    for (let i = 0; i < oPos.count; i++) {
                        shoalArr[i] = computeShoalFactor(oPos.getX(i), oPos.getZ(i));
                    }
                    oceanGeo.setAttribute('aShoal', new THREE.BufferAttribute(shoalArr, 1));
                    const oceanMat = createCustomOceanShaderMaterial('#062438');
                    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
                    oceanMesh.position.y = -15.5;
                    oceanMesh.receiveShadow = true;
                    threeState.scene.add(oceanMesh);
                    threeState.oceanMesh = oceanMesh;
                    threeState.oceanBasePos = new Float32Array(oPos.array);
                    threeState.rippleSlots = oceanMat.uniforms.uRippleCenters.value;

                    const shimmerGeo = new THREE.PlaneGeometry(11800, 11800, 72, 72);
                    shimmerGeo.rotateX(-Math.PI / 2);
                    const sPos = shimmerGeo.attributes.position;
                    const shimmerMat = new THREE.MeshBasicMaterial({
                        color: '#7dd3fc',
                        transparent: true,
                        opacity: 0.14,
                        depthWrite: false
                    });
                    const shimmerMesh = new THREE.Mesh(shimmerGeo, shimmerMat);
                    shimmerMesh.position.y = -11.2;
                    threeState.scene.add(shimmerMesh);
                    threeState.shimmerMesh = shimmerMesh;
                    threeState.shimmerBasePos = new Float32Array(sPos.array);

                    const ringGeo = new THREE.RingGeometry(10, 14, 24);
                    ringGeo.rotateX(-Math.PI / 2);
                    for (let i = 0; i < 6; i++) {
                        const rMat = new THREE.MeshBasicMaterial({
                            color: '#bae6fd',
                            transparent: true,
                            opacity: 0,
                            side: THREE.DoubleSide,
                            depthWrite: false
                        });
                        const rMesh = new THREE.Mesh(ringGeo, rMat);
                        rMesh.position.y = -11.0;
                        threeState.scene.add(rMesh);
                        threeState.foamRings.push({ mesh: rMesh, mat: rMat, age: 99, x: 0, z: 0 });
                    }

                    const wakeGeo = new THREE.PlaneGeometry(18, 56, 2, 8);
                    wakeGeo.rotateX(-Math.PI / 2);
                    wakeGeo.translate(0, 0, -28);
                    const wakeMat = new THREE.MeshBasicMaterial({
                        color: '#e0f2fe',
                        transparent: true,
                        opacity: 0.28,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });
                    const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
                    wakeMesh.visible = false;
                    threeState.scene.add(wakeMesh);
                    threeState.wakeMesh = wakeMesh;

                    const dustCount = 260;
                    const dustPos = new Float32Array(dustCount * 3);
                    for (let i = 0; i < dustCount; i++) {
                        dustPos[i * 3] = (Math.random() - 0.5) * 6200;
                        dustPos[i * 3 + 1] = 28 + Math.random() * 145;
                        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6200;
                    }
                    const dustGeo = new THREE.BufferGeometry();
                    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
                    const dustMat = new THREE.PointsMaterial({
                        color: '#ccfbf1',
                        size: 9.5,
                        transparent: true,
                        opacity: 0.42,
                        depthWrite: false
                    });
                    const ambientDustPoints = new THREE.Points(dustGeo, dustMat);
                    threeState.scene.add(ambientDustPoints);
                    threeState.ambientDustPoints = ambientDustPoints;
                    threeState.ambientDustBase = new Float32Array(dustPos);

                    const boltMat = new THREE.LineBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.95 });
                    const boltPts = [
                        new THREE.Vector3(0, 420, 0),
                        new THREE.Vector3(24, 290, -14),
                        new THREE.Vector3(-18, 175, 16),
                        new THREE.Vector3(12, 65, -8),
                        new THREE.Vector3(0, -12, 0)
                    ];
                    const lightningLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(boltPts), boltMat);
                    lightningLine.visible = false;
                    threeState.scene.add(lightningLine);
                    threeState.lightningLine = lightningLine;

                    threeState.worldGroup = new THREE.Group();
                    threeState.scene.add(threeState.worldGroup);
                    threeState.initialized = true;
                    rebuildTerracedWorld();
                    return true;
                } catch (e) {
                    threeState.initialized = false;
                    return false;
                }
            }

            function rebuildTerracedWorld() {
                if (!threeState.initialized || !threeState.worldGroup) return;
                while (threeState.worldGroup.children.length > 0) {
                    const child = threeState.worldGroup.children[0];
                    threeState.worldGroup.remove(child);
                    if (child.geometry && !child.userData.sharedGeo) child.geometry.dispose();
                    if (child.material && !child.material.userData?.isCustomShader) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                }
                threeState.beaconSpire = null;

                const era = EARTH_ERAS[currentEraIndex];
                const tex = getMinecraftTextures();

                // Build Minecraft-style Terraced Voxel Blocks across all 7 Islands
                const blockPositions = [];
                const treePositions = [];
                const rockPositions = [];

                for (let idx = 0; idx < ISLAND_ARCHIPELAGO.length; idx++) {
                    const isl = ISLAND_ARCHIPELAGO[idx];
                    const rBound = Math.ceil(isl.radius / TILE_STEP) * TILE_STEP;
                    for (let x = isl.x - rBound; x <= isl.x + rBound; x += TILE_STEP) {
                        for (let z = isl.y - rBound; z <= isl.y + rBound; z += TILE_STEP) {
                            const d = Math.hypot(x - isl.x, z - isl.y);
                            if (d > isl.radius * 1.04) continue;
                            const elev = getWorldElevation(x, z);
                            const step = getTerraceStep(elev);
                            if (step < 0) continue;
                            const topY = terraceHeightY(elev);
                            const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233 + worldSeed) * 43758.5453) % 1;
                            blockPositions.push({ x, z, topY, step, hash, island: isl });
                            if (step >= 1) {
                                if (hash > 0.875) treePositions.push({ x, z, y: topY, scale: 0.92 + (hash - 0.875) * 2.2 });
                                else if (hash > 0.84) rockPositions.push({ x, z, y: topY, scale: 0.8 + hash * 0.45 });
                            }
                        }
                    }

                    const rimGeo = new THREE.RingGeometry(isl.radius * 0.94, isl.radius * 1.04, 48);
                    rimGeo.rotateX(-Math.PI / 2);
                    const rimMat = new THREE.MeshBasicMaterial({
                        color: isl.color,
                        transparent: true,
                        opacity: 0.34,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });
                    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
                    rimMesh.position.set(isl.x, -9.2, isl.y);
                    threeState.worldGroup.add(rimMesh);

                    const pondGeo = new THREE.CylinderGeometry(148, 162, 12, 28);
                    const pondMat = new THREE.MeshStandardMaterial({
                        color: '#0ea5e9',
                        emissive: '#0369a1',
                        emissiveIntensity: 0.35,
                        roughness: 0.12,
                        metalness: 0.25,
                        transparent: true,
                        opacity: 0.88
                    });
                    const pondMesh = new THREE.Mesh(pondGeo, pondMat);
                    pondMesh.position.set(isl.x + 70, -11.5, isl.y + 140);
                    pondMesh.receiveShadow = true;
                    threeState.worldGroup.add(pondMesh);
                }

                if (blockPositions.length > 0) {
                    const sideMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ map: tex.grassSide, roughness: 0.9, metalness: 0.02 }),
                        { isTerrain: true }
                    );
                    const topMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ map: tex.grassTop, roughness: 0.85, metalness: 0.02 }),
                        { isTerrain: true }
                    );
                    const colGeo = new THREE.BoxGeometry(TILE_STEP * 1.01, 74, TILE_STEP * 1.01);
                    const colInst = new THREE.InstancedMesh(
                        colGeo,
                        [sideMat, sideMat, topMat, sideMat, sideMat, sideMat],
                        blockPositions.length
                    );
                    colInst.receiveShadow = true;
                    colInst.castShadow = true;

                    const dummy = new THREE.Object3D();
                    const color = new THREE.Color();
                    blockPositions.forEach((b, i) => {
                        dummy.position.set(b.x, b.topY - 37, b.z);
                        dummy.rotation.set(0, 0, 0);
                        dummy.scale.set(1, 1, 1);
                        dummy.updateMatrix();
                        colInst.setMatrixAt(i, dummy.matrix);
                        if (b.step === 0) color.set('#f2dfa4').offsetHSL(0, 0, (b.hash - 0.5) * 0.04);
                        else if (b.step === 1) color.set('#b7d968').lerp(new THREE.Color(b.island.topTint), 0.3);
                        else if (b.step === 2) color.set('#9ec456').lerp(new THREE.Color(b.island.midTint), 0.32);
                        else color.set('#d6c7a9').lerp(new THREE.Color(b.island.topTint), 0.25);
                        colInst.setColorAt(i, color);
                    });
                    colInst.instanceMatrix.needsUpdate = true;
                    if (colInst.instanceColor) colInst.instanceColor.needsUpdate = true;
                    threeState.worldGroup.add(colInst);
                }

                // Minecraft Voxel Trees (Bark Trunk + Blocky Leaf Canopy + Hanging Apples)
                if (treePositions.length > 0) {
                    const trunkMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ map: tex.barkTex, roughness: 0.92 }),
                        { isFoliage: true, swayAmp: 0.25 }
                    );
                    const leafMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ map: tex.leafTex, roughness: 0.82 }),
                        { isFoliage: true, swayAmp: 1.35 }
                    );
                    const trunkInst = new THREE.InstancedMesh(new THREE.BoxGeometry(10, 26, 10), trunkMat, treePositions.length);
                    const crownInst = new THREE.InstancedMesh(new THREE.BoxGeometry(30, 22, 30), leafMat, treePositions.length);
                    const crownTopInst = new THREE.InstancedMesh(new THREE.BoxGeometry(18, 13, 18), leafMat, treePositions.length);
                    trunkInst.castShadow = true; trunkInst.receiveShadow = true;
                    crownInst.castShadow = true; crownInst.receiveShadow = true;
                    crownTopInst.castShadow = true; crownTopInst.receiveShadow = true;

                    const dummy = new THREE.Object3D();
                    const leafTint = new THREE.Color();
                    const treeHeightScale = worldUnitsFromMeters(18) / 50;
                    const treeWidthScale = worldUnitsFromMeters(4.2) / 30;
                    treePositions.forEach((t, i) => {
                        const fr = (t.scale * 7.31) % 1;
                        leafTint.setHSL(0.24 + fr * 0.09, 0.62, 0.78 + fr * 0.16);
                        dummy.rotation.set(0, 0, 0);
                        dummy.position.set(t.x, t.y + 13 * treeHeightScale * t.scale, t.z);
                        dummy.scale.set(treeWidthScale * t.scale, treeHeightScale * t.scale, treeWidthScale * t.scale);
                        dummy.updateMatrix();
                        trunkInst.setMatrixAt(i, dummy.matrix);

                        dummy.position.set(t.x, t.y + 28 * treeHeightScale * t.scale, t.z);
                        dummy.scale.set(treeWidthScale * t.scale, treeHeightScale * t.scale, treeWidthScale * t.scale);
                        dummy.updateMatrix();
                        crownInst.setMatrixAt(i, dummy.matrix);
                        crownInst.setColorAt(i, leafTint);

                        dummy.position.set(t.x, t.y + 42 * treeHeightScale * t.scale, t.z);
                        dummy.scale.set(treeWidthScale * 0.72 * t.scale, treeHeightScale * 0.72 * t.scale, treeWidthScale * 0.72 * t.scale);
                        dummy.updateMatrix();
                        crownTopInst.setMatrixAt(i, dummy.matrix);
                        crownTopInst.setColorAt(i, leafTint);
                    });
                    trunkInst.instanceMatrix.needsUpdate = true;
                    crownInst.instanceMatrix.needsUpdate = true;
                    crownTopInst.instanceMatrix.needsUpdate = true;
                    if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
                    if (crownTopInst.instanceColor) crownTopInst.instanceColor.needsUpdate = true;
                    threeState.worldGroup.add(trunkInst, crownInst, crownTopInst);
                }

                // Voxel Stone Boulders
                if (rockPositions.length > 0) {
                    const rockMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ map: tex.stoneTex, roughness: 0.88, metalness: 0.08 }),
                        { isTerrain: true }
                    );
                    const rockInst = new THREE.InstancedMesh(new THREE.BoxGeometry(16, 12, 16), rockMat, rockPositions.length);
                    rockInst.castShadow = true; rockInst.receiveShadow = true;
                    const dummy = new THREE.Object3D();
                    rockPositions.forEach((rc, i) => {
                        dummy.position.set(rc.x, rc.y + 5 * rc.scale, rc.z);
                        dummy.rotation.set(0, i * 0.45, 0);
                        dummy.scale.set(rc.scale, rc.scale * 0.85, rc.scale);
                        dummy.updateMatrix();
                        rockInst.setMatrixAt(i, dummy.matrix);
                    });
                    rockInst.instanceMatrix.needsUpdate = true;
                    threeState.worldGroup.add(rockInst);
                }

                if (oreVeins.length > 0) {
                    const oreMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#92400e', emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.65 });
                    const oreInst = new THREE.InstancedMesh(new THREE.BoxGeometry(15, 13, 15), oreMat, oreVeins.length);
                    oreInst.castShadow = true;
                    const dummy = new THREE.Object3D();
                    oreVeins.forEach((ov, i) => {
                        const gy = terraceHeightY(getWorldElevation(ov.x, ov.y));
                        dummy.position.set(ov.x, gy + 6, ov.y);
                        dummy.scale.setScalar(ov.ore > 0 ? 1.0 : 0.35);
                        dummy.updateMatrix();
                        oreInst.setMatrixAt(i, dummy.matrix);
                    });
                    oreInst.instanceMatrix.needsUpdate = true;
                    threeState.worldGroup.add(oreInst);
                }

                for (const wf of wildfires) {
                    const gy = terraceHeightY(getWorldElevation(wf.x, wf.y));
                    const fireMesh = new THREE.Mesh(
                        new THREE.ConeGeometry(16, 32, 6),
                        new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.85 })
                    );
                    fireMesh.position.set(wf.x, gy + 15, wf.y);
                    threeState.worldGroup.add(fireMesh);
                }

                const springGeo = new THREE.CylinderGeometry(18, 22, 6, 20);
                const springMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.55, roughness: 0.15, transparent: true, opacity: 0.88 });
                for (const sp of springs) {
                    const gy = terraceHeightY(getWorldElevation(sp.x, sp.y));
                    const sMesh = new THREE.Mesh(springGeo, springMat);
                    sMesh.position.set(sp.x, gy + 2, sp.y);
                    sMesh.scale.setScalar(Math.max(0.6, sp.radius / 26));
                    threeState.worldGroup.add(sMesh);
                }

                // Minecraft-Textured Human Houses, Towers, Granaries & Rebel Strongholds
                const plankMat = new THREE.MeshStandardMaterial({ map: tex.planksTex, roughness: 0.78 });
                const stoneWallMat = new THREE.MeshStandardMaterial({ map: tex.stoneTex, roughness: 0.85 });
                const roofMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.6 });
                const rebelRoofMat = new THREE.MeshStandardMaterial({ color: '#e11d48', emissive: '#9f1239', emissiveIntensity: 0.4, roughness: 0.5 });
                const glowMat = new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#f59e0b', emissiveIntensity: 0.9 });
                threeState.houseGlowMat = glowMat;

                for (const st of builtStructures) {
                    const gy = terraceHeightY(getWorldElevation(st.x, st.y));
                    const hGroup = new THREE.Group();
                    hGroup.position.set(st.x, gy, st.y);
                    const kind = st.kind || 'camp';
                    const activeRoof = st.isRebelStronghold ? rebelRoofMat : roofMat;

                    if (kind === 'campfire') {
                        const ring = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 4, 8), stoneWallMat);
                        ring.position.y = 2; hGroup.add(ring);
                        const logs = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 4), plankMat);
                        logs.position.y = 4.5; hGroup.add(logs);
                        const flame = new THREE.Mesh(new THREE.ConeGeometry(5.5, 12, 5), new THREE.MeshBasicMaterial({ color: '#fb923c' }));
                        flame.position.y = 11; hGroup.add(flame);
                    } else if (kind === 'mine') {
                        const arch = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 18), stoneWallMat);
                        arch.position.y = 9; arch.castShadow = true; hGroup.add(arch);
                        const shaft = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 19), new THREE.MeshBasicMaterial({ color: '#090d16' }));
                        shaft.position.y = 6; hGroup.add(shaft);
                        const ore = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#d97706', emissiveIntensity: 0.7 }));
                        ore.position.set(8, 14, 7); hGroup.add(ore);
                    } else if (kind === 'industry') {
                        const hall = new THREE.Mesh(new THREE.BoxGeometry(26, 18, 20), new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.8 }));
                        hall.position.y = 9; hall.castShadow = true; hGroup.add(hall);
                        const stack = new THREE.Mesh(new THREE.BoxGeometry(6, 20, 6), stoneWallMat);
                        stack.position.set(8, 22, -5); stack.castShadow = true; hGroup.add(stack);
                        const furnace = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 2), glowMat);
                        furnace.position.set(-4, 6, 10.2); hGroup.add(furnace);
                    } else if (kind === 'tower') {
                        const base = new THREE.Mesh(new THREE.BoxGeometry(16, 26, 16), stoneWallMat);
                        base.position.y = 13; base.castShadow = true; hGroup.add(base);
                        const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 22), plankMat);
                        deck.position.y = 26; deck.castShadow = true; hGroup.add(deck);
                        const lantern = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), glowMat);
                        lantern.position.y = 31; hGroup.add(lantern);
                    } else if (kind === 'granary') {
                        const silo = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 20), plankMat);
                        silo.position.y = 9; silo.castShadow = true; hGroup.add(silo);
                        const dome = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), activeRoof);
                        dome.position.y = 21.5; dome.castShadow = true; hGroup.add(dome);
                    } else if (kind === 'beacon') {
                        const plinth = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 16), stoneWallMat);
                        plinth.position.y = 5; plinth.castShadow = true; hGroup.add(plinth);
                        const spireColor = st.isRebelStronghold ? '#fb7185' : '#c084fc';
                        const spire = new THREE.Mesh(new THREE.OctahedronGeometry(7.5, 0), new THREE.MeshStandardMaterial({ color: spireColor, emissive: spireColor, emissiveIntensity: 1.15 }));
                        spire.position.y = 18; spire.castShadow = true; hGroup.add(spire);
                        threeState.beaconSpire = spire;
                    } else {
                        const body = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 16), plankMat);
                        body.position.y = 7; body.castShadow = true; body.receiveShadow = true; hGroup.add(body);
                        const roof = new THREE.Mesh(new THREE.ConeGeometry(14.5, 10, 4), activeRoof);
                        roof.position.y = 19; roof.rotation.y = Math.PI * 0.25; roof.castShadow = true; hGroup.add(roof);
                        const win = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 1.5), glowMat);
                        win.position.set(0, 7.5, 8.2); hGroup.add(win);

                        // Furnished cutaway interior: floor, partition, bed, table, storage and hearth.
                        const interior = new THREE.Group();
                        const floor = new THREE.Mesh(new THREE.BoxGeometry(17.2, 1.2, 15.2), new THREE.MeshStandardMaterial({ color: '#8b6848', roughness: 0.92 }));
                        floor.position.y = 1.1; interior.add(floor);
                        const innerWall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 7.5, 14), stoneWallMat);
                        innerWall.position.set(2.8, 4.8, -0.4); interior.add(innerWall);
                        const bedBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.2, 7.2), plankMat);
                        bedBase.position.set(-5.1, 2.2, -3.1); interior.add(bedBase);
                        const mattress = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 6.8), new THREE.MeshStandardMaterial({ color: '#bfdbfe', roughness: 0.95 }));
                        mattress.position.set(-5.1, 3.1, -3.1); interior.add(mattress);
                        const table = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.2, 3.6), plankMat);
                        table.position.set(-4.5, 3.2, 4.0); interior.add(table);
                        const stool = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 2.2), stoneWallMat);
                        stool.position.set(-7.3, 2.2, 4.0); interior.add(stool);
                        const hearth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.4), glowMat);
                        hearth.position.set(5.4, 2.7, 4.6); interior.add(hearth);
                        const storage = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.2, 2.8), plankMat);
                        storage.position.set(5.6, 3.6, -4.6); interior.add(storage);
                        interior.visible = interiorMode;
                        interior.userData.isHouseInterior = true;
                        hGroup.add(interior);
                        hGroup.scale.set(4, 2.7, 4);
                        hGroup.userData.interior = interior;
                        roof.visible = !interiorMode;
                        body.visible = !interiorMode;
                        // Keep a low perimeter so the cutaway room remains readable.
                        if (interiorMode) {
                            const sill = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 16), stoneWallMat);
                            sill.position.y = 1.2; hGroup.add(sill);
                        }
                    }
                    threeState.worldGroup.add(hGroup);
                }

                const cloudGroup = new THREE.Group();
                const cGeo = new THREE.BoxGeometry(72, 16, 48);
                const cMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.95, transparent: true, opacity: 0.72 });
                for (let c = 0; c < 14; c++) {
                    const cl = new THREE.Mesh(cGeo, cMat);
                    const ang = (c / 14) * Math.PI * 2;
                    const rad = 750 + (c % 4) * 780;
                    cl.position.set(Math.cos(ang) * rad, 128 + (c % 3) * 16, Math.sin(ang) * rad);
                    cl.scale.set(1.5, 0.9, 1.15);
                    cloudGroup.add(cl);
                }
                cloudGroup.visible = showAtmosphereClouds;
                threeState.worldGroup.add(cloudGroup);
                threeState.cloudGroup = cloudGroup;

                rebuildThreeEntities();
                if (threeState.oceanMesh && threeState.oceanMesh.material.uniforms) {
                    threeState.oceanMesh.material.uniforms.uDeepColor.value.set(era.oceanColor).lerp(new THREE.Color('#031829'), 0.65);
                }
            }

            function buildDetailedCreatureMesh(c) {
                const group = new THREE.Group();
                const s = c.genome.size * (0.62 + c.growthProgress * 0.42);
                const bodyColor = c.isHuman ? '#f5c28b' : `hsl(${Math.round(c.genome.hue)}, 74%, 56%)`;
                const accentColor = c.isHuman ? (c.faction === 'REBEL' ? '#e11d48' : '#0ea5e9') : `hsl(${Math.round(c.genome.accentHue)}, 82%, 62%)`;
                const sphere = c.genome.sphereAffinity;

                const bodyMat = injectOrganismRimShader(
                    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.42, metalness: 0.08 }),
                    { rimHex: c.faction === 'REBEL' ? '#fb7185' : (c.isHuman ? '#fde047' : accentColor), rimStrength: c.isCognitiveLeader ? 0.55 : 0.32 }
                );
                const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.35, metalness: 0.14 });
                const eyeMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });

                const parts = { legs: [], fins: [], wings: [], arms: [] };

                if (c.isHuman) {
                    // Minecraft-inspired blocky humanoid proportions
                    const torso = new THREE.Mesh(new THREE.BoxGeometry(s * 0.85, s * 1.15, s * 0.52), accentMat);
                    torso.position.y = s * 1.25; torso.castShadow = true; group.add(torso);
                    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.72, s * 0.72, s * 0.72), bodyMat);
                    head.position.y = s * 2.18; head.castShadow = true; group.add(head);
                    const lEye = new THREE.Mesh(new THREE.BoxGeometry(s * 0.12, s * 0.12, s * 0.12), eyeMat);
                    lEye.position.set(s * 0.35, s * 2.22, -s * 0.15); group.add(lEye);
                    const rEye = new THREE.Mesh(new THREE.BoxGeometry(s * 0.12, s * 0.12, s * 0.12), eyeMat);
                    rEye.position.set(s * 0.35, s * 2.22, s * 0.15); group.add(rEye);
                    [-1, 1].forEach((side) => {
                        const leg = new THREE.Mesh(new THREE.BoxGeometry(s * 0.28, s * 0.74, s * 0.28), bodyMat);
                        leg.position.set(0, s * 0.68, side * s * 0.2); leg.castShadow = true; group.add(leg);
                        parts.legs.push({ mesh: leg, side });
                        const arm = new THREE.Mesh(new THREE.BoxGeometry(s * 0.24, s * 0.68, s * 0.24), bodyMat);
                        arm.position.set(0, s * 1.48, side * s * 0.56); arm.castShadow = true; group.add(arm);
                        parts.arms.push({ mesh: arm, side });
                    });
                } else if (sphere === 'OCEAN') {
                    const hull = new THREE.Mesh(new THREE.SphereGeometry(s * 0.72, 14, 12), bodyMat);
                    hull.scale.set(1.55, 0.78, 0.85); hull.castShadow = true; group.add(hull);
                    const tailFin = new THREE.Mesh(new THREE.ConeGeometry(s * 0.42, s * 0.95, 4), accentMat);
                    tailFin.rotation.z = Math.PI * 0.5; tailFin.position.set(-s * 1.28, 0, 0); group.add(tailFin);
                    parts.fins.push(tailFin);
                    [-1, 1].forEach((side) => {
                        const pFin = new THREE.Mesh(new THREE.BoxGeometry(s * 0.55, s * 0.08, s * 0.45), accentMat);
                        pFin.position.set(s * 0.1, -s * 0.1, side * s * 0.68); group.add(pFin);
                        parts.fins.push(pFin);
                    });
                    const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 6, 6), eyeMat);
                    eye.position.set(s * 0.72, s * 0.12, s * 0.34); group.add(eye);
                } else if (sphere === 'ATMOSPHERE') {
                    const body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.52, 12, 10), bodyMat);
                    body.scale.set(1.35, 0.82, 0.85); body.castShadow = true; group.add(body);
                    [-1, 1].forEach((side) => {
                        const wing = new THREE.Mesh(new THREE.BoxGeometry(s * 0.78, s * 0.08, s * 1.25), accentMat);
                        wing.position.set(0, s * 0.12, side * s * 0.85); wing.castShadow = true; group.add(wing);
                        parts.wings.push({ mesh: wing, side });
                    });
                    const eye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.08, 6, 6), eyeMat);
                    eye.position.set(s * 0.58, s * 0.1, s * 0.24); group.add(eye);
                } else {
                    const torso = new THREE.Mesh(new THREE.SphereGeometry(s * 0.68, 14, 12), bodyMat);
                    torso.scale.set(1.35, 0.88, 0.95); torso.position.y = s * 0.68; torso.castShadow = true; group.add(torso);
                    const head = new THREE.Mesh(new THREE.SphereGeometry(s * 0.42, 12, 10), bodyMat);
                    head.position.set(s * 0.88, s * 0.84, 0); head.castShadow = true; group.add(head);
                    const snout = new THREE.Mesh(new THREE.BoxGeometry(s * 0.32, s * 0.22, s * 0.28), accentMat);
                    snout.position.set(s * 1.18, s * 0.76, 0); group.add(snout);
                    const lEye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 6, 6), eyeMat);
                    lEye.position.set(s * 0.98, s * 0.96, -s * 0.28); group.add(lEye);
                    const rEye = new THREE.Mesh(new THREE.SphereGeometry(s * 0.07, 6, 6), eyeMat);
                    rEye.position.set(s * 0.98, s * 0.96, s * 0.28); group.add(rEye);
                    [[s * 0.45, -s * 0.38], [s * 0.45, s * 0.38], [-s * 0.45, -s * 0.38], [-s * 0.45, s * 0.38]].forEach(([lx, lz], idx) => {
                        const leg = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.11, s * 0.09, s * 0.52, 7), accentMat);
                        leg.position.set(lx, s * 0.26, lz); leg.castShadow = true; group.add(leg);
                        parts.legs.push({ mesh: leg, phase: idx * 1.57 });
                    });
                }

                if (c.isCognitiveLeader || c.faction === 'REBEL') {
                    const halo = new THREE.Mesh(
                        new THREE.TorusGeometry(s * 0.68, Math.max(0.7, s * 0.08), 8, 20),
                        new THREE.MeshBasicMaterial({ color: c.faction === 'REBEL' ? '#fb7185' : '#fde047' })
                    );
                    halo.rotation.x = Math.PI * 0.5;
                    halo.position.y = c.isHuman ? s * 2.75 : s * 1.58;
                    group.add(halo);
                }

                group.userData = parts;
                return group;
            }

            function rebuildThreeEntities() {
                if (!threeState.initialized || !threeState.worldGroup) return;
                for (const obj of threeState.creatureMeshes.values()) {
                    threeState.worldGroup.remove(obj);
                }
                threeState.creatureMeshes.clear();

                for (const c of creatures) {
                    const mesh = buildDetailedCreatureMesh(c);
                    threeState.worldGroup.add(mesh);
                    threeState.creatureMeshes.set(c, mesh);
                }

                if (threeState.nutrientMesh) {
                    threeState.worldGroup.remove(threeState.nutrientMesh);
                    threeState.nutrientMesh.geometry.dispose();
                    threeState.nutrientMesh.material.dispose();
                    threeState.nutrientMesh = null;
                }
                if (nutrients.length > 0) {
                    const nGeo = new THREE.BoxGeometry(7.5, 7.5, 7.5);
                    const nMat = injectTerrainAndFoliageShaders(
                        new THREE.MeshStandardMaterial({ color: '#fb7185', emissive: '#e11d48', emissiveIntensity: 0.32, roughness: 0.35 }),
                        { isFoliage: true, swayAmp: 0.25 }
                    );
                    const nInst = new THREE.InstancedMesh(nGeo, nMat, nutrients.length);
                    nInst.castShadow = true;
                    const dummy = new THREE.Object3D();
                    const col = new THREE.Color();
                    nutrients.forEach((n, i) => {
                        const gy = terraceHeightY(getWorldElevation(n.x, n.y));
                        dummy.position.set(n.x, gy + 5, n.y);
                        dummy.scale.setScalar(n.size / 5.5);
                        dummy.updateMatrix();
                        nInst.setMatrixAt(i, dummy.matrix);
                        col.set(n.kind === 'plankton' ? '#38bdf8' : '#fb7185');
                        nInst.setColorAt(i, col);
                    });
                    nInst.instanceMatrix.needsUpdate = true;
                    if (nInst.instanceColor) nInst.instanceColor.needsUpdate = true;
                    threeState.worldGroup.add(nInst);
                    threeState.nutrientMesh = nInst;
                }
            }

            function syncThreeFrame() {
                if (!threeState.initialized || !threeState.renderer) return;
                const w = window.innerWidth;
                const h = window.innerHeight;
                if (w !== threeState.width || h !== threeState.height) {
                    threeState.width = w;
                    threeState.height = h;
                    threeState.renderer.setSize(w, h, false);
                    const aspect = w / Math.max(1, h);
                    const frustum = 950 / Math.max(0.25, camera.zoom);
                    threeState.orthoCamera.left = -frustum * aspect;
                    threeState.orthoCamera.right = frustum * aspect;
                    threeState.orthoCamera.top = frustum;
                    threeState.orthoCamera.bottom = -frustum;
                    threeState.orthoCamera.updateProjectionMatrix();
                    threeState.perspCamera.aspect = aspect;
                    threeState.perspCamera.updateProjectionMatrix();
                }

                const activeFpv = Boolean(isFpvMode && selectedCreature && creatures.includes(selectedCreature));
                if (!activeFpv && hoveredCreature && creatures.includes(hoveredCreature)) {
                    const hsp = worldToScreen(hoveredCreature.x, hoveredCreature.y);
                    ctx.save();
                    ctx.strokeStyle = '#5eead4';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(hsp.x, hsp.y, 18, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                const usePersp = is3DView || activeFpv;
                threeState.camera = usePersp ? threeState.perspCamera : threeState.orthoCamera;

                if (usePersp) {
                    threeState.perspCamera.fov = activeFpv ? 82 : 44;
                    threeState.perspCamera.updateProjectionMatrix();
                } else {
                    const frustum = 950 / Math.max(0.25, camera.zoom);
                    const aspect = w / Math.max(1, h);
                    threeState.orthoCamera.left = -frustum * aspect;
                    threeState.orthoCamera.right = frustum * aspect;
                    threeState.orthoCamera.top = frustum;
                    threeState.orthoCamera.bottom = -frustum;
                    threeState.orthoCamera.up.set(0, 1, 0);
                    threeState.orthoCamera.updateProjectionMatrix();
                }

                const dayNorm = Math.sin(((timeOfDay - 6) / 24) * Math.PI);
                const daylight = Math.max(0.18, Math.min(1.0, 0.22 + dayNorm * 0.78));
                const nightFactor = Math.max(0, 1 - daylight * 1.15);
                const weatherLightMult = currentWeather === 'storm' ? 0.55 : currentWeather === 'rain' ? 0.76 : currentWeather === 'mist' ? 0.84 : 1.0;

                const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
                const sunDir = new THREE.Vector3(Math.cos(sunAngle) * 0.72, Math.max(0.12, Math.sin(sunAngle) * 0.85 + 0.25), 0.42).normalize();
                if (threeState.sunLight) {
                    threeState.sunLight.position.copy(sunDir).multiplyScalar(2600);
                    threeState.sunLight.intensity = (0.65 + daylight * 1.95) * weatherLightMult;
                    threeState.sunLight.color.set(daylight < 0.45 ? '#fb923c' : '#fffbeb');
                }
                if (threeState.hemiLight) threeState.hemiLight.intensity = (0.55 + daylight * 1.1) * weatherLightMult;
                if (threeState.fillLight) threeState.fillLight.intensity = (0.35 + nightFactor * 0.55) * weatherLightMult;
                if (threeState.rimLight) threeState.rimLight.intensity = (0.28 + daylight * 0.45) * weatherLightMult;

                const era = EARTH_ERAS[currentEraIndex];
                const stormMix = currentWeather === 'storm' ? 1.0 : currentWeather === 'rain' ? 0.45 : 0.0;
                const wt = renderFrame * 0.045;

                threeState.sharedShaderUniforms.uTime.value = wt;
                threeState.sharedShaderUniforms.uStormMix.value = stormMix;
                threeState.sharedShaderUniforms.uNightMix.value = nightFactor;
                threeState.sharedShaderUniforms.uCloudOpacity.value = showAtmosphereClouds ? (currentWeather === 'storm' ? 0.78 : currentWeather === 'mist' ? 0.65 : 0.45) : 0.0;
                threeState.sharedShaderUniforms.uLightningFlash.value = lightningFlash;
                threeState.sharedShaderUniforms.uSoilFertility.value = soilFertility;

                if (threeState.skyDomeMat) {
                    threeState.skyDomeMat.uniforms.uTime.value = wt;
                    threeState.skyDomeMat.uniforms.uSunDir.value.copy(sunDir);
                    threeState.skyDomeMat.uniforms.uStormMix.value = stormMix;
                    threeState.skyDomeMat.uniforms.uNightMix.value = nightFactor;
                    threeState.skyDomeMat.uniforms.uEraTint.value.set(era.oceanColor).lerp(new THREE.Color('#2dd4bf'), 0.45);
                }
                if (threeState.skyDomeMesh) threeState.skyDomeMesh.position.set(camera.x, 0, camera.y);

                if (threeState.mistPlaneMat) {
                    threeState.mistPlaneMat.uniforms.uTime.value = wt;
                    threeState.mistPlaneMat.uniforms.uSunDir.value.copy(sunDir);
                    const mistBase = currentWeather === 'mist' ? 0.34 : currentWeather === 'storm' ? 0.24 : 0.11;
                    threeState.mistPlaneMat.uniforms.uMistDensity.value = mistBase * (0.4 + daylight * 0.75);
                    threeState.mistPlaneMat.uniforms.uMistColor.value.set(daylight < 0.45 ? '#fdba74' : '#99f6e4');
                }
                if (threeState.mistPlaneMesh) threeState.mistPlaneMesh.position.set(camera.x, 42 + Math.sin(wt * 0.5) * 4, camera.y);

                if (threeState.scene) {
                    const baseFog = new THREE.Color(era.oceanColor).lerp(new THREE.Color('#020811'), nightFactor * 0.72);
                    if (currentWeather === 'mist') baseFog.lerp(new THREE.Color('#64748b'), 0.38);
                    else if (currentWeather === 'storm') baseFog.lerp(new THREE.Color('#1e293b'), 0.45);
                    baseFog.lerp(new THREE.Color('#cbd5e1'), lightningFlash * 0.35);
                    threeState.scene.background.copy(baseFog);
                    if (threeState.scene.fog) threeState.scene.fog.color.copy(baseFog);
                }

                if (threeState.oceanMesh && threeState.oceanMesh.material.uniforms) {
                    const ou = threeState.oceanMesh.material.uniforms;
                    ou.uTime.value = wt;
                    ou.uSunDir.value.copy(sunDir);
                    ou.uStormMix.value = stormMix;
                    ou.uNightMix.value = nightFactor;
                    ou.uTideOffset.value = tideOffset;
                    ou.uSkyReflectColor.value.set(daylight < 0.45 ? '#fdba74' : '#bae6fd');
                }
                if (threeState.shimmerMesh && threeState.shimmerBasePos) {
                    const sPos = threeState.shimmerMesh.geometry.attributes.position;
                    for (let i = 0; i < sPos.count; i++) {
                        const bx = threeState.shimmerBasePos[i * 3];
                        const bz = threeState.shimmerBasePos[i * 3 + 2];
                        sPos.setY(i, computeOceanWaveHeight(bx, bz, wt * 1.15, currentWeather) + 3.2);
                    }
                    sPos.needsUpdate = true;
                    threeState.shimmerMesh.material.opacity = (0.09 + daylight * 0.11) * (currentWeather === 'storm' ? 0.45 : 1.0);
                }

                if (threeState.foamRings.length > 0) {
                    if (Math.random() < (currentWeather === 'storm' ? 0.14 : 0.055)) {
                        const ring = threeState.foamRings.find(r => r.age > 1.0);
                        if (ring) {
                            const isl = ISLAND_ARCHIPELAGO[Math.floor(Math.random() * ISLAND_ARCHIPELAGO.length)];
                            const ang = Math.random() * Math.PI * 2;
                            const shoreR = isl.radius * (0.94 + Math.random() * 0.14);
                            ring.x = isl.x + Math.cos(ang) * shoreR;
                            ring.z = isl.y + Math.sin(ang) * shoreR;
                            ring.age = 0.0;
                            emitOceanRipple(ring.x, ring.z, currentWeather === 'storm' ? 0.95 : 0.55);
                        }
                    }
                    for (const ring of threeState.foamRings) {
                        if (ring.age <= 1.0) {
                            ring.age += 0.016;
                            const sc = 0.4 + ring.age * 2.4;
                            ring.mesh.position.set(ring.x, computeOceanWaveHeight(ring.x, ring.z, wt, currentWeather) - 10.2, ring.z);
                            ring.mesh.scale.set(sc, sc, 1);
                            ring.mat.opacity = Math.max(0, (1.0 - ring.age) * 0.34);
                        } else {
                            ring.mat.opacity = 0;
                        }
                    }
                }

                if (threeState.ambientDustPoints && threeState.ambientDustBase) {
                    const dPos = threeState.ambientDustPoints.geometry.attributes.position;
                    for (let i = 0; i < dPos.count; i++) {
                        const bx = threeState.ambientDustBase[i * 3];
                        const by = threeState.ambientDustBase[i * 3 + 1];
                        const bz = threeState.ambientDustBase[i * 3 + 2];
                        dPos.setXYZ(i, bx + Math.sin(wt * 0.45 + i) * 28, by + Math.cos(wt * 0.65 + i * 0.7) * 9, bz + Math.cos(wt * 0.38 + i * 1.1) * 28);
                    }
                    dPos.needsUpdate = true;
                    threeState.ambientDustPoints.material.color.set(nightFactor > 0.55 ? '#5eead4' : '#fef08a');
                    threeState.ambientDustPoints.material.opacity = nightFactor > 0.55 ? 0.58 : 0.34;
                }

                if (threeState.lightningLine) {
                    if (lightningFlash > 0.05 && activeLightningBolt) {
                        threeState.lightningLine.visible = true;
                        threeState.lightningLine.position.set(activeLightningBolt.x, 0, activeLightningBolt.z);
                        threeState.lightningLine.material.opacity = Math.min(1, lightningFlash);
                    } else {
                        threeState.lightningLine.visible = false;
                    }
                }

                if (threeState.houseGlowMat) threeState.houseGlowMat.emissiveIntensity = 0.25 + nightFactor * 1.45;
                if (threeState.beaconSpire) {
                    threeState.beaconSpire.rotation.y += 0.04;
                    threeState.beaconSpire.position.y = 18 + Math.sin(wt * 2.2) * 2.5;
                }
                if (threeState.cloudGroup) {
                    threeState.cloudGroup.visible = showAtmosphereClouds;
                    threeState.cloudGroup.rotation.y += 0.00045 * speedMultiplier;
                }

                if (threeState.creatureMeshes.size !== creatures.length) rebuildThreeEntities();

                for (const [c, mesh] of threeState.creatureMeshes.entries()) {
                    mesh.visible = !(activeFpv && c === selectedCreature);
                    const elev = getWorldElevation(c.x, c.y);
                    const gy = terraceHeightY(elev);
                    const s = c.genome.size * (0.62 + c.growthProgress * 0.42);
                    const sphere = c.genome.sphereAffinity;
                    let py = gy;
                    if (sphere === 'ATMOSPHERE') py = gy + 38 + Math.sin(c.walkPhase * 0.6) * 4.5;
                    else if (sphere === 'OCEAN') {
                        const waveH = computeOceanWaveHeight(c.x, c.y, wt, currentWeather);
                        py = Math.max(gy, -12.5 + waveH + Math.sin(c.walkPhase * 0.5) * 2.2);
                    } else if (c.isHuman) py = gy + Math.abs(Math.sin(c.walkPhase)) * 1.8;
                    else py = gy + Math.abs(Math.sin(c.walkPhase)) * 1.2;

                    mesh.position.set(c.x, py, c.y);
                    mesh.rotation.y = -c.angle;
                    mesh.rotation.z = c.bankAngle || 0;
                    mesh.rotation.x = (c.pitchAngle || 0) * 0.5;
                    mesh.scale.setScalar(0.72 + c.growthProgress * 0.35);

                    const parts = mesh.userData;
                    if (parts) {
                        const swing = Math.sin(c.walkPhase) * 0.52;
                        if (parts.legs) {
                            parts.legs.forEach((l) => {
                                const ph = l.phase !== undefined ? l.phase : (l.side || 1) * Math.PI * 0.5;
                                l.mesh.rotation.z = Math.sin(c.walkPhase + ph) * 0.45;
                                if (c.isHuman && l.side) l.mesh.position.x = Math.sin(c.walkPhase + (l.side > 0 ? 0 : Math.PI)) * s * 0.22;
                            });
                        }
                        if (parts.arms) parts.arms.forEach((a) => { a.mesh.rotation.z = -swing * 0.65 * (a.side || 1); });
                        if (parts.wings) parts.wings.forEach((w) => { w.mesh.rotation.x = Math.sin(c.walkPhase * 1.45) * 0.58 * (w.side || 1); });
                        if (parts.fins) parts.fins.forEach((f, idx) => {
                            if (idx === 0) f.rotation.y = Math.sin(c.walkPhase * 1.2) * 0.42;
                            else f.rotation.x = Math.cos(c.walkPhase * 1.1) * 0.25;
                        });
                    }
                }

                if (threeState.worldGroup && tradeBoats.length > 0) {
                    if (!threeState.boatMeshes) threeState.boatMeshes = [];
                    while (threeState.boatMeshes.length < tradeBoats.length) {
                        const bGrp = new THREE.Group();
                        const hull = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 11), new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.8 }));
                        const sail = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 12), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }));
                        sail.position.y = 12;
                        bGrp.add(hull, sail);
                        threeState.scene.add(bGrp);
                        threeState.boatMeshes.push(bGrp);
                    }
                    tradeBoats.forEach((bt, idx) => {
                        const bm = threeState.boatMeshes[idx];
                        const wy = computeOceanWaveHeight(bt.x, bt.y, wt, currentWeather) - 12;
                        bm.position.set(bt.x, wy, bt.y);
                        bm.rotation.y = -bt.angle;
                    });
                }

                if (threeState.wakeMesh) {
                    const wakeTarget = (selectedCreature && creatures.includes(selectedCreature))
                        ? selectedCreature
                        : creatures.find(cr => cr.genome.sphereAffinity === 'OCEAN' || getWorldElevation(cr.x, cr.y) <= 0.05);
                    if (wakeTarget && Math.hypot(wakeTarget.vx, wakeTarget.vy) > 0.35 && getWorldElevation(wakeTarget.x, wakeTarget.y) <= 0.12) {
                        const wElev = getWorldElevation(wakeTarget.x, wakeTarget.y);
                        const wY = Math.max(terraceHeightY(wElev), -11.4 + computeOceanWaveHeight(wakeTarget.x, wakeTarget.y, wt, currentWeather));
                        threeState.wakeMesh.visible = true;
                        threeState.wakeMesh.position.set(wakeTarget.x, wY, wakeTarget.y);
                        threeState.wakeMesh.rotation.y = -wakeTarget.angle + Math.PI * 0.5;
                        const wScale = 0.65 + Math.min(1.4, Math.hypot(wakeTarget.vx, wakeTarget.vy) * 0.42);
                        threeState.wakeMesh.scale.set(wScale, 1, wScale);
                    } else {
                        threeState.wakeMesh.visible = false;
                    }
                }

                if (activeFpv) {
                    updateFpvCameraAndHud(selectedCreature);
                } else if (is3DView) {
                    const zoomFactor = Math.max(0.35, camera.zoom);
                    const dist = 1350 / zoomFactor;
                    threeState.perspCamera.up.set(0, 1, 0);
                    threeState.perspCamera.position.set(camera.x, dist * 0.86, camera.y + dist * 0.62);
                    threeState.perspCamera.lookAt(camera.x, 8, camera.y);
                } else {
                    const zoomFactor = Math.max(0.35, camera.zoom);
                    const dist = 1650 / zoomFactor;
                    threeState.orthoCamera.up.set(0, 1, 0);
                    threeState.orthoCamera.position.set(camera.x, dist, camera.y);
                    threeState.orthoCamera.lookAt(camera.x, 0, camera.y);
                }

                threeState.renderer.render(threeState.scene, threeState.camera);
            }

            // =========================================================================
            // SECTION 6: 2D PROJECTION, COMMAND BEAMS, REVOLUTION WAVES & OVERLAYS
            // =========================================================================
            function drawSafeRoundRect(c2d, x, y, w, h, r) {
                if (typeof c2d.roundRect === 'function') {
                    c2d.beginPath();
                    c2d.roundRect(x, y, w, h, r);
                    return;
                }
                c2d.beginPath();
                c2d.moveTo(x + r, y);
                c2d.lineTo(x + w - r, y);
                c2d.quadraticCurveTo(x + w, y, x + w, y + r);
                c2d.lineTo(x + w, y + h - r);
                c2d.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                c2d.lineTo(x + r, y + h);
                c2d.quadraticCurveTo(x, y + h, x, y + h - r);
                c2d.lineTo(x, y + r);
                c2d.quadraticCurveTo(x, y, x + r, y);
                c2d.closePath();
            }

            function worldToScreen(wx, wy) {
                if (threeState.initialized && threeState.camera) {
                    const elev = getWorldElevation(wx, wy);
                    const gy = terraceHeightY(elev);
                    const v = new THREE.Vector3(wx, gy + 8, wy);
                    v.project(threeState.camera);
                    if (v.z > 1) return { x: -9999, y: -9999 };
                    return {
                        x: (v.x * 0.5 + 0.5) * simCanvas.width,
                        y: (-v.y * 0.5 + 0.5) * simCanvas.height
                    };
                }
                return {
                    x: (wx - camera.x) * camera.zoom + simCanvas.width * 0.5,
                    y: (wy - camera.y) * camera.zoom + simCanvas.height * 0.5
                };
            }

            function screenToWorld(sx, sy) {
                if (threeState.initialized && threeState.camera) {
                    const ndcX = (sx / Math.max(1, simCanvas.width)) * 2 - 1;
                    const ndcY = -(sy / Math.max(1, simCanvas.height)) * 2 + 1;
                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), threeState.camera);
                    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                    const hit = new THREE.Vector3();
                    if (raycaster.ray.intersectPlane(groundPlane, hit)) return { x: hit.x, y: hit.z };
                }
                return {
                    x: (sx - simCanvas.width * 0.5) / camera.zoom + camera.x,
                    y: (sy - simCanvas.height * 0.5) / camera.zoom + camera.y
                };
            }

            function updateHoverInspector(clientX, clientY) {
                const tip = document.getElementById('hoverTooltip');
                if (!tip) return;
                const rect = simCanvas.getBoundingClientRect();
                const sx = clientX - rect.left;
                const sy = clientY - rect.top;
                if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) {
                    tip.classList.add('hidden');
                    hoveredCreature = null;
                    return;
                }

                let title = '', badge = '', sub = '', meta = '';
                hoveredCreature = null;

                // 1. Check Organisms / Humans
                let bestOrg = null, bestOrgD = 32;
                for (const c of creatures) {
                    const sp = worldToScreen(c.x, c.y);
                    const d = Math.hypot(sp.x - sx, sp.y - sy);
                    if (d < bestOrgD) { bestOrgD = d; bestOrg = c; }
                }
                if (bestOrg) {
                    hoveredCreature = bestOrg;
                    const nrg = Math.max(0, Math.min(100, Math.round((bestOrg.energy / bestOrg.maxEnergy) * 100)));
                    title = bestOrg.realName.split(' (')[0];
                    badge = bestOrg.isHuman ? `HUMAN ANN ${bestOrg.humanAnnStage}/4` : SPECIES_CONFIG[bestOrg.species].name.toUpperCase();
                    const hSex = bestOrg.sex === 'Female' ? '\u2640' : '\u2642';
                    sub = `${hSex} ${bestOrg.sex} • Role: ${bestOrg.jobTitle || 'Wild'} • ${bestOrg.stateLabel}`;
                    meta = `Energy ${nrg}% • Gen ${bestOrg.generation} • Fit ${bestOrg.computeFitness().toFixed(1)}`;
                } else {
                    // 2. Check Built Structures (Fire, Mine, Industry, Houses)
                    let bestSt = null, bestStD = 36;
                    for (const st of builtStructures) {
                        const sp = worldToScreen(st.x, st.y);
                        const d = Math.hypot(sp.x - sx, sp.y - sy);
                        if (d < bestStD) { bestStD = d; bestSt = st; }
                    }
                    if (bestSt) {
                        const spec = SHELTER_TYPES.find(s => s.kind === bestSt.kind) || SHELTER_TYPES[0];
                        title = bestSt.shelterName || spec.label;
                        badge = (bestSt.kind || 'STRUCTURE').toUpperCase();
                        sub = `Built by ${bestSt.builderName ? bestSt.builderName.split(' (')[0] : 'Human'}`;
                        meta = `${bestSt.label || ''} • ${spec.bonusDesc}`;
                    } else {
                        // 3. Check Mineral Springs
                        let bestSp = null, bestSpD = 34;
                        for (const s of springs) {
                            const sp = worldToScreen(s.x, s.y);
                            const d = Math.hypot(sp.x - sx, sp.y - sy);
                            if (d < bestSpD) { bestSpD = d; bestSp = s; }
                        }
                        if (bestSp) {
                            title = 'Mineral Thermal Spring';
                            badge = 'SPRING';
                            sub = 'Freshwater & Hydration Source';
                            meta = 'Restores Hydration & lowers organism stress';
                        } else {
                            // 4. Check Nutrients (Fruit / Plankton)
                            let bestN = null, bestND = 24;
                            for (const n of nutrients) {
                                const sp = worldToScreen(n.x, n.y);
                                const d = Math.hypot(sp.x - sx, sp.y - sy);
                                if (d < bestND) { bestND = d; bestN = n; }
                            }
                            if (bestN) {
                                title = bestN.kind === 'plankton' ? 'Marine Plankton Bloom' : 'Orchard Fruit';
                                badge = 'NUTRIENT';
                                sub = `+${bestN.energy} ATP Energy`;
                                meta = bestN.kind === 'plankton' ? 'Ocean food source' : 'Land food source';
                            } else {
                                // 5. Terrain / Island info
                                const wPt = screenToWorld(sx, sy);
                                const { island, normDist } = getNearestIsland(wPt.x, wPt.y);
                                const elev = getWorldElevation(wPt.x, wPt.y);
                                if (normDist < 1.15) {
                                    title = island.name;
                                    badge = elev > 0.05 ? 'VOXEL LAND' : 'COASTAL SEA';
                                    sub = `Fertility ${Math.round(soilFertility * 100)}% • ${HUMAN_REVOLUTIONS[currentRegimeIndex].short}`;
                                    meta = 'Click an organism or structure to inspect';
                                } else {
                                    tip.classList.add('hidden');
                                    return;
                                }
                            }
                        }
                    }
                }

                document.getElementById('hoverTitle').textContent = title;
                document.getElementById('hoverBadge').textContent = badge;
                document.getElementById('hoverSub').textContent = sub;
                document.getElementById('hoverMeta').textContent = meta;

                const tx = Math.min(window.innerWidth - 260, clientX + 16);
                const ty = Math.min(window.innerHeight - 100, clientY + 16);
                tip.style.left = `${Math.max(8, tx)}px`;
                tip.style.top = `${Math.max(8, ty)}px`;
                tip.classList.remove('hidden');
            }

            function draw2DOverlay() {
                renderFrame++;
                ctx.clearRect(0, 0, simCanvas.width, simCanvas.height);

                const activeFpv = Boolean(isFpvMode && selectedCreature && creatures.includes(selectedCreature));

                // Draw Revolution Shockwaves
                for (let i = revolutionWaves.length - 1; i >= 0; i--) {
                    const rw = revolutionWaves[i];
                    rw.radius += 7.5;
                    rw.alpha = Math.max(0, 1 - rw.radius / rw.maxRadius);
                    if (rw.alpha <= 0.02) {
                        revolutionWaves.splice(i, 1);
                        continue;
                    }
                    const sp = worldToScreen(rw.x, rw.y);
                    ctx.save();
                    ctx.strokeStyle = `rgba(251, 113, 133, ${rw.alpha * 0.85})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, rw.radius * camera.zoom, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.font = '700 11px "JetBrains Mono", monospace';
                    ctx.fillStyle = `rgba(253, 224, 71, ${rw.alpha})`;
                    ctx.textAlign = 'center';
                    ctx.fillText(rw.label, sp.x, sp.y - rw.radius * camera.zoom - 6);
                    ctx.restore();
                }

                // Draw Human Command Beams
                for (let i = commandBeams.length - 1; i >= 0; i--) {
                    const bm = commandBeams[i];
                    bm.life--;
                    if (bm.life <= 0 || !creatures.includes(bm.from) || !creatures.includes(bm.to)) {
                        commandBeams.splice(i, 1);
                        continue;
                    }
                    if (!activeFpv && showSensoryOverlay) {
                        const p1 = worldToScreen(bm.from.x, bm.from.y);
                        const p2 = worldToScreen(bm.to.x, bm.to.y);
                        ctx.save();
                        ctx.strokeStyle = bm.color;
                        ctx.globalAlpha = Math.min(0.85, bm.life / 45);
                        ctx.lineWidth = 1.8;
                        ctx.setLineDash([5, 4]);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.restore();
                    }
                }

                if (!activeFpv) {
                    for (const col of colonies) {
                        const sp = worldToScreen(col.x, col.y);
                        if (sp.x < -150 || sp.x > simCanvas.width + 150 || sp.y < -150 || sp.y > simCanvas.height + 150) continue;
                        const rPx = Math.min(260, (220 + col.levelIdx * 55) * camera.zoom);
                        ctx.save();
                        ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
                        ctx.setLineDash([6, 6]);
                        ctx.lineWidth = 1.4;
                        ctx.beginPath();
                        ctx.arc(sp.x, sp.y, rPx, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.font = '700 10px "JetBrains Mono", monospace';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#99f6e4';
                        ctx.fillText(`${col.name} (${COLONY_LEVELS[col.levelIdx]})`, sp.x, sp.y - rPx - 6);
                        ctx.restore();
                    }
                    for (let i = matingPulses.length - 1; i >= 0; i--) {
                        const mp = matingPulses[i];
                        mp.radius += 1.6;
                        mp.alpha -= 0.025;
                        if (mp.alpha <= 0) { matingPulses.splice(i, 1); continue; }
                        const sp = worldToScreen(mp.x, mp.y);
                        ctx.save();
                        ctx.strokeStyle = `rgba(244, 114, 182, ${mp.alpha})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(sp.x, sp.y, mp.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.font = '700 11px sans-serif';
                        ctx.fillStyle = `rgba(244, 114, 182, ${mp.alpha})`;
                        ctx.fillText('\u2665', sp.x, sp.y - mp.radius - 2);
                        ctx.restore();
                    }
                }

                if (!activeFpv && showZoneLabels) {
                    ctx.save();
                    ctx.font = '600 11px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    for (const isl of ISLAND_ARCHIPELAGO) {
                        const sp = worldToScreen(isl.x, isl.y);
                        if (sp.x < -160 || sp.x > simCanvas.width + 160 || sp.y < -120 || sp.y > simCanvas.height + 120) continue;
                        ctx.fillStyle = 'rgba(2, 12, 22, 0.72)';
                        drawSafeRoundRect(ctx, sp.x - 86, sp.y - 16, 172, 22, 7);
                        ctx.fill();
                        ctx.strokeStyle = isl.color;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.fillStyle = '#f8fafc';
                        ctx.fillText(isl.name, sp.x, sp.y - 1);
                    }
                    ctx.restore();
                }

                if (!activeFpv && showSensoryOverlay) {
                    ctx.save();
                    for (const c of creatures) {
                        const sp = worldToScreen(c.x, c.y);
                        if (sp.x < -120 || sp.x > simCanvas.width + 120 || sp.y < -120 || sp.y > simCanvas.height + 120) continue;
                        const isSel = c === selectedCreature;
                        const rPx = Math.max(18, c.genome.vision * camera.zoom * (isSel ? 0.52 : 0.28));
                        ctx.beginPath();
                        ctx.moveTo(sp.x, sp.y);
                        ctx.arc(sp.x, sp.y, rPx, c.angle - 0.58, c.angle + 0.58);
                        ctx.closePath();
                        ctx.fillStyle = isSel ? 'rgba(45, 212, 191, 0.14)' : (c.faction === 'REBEL' ? 'rgba(251, 113, 133, 0.08)' : 'rgba(148, 163, 184, 0.04)');
                        ctx.fill();

                        if (isSel && c.activeTarget) {
                            const tp = worldToScreen(c.activeTarget.x, c.activeTarget.y);
                            ctx.beginPath();
                            ctx.moveTo(sp.x, sp.y);
                            ctx.lineTo(tp.x, tp.y);
                            ctx.strokeStyle = c.activeTarget.kind === 'threat' ? 'rgba(251, 113, 133, 0.75)' : 'rgba(56, 189, 248, 0.65)';
                            ctx.setLineDash([4, 4]);
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    }
                    ctx.restore();
                }

                if (!activeFpv && !isExhibitionMode && showThoughtBubbles) {
                    ctx.save();
                    ctx.font = '500 10px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    for (const c of creatures) {
                        const isSel = c === selectedCreature;
                        if (!isSel && !c.isCognitiveLeader && !c.commandedTask && c.faction !== 'REBEL' && c.stress < 0.55) continue;
                        const sp = worldToScreen(c.x, c.y);
                        if (sp.x < -140 || sp.x > simCanvas.width + 140 || sp.y < -90 || sp.y > simCanvas.height + 90) continue;
                        const prefix = c.faction === 'REBEL' ? '[REV] ' : '';
                        const label = isSel ? `${prefix}${c.realName.split(' ')[0]} \u2022 ${c.stateLabel}` : `${prefix}${c.commandedTask ? c.commandedTask : c.stateLabel}`;
                        const tw = ctx.measureText(label).width + 14;
                        const by = sp.y - 24;
                        ctx.fillStyle = c.faction === 'REBEL' ? 'rgba(136, 19, 55, 0.88)' : (isSel ? 'rgba(6, 78, 59, 0.88)' : 'rgba(15, 23, 42, 0.82)');
                        drawSafeRoundRect(ctx, sp.x - tw * 0.5, by - 12, tw, 18, 6);
                        ctx.fill();
                        ctx.strokeStyle = c.faction === 'REBEL' ? '#fb7185' : (isSel ? '#5eead4' : 'rgba(251, 191, 36, 0.55)');
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.fillStyle = c.faction === 'REBEL' ? '#ffe4e6' : (isSel ? '#ecfdf5' : '#fde68a');
                        ctx.fillText(label, sp.x, by + 1);
                    }
                    ctx.restore();
                }

                if (currentWeather === 'rain' || currentWeather === 'storm') {
                    ctx.save();
                    ctx.strokeStyle = currentWeather === 'storm' ? 'rgba(186, 230, 253, 0.42)' : 'rgba(125, 211, 252, 0.28)';
                    ctx.lineWidth = currentWeather === 'storm' ? 1.4 : 1.0;
                    const windX = currentWeather === 'storm' ? -4.5 : -1.5;
                    for (const drop of raindrops) {
                        drop.x += windX * speedMultiplier;
                        drop.y += drop.spd * speedMultiplier;
                        if (drop.y > simCanvas.height) { drop.y = -20; drop.x = Math.random() * simCanvas.width; }
                        if (drop.x < 0) drop.x += simCanvas.width;
                        ctx.beginPath();
                        ctx.moveTo(drop.x, drop.y);
                        ctx.lineTo(drop.x + windX * 2.2, drop.y + drop.len);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                if (activeFpv) {
                    const fc = selectedCreature;
                    const cx = simCanvas.width * 0.5;
                    const cy = simCanvas.height * 0.5;
                    ctx.save();
                    if (fc.genome.sphereAffinity === 'OCEAN') {
                        ctx.fillStyle = 'rgba(6, 78, 110, 0.22)';
                        ctx.fillRect(0, 0, simCanvas.width, simCanvas.height);
                    }
                    // Subtle FPV crosshair
                    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 5, cy);
                    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 14, cy);
                    ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 5);
                    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 14);
                    ctx.stroke();

                    // FPV Compass Strip
                    const viewYaw = fc.angle + fpvCam.yawOffset;
                    const deg = (((viewYaw * 180) / Math.PI) % 360 + 360) % 360;
                    const dirs = [['E', 0], ['SE', 45], ['S', 90], ['SW', 135], ['W', 180], ['NW', 225], ['N', 270], ['NE', 315]];
                    ctx.fillStyle = 'rgba(2, 12, 22, 0.65)';
                    drawSafeRoundRect(ctx, cx - 130, 86, 260, 22, 8);
                    ctx.fill();
                    ctx.font = '600 10px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    for (const [lbl, dAngle] of dirs) {
                        let diff = ((dAngle - deg + 540) % 360) - 180;
                        if (Math.abs(diff) <= 58) {
                            ctx.fillStyle = lbl.length === 1 ? '#5eead4' : '#94a3b8';
                            ctx.fillText(lbl, cx + diff * 2.0, 100);
                        }
                    }

                    // Nearby living beings tags in FPV
                    ctx.font = '500 10px "JetBrains Mono", monospace';
                    for (const other of creatures) {
                        if (other === fc) continue;
                        const dist = Math.hypot(other.x - fc.x, other.y - fc.y);
                        if (dist > 420) continue;
                        const sp = worldToScreen(other.x, other.y);
                        if (sp.x < 20 || sp.x > simCanvas.width - 20 || sp.y < 20 || sp.y > simCanvas.height - 20) continue;
                        const tag = `${other.realName.split(' (')[0]} (${Math.round(dist)}m)`;
                        ctx.fillStyle = other.faction === 'REBEL' ? 'rgba(251,113,133,0.9)' : 'rgba(165,243,252,0.88)';
                        ctx.fillText(tag, sp.x, sp.y - 16);
                    }
                    ctx.restore();
                }
            }

            // =========================================================================
            // SECTION 7: HUD, INSPECTOR, LINEAGE COMPARE, CHALLENGES & CRYO-LAB
            // =========================================================================
            function formatPopCount(pop) {
                if (pop >= 1000000000) return `${(pop / 1000000000).toFixed(2)}B`;
                if (pop >= 1000000) return `${Math.round(pop / 1000000)}M`;
                if (pop >= 1000) return `${Math.round(pop / 1000)}K`;
                return String(Math.round(pop));
            }

            function getTotalBiospherePopulation() {
                return creatures.length;
            }

            function formatClock(hoursFloat) {
                const norm = ((hoursFloat % 24) + 24) % 24;
                const hh = Math.floor(norm);
                const mm = Math.floor((norm - hh) * 60);
                return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
            }

            function updateCulturalProgression() {
                let nextIdx = 0;
                for (let i = CULTURAL_STAGES.length - 1; i >= 0; i--) {
                    if (collectiveKnowledgeXP >= CULTURAL_STAGES[i].minXP) { nextIdx = i; break; }
                }
                if (nextIdx > culturalStageIndex) {
                    culturalStageIndex = nextIdx;
                    recordEventMarker(`Civ ${CULTURAL_STAGES[nextIdx].name.split(': ')[1]}`, '#38bdf8');
                    addChronicleEntry(`Civilization reached ${CULTURAL_STAGES[nextIdx].name}!`, 'text-cyan-300');
                    showToast(`Civilization Evolved: ${CULTURAL_STAGES[nextIdx].name}!`);
                    audioEngine.playChime(880, 0.28);
                }
                const curStage = CULTURAL_STAGES[culturalStageIndex];
                const nextStage = CULTURAL_STAGES[Math.min(CULTURAL_STAGES.length - 1, culturalStageIndex + 1)];
                const span = Math.max(1, nextStage.minXP - curStage.minXP);
                const pct = culturalStageIndex === CULTURAL_STAGES.length - 1 ? 100 : Math.max(0, Math.min(100, ((collectiveKnowledgeXP - curStage.minXP) / span) * 100));

                const titleEl = document.getElementById('cultureStageTitle');
                const xpEl = document.getElementById('cultureXpText');
                const barEl = document.getElementById('cultureXpBar');
                if (titleEl) titleEl.textContent = curStage.name;
                if (xpEl) xpEl.textContent = `${Math.floor(collectiveKnowledgeXP)} XP`;
                if (barEl) barEl.style.width = `${pct.toFixed(0)}%`;
            }

            function updateEraHUD() {
                const era = EARTH_ERAS[currentEraIndex];
                document.getElementById('eraYearBadge').textContent = era.years;
                document.getElementById('eraTitleBadge').textContent = era.name;
                document.getElementById('eraSubtitle').textContent = era.subtitle;
                document.getElementById('historicalEventLabel').textContent = `Trigger: ${era.eventName}`;
                document.getElementById('eraProgressBar').style.width = `${(eraProgress * 100).toFixed(1)}%`;
                for (let i = 0; i < EARTH_ERAS.length; i++) {
                    const btn = document.getElementById(`eraBtn${i}`);
                    if (!btn) continue;
                    btn.className = i === currentEraIndex
                        ? "py-1 px-1 rounded-lg border text-center transition truncate bg-teal-500/25 border-teal-400/50 text-teal-200 font-semibold"
                        : "py-1 px-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white text-center transition truncate";
                }
                const seedBadge = document.getElementById('currentSeedBadge');
                if (seedBadge) seedBadge.textContent = `Seed ${worldSeed.toFixed(2)}`;
            }

            function updateHUD() {
                updateCulturalProgression();
                const pop = creatures.length;
                const humanCnt = creatures.filter(c => c.isHuman).length;
                const faunaCnt = pop - humanCnt;
                document.getElementById('hudPop').textContent = `${pop} Living (${humanCnt}H / ${faunaCnt}F)`;
                const chartPop = document.getElementById('chartPopulation');
                if (chartPop) chartPop.textContent = `${pop} Living`;
                const leaders = creatures.filter(c => c.isCognitiveLeader).length;
                document.getElementById('hudLeaderCount').textContent = `${leaders}/${creatures.length}`;
                const colHud = document.getElementById('hudColoniesCount');
                if (colHud) colHud.textContent = `${colonies.length}`;
                document.getElementById('hudStructuresCount').textContent = `${builtStructures.length}`;

                const revEl = document.getElementById('hudRevolutionBadge');
                if (revEl) revEl.textContent = `${HUMAN_REVOLUTIONS[currentRegimeIndex].short} \u2022 ${oreStock} Ore / ${industryOutput} Ind`;
                const tasksEl = document.getElementById('hudTasksCount');
                if (tasksEl) tasksEl.textContent = String(tasksIssuedTotal);

                const tideEl = document.getElementById('hudTideSeason');
                if (tideEl) {
                    const sign = tideOffset >= 0 ? '+' : '';
                    tideEl.textContent = `${Math.round(soilFertility * 100)}% \u2022 ${sign}${tideOffset.toFixed(1)}m`;
                }

                const spheresEl = document.getElementById('hudSpheresCount');
                if (spheresEl) {
                    let aCount = 0, oCount = 0, lCount = 0;
                    for (const c of creatures) {
                        if (c.genome.sphereAffinity === 'ATMOSPHERE') aCount++;
                        else if (c.genome.sphereAffinity === 'OCEAN') oCount++;
                        else lCount++;
                    }
                    spheresEl.textContent = `A:${aCount} O:${oCount} L:${lCount}`;
                }

                const humans = creatures.filter(c => c.isHuman);
                const maxHStage = humans.length ? Math.max(...humans.map(h => h.humanAnnStage || 0)) : 0;
                const hSt = HUMAN_ANN_STAGES[maxHStage];
                const hudHuman = document.getElementById('hudHumanStage');
                if (hudHuman) hudHuman.textContent = `${maxHStage}/4 (${hSt.inSize}\u2192${hSt.hidSize}\u2192${hSt.outSize})`;

                const wxEl = document.getElementById('hudWeatherClock');
                if (wxEl) {
                    const wLabel = currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1);
                    wxEl.textContent = `${formatClock(timeOfDay)} \u2022 ${wLabel}`;
                }

                const activeNiches = new Set(creatures.map(c => c.species)).size;
                if (activeNiches >= SPECIES_KEYS.length && currentWeather === 'storm') sustainedAll25ThroughEvent = true;

                const survSummary = document.getElementById('survivalSummaryText');
                if (survSummary) {
                    let topName = 'Human';
                    let topFit = -1;
                    for (const c of creatures) {
                        const f = c.computeFitness();
                        if (f > topFit) { topFit = f; topName = c.realName.split(' (')[0]; }
                    }
                    survSummary.textContent = `Peak Gen: ${maxGeneration} \u2022 Top: ${topName} (F:${topFit.toFixed(0)}) \u2022 Niches: ${activeNiches}/${SPECIES_KEYS.length}`;
                }

                const shelterEl = document.getElementById('shelterBreakdownText');
                if (shelterEl) {
                    const counts = { camp: 0, tower: 0, granary: 0, beacon: 0 };
                    for (const s of builtStructures) counts[s.kind || 'camp'] = (counts[s.kind || 'camp'] || 0) + 1;
                    shelterEl.textContent = `Shelters: Camp ${counts.camp} \u2022 Tower ${counts.tower} \u2022 Granary ${counts.granary} \u2022 Beacon ${counts.beacon}`;
                }

                const listEl = document.getElementById('speciesRosterList');
                if (listEl) {
                    const counts = {};
                    for (const k of SPECIES_KEYS) counts[k] = 0;
                    for (const c of creatures) counts[c.species] = (counts[c.species] || 0) + 1;

                    listEl.innerHTML = SPECIES_KEYS.map((k) => {
                        const cfg = SPECIES_CONFIG[k];
                        const cnt = counts[k] || 0;
                        const isEraAllowed = !EARTH_ERAS[currentEraIndex].allowedSpecies || EARTH_ERAS[currentEraIndex].allowedSpecies.includes(k);
                        return `<div class="flex items-center justify-between px-2 py-1 ${cnt > 0 ? 'text-slate-200' : 'text-slate-500'}">
                            <span class="flex items-center gap-1.5 truncate">
                                <span class="w-2 h-2 rounded-full shrink-0" style="background:${cfg.color}"></span>
                                <span class="truncate">${cfg.name}</span>
                            </span>
                            <span class="flex items-center gap-1.5 shrink-0">
                                ${!isEraAllowed ? '<span class="text-[8px] text-amber-400/80">FUTURE</span>' : ''}
                                <span class="font-semibold ${cnt > 0 ? 'text-teal-300' : 'text-slate-600'}">${cnt}</span>
                            </span>
                        </div>`;
                    }).join('');
                }

                updateChallengesPanel();
            }

            function updateChallengesPanel() {
                const badge = document.getElementById('challengesBadge');
                const list = document.getElementById('challengesList');
                if (!list) return;
                const humans = creatures.filter(c => c.isHuman);
                const maxHStage = humans.length ? Math.max(...humans.map(h => h.humanAnnStage || 0)) : 0;
                const activeNiches = new Set(creatures.map(c => c.species)).size;
                const challenges = [
                    { title: 'Evolve Human ANN to Stage 2+', done: maxHStage >= 2, prog: `Stage ${maxHStage}/2` },
                    { title: 'Assign 5+ Tasks via Human Commander', done: tasksIssuedTotal >= 5, prog: `${tasksIssuedTotal}/5` },
                    { title: 'Spark a Human-led Revolution', done: revolutionCount >= 1, prog: `${revolutionCount}/1` },
                    { title: 'Raise 3+ Voxel Shelters', done: builtStructures.length >= 3, prog: `${builtStructures.length}/3` },
                    { title: 'Sustain All 25 Niches in Storm', done: sustainedAll25ThroughEvent || (activeNiches >= 25 && currentWeather === 'storm'), prog: `${activeNiches}/25` }
                ];
                const doneCount = challenges.filter(ch => ch.done).length;
                if (badge) badge.textContent = `${doneCount}/${challenges.length} Done`;
                list.innerHTML = challenges.map(ch =>
                    `<div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-950/75 border ${ch.done ? 'border-emerald-400/45 text-emerald-200' : 'border-slate-800 text-slate-300'}">
                        <span class="truncate">${ch.done ? '\u2713 ' : '\u25CB '}${ch.title}</span>
                        <span class="text-[9px] shrink-0 ${ch.done ? 'text-emerald-300 font-bold' : 'text-amber-300'}">${ch.prog}</span>
                    </div>`
                ).join('');
            }

            function drawNeuralBrain(c) {
                if (!neuralCtx || !c || !c.brain) return;
                const w = neuralCanvas.width;
                const h = neuralCanvas.height;
                neuralCtx.clearRect(0, 0, w, h);
                neuralCtx.fillStyle = '#020a14';
                neuralCtx.fillRect(0, 0, w, h);

                const b = c.brain;
                const archEl = document.getElementById('neuralArchLabel');
                if (archEl) {
                    const synCount = (b.isNeataptic && b.net) ? b.net.connections.length : (b.hidSize * b.inSize + b.outSize * b.hidSize);
                    archEl.textContent = `${b.isNeataptic ? 'NEATAPTIC' : 'ANN'} (${b.inSize}\u2192${b.hidSize}\u2192${b.outSize}) \u2022 ${synCount}W`;
                }

                const cols = [w * 0.16, w * 0.5, w * 0.84];
                const makePts = (count, xPos) => {
                    const arr = [];
                    for (let i = 0; i < count; i++) {
                        const yPos = ((i + 0.5) / Math.max(1, count)) * (h - 24) + 12;
                        arr.push({ x: xPos, y: yPos });
                    }
                    return arr;
                };
                const inPts = makePts(b.inSize, cols[0]);
                const hidPts = makePts(b.hidSize, cols[1]);
                const outPts = makePts(b.outSize, cols[2]);

                if (b.isNeataptic && b.net && Array.isArray(b.net.connections)) {
                    const nodeCoords = new Map();
                    const inputs = b.net.nodes.filter(n => n.type === 'input');
                    const hiddens = b.net.nodes.filter(n => n.type === 'hidden');
                    const outputs = b.net.nodes.filter(n => n.type === 'output');
                    inputs.forEach((n, idx) => nodeCoords.set(n, makePts(inputs.length, cols[0])[idx]));
                    hiddens.forEach((n, idx) => nodeCoords.set(n, makePts(hiddens.length, cols[1])[idx]));
                    outputs.forEach((n, idx) => nodeCoords.set(n, makePts(outputs.length, cols[2])[idx]));

                    for (const conn of b.net.connections) {
                        const pA = nodeCoords.get(conn.from);
                        const pB = nodeCoords.get(conn.to);
                        if (!pA || !pB) continue;
                        const weight = conn.weight || 0;
                        neuralCtx.strokeStyle = weight >= 0 ? `rgba(45, 212, 191, ${Math.min(0.85, Math.abs(weight) * 0.45 + 0.15)})` : `rgba(251, 113, 133, ${Math.min(0.85, Math.abs(weight) * 0.45 + 0.15)})`;
                        neuralCtx.lineWidth = Math.max(0.7, Math.min(2.6, Math.abs(weight)));
                        neuralCtx.beginPath();
                        neuralCtx.moveTo(pA.x, pA.y);
                        neuralCtx.lineTo(pB.x, pB.y);
                        neuralCtx.stroke();
                    }
                } else {
                    for (let hIdx = 0; hIdx < b.hidSize; hIdx++) {
                        for (let iIdx = 0; iIdx < b.inSize; iIdx++) {
                            const weight = (b.w1[hIdx] && b.w1[hIdx][iIdx]) || 0;
                            neuralCtx.strokeStyle = weight >= 0 ? `rgba(45, 212, 191, ${Math.min(0.8, Math.abs(weight) * 0.45 + 0.12)})` : `rgba(251, 113, 133, ${Math.min(0.8, Math.abs(weight) * 0.45 + 0.12)})`;
                            neuralCtx.lineWidth = Math.max(0.7, Math.min(2.2, Math.abs(weight)));
                            neuralCtx.beginPath();
                            neuralCtx.moveTo(inPts[iIdx].x, inPts[iIdx].y);
                            neuralCtx.lineTo(hidPts[hIdx].x, hidPts[hIdx].y);
                            neuralCtx.stroke();
                        }
                    }
                    for (let oIdx = 0; oIdx < b.outSize; oIdx++) {
                        for (let hIdx = 0; hIdx < b.hidSize; hIdx++) {
                            const weight = (b.w2[oIdx] && b.w2[oIdx][hIdx]) || 0;
                            neuralCtx.strokeStyle = weight >= 0 ? `rgba(56, 189, 248, ${Math.min(0.85, Math.abs(weight) * 0.45 + 0.15)})` : `rgba(251, 191, 36, ${Math.min(0.85, Math.abs(weight) * 0.45 + 0.15)})`;
                            neuralCtx.lineWidth = Math.max(0.8, Math.min(2.4, Math.abs(weight)));
                            neuralCtx.beginPath();
                            neuralCtx.moveTo(hidPts[hIdx].x, hidPts[hIdx].y);
                            neuralCtx.lineTo(outPts[oIdx].x, outPts[oIdx].y);
                            neuralCtx.stroke();
                        }
                    }
                }

                const drawLayerNodes = (pts, vals, fillHex) => {
                    pts.forEach((pt, idx) => {
                        const act = Math.max(-1, Math.min(1, vals[idx] || 0));
                        const r = 4.2 + Math.abs(act) * 2.2;
                        neuralCtx.fillStyle = act >= 0 ? fillHex : '#fb7185';
                        neuralCtx.beginPath();
                        neuralCtx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
                        neuralCtx.fill();
                        neuralCtx.strokeStyle = '#e2e8f0';
                        neuralCtx.lineWidth = 0.8;
                        neuralCtx.stroke();
                    });
                };

                drawLayerNodes(inPts, b.lastInputs, '#2dd4bf');
                drawLayerNodes(hidPts, b.lastHidden, '#38bdf8');
                drawLayerNodes(outPts, b.lastOutputs, '#fde047');
            }

            function updateInspectorHUD() {
                const card = document.getElementById('inspectorCard');
                if (!selectedCreature || !creatures.includes(selectedCreature)) {
                    card.classList.add('hidden');
                    return;
                }
                card.classList.remove('hidden');
                const c = selectedCreature;
                const cfg = SPECIES_CONFIG[c.species] || SPECIES_CONFIG.capybara;
                const nrgPct = Math.max(0, Math.min(100, Math.round((c.energy / c.maxEnergy) * 100)));
                const hydPct = Math.max(0, Math.min(100, Math.round(c.hydration)));
                const growthPct = Math.round(c.growthProgress * 100);

                document.getElementById('dnaSpeciesDot').style.setProperty('--sp', cfg.color);
                document.getElementById('dnaSpeciesDot').style.background = cfg.color;
                document.getElementById('dnaSpeciesTitle').textContent = c.realName;
                document.getElementById('dnaLeaderBadge').classList.toggle('hidden', !c.isCognitiveLeader);
                const sexSym = c.sex === 'Female' ? '\u2640' : '\u2642';
                const parentTag = (c.motherName && c.fatherName) ? ` \u2022 Parents: ${c.motherName} & ${c.fatherName}` : '';
                document.getElementById('dnaDietBadge').textContent = `${sexSym} ${c.sex} \u2022 ${c.genome.sphereAffinity}${parentTag}`;
                document.getElementById('dnaIdBadge').textContent = c.genome.id;
                document.getElementById('dnaLifeStage').textContent = c.lifeStage;
                document.getElementById('dnaAgeText').textContent = `Age ${Math.floor(c.ageTicks / 60)}s \u2022 ${growthPct}%`;
                document.getElementById('dnaGrowthBar').style.width = `${growthPct}%`;

                const nrgText = document.getElementById('dnaEnergyText');
                const nrgBar = document.getElementById('dnaEnergyBar');
                nrgText.textContent = `${nrgPct}%`;
                nrgText.classList.toggle('insp-low-text', nrgPct < 28);
                nrgBar.style.width = `${nrgPct}%`;
                nrgBar.classList.toggle('insp-low', nrgPct < 28);

                document.getElementById('dnaHydrationText').textContent = `${hydPct}%`;
                document.getElementById('dnaHydrationBar').style.width = `${hydPct}%`;

                document.getElementById('dnaGen').textContent = `Gen ${c.generation}`;
                document.getElementById('dnaChildren').textContent = `${c.computeFitness().toFixed(1)}`;
                document.getElementById('dnaSphereAffinity').textContent = `${c.genome.sphereAffinity.slice(0, 4)} / ${c.genome.variantTag || 'V1'}`;
                document.getElementById('dnaSpeed').textContent = c.genome.speed.toFixed(2);
                document.getElementById('dnaVision').textContent = `${Math.round(c.genome.vision)} px`;
                document.getElementById('dnaStressRes').textContent = `${Math.round(c.stress * 100)}% / ${Math.round(c.resilience * 100)}%`;
                document.getElementById('survivalDefense').textContent = c.genome.defense;
                document.getElementById('survivalEscapes').textContent = `${c.successfulEscapes}`;
                const facEl = document.getElementById('dnaFactionBadge');
                if (facEl) {
                    facEl.textContent = (c.jobTitle || 'FORAGER').toUpperCase();
                    facEl.className = 'insp-fact-v text-amber-300';
                }
                document.getElementById('dnaEcology').textContent = cfg.ecology;
                document.getElementById('dnaMindGrowthText').textContent = `Mind IQ: ${c.mindGrowth.toFixed(2)}`;
                document.getElementById('neuralStateLabel').textContent = c.stateLabel;
                document.getElementById('dnaThoughtReadout').textContent = c.lastThought;

                const goalSelect = document.getElementById('dnaGoalSelect');
                if (goalSelect && goalSelect.value !== c.assignedGoal) goalSelect.value = c.assignedGoal;

                const humanPanel = document.getElementById('humanEvolutionPanel');
                if (humanPanel) {
                    humanPanel.classList.toggle('hidden', !c.isHuman);
                    if (c.isHuman) {
                        const st = HUMAN_ANN_STAGES[c.humanAnnStage || 0];
                        const nextSt = HUMAN_ANN_STAGES[Math.min(4, (c.humanAnnStage || 0) + 1)];
                        const prog = c.humanAnnStage >= 4 ? 100 : Math.max(0, Math.min(100, ((c.humanNeuralXP - st.minXP) / Math.max(1, nextSt.minXP - st.minXP)) * 100));
                        document.getElementById('humanAnnStageName').textContent = st.name;
                        document.getElementById('humanAnnTopo').textContent = `${st.inSize}\u2192${st.hidSize}\u2192${st.outSize}`;
                        document.getElementById('humanAnnProgressBar').style.width = `${prog.toFixed(0)}%`;
                        const synCnt = (c.brain && c.brain.isNeataptic && c.brain.net) ? c.brain.net.connections.length : ((c.brain?.hidSize || 2) * (c.brain?.inSize || 2));
                        document.getElementById('humanAnnSynapses').textContent = `Synapses: ${synCnt} \u2022 Learned: ${c.brain?.learningUpdates || 0}`;
                        const cmdStats = document.getElementById('humanCmdStats');
                        if (cmdStats) cmdStats.textContent = `Cmds: ${c.tasksIssued || 0} \u2022 Revs: ${c.revolutionsLed || 0}`;
                    }
                }

                drawNeuralBrain(c);
                updateLineageComparePanel();
            }

            function updateLineageComparePanel() {
                const chainBox = document.getElementById('lineageChainBox');
                const leftBox = document.getElementById('compareLeftBox');
                const rightBox = document.getElementById('compareRightBox');
                if (!chainBox || !leftBox || !rightBox) return;

                if (!selectedCreature || !creatures.includes(selectedCreature)) {
                    chainBox.textContent = 'Select an organism to trace lineage & compare ANN activations.';
                    leftBox.innerHTML = '<span class="text-teal-300 font-bold">Specimen A</span><span>\u2014</span>';
                    rightBox.innerHTML = '<span class="text-amber-300 font-bold">Specimen B</span><span>\u2014</span>';
                    return;
                }

                const a = selectedCreature;
                if (!compareCreature || !creatures.includes(compareCreature) || compareCreature === a) {
                    compareCreature = creatures.find(x => x !== a && x.species === a.species) || creatures.find(x => x !== a) || a;
                }
                const b = compareCreature;

                const parentStr = a.parentId ? `${a.parentName || 'Ancestor'} (${a.parentId})` : 'Primordial Seed';
                chainBox.textContent = `Lineage: ${parentStr} \u2192 ${a.realName.split(' (')[0]} (${a.genome.id}, Gen ${a.generation})`;

                const renderSpecBox = (box, title, sp) => {
                    const outStr = (sp.brain?.lastOutputs || [0, 0]).map(v => v.toFixed(2)).join(', ');
                    box.innerHTML = `
                        <div class="font-bold text-white truncate">${title}: ${sp.realName.split(' (')[0]}</div>
                        <div class="text-cyan-300">${sp.genome.id} \u2022 Gen ${sp.generation} \u2022 ${sp.genome.variantTag || 'V1'}</div>
                        <div>Fitness: <span class="text-emerald-300 font-bold">${sp.computeFitness().toFixed(1)}</span> \u2022 Spd ${sp.genome.speed.toFixed(1)}</div>
                        <div class="text-amber-200 truncate">Out: [${outStr}]</div>
                    `;
                };
                renderSpecBox(leftBox, 'A', a);
                renderSpecBox(rightBox, 'B', b);
            }

            function deselectCreature() {
                selectedCreature = null;
                followSelected = false;
                exitFpvMode(true);
                const followBtn = document.getElementById('btnFollowBot');
                const followText = document.getElementById('textFollowBot');
                if (followBtn) { followBtn.classList.remove('insp-on'); followBtn.setAttribute('aria-pressed', 'false'); }
                if (followText) followText.textContent = 'Follow: OFF';
                document.getElementById('inspectorCard').classList.add('hidden');
                updateLineageComparePanel();
            }

            function recordTelemetryPoint() {
                let land = 0, ocean = 0, sky = 0;
                for (const c of creatures) {
                    if (c.genome.sphereAffinity === 'ATMOSPHERE') sky++;
                    else if (c.genome.sphereAffinity === 'OCEAN') ocean++;
                    else land++;
                }
                telemetryHistory.push({
                    tick: simTick,
                    pop: getTotalBiospherePopulation(),
                    land,
                    ocean,
                    sky
                });
                if (telemetryHistory.length > 140) telemetryHistory.shift();
            }

            function drawTelemetryChart() {
                if (!chartCtx || !telemetryHistory.length) return;
                const w = chartCanvas.width;
                const h = chartCanvas.height;
                chartCtx.clearRect(0, 0, w, h);
                chartCtx.fillStyle = '#020a14';
                chartCtx.fillRect(0, 0, w, h);

                const pts = telemetryHistory.map(p => {
                    if (chartFilter === 'land') return p.land;
                    if (chartFilter === 'ocean') return p.ocean;
                    if (chartFilter === 'sky') return p.sky;
                    return p.pop;
                });
                const maxV = Math.max(1, ...pts);
                const minV = Math.min(...pts);
                const span = Math.max(1, maxV - minV);

                chartCtx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
                chartCtx.lineWidth = 1;
                for (let g = 1; g < 4; g++) {
                    const gy = (h / 4) * g;
                    chartCtx.beginPath(); chartCtx.moveTo(0, gy); chartCtx.lineTo(w, gy); chartCtx.stroke();
                }

                const strokeHex = chartFilter === 'land' ? '#4ade80' : chartFilter === 'ocean' ? '#38bdf8' : chartFilter === 'sky' ? '#c084fc' : '#2dd4bf';
                chartCtx.strokeStyle = strokeHex;
                chartCtx.lineWidth = 2.2;
                chartCtx.beginPath();
                pts.forEach((val, idx) => {
                    const x = (idx / Math.max(1, pts.length - 1)) * (w - 16) + 8;
                    const y = h - 12 - ((val - minV) / span) * (h - 24);
                    if (idx === 0) chartCtx.moveTo(x, y);
                    else chartCtx.lineTo(x, y);
                });
                chartCtx.stroke();

                const firstTick = telemetryHistory[0].tick;
                const lastTick = telemetryHistory[telemetryHistory.length - 1].tick;
                const tickSpan = Math.max(1, lastTick - firstTick);
                for (const m of eventMarkers) {
                    if (m.tick >= firstTick && m.tick <= lastTick) {
                        const mx = ((m.tick - firstTick) / tickSpan) * (w - 16) + 8;
                        chartCtx.strokeStyle = m.color;
                        chartCtx.lineWidth = 1;
                        chartCtx.setLineDash([2, 2]);
                        chartCtx.beginPath(); chartCtx.moveTo(mx, 4); chartCtx.lineTo(mx, h - 4); chartCtx.stroke();
                        chartCtx.setLineDash([]);
                    }
                }
            }

            function exportTelemetryFile(format) {
                const payload = {
                    seed: worldSeed,
                    tick: simTick,
                    era: EARTH_ERAS[currentEraIndex].name,
                    weather: currentWeather,
                    regime: COLONY_REGIMES[currentRegimeIndex],
                    revolutions: revolutionCount,
                    tasksIssued: tasksIssuedTotal,
                    culturalStage: CULTURAL_STAGES[culturalStageIndex].name,
                    population: getTotalBiospherePopulation(),
                    history: telemetryHistory,
                    events: eventMarkers,
                    shelters: builtStructures
                };
                const content = format === 'csv'
                    ? ['tick,population,land,ocean,sky', ...telemetryHistory.map(r => `${r.tick},${r.pop},${r.land},${r.ocean},${r.sky}`)].join('\n')
                    : JSON.stringify(payload, null, 2);
                const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `digital-life-tick-${simTick}.${format}`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                showToast(`Exported ${format.toUpperCase()} telemetry`);
            }

            function openSpecimenLab() {
                if (!selectedCreature || !creatures.includes(selectedCreature)) selectedCreature = creatures[0] || null;
                if (!selectedCreature) return;
                isModalOpen = true;
                document.getElementById('specimenLabModal').classList.remove('hidden');
                syncSpecimenLabModal();
            }

            function closeSpecimenLab() {
                isModalOpen = false;
                draggingLattice = false;
                document.getElementById('specimenLabModal').classList.add('hidden');
            }

            function stepSpecimenInLab(delta) {
                if (!creatures.length) return;
                const idx = selectedCreature ? creatures.indexOf(selectedCreature) : 0;
                const nextIdx = (idx + delta + creatures.length) % creatures.length;
                selectedCreature = creatures[nextIdx];
                updateInspectorHUD();
                syncSpecimenLabModal();
            }

            function syncSpecimenLabModal() {
                if (!isModalOpen || !selectedCreature || !creatures.includes(selectedCreature)) return;
                const c = selectedCreature;
                const cfg = SPECIES_CONFIG[c.species] || SPECIES_CONFIG.capybara;
                const nrgPct = Math.max(0, Math.min(100, Math.round((c.energy / c.maxEnergy) * 100)));
                const hydPct = Math.max(0, Math.min(100, Math.round(c.hydration)));
                const synCount = (c.brain && c.brain.isNeataptic && c.brain.net) ? c.brain.net.connections.length : ((c.brain?.hidSize || 2) * (c.brain?.inSize || 2));

                document.getElementById('modalAvatarBadge').textContent = c.genome.id.slice(-2);
                document.getElementById('modalSpecimenName').textContent = c.realName;
                document.getElementById('modalCognitiveStatus').textContent = c.isCognitiveLeader ? 'COGNITIVE LEADER' : 'NEURAL AGENT';
                document.getElementById('modalLifeStageDetail').textContent = `${c.lifeStage} \u2022 ${c.genome.sphereAffinity} \u2022 ${cfg.diet}`;
                document.getElementById('modalStrainBadge').textContent = `STRAIN_${c.genome.id}_${c.genome.variantTag || 'V1'}`;
                document.getElementById('modalResolutionVal').textContent = `${(1.65 + (1 - c.growthProgress) * 0.75).toFixed(2)} \u00C5`;
                document.getElementById('modalCivilization').textContent = CULTURAL_STAGES[culturalStageIndex].name.split(': ')[1];
                document.getElementById('modalHydration').textContent = `${hydPct}%`;
                document.getElementById('modalDefenseVal').textContent = `${c.computeFitness().toFixed(1)}`;
                document.getElementById('modalEcologyDetail').textContent = cfg.ecology;

                document.getElementById('modalActiveNodesBadge').textContent = `${(c.brain?.hidSize || 6) + (c.brain?.inSize || 5)} Nodes`;
                document.getElementById('modalBindingEnergy').innerHTML = `${(-7.5 - c.mindGrowth * 1.4).toFixed(1)} <span class="text-[9px] text-slate-400 font-normal">kcal/mol</span>`;
                document.getElementById('modalSensorArea').innerHTML = `${Math.round(c.genome.vision * 2.4)} <span class="text-[9px] text-slate-400 font-normal">\u00C5\u00B2</span>`;
                document.getElementById('modalActiveNodesCount').textContent = `${synCount}`;

                const foldPct = Math.min(99, Math.round(65 + c.growthProgress * 30));
                const synPct = Math.min(99, Math.round(45 + synCount * 1.4));
                const ecoPct = hydPct;
                const metPct = nrgPct;
                document.getElementById('pipeFoldPct').textContent = `${foldPct}%`;
                document.getElementById('pipeFoldBar').style.width = `${foldPct}%`;
                document.getElementById('pipeSynPct').textContent = `${synPct}%`;
                document.getElementById('pipeSynBar').style.width = `${synPct}%`;
                document.getElementById('pipeEcoPct').textContent = `${ecoPct}%`;
                document.getElementById('pipeEcoBar').style.width = `${ecoPct}%`;
                document.getElementById('pipeMetPct').textContent = `${metPct}%`;
                document.getElementById('pipeMetBar').style.width = `${metPct}%`;

                document.getElementById('cryoProteinTitle').textContent = `${cfg.name} Matrix`;
                document.getElementById('cryoPatternTag').textContent = c.genome.pattern;
                document.getElementById('cryoMassVal').textContent = `${(c.genome.size * 1.8).toFixed(1)} kDa`;
                document.getElementById('cryoSpeedVal').textContent = c.genome.speed.toFixed(2);
                document.getElementById('cryoVisionVal').textContent = `${Math.round(c.genome.vision)} px`;
                document.getElementById('cryoEscapesVal').textContent = `${c.successfulEscapes}`;
                document.getElementById('cryoKdVal').textContent = `${Math.max(12, Math.round(52 - c.resilience * 28))}`;
                document.getElementById('cryoVitalityBadge').textContent = nrgPct > 55 ? 'EXCELLENT' : nrgPct > 28 ? 'NOMINAL' : 'LOW ATP';

                drawCryoCanvases(c);
            }

            function drawCryoCanvases(c) {
                if (cryo3dCanvas) {
                    const g = cryo3dCanvas.getContext('2d');
                    const w = cryo3dCanvas.width, h = cryo3dCanvas.height;
                    g.clearRect(0, 0, w, h);
                    g.fillStyle = '#03121e';
                    g.fillRect(0, 0, w, h);
                    const cx = w * 0.5, cy = h * 0.5;
                    const t = renderFrame * 0.03 + latticeYaw;
                    const nodes = [];
                    const totalN = 28;
                    for (let i = 0; i < totalN; i++) {
                        const phi = Math.acos(1 - (2 * (i + 0.5)) / totalN);
                        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t;
                        const rad = 115;
                        const x3 = rad * Math.sin(phi) * Math.cos(theta);
                        const y3 = rad * Math.cos(phi) * Math.cos(latticePitch) - rad * Math.sin(phi) * Math.sin(theta) * Math.sin(latticePitch);
                        const z3 = rad * Math.sin(phi) * Math.sin(theta) * Math.cos(latticePitch) + rad * Math.cos(phi) * Math.sin(latticePitch);
                        const scale = 320 / Math.max(120, 320 + z3);
                        nodes.push({ x: cx + x3 * scale, y: cy + y3 * scale, z: z3, r: 4.5 * scale });
                    }
                    g.strokeStyle = 'rgba(45, 212, 191, 0.25)';
                    g.lineWidth = 1;
                    for (let i = 0; i < nodes.length; i++) {
                        for (let j = i + 1; j < nodes.length; j++) {
                            if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 85) {
                                g.beginPath(); g.moveTo(nodes[i].x, nodes[i].y); g.lineTo(nodes[j].x, nodes[j].y); g.stroke();
                            }
                        }
                    }
                    nodes.sort((a, b) => a.z - b.z).forEach((nd, idx) => {
                        g.fillStyle = idx % 3 === 0 ? '#fde047' : idx % 2 === 0 ? '#2dd4bf' : '#38bdf8';
                        g.beginPath(); g.arc(nd.x, nd.y, Math.max(2, nd.r), 0, Math.PI * 2); g.fill();
                    });
                }

                const interCanvas = document.getElementById('cryoInteractionCanvas');
                if (interCanvas) {
                    const ig = interCanvas.getContext('2d');
                    const iw = interCanvas.width, ih = interCanvas.height;
                    ig.clearRect(0, 0, iw, ih);
                    ig.fillStyle = '#020a14'; ig.fillRect(0, 0, iw, ih);
                    const icx = iw * 0.5, icy = ih * 0.5;
                    for (let r = 24; r <= 78; r += 27) {
                        ig.strokeStyle = 'rgba(56, 189, 248, 0.18)';
                        ig.beginPath(); ig.arc(icx, icy, r, 0, Math.PI * 2); ig.stroke();
                    }
                    [{ ang: 0.4, dist: 38, col: '#34d399' }, { ang: 2.1, dist: 56, col: '#38bdf8' }, { ang: 4.2, dist: 44, col: '#fb7185' }].forEach((it, idx) => {
                        const a = it.ang + renderFrame * 0.02 * (idx % 2 === 0 ? 1 : -1);
                        ig.fillStyle = it.col;
                        ig.beginPath();
                        ig.arc(icx + Math.cos(a) * it.dist, icy + Math.sin(a) * it.dist, 5, 0, Math.PI * 2);
                        ig.fill();
                    });
                }

                const protCanvas = document.getElementById('cryoProteinCanvas');
                if (protCanvas) {
                    const pg = protCanvas.getContext('2d');
                    const pw = protCanvas.width, ph = protCanvas.height;
                    pg.clearRect(0, 0, pw, ph);
                    pg.fillStyle = '#020a14'; pg.fillRect(0, 0, pw, ph);
                    pg.strokeStyle = '#2dd4bf'; pg.lineWidth = 2.5;
                    pg.beginPath();
                    for (let x = 8; x < pw - 8; x += 4) {
                        const y = ph * 0.5 + Math.sin(x * 0.09 + renderFrame * 0.08) * (ph * 0.28);
                        if (x === 8) pg.moveTo(x, y); else pg.lineTo(x, y);
                    }
                    pg.stroke();
                }

                const chemCanvas = document.getElementById('cryoChemicalCanvas');
                if (chemCanvas) {
                    const cg = chemCanvas.getContext('2d');
                    const cw = chemCanvas.width, ch = chemCanvas.height;
                    cg.clearRect(0, 0, cw, ch);
                    cg.fillStyle = '#020a14'; cg.fillRect(0, 0, cw, ch);
                    const bars = 24;
                    const bw = (cw - 24) / bars;
                    for (let i = 0; i < bars; i++) {
                        const val = 0.25 + 0.7 * Math.abs(Math.sin(i * 0.55 + c.genome.hue * 0.05 + renderFrame * 0.04));
                        const bh = val * (ch - 18);
                        cg.fillStyle = i % 2 === 0 ? 'rgba(45, 212, 191, 0.75)' : 'rgba(56, 189, 248, 0.75)';
                        cg.fillRect(12 + i * bw, ch - 8 - bh, Math.max(3, bw - 2), bh);
                    }
                }

                if (modalVitalityCanvas) {
                    const mg = modalVitalityCanvas.getContext('2d');
                    const mw = modalVitalityCanvas.width, mh = modalVitalityCanvas.height;
                    mg.clearRect(0, 0, mw, mh);
                    mg.fillStyle = '#020a14'; mg.fillRect(0, 0, mw, mh);
                    const hist = c.vitalityHistory || [0.6];
                    mg.strokeStyle = '#34d399'; mg.lineWidth = 2;
                    mg.beginPath();
                    hist.forEach((v, idx) => {
                        const x = (idx / Math.max(1, hist.length - 1)) * (mw - 16) + 8;
                        const y = mh - 10 - v * (mh - 20);
                        if (idx === 0) mg.moveTo(x, y); else mg.lineTo(x, y);
                    });
                    mg.stroke();
                }
            }

            // =========================================================================
            // SECTION 8: SEEDING, ERAS, WEATHER, EVENTS & SAVE/RESTORE
            // =========================================================================
            function seedInitialNutrients() {
                nutrients = [];
                const era = EARTH_ERAS[currentEraIndex];
                const baseFruit = Math.round(28 + params.foodRate * 11 * era.nutrientBoost * soilFertility);
                for (let i = 0; i < baseFruit; i++) {
                    const isl = ISLAND_ARCHIPELAGO[i % ISLAND_ARCHIPELAGO.length];
                    const ang = Math.random() * Math.PI * 2;
                    const rad = Math.random() * isl.radius * 0.72;
                    const fx = clampWorldCoordinate(isl.x + Math.cos(ang) * rad);
                    const fy = clampWorldCoordinate(isl.y + Math.sin(ang) * rad);
                    const el = getWorldElevation(fx, fy);
                    nutrients.push({ x: fx, y: fy, size: el > 0.05 ? 5.6 : 4.6, energy: el > 0.05 ? 46 : 36, kind: el > 0.05 ? 'fruit' : 'plankton' });
                }
            }

            function seedInitialOreAndColonies() {
                oreVeins = [];
                colonies = [];
                tradeBoats = [];
                wildfires = [];
                ISLAND_ARCHIPELAGO.forEach((isl, idx) => {
                    for (let k = 0; k < 3; k++) {
                        const ang = idx * 0.9 + k * 2.1;
                        const rad = isl.radius * (0.35 + k * 0.14);
                        oreVeins.push({ x: isl.x + Math.cos(ang) * rad, y: isl.y + Math.sin(ang) * rad, ore: 60 });
                    }
                });
            }

            function seedInitialSprings() {
                springs = ISLAND_ARCHIPELAGO.map((isl, i) => ({
                    x: isl.x + Math.cos(i * 1.1) * 140,
                    y: isl.y + Math.sin(i * 1.1) * 140,
                    radius: 34
                }));
            }

            function seedInitialCreatures() {
                creatures = [];
                builtStructures = [];
                collectiveKnowledgeXP = 0;
                culturalStageIndex = 0;
                revolutionCount = 0;
                tasksIssuedTotal = 0;
                currentRegimeIndex = 0;
                oreStock = 0;
                industryOutput = 0;
                fireCount = 0;
                revolutionWaves.length = 0;
                commandBeams.length = 0;
                spawnedGenomeSignatures.clear();
                nameCursor = 0;
                maxGeneration = 1;
                totalSpawnCounter = 0;

                const perIslandCore = [
                    ['human', 'woodlouse', 'earthworm', 'nautilus', 'moonjelly', 'capybara'],
                    ['human', 'clownfish', 'moonjelly', 'seaotter', 'earthworm', 'capybara'],
                    ['human', 'mantaray', 'seaturtle', 'dolphin', 'albatross', 'capybara'],
                    ['human', 'armadillo', 'pangolin', 'molerat', 'reddeer', 'bison'],
                    ['human', 'honeybee', 'hummingbird', 'flyingsquirrel', 'jaguar', 'reddeer'],
                    ['human', 'snowleopard', 'falcon', 'albatross', 'armadillo', 'nautilus'],
                    ['human', 'capybara', 'reddeer', 'bison', 'dolphin', 'octopus', 'whale', 'honeybee', 'falcon', 'jaguar', 'seaotter', 'moonjelly']
                ];

                ISLAND_ARCHIPELAGO.forEach((isl, idx) => {
                    const roster = perIslandCore[idx] || perIslandCore[6];
                    roster.forEach((sp, sIdx) => {
                        const ang = (sIdx / roster.length) * Math.PI * 2 + idx * 0.4;
                        const isWater = SPECIES_CONFIG[sp]?.sphere === 'OCEAN';
                        const rad = isWater ? isl.radius * 1.08 : isl.radius * (0.25 + (sIdx % 3) * 0.16);
                        const org = new Organism(isl.x + Math.cos(ang) * rad, isl.y + Math.sin(ang) * rad, sp, 1, null, null, sIdx === 0);
                        creatures.push(org);
                    });
                });

                selectedCreature = creatures[0] || null;
                updateInspectorHUD();
                addEvolutionMilestone('Seeded 7-Island Voxel Archipelago');
            }

            function setEra(idx, announce = true) {
                currentEraIndex = ((idx % EARTH_ERAS.length) + EARTH_ERAS.length) % EARTH_ERAS.length;
                eraProgress = 0;
                updateEraHUD();
                rebuildTerracedWorld();
                updateHUD();
                if (announce) {
                    const era = EARTH_ERAS[currentEraIndex];
                    recordEventMarker(`Era: ${era.name.split(' ')[1] || era.name}`, '#5eead4');
                    addChronicleEntry(`Entered ${era.name} (${era.years})`, 'text-teal-300');
                    showToast(`${era.years}: ${era.name}`);
                }
            }

            function cycleWeather(nextWx = null) {
                const order = ['clear', 'rain', 'storm', 'mist'];
                if (nextWx && order.includes(nextWx)) currentWeather = nextWx;
                else currentWeather = order[(order.indexOf(currentWeather) + 1) % order.length];
                weatherTimer = 420;
                const sel = document.getElementById('selectWeather');
                if (sel) sel.value = currentWeather;
                recordEventMarker(`Weather: ${currentWeather}`, '#7dd3fc');
                addChronicleEntry(`Atmosphere shifted to ${currentWeather.toUpperCase()}`, 'text-sky-300');
                showToast(`Weather: ${currentWeather.toUpperCase()}`);
                updateHUD();
            }

            function applyScenarioPreset(key) {
                const preset = SCENARIO_PRESETS[key];
                if (!preset) return;
                params.tempShift = preset.tempShift;
                params.foodRate = preset.foodRate;
                params.mutationRate = preset.mutationRate;
                params.burnRate = preset.burnRate;
                currentWeather = preset.weather;
                timeOfDay = preset.timeOfDay;
                syncSlidersFromParams();
                setEra(preset.eraIdx, false);
                if (key === 'people_revolution') {
                    const h = creatures.find(c => c.isHuman);
                    if (h) triggerHumanRevolution(h);
                }
                recordEventMarker(`Scenario: ${preset.label}`, '#fbbf24');
                addChronicleEntry(preset.narration, 'text-amber-200');
                showToast(`Scenario Active: ${preset.label}`);
                audioEngine.playChime(587.33, 0.24);
                updateHUD();
            }

            function triggerHistoricalEvent() {
                const era = EARTH_ERAS[currentEraIndex];
                recordEventMarker(era.eventName, '#fb923c');
                addChronicleEntry(`EVENT: ${era.eventName} across the 7 islands!`, 'text-amber-300');
                showToast(`Event: ${era.eventName}!`);
                audioEngine.playPulse(115, 0.42);
                addEvolutionMilestone(era.eventName);

                for (const isl of ISLAND_ARCHIPELAGO) {
                    emitOceanRipple(isl.x + isl.radius * 0.95, isl.y, 1.35);
                }

                if (era.eventName === "Asteroid Shockwave" || era.eventName === "Volcanic Surge") {
                    currentWeather = 'storm';
                    weatherTimer = 360;
                    const sel = document.getElementById('selectWeather');
                    if (sel) sel.value = 'storm';
                    lightningFlash = 1.0;
                    const isl0 = ISLAND_ARCHIPELAGO[0];
                    activeLightningBolt = { x: isl0.x + 80, z: isl0.y - 60 };
                    for (const c of creatures) {
                        const isHardened = c.genome.defense.includes("ARMOUR") || c.genome.defense.includes("SHELL") || c.genome.defense.includes("CARAPACE") || c.genome.defense.includes("CHAMBER") || c.genome.defense.includes("TOOLS") || c.resilience > 0.65;
                        if (!isHardened) {
                            c.energy = Math.max(14, c.energy * 0.72);
                            c.stress = Math.min(0.95, c.stress + 0.25);
                        } else {
                            c.successfulEscapes++;
                            c.energy = Math.min(c.maxEnergy, c.energy + 22);
                        }
                    }
                } else {
                    currentWeather = 'rain';
                    weatherTimer = 300;
                    const sel = document.getElementById('selectWeather');
                    if (sel) sel.value = 'rain';
                    soilFertility = Math.min(1.6, soilFertility + 0.22);
                    for (let i = 0; i < 28; i++) {
                        const isl = ISLAND_ARCHIPELAGO[i % ISLAND_ARCHIPELAGO.length];
                        const ang = Math.random() * Math.PI * 2;
                        const rad = Math.random() * isl.radius * 0.75;
                        const fx = clampWorldCoordinate(isl.x + Math.cos(ang) * rad);
                        const fy = clampWorldCoordinate(isl.y + Math.sin(ang) * rad);
                        nutrients.push({ x: fx, y: fy, size: 6.2, energy: 54, kind: 'fruit' });
                    }
                    rebuildThreeEntities();
                }
                updateHUD();
            }

            function resetHumansToTabulaRasa() {
                for (const c of creatures) {
                    if (c.isHuman) {
                        c.humanAnnStage = 0;
                        c.humanNeuralXP = 0;
                        c.isCognitiveLeader = false;
                        c.inventions = [];
                        c.tasksIssued = 0;
                        c.revolutionsLed = 0;
                        c.faction = 'COLONY';
                        c.brain = new NeuralBrain(null, false, true, 0);
                    }
                }
                builtStructures = [];
                collectiveKnowledgeXP = 0;
                culturalStageIndex = 0;
                revolutionCount = 0;
                tasksIssuedTotal = 0;
                currentRegimeIndex = 0;
                rebuildTerracedWorld();
                updateInspectorHUD();
                updateHUD();
                addChronicleEntry('Humanity reset to Stage 0 (2\u21922\u21922 Tabula Rasa).', 'text-rose-300');
                showToast('Humans reset to Stage 0 Tabula Rasa');
            }

            function captureSimulationSnapshot(label = '') {
                return {
                    label, tick: simTick, worldSeed, currentEraIndex, eraProgress, timeOfDay, currentWeather,
                    soilFertility, tideOffset, collectiveKnowledgeXP, culturalStageIndex,
                    revolutionCount, tasksIssuedTotal, currentRegimeIndex,
                    params: { ...params },
                    builtStructures: builtStructures.map(s => ({ ...s })),
                    nutrients: nutrients.map(n => ({ ...n })),
                    springs: springs.map(sp => ({ ...sp })),
                    creatures: creatures.map(c => ({
                        x: c.x, y: c.y, species: c.species, generation: c.generation,
                        parentId: c.parentId, parentName: c.parentName, resilience: c.resilience,
                        stress: c.stress, isHuman: c.isHuman, humanAnnStage: c.humanAnnStage,
                        humanNeuralXP: c.humanNeuralXP, isCognitiveLeader: c.isCognitiveLeader,
                        faction: c.faction, tasksIssued: c.tasksIssued, revolutionsLed: c.revolutionsLed,
                        realName: c.realName, genome: { ...c.genome },
                        angle: c.angle, energy: c.energy, hydration: c.hydration,
                        offspring: c.offspring, fitness: c.fitness, ageTicks: c.ageTicks,
                        growthProgress: c.growthProgress, assignedGoal: c.assignedGoal,
                        inventions: [...c.inventions], successfulEscapes: c.successfulEscapes,
                        brainData: (c.brain && c.brain.isNeataptic && c.brain.net)
                            ? { neatJSON: c.brain.net.toJSON(), learningUpdates: c.brain.learningUpdates }
                            : { w1: c.brain?.w1, b1: c.brain?.b1, w2: c.brain?.w2, b2: c.brain?.b2, learningUpdates: c.brain?.learningUpdates || 0 }
                    }))
                };
            }

            function applySimulationSnapshot(snap, sourceName = 'Checkpoint') {
                if (!snap || !Array.isArray(snap.creatures)) return;
                simTick = snap.tick || 0;
                worldSeed = snap.worldSeed || worldSeed;
                currentEraIndex = snap.currentEraIndex || 0;
                eraProgress = snap.eraProgress || 0;
                timeOfDay = snap.timeOfDay ?? 12;
                currentWeather = snap.currentWeather || 'clear';
                soilFertility = snap.soilFertility ?? 1.0;
                tideOffset = snap.tideOffset ?? 0;
                collectiveKnowledgeXP = snap.collectiveKnowledgeXP || 0;
                culturalStageIndex = snap.culturalStageIndex || 0;
                revolutionCount = snap.revolutionCount || 0;
                tasksIssuedTotal = snap.tasksIssuedTotal || 0;
                currentRegimeIndex = snap.currentRegimeIndex || 0;
                if (snap.params) Object.assign(params, snap.params);
                builtStructures = (snap.builtStructures || []).map(s => ({ ...s }));
                nutrients = (snap.nutrients || []).map(n => ({ ...n }));
                springs = (snap.springs || []).map(sp => ({ ...sp }));
                creatures = snap.creatures.map(d => {
                    const org = new Organism(d.x, d.y, d.species, d.generation, d.genome, null, d.isCognitiveLeader, d.parentId ? { id: d.parentId, name: d.parentName, resilience: d.resilience } : null);
                    org.realName = d.realName || org.realName;
                    org.genome = { ...d.genome };
                    org.humanAnnStage = d.humanAnnStage || 0;
                    org.humanNeuralXP = d.humanNeuralXP || 0;
                    org.faction = d.faction || 'COLONY';
                    org.tasksIssued = d.tasksIssued || 0;
                    org.revolutionsLed = d.revolutionsLed || 0;
                    org.angle = d.angle || 0;
                    org.energy = d.energy ?? 120;
                    org.hydration = d.hydration ?? 100;
                    org.stress = d.stress ?? 0.1;
                    org.resilience = d.resilience ?? 0.5;
                    org.offspring = d.offspring || 0;
                    org.fitness = d.fitness || 10;
                    org.ageTicks = d.ageTicks || 0;
                    org.growthProgress = d.growthProgress ?? 1;
                    org.assignedGoal = d.assignedGoal || org.assignedGoal;
                    org.inventions = [...(d.inventions || [])];
                    org.successfulEscapes = d.successfulEscapes || 0;
                    org.brain = new NeuralBrain(d.brainData, org.isCognitiveLeader, org.isHuman, org.humanAnnStage);
                    return org;
                });
                selectedCreature = creatures[0] || null;
                syncSlidersFromParams();
                updateEraHUD();
                rebuildTerracedWorld();
                updateInspectorHUD();
                updateHUD();
                addChronicleEntry(`Restored ${sourceName} (Tick ${simTick})`, 'text-amber-300');
                showToast(`Restored ${sourceName}`);
            }

            function saveCheckpointToStorage() {
                try {
                    const slotKey = document.getElementById('checkpointSlotSelect')?.value || 'slot_1';
                    const customName = (document.getElementById('checkpointSlotName')?.value || '').trim();
                    const snap = captureSimulationSnapshot(customName || slotKey);
                    const allSlots = JSON.parse(localStorage.getItem(STORAGE_SLOTS_KEY) || '{}');
                    allSlots[slotKey] = { name: customName || slotKey, savedAt: new Date().toLocaleTimeString(), snap };
                    localStorage.setItem(STORAGE_SLOTS_KEY, JSON.stringify(allSlots));
                    savedCheckpoint = snap;
                    showToast(`Saved ${customName || slotKey} (Tick ${simTick})`);
                } catch (e) {
                    savedCheckpoint = captureSimulationSnapshot('Memory');
                    showToast(`Saved snapshot in memory (Tick ${simTick})`);
                }
            }

            function restoreCheckpointFromStorage() {
                try {
                    const slotKey = document.getElementById('checkpointSlotSelect')?.value || 'slot_1';
                    const allSlots = JSON.parse(localStorage.getItem(STORAGE_SLOTS_KEY) || '{}');
                    const entry = allSlots[slotKey];
                    const snap = entry?.snap || savedCheckpoint;
                    if (!snap) { showToast('No saved checkpoint found'); return; }
                    undoCheckpoint = captureSimulationSnapshot('Before Restore');
                    applySimulationSnapshot(snap, entry?.name || slotKey);
                } catch (e) {
                    if (savedCheckpoint) {
                        undoCheckpoint = captureSimulationSnapshot('Before Restore');
                        applySimulationSnapshot(savedCheckpoint, 'Memory');
                    }
                }
            }

            function undoLastCheckpointRestore() {
                if (!undoCheckpoint) { showToast('Nothing to undo'); return; }
                const prev = undoCheckpoint;
                undoCheckpoint = null;
                applySimulationSnapshot(prev, 'Pre-Restore State');
            }

            function copySeedStateCode() {
                const compact = {
                    s: worldSeed, e: currentEraIndex, t: Number(timeOfDay.toFixed(1)), w: currentWeather,
                    p: [params.tempShift, params.foodRate, Number(params.mutationRate.toFixed(2)), Number(params.burnRate.toFixed(2))]
                };
                const code = 'dl1|' + btoa(JSON.stringify(compact));
                const inp = document.getElementById('seedStateInput');
                if (inp) inp.value = code;
                try {
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                } catch (e) { }
                showToast('Copied shareable Seed Code');
            }

            function applySeedStateCode() {
                const inp = document.getElementById('seedStateInput');
                const raw = (inp?.value || '').trim();
                if (!raw.startsWith('dl1|')) { showToast('Enter a valid dl1|... seed code'); return; }
                try {
                    const parsed = JSON.parse(atob(raw.slice(4)));
                    worldSeed = Number(parsed.s) || worldSeed;
                    timeOfDay = Number(parsed.t) || 12;
                    if (parsed.w) currentWeather = parsed.w;
                    if (Array.isArray(parsed.p)) {
                        params.tempShift = Number(parsed.p[0]) || 0;
                        params.foodRate = Number(parsed.p[1]) || 6;
                        params.mutationRate = Number(parsed.p[2]) || 0.3;
                        params.burnRate = Number(parsed.p[3]) || 1.0;
                    }
                    syncSlidersFromParams();
                    setEra(Number(parsed.e) || 0, false);
                    seedInitialSprings();
                    seedInitialNutrients();
                    seedInitialCreatures();
                    showToast(`Loaded Seed ${worldSeed.toFixed(2)}`);
                } catch (e) {
                    showToast('Invalid seed code format');
                }
            }

            function syncSlidersFromParams() {
                const tSlider = document.getElementById('sliderTimeOfDay');
                const tempSlider = document.getElementById('sliderTempShift');
                const foodSlider = document.getElementById('sliderFoodRate');
                const mutSlider = document.getElementById('sliderMutation');
                const burnSlider = document.getElementById('sliderBurnRate');
                const wxSel = document.getElementById('selectWeather');
                if (tSlider) tSlider.value = String(timeOfDay);
                if (tempSlider) tempSlider.value = String(params.tempShift);
                if (foodSlider) foodSlider.value = String(params.foodRate);
                if (mutSlider) mutSlider.value = String(Math.round(params.mutationRate * 100));
                if (burnSlider) burnSlider.value = String(Math.round(params.burnRate * 10));
                if (wxSel) wxSel.value = currentWeather;

                document.getElementById('valTimeOfDay').textContent = formatClock(timeOfDay);
                document.getElementById('valTempShift').textContent = `${params.tempShift >= 0 ? '+' : ''}${params.tempShift}\u00B0C`;
                document.getElementById('valFoodRate').textContent = `${params.foodRate}/10`;
                document.getElementById('valMutation').textContent = `${Math.round(params.mutationRate * 100)}%`;
                document.getElementById('valBurnRate').textContent = `${params.burnRate.toFixed(1)}x`;
            }

            function resetSimulation() {
                worldSeed = 2000 + Math.random() * 900;
                params.tempShift = 0;
                params.foodRate = 6;
                params.mutationRate = 0.30;
                params.burnRate = 1.0;
                timeOfDay = 11.5;
                currentWeather = 'clear';
                soilFertility = 1.0;
                tideOffset = 0;
                simTick = 0;
                milestones = [];
                eventMarkers.length = 0;
                telemetryHistory.length = 0;
                renderMilestoneStrip();
                syncSlidersFromParams();
                seedInitialSprings();
                seedInitialNutrients();
                seedInitialCreatures();
                setEra(0, false);
                recordEventMarker('New Seed', '#2dd4bf');
                addChronicleEntry(`Generated fresh voxel archipelago seed ${worldSeed.toFixed(2)}.`, 'text-teal-300');
                showToast(`New Seed ${worldSeed.toFixed(2)} across 7 Islands`);
            }

            let toastTimeout = null;
            function showToast(msg) {
                const el = document.getElementById('simToast');
                if (!el) return;
                el.textContent = msg;
                el.style.opacity = '1';
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => { el.style.opacity = '0'; }, 2400);
            }

            function setClickMode(mode) {
                clickMode = mode;
                ['inspect', 'food', 'spawn', 'toxin', 'build'].forEach(m => {
                    const btn = document.getElementById(`tool${m.charAt(0).toUpperCase() + m.slice(1)}`);
                    if (!btn) return;
                    btn.className = m === mode
                        ? "px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 bg-teal-500/25 text-teal-200 border border-teal-400/40"
                        : "px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 shrink-0";
                });
            }

            function setSpeed(mult) {
                speedMultiplier = mult;
                [1, 2, 5].forEach(s => {
                    const b = document.getElementById(`spd${s}`);
                    if (!b) return;
                    b.className = s === mult
                        ? "px-2.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 font-semibold transition"
                        : "px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
                });
            }

            function applyCameraPreset(preset) {
                if (preset === 'overview') {
                    exitFpvMode(true);
                    camera.x = 0; camera.y = 0; camera.zoom = 0.42;
                } else if (preset === 'island') {
                    exitFpvMode(true);
                    const isl = ISLAND_ARCHIPELAGO[currentEraIndex % ISLAND_ARCHIPELAGO.length];
                    camera.x = isl.x; camera.y = isl.y; camera.zoom = 1.05;
                } else if (preset === 'fpv') {
                    const targetOrg = (selectedCreature && creatures.includes(selectedCreature)) ? selectedCreature : creatures[0];
                    if (targetOrg) enterFpvForCreature(targetOrg);
                } else if (preset === 'cryo') {
                    openSpecimenLab();
                }
                document.getElementById('hudZoom').textContent = `${Math.round(camera.zoom * 100)}%`;
            }

            function collectResearchMetrics() {
                let land = 0, ocean = 0, sky = 0, energy = 0, hydration = 0;
                const species = new Set();
                for (const c of creatures) {
                    const affinity = c.genome?.sphereAffinity;
                    if (affinity === 'ATMOSPHERE') sky++; else if (affinity === 'OCEAN') ocean++; else land++;
                    energy += Number(c.energy) || 0;
                    hydration += Number(c.hydration) || 0;
                    if (c.genome?.id) species.add(c.genome.id);
                }
                const n = Math.max(1, creatures.length);
                return {
                    timestamp: new Date().toISOString(), tick: simTick, population: creatures.length,
                    land, ocean, sky, speciesCount: species.size,
                    averageEnergy: Math.round(energy / n * 10) / 10,
                    averageHydration: Math.round(hydration / n * 10) / 10,
                    era: EARTH_ERAS[currentEraIndex]?.name || 'Unknown', weather: currentWeather,
                    temperatureShift: params.tempShift, foodRate: params.foodRate,
                    mutationRate: params.mutationRate, burnRate: params.burnRate,
                    condition: document.getElementById('researchCondition')?.value || 'Unspecified'
                };
            }

            function renderResearchPanel() {
                const m = collectResearchMetrics();
                const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
                set('researchPopulation', String(m.population));
                set('researchHabitats', `${m.land} / ${m.ocean} / ${m.sky}`);
                set('researchEnergy', String(m.averageEnergy));
                set('researchHydration', `${m.averageHydration}%`);
                set('researchCount', `${researchObservations.length} records`);
                const log = document.getElementById('researchLog');
                if (log) {
                    const rows = [];
                    if (researchBaseline) rows.push({ ...researchBaseline, label: 'Baseline' });
                    rows.push(...researchObservations);
                    log.innerHTML = rows.length ? rows.slice().reverse().map((r, i) => `<div class="rounded-lg border border-slate-700 bg-slate-900/80 p-2"><div class="flex justify-between gap-2"><b class="text-cyan-200">${r.label || 'Observation'} · Tick ${r.tick}</b><span class="text-slate-500">${new Date(r.timestamp).toLocaleTimeString()}</span></div><div class="mt-1 text-slate-300">${r.condition} · Population ${r.population} · Land/Ocean/Sky ${r.land}/${r.ocean}/${r.sky} · Species IDs ${r.speciesCount}</div></div>`).join('') : '<p class="text-slate-500">Capture a baseline to begin your experiment.</p>';
                }
            }

            function exportResearchReport() {
                if (!researchBaseline && !researchObservations.length) { showToast('Capture a baseline or observation first'); return; }
                const report = {
                    project: 'Digital Life Research Mode',
                    question: document.getElementById('researchQuestion')?.value || '',
                    exportedAt: new Date().toISOString(),
                    methodology: 'Artificial-life simulation observations; change one condition at a time and repeat trials.',
                    baseline: researchBaseline,
                    observations: researchObservations,
                    scientificLimit: 'Not a validated real-world ecological prediction model.'
                };
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `digital-life-research-tick-${simTick}.json`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                showToast('Research report exported');
            }

            function handleAction(action) {
                switch (action) {
                    case 'pause':
                        isPaused = !isPaused;
                        document.getElementById('textPlayPause').textContent = isPaused ? 'Resume' : 'Pause';
                        showToast(isPaused ? 'Simulation Paused' : 'Simulation Resumed');
                        break;
                    case 'view':
                        is3DView = !is3DView;
                        if (!is3DView && isFpvMode) exitFpvMode(true);
                        document.getElementById('hudViewMode').textContent = is3DView ? '3D ISO' : '2D PLAN';
                        showToast(is3DView ? 'Switched to 3D Isometric View' : 'Switched to 2D Plan View');
                        break;
                    case 'zones':
                        showZoneLabels = !showZoneLabels;
                        showToast(showZoneLabels ? 'Island Pins Shown' : 'Island Pins Hidden');
                        break;
                    case 'camera':
                        exitFpvMode(true);
                        const isl = ISLAND_ARCHIPELAGO[currentEraIndex % ISLAND_ARCHIPELAGO.length];
                        camera.x = isl.x; camera.y = isl.y; camera.zoom = 0.85;
                        document.getElementById('hudZoom').textContent = '85%';
                        showToast(`Centered on ${isl.name}`);
                        break;
                    case 'exhibition':
                        isExhibitionMode = !isExhibitionMode;
                        document.getElementById('hudExhibitionLabel').textContent = isExhibitionMode ? 'Exhibition: ON' : 'Exhibition: OFF';
                        showToast(isExhibitionMode ? 'Exhibition Mode ON (Clean View)' : 'Exhibition Mode OFF');
                        break;
                    case 'toggle-audio':
                        audioEngine.toggle();
                        break;
                    case 'toggle-sensory':
                        showSensoryOverlay = !showSensoryOverlay;
                        document.getElementById('hudSensoryLabel').textContent = showSensoryOverlay ? 'Sensors: ON' : 'Sensors: OFF';
                        break;
                    case 'cycle-weather':
                        cycleWeather();
                        break;
                    case 'inspect-human': {
                        const h = creatures.find(c => c.isHuman) || creatures[0];
                        if (h) {
                            selectedCreature = h;
                            camera.x = h.x; camera.y = h.y;
                            updateInspectorHUD();
                            showToast(`Inspecting ${h.realName}`);
                        }
                        break;
                    }
                    case 'issue-human-task': {
                        const commander = (selectedCreature && selectedCreature.isHuman) ? selectedCreature : creatures.find(c => c.isHuman);
                        const taskName = document.getElementById('humanTaskSelect')?.value || 'Harvest Fruit';
                        if (commander) {
                            issueTaskFromHuman(commander, taskName, 560);
                            updateInspectorHUD();
                            updateHUD();
                        }
                        break;
                    }
                    case 'spark-revolution': {
                        const leader = (selectedCreature && selectedCreature.isHuman) ? selectedCreature : creatures.find(c => c.isHuman);
                        triggerHumanRevolution(leader);
                        break;
                    }
                    case 'train-all-humans': {
                        const humans = creatures.filter(c => c.isHuman);
                        humans.forEach(h => {
                            h.humanNeuralXP += 8.0;
                            h.brain.reinforce(1.0);
                            h.isCognitiveLeader = true;
                        });
                        collectiveKnowledgeXP += humans.length * 1.5;
                        updateInspectorHUD();
                        updateHUD();
                        showToast(`Trained & upgraded ANN for all ${humans.length} Humans`);
                        audioEngine.playChime(740, 0.22);
                        break;
                    }
                    case 'train-human':
                        if (selectedCreature && selectedCreature.isHuman) {
                            selectedCreature.humanNeuralXP += 6.5;
                            selectedCreature.brain.reinforce(1.0);
                            collectiveKnowledgeXP += 4.0;
                            updateInspectorHUD();
                            updateHUD();
                            showToast(`Trained ${selectedCreature.realName}'s Neataptic ANN`);
                            audioEngine.playChime(659.25, 0.2);
                        }
                        break;
                    case 'neuro-add-node':
                        if (selectedCreature && selectedCreature.brain && selectedCreature.brain.mutateStructural('ADD_NODE')) {
                            updateInspectorHUD();
                            showToast('Added hidden neuron to ANN');
                        }
                        break;
                    case 'neuro-add-conn':
                        if (selectedCreature && selectedCreature.brain && selectedCreature.brain.mutateStructural('ADD_CONN')) {
                            updateInspectorHUD();
                            showToast('Mutated synaptic connection weight');
                        }
                        break;
                    case 'ann-reward':
                        if (selectedCreature && selectedCreature.brain) {
                            selectedCreature.brain.reinforce(1.0);
                            if (selectedCreature.isHuman) selectedCreature.humanNeuralXP += 4;
                            selectedCreature.energy = Math.min(selectedCreature.maxEnergy, selectedCreature.energy + 15);
                            updateInspectorHUD();
                            showToast(`+Reward reinforced ${selectedCreature.realName.split(' (')[0]}'s ANN`);
                        }
                        break;
                    case 'ann-punish':
                        if (selectedCreature && selectedCreature.brain) {
                            selectedCreature.brain.reinforce(-1.0);
                            selectedCreature.angle = normalizeAngle(selectedCreature.angle + Math.PI * 0.5);
                            updateInspectorHUD();
                            showToast(`\u2212Punish adjusted ${selectedCreature.realName.split(' (')[0]}'s ANN`);
                        }
                        break;
                    case 'trigger-disaster':
                        triggerWildfireOrEruption();
                        break;
                    case 'species-panel':
                        document.getElementById('biodiversityCard').classList.toggle('hidden');
                        break;
                    case 'toggle-more-menu':
                        document.getElementById('moreMenuPopover')?.classList.toggle('hidden');
                        break;
                    case 'lineage':
                        document.getElementById('lineageCard').classList.toggle('hidden');
                        updateLineageComparePanel();
                        break;
                    case 'evolve-gen':
                        runGenerationalNeuroevolution();
                        break;
                    case 'pick-compare-peer':
                        if (selectedCreature && creatures.length > 1) {
                            const idx = creatures.indexOf(compareCreature);
                            let next = creatures[(idx + 1) % creatures.length];
                            if (next === selectedCreature) next = creatures[(idx + 2) % creatures.length];
                            compareCreature = next;
                            updateLineageComparePanel();
                        }
                        break;
                    case 'record-milestone':
                        addEvolutionMilestone(EARTH_ERAS[currentEraIndex].name.split(' ')[1] || 'Snapshot');
                        showToast('Recorded evolutionary milestone');
                        break;
                    case 'challenges':
                        document.getElementById('challengesCard').classList.toggle('hidden');
                        updateChallengesPanel();
                        break;
                    case 'charts':
                        document.getElementById('telemetryCard').classList.toggle('hidden');
                        drawTelemetryChart();
                        break;
                    case 'scale-guide': {
                        document.getElementById('scaleGuideModal')?.classList.toggle('hidden');
                        break;
                    }
                    case 'interior-mode': {
                        interiorMode = !interiorMode;
                        const panel = document.getElementById('houseInteriorModal');
                        if (interiorMode) panel?.classList.remove('hidden'); else panel?.classList.add('hidden');
                        rebuildTerracedWorld();
                        showToast(interiorMode ? 'House cutaway interiors enabled' : 'House exterior view restored');
                        break;
                    }
                    case 'applications': {
                        const panel = document.getElementById('applicationsModal');
                        panel?.classList.toggle('hidden');
                        break;
                    }
                    case 'research': {
                        const panel = document.getElementById('researchModal');
                        panel?.classList.toggle('hidden');
                        if (panel && !panel.classList.contains('hidden')) renderResearchPanel();
                        break;
                    }
                    case 'research-baseline':
                        researchBaseline = { ...collectResearchMetrics(), label: 'Baseline' };
                        researchObservations = [];
                        renderResearchPanel();
                        showToast('Research baseline captured');
                        break;
                    case 'research-record':
                        researchObservations.push({ ...collectResearchMetrics(), label: 'Observation ' + (researchObservations.length + 1) });
                        renderResearchPanel();
                        showToast('Research observation recorded');
                        break;
                    case 'research-export':
                        exportResearchReport();
                        break;
                    case 'research-reset':
                        researchBaseline = null;
                        researchObservations = [];
                        renderResearchPanel();
                        showToast('Experiment log cleared');
                        break;
                    case 'fpv-hide-ui':
                        if (isFpvMode) {
                            document.body.classList.add('fpv-clean-view');
                            document.getElementById('fpvRestoreUiButton')?.classList.remove('hidden');
                        }
                        break;
                    case 'fpv-show-ui':
                        document.body.classList.remove('fpv-clean-view');
                        document.getElementById('fpvRestoreUiButton')?.classList.add('hidden');
                        break;
                    case 'params':
                        document.getElementById('paramsCard').classList.toggle('hidden');
                        break;
                    case 'shortcuts':
                        document.getElementById('shortcutsModal').classList.toggle('hidden');
                        break;
                    case 'export-csv':
                        exportTelemetryFile('csv');
                        break;
                    case 'export-json':
                        exportTelemetryFile('json');
                        break;
                    case 'copy-seed-code':
                        copySeedStateCode();
                        break;
                    case 'apply-seed-code':
                        applySeedStateCode();
                        break;
                    case 'reset':
                        resetSimulation();
                        break;
                    case 'event':
                        triggerHistoricalEvent();
                        break;
                    case 'save-checkpoint':
                        saveCheckpointToStorage();
                        break;
                    case 'restore-checkpoint':
                        restoreCheckpointFromStorage();
                        break;
                    case 'undo-checkpoint':
                        undoLastCheckpointRestore();
                        break;
                    case 'reset-humans':
                        resetHumansToTabulaRasa();
                        break;
                    case 'deselect':
                        deselectCreature();
                        break;
                    case 'inspect-prev':
                        if (creatures.length) {
                            const i = selectedCreature ? creatures.indexOf(selectedCreature) : 0;
                            selectedCreature = creatures[(i - 1 + creatures.length) % creatures.length];
                            updateInspectorHUD();
                        }
                        break;
                    case 'inspect-next':
                        if (creatures.length) {
                            const i = selectedCreature ? creatures.indexOf(selectedCreature) : 0;
                            selectedCreature = creatures[(i + 1) % creatures.length];
                            updateInspectorHUD();
                        }
                        break;
                    case 'follow':
                        if (selectedCreature) {
                            followSelected = !followSelected;
                            const btn = document.getElementById('btnFollowBot');
                            const txt = document.getElementById('textFollowBot');
                            btn.classList.toggle('insp-on', followSelected);
                            btn.setAttribute('aria-pressed', String(followSelected));
                            txt.textContent = followSelected ? 'Follow: ON' : 'Follow: OFF';
                        }
                        break;
                    case 'fpv':
                        if (isFpvMode) exitFpvMode();
                        else if (selectedCreature) enterFpvForCreature(selectedCreature);
                        break;
                    case 'fpv-prev':
                        cycleFpvSubject(-1);
                        break;
                    case 'fpv-next':
                        cycleFpvSubject(1);
                        break;
                    case 'fpv-recenter':
                        fpvCam.yawOffset = 0; fpvCam.pitchOffset = 0; fpvCam.rollAngle = 0; fpvCam.recenterTimer = 0;
                        showToast('Re-centered FPV gaze');
                        break;
                    case 'open-lab':
                        openSpecimenLab();
                        break;
                    case 'close-lab':
                        closeSpecimenLab();
                        break;
                    case 'lab-prev':
                        stepSpecimenInLab(-1);
                        break;
                    case 'lab-next':
                        stepSpecimenInLab(1);
                        break;
                    case 'boost-specimen':
                        if (selectedCreature) {
                            selectedCreature.energy = selectedCreature.maxEnergy;
                            selectedCreature.hydration = 100;
                            updateInspectorHUD();
                            syncSpecimenLabModal();
                            showToast(`Boosted ATP & Hydration for ${selectedCreature.realName}`);
                        }
                        break;
                    case 'lab-mutate':
                    case 'dna-mutate':
                        if (selectedCreature && creatures.length < 115) {
                            const child = new Organism(
                                selectedCreature.x + (Math.random() - 0.5) * 26,
                                selectedCreature.y + (Math.random() - 0.5) * 26,
                                selectedCreature.species,
                                selectedCreature.generation + 1,
                                selectedCreature.genome,
                                selectedCreature.brain,
                                null,
                                { id: selectedCreature.genome.id, name: selectedCreature.realName, resilience: selectedCreature.resilience },
                                true
                            );
                            creatures.push(child);
                            selectedCreature = child;
                            rebuildThreeEntities();
                            updateInspectorHUD();
                            syncSpecimenLabModal();
                            showToast(`Speciated ${child.genome.id} (${child.genome.variantTag})`);
                        }
                        break;
                    case 'dna-speed':
                        if (selectedCreature) {
                            selectedCreature.genome.speed = Math.min(4.2, selectedCreature.genome.speed + 0.25);
                            updateInspectorHUD();
                        }
                        break;
                    case 'dna-vision':
                        if (selectedCreature) {
                            selectedCreature.genome.vision = Math.min(265, selectedCreature.genome.vision + 20);
                            updateInspectorHUD();
                        }
                        break;
                }
            }

            // =========================================================================
            // SECTION 9: EVENT LISTENERS & SIMULATION LOOP
            // =========================================================================
            document.addEventListener('click', (e) => {
                const msBtn = e.target.closest('[data-milestone-idx]');
                if (msBtn) { restoreMilestoneByIndex(Number(msBtn.getAttribute('data-milestone-idx'))); return; }
                const filterBtn = e.target.closest('[data-chart-filter]');
                if (filterBtn) {
                    chartFilter = filterBtn.getAttribute('data-chart-filter');
                    ['all', 'land', 'ocean', 'sky'].forEach(f => {
                        const b = document.getElementById(`chartFilter${f.charAt(0).toUpperCase() + f.slice(1)}`);
                        if (b) b.className = f === chartFilter
                            ? "px-1.5 py-0.5 rounded bg-teal-500/25 text-teal-200 border border-teal-400/40"
                            : "px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700";
                    });
                    drawTelemetryChart();
                    return;
                }
                const modeBtn = e.target.closest('[data-mode]');
                if (modeBtn) { setClickMode(modeBtn.getAttribute('data-mode')); return; }
                const spdBtn = e.target.closest('[data-speed]');
                if (spdBtn) { setSpeed(Number(spdBtn.getAttribute('data-speed'))); return; }
                const eraBtn = e.target.closest('[data-era]');
                if (eraBtn) { setEra(Number(eraBtn.getAttribute('data-era'))); return; }
                const actBtn = e.target.closest('[data-action]');
                if (actBtn) {
                    const act = actBtn.getAttribute('data-action');
                    if (act !== 'toggle-more-menu') document.getElementById('moreMenuPopover')?.classList.add('hidden');
                    handleAction(act);
                }
            });

            document.getElementById('spawnSpeciesSelect')?.addEventListener('change', () => setClickMode('spawn'));
            document.getElementById('buildStructureSelect')?.addEventListener('change', () => setClickMode('build'));
            document.getElementById('camPresetSelect')?.addEventListener('change', (e) => applyCameraPreset(e.target.value));
            document.getElementById('scenarioPresetSelect')?.addEventListener('change', (e) => { if (e.target.value) applyScenarioPreset(e.target.value); });
            document.getElementById('dnaGoalSelect')?.addEventListener('change', (e) => {
                if (selectedCreature) {
                    selectedCreature.assignedGoal = e.target.value;
                    selectedCreature.lastThought = `Goal: ${e.target.value}`;
                    updateInspectorHUD();
                }
            });
            document.getElementById('selectWeather')?.addEventListener('change', (e) => cycleWeather(e.target.value));
            document.getElementById('cryoSearchInput')?.addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                if (q.length < 2) return;
                const match = creatures.find(c => c.realName.toLowerCase().includes(q) || c.genome.id.toLowerCase().includes(q));
                if (match && match !== selectedCreature) {
                    selectedCreature = match;
                    updateInspectorHUD();
                    syncSpecimenLabModal();
                }
            });

            document.querySelectorAll('[data-input-action="sliders"]').forEach(sl => {
                sl.addEventListener('input', () => {
                    timeOfDay = Number(document.getElementById('sliderTimeOfDay').value);
                    params.tempShift = Number(document.getElementById('sliderTempShift').value);
                    params.foodRate = Number(document.getElementById('sliderFoodRate').value);
                    params.mutationRate = Number(document.getElementById('sliderMutation').value) / 100;
                    params.burnRate = Number(document.getElementById('sliderBurnRate').value) / 10;
                    syncSlidersFromParams();
                });
            });

            document.getElementById('toggleBubbles')?.addEventListener('change', (e) => { showThoughtBubbles = e.target.checked; });
            document.getElementById('toggleClouds')?.addEventListener('change', (e) => {
                showAtmosphereClouds = e.target.checked;
                if (threeState.cloudGroup) threeState.cloudGroup.visible = showAtmosphereClouds;
            });

            simCanvas.addEventListener('pointerdown', (e) => {
                if (isFpvMode && selectedCreature && creatures.includes(selectedCreature)) {
                    fpvCam.isDraggingLook = true;
                    fpvCam.lastLookX = e.clientX;
                    fpvCam.lastLookY = e.clientY;
                    fpvCam.recenterTimer = 150;
                    return;
                }
                followSelected = false;
                const followBtn = document.getElementById('btnFollowBot');
                const followText = document.getElementById('textFollowBot');
                if (followBtn) { followBtn.classList.remove('insp-on'); followBtn.setAttribute('aria-pressed', 'false'); }
                if (followText) followText.textContent = 'Follow: OFF';

                camera.isDragging = true;
                camera.hasMoved = false;
                camera.dragStartX = e.clientX;
                camera.dragStartY = e.clientY;
                camera.lastPointerX = e.clientX;
                camera.lastPointerY = e.clientY;
            });

            window.addEventListener('pointermove', (e) => {
                if (fpvCam.isDraggingLook) {
                    const dx = e.clientX - fpvCam.lastLookX;
                    const dy = e.clientY - fpvCam.lastLookY;
                    fpvCam.lastLookX = e.clientX;
                    fpvCam.lastLookY = e.clientY;
                    fpvCam.yawOffset = Math.max(-1.65, Math.min(1.65, fpvCam.yawOffset - dx * 0.0055));
                    fpvCam.pitchOffset = Math.max(-0.55, Math.min(0.62, fpvCam.pitchOffset - dy * 0.0042));
                    fpvCam.recenterTimer = 150;
                    return;
                }
                if (!camera.isDragging && !isFpvMode && !isModalOpen) {
                    updateHoverInspector(e.clientX, e.clientY);
                }
                if (!camera.isDragging) {
                    return;
                }
                document.getElementById('hoverTooltip')?.classList.add('hidden');
                const dx = e.clientX - camera.lastPointerX;
                const dy = e.clientY - camera.lastPointerY;
                if (Math.hypot(e.clientX - camera.dragStartX, e.clientY - camera.dragStartY) > 6) camera.hasMoved = true;
                camera.lastPointerX = e.clientX;
                camera.lastPointerY = e.clientY;
                const panScale = is3DView ? 1.35 / Math.max(0.4, camera.zoom) : 1.0 / Math.max(0.3, camera.zoom);
                camera.x -= dx * panScale;
                camera.y -= dy * panScale;
                clampCameraToWorld();
            });

            window.addEventListener('pointerup', (e) => {
                if (fpvCam.isDraggingLook) { fpvCam.isDraggingLook = false; return; }
                if (!camera.isDragging) return;
                const wasClick = !camera.hasMoved;
                camera.isDragging = false;
                if (!wasClick) return;

                const rect = simCanvas.getBoundingClientRect();
                const sx = e.clientX - rect.left;
                const sy = e.clientY - rect.top;
                const worldPt = screenToWorld(sx, sy);

                if (clickMode === 'inspect') {
                    let best = null, bestPx = 38;
                    for (const c of creatures) {
                        const sp = worldToScreen(c.x, c.y);
                        const d = Math.hypot(sp.x - sx, sp.y - sy);
                        if (d < bestPx) { bestPx = d; best = c; }
                    }
                    if (best) {
                        selectedCreature = best;
                        updateInspectorHUD();
                        updateLineageComparePanel();
                        showToast(`Inspected ${best.realName}`);
                    } else {
                        deselectCreature();
                    }
                } else if (clickMode === 'food') {
                    for (let i = 0; i < 5; i++) {
                        nutrients.push({
                            x: clampWorldCoordinate(worldPt.x + (Math.random() - 0.5) * 38),
                            y: clampWorldCoordinate(worldPt.y + (Math.random() - 0.5) * 38),
                            size: 6, energy: 50, kind: 'fruit'
                        });
                    }
                    rebuildThreeEntities();
                    showToast('Dropped Orchard Fruit');
                } else if (clickMode === 'spawn') {
                    const spKey = document.getElementById('spawnSpeciesSelect')?.value || 'human';
                    const org = new Organism(worldPt.x, worldPt.y, spKey, 1);
                    creatures.push(org);
                    selectedCreature = org;
                    rebuildThreeEntities();
                    updateInspectorHUD();
                    updateHUD();
                    showToast(`Spawned ${org.realName}`);
                } else if (clickMode === 'toxin') {
                    springs.push({ x: clampWorldCoordinate(worldPt.x), y: clampWorldCoordinate(worldPt.y), radius: 36 });
                    emitOceanRipple(worldPt.x, worldPt.y, 1.1);
                    rebuildTerracedWorld();
                    showToast('Added Mineral Spring');
                } else if (clickMode === 'build') {
                    const kind = document.getElementById('buildStructureSelect')?.value || 'camp';
                    const spec = SHELTER_TYPES.find(s => s.kind === kind) || SHELTER_TYPES[0];
                    builtStructures.push({
                        x: clampWorldCoordinate(worldPt.x),
                        y: clampWorldCoordinate(worldPt.y),
                        stage: culturalStageIndex,
                        kind: spec.kind,
                        shelterName: spec.label,
                        builderName: 'Architect',
                        label: spec.label
                    });
                    if (spec.kind === 'campfire') fireCount++;
                    if (spec.kind === 'mine') oreStock += 15;
                    if (spec.kind === 'industry') industryOutput += 12;
                    getOrCreateColonyAt(worldPt.x, worldPt.y, null);
                    rebuildTerracedWorld();
                    updateHUD();
                    showToast(`Placed ${spec.label}`);
                }
            });

            simCanvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (isFpvMode) return;
                const factor = e.deltaY < 0 ? 1.12 : 0.89;
                camera.zoom = Math.max(0.28, Math.min(2.6, camera.zoom * factor));
                document.getElementById('hudZoom').textContent = `${Math.round(camera.zoom * 100)}%`;
            }, { passive: false });

            cryo3dCanvas?.addEventListener('pointerdown', (e) => {
                draggingLattice = true;
                latticeLastX = e.clientX;
                latticeLastY = e.clientY;
            });
            window.addEventListener('pointermove', (e) => {
                if (!draggingLattice) return;
                latticeYaw += (e.clientX - latticeLastX) * 0.012;
                latticePitch = Math.max(-0.9, Math.min(0.9, latticePitch + (e.clientY - latticeLastY) * 0.01));
                latticeLastX = e.clientX;
                latticeLastY = e.clientY;
            });
            window.addEventListener('pointerup', () => { draggingLattice = false; });

            window.addEventListener('keydown', (e) => {
                if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
                if (isFpvMode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    fpvCam.keysDown.add(e.key);
                    return;
                }
                if (e.key === ' ') { e.preventDefault(); handleAction('pause'); }
                else if (e.key === '1') applyCameraPreset('overview');
                else if (e.key === '2') applyCameraPreset('island');
                else if (e.key === '3') applyCameraPreset('fpv');
                else if (e.key === '4') applyCameraPreset('cryo');
                else if (e.key === '5') {
                    const nextSpd = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 5 : 1;
                    setSpeed(nextSpd);
                    showToast(`Speed: ${nextSpd}x`);
                }
                else if (e.key === 'f' || e.key === 'F') handleAction('follow');
                else if (e.key === 'v' || e.key === 'V') handleAction('fpv');
                else if (e.key === 'r' || e.key === 'R') handleAction('spark-revolution');
                else if (e.key === 'm' || e.key === 'M') audioEngine.toggle();
                else if (e.key === '?') handleAction('shortcuts');
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    handleAction(e.shiftKey ? 'inspect-prev' : 'inspect-next');
                } else if (e.key === 'Escape') {
                    if (isModalOpen) closeSpecimenLab();
                    else if (isFpvMode) exitFpvMode();
                    else deselectCreature();
                }
            });

            window.addEventListener('keyup', (e) => { fpvCam.keysDown.delete(e.key); });

            function resizeCanvases() {
                simCanvas.width = window.innerWidth;
                simCanvas.height = window.innerHeight;
                if (threeState.renderer) threeState.renderer.setSize(window.innerWidth, window.innerHeight, false);
            }
            window.addEventListener('resize', resizeCanvases);

            function resolveFactionCombat() {
                if (simTick % 6 !== 0) return;
                const humans = creatures.filter(c => c.isHuman && c.combatHealth > 0);
                for (let i = 0; i < humans.length; i++) {
                    const a = humans[i];
                    if (a.combatCooldown > 0) { a.combatCooldown -= 6; continue; }
                    for (let j = i + 1; j < humans.length; j++) {
                        const b = humans[j];
                        if (a.faction === b.faction) continue;
                        const d = Math.hypot(a.x - b.x, a.y - b.y);
                        if (d > 34) continue;
                        const eraWeaponBonus = currentRegimeIndex >= 3 ? 1.35 : currentRegimeIndex >= 1 ? 1.12 : 0.85;
                        const aPower = (1 + (a.humanAnnStage || 0) * 0.16 + (a.isCognitiveLeader ? 0.18 : 0)) * eraWeaponBonus;
                        const bPower = (1 + (b.humanAnnStage || 0) * 0.16 + (b.isCognitiveLeader ? 0.18 : 0)) * eraWeaponBonus;
                        const aDamage = 5.5 * aPower * (0.8 + Math.random() * 0.4);
                        const bDamage = 5.5 * bPower * (0.8 + Math.random() * 0.4);
                        a.combatHealth = Math.max(0, a.combatHealth - bDamage);
                        b.combatHealth = Math.max(0, b.combatHealth - aDamage);
                        a.energy = Math.max(0, a.energy - 2.5);
                        b.energy = Math.max(0, b.energy - 2.5);
                        a.stress = Math.min(1, a.stress + 0.08);
                        b.stress = Math.min(1, b.stress + 0.08);
                        a.combatCooldown = b.combatCooldown = 42;
                        a.lastCombatTick = b.lastCombatTick = simTick;
                        a.angle = Math.atan2(a.y - b.y, a.x - b.x);
                        b.angle = Math.atan2(b.y - a.y, b.x - a.x);
                        combatEvents++;
                        if (combatEvents % 4 === 1) {
                            addChronicleEntry(`${a.faction} and ${b.faction} forces clashed near ${a.realName.split(' (')[0]}'s position.`, 'text-rose-300');
                        }
                        if (a.combatHealth <= 0 || b.combatHealth <= 0) {
                            const defeated = a.combatHealth <= 0 ? a : b;
                            const victor = defeated === a ? b : a;
                            victor.energy = Math.min(victor.maxEnergy, victor.energy + 18);
                            if (selectedCreature === defeated) deselectCreature();
                            const idx = creatures.indexOf(defeated);
                            if (idx >= 0) creatures.splice(idx, 1);
                            addChronicleEntry(`${defeated.realName.split(' (')[0]} was defeated in a faction conflict.`, 'text-rose-300');
                        }
                        break;
                    }
                }
            }

            function stepSimulation(dt) {
                simTick++;
                timeOfDay = (timeOfDay + 0.008 * dt) % 24;
                seasonalCyclePhase = (seasonalCyclePhase + 0.0006 * dt) % 100;
                tideOffset = Math.sin(seasonalCyclePhase * 1.4) * 0.65;
                const tSlider = document.getElementById('sliderTimeOfDay');
                if (tSlider && document.activeElement !== tSlider) tSlider.value = timeOfDay.toFixed(1);
                document.getElementById('valTimeOfDay').textContent = formatClock(timeOfDay);

                if (lightningFlash > 0) lightningFlash = Math.max(0, lightningFlash - 0.06 * dt);
                if (currentWeather === 'storm' && Math.random() < 0.006 * dt) {
                    lightningFlash = 1.0;
                    const isl = ISLAND_ARCHIPELAGO[Math.floor(Math.random() * ISLAND_ARCHIPELAGO.length)];
                    activeLightningBolt = { x: isl.x + (Math.random() - 0.5) * 260, z: isl.y + (Math.random() - 0.5) * 260 };
                    emitOceanRipple(activeLightningBolt.x, activeLightningBolt.z, 1.2);
                    audioEngine.playPulse(95, 0.35);
                }
                if (weatherTimer > 0) {
                    weatherTimer -= dt;
                    if (weatherTimer <= 0 && currentWeather !== 'clear') {
                        currentWeather = 'clear';
                        const sel = document.getElementById('selectWeather');
                        if (sel) sel.value = 'clear';
                    }
                }

                if (document.getElementById('toggleAutoEra')?.checked) {
                    eraProgress += 0.00042 * dt;
                    if (eraProgress >= 1) setEra((currentEraIndex + 1) % EARTH_ERAS.length, true);
                    else document.getElementById('eraProgressBar').style.width = `${(eraProgress * 100).toFixed(1)}%`;
                }

                const targetNutrients = Math.round(24 + params.foodRate * 10 * EARTH_ERAS[currentEraIndex].nutrientBoost * soilFertility);
                if (nutrients.length < targetNutrients && Math.random() < 0.22 * dt) {
                    const isl = ISLAND_ARCHIPELAGO[Math.floor(Math.random() * ISLAND_ARCHIPELAGO.length)];
                    const ang = Math.random() * Math.PI * 2;
                    const rad = Math.random() * isl.radius * 0.78;
                    const fx = clampWorldCoordinate(isl.x + Math.cos(ang) * rad);
                    const fy = clampWorldCoordinate(isl.y + Math.sin(ang) * rad);
                    const el = getWorldElevation(fx, fy);
                    nutrients.push({ x: fx, y: fy, size: el > 0.05 ? 5.6 : 4.6, energy: el > 0.05 ? 46 : 36, kind: el > 0.05 ? 'fruit' : 'plankton' });
                }

                for (let i = creatures.length - 1; i >= 0; i--) {
                    const c = creatures[i];
                    c.update();
                    if (c.energy <= 0 || c.hydration <= 0) {
                        if (selectedCreature === c) deselectCreature();
                        creatures.splice(i, 1);
                    }
                }

                resolveFactionCombat();

                if (creatures.length < 36) {
                    const fallbackPool = EARTH_ERAS[currentEraIndex].allowedSpecies || SPECIES_KEYS;
                    const pickSp = fallbackPool[simTick % fallbackPool.length] || 'capybara';
                    const isl = ISLAND_ARCHIPELAGO[simTick % ISLAND_ARCHIPELAGO.length];
                    creatures.push(new Organism(isl.x + (Math.random() - 0.5) * 180, isl.y + (Math.random() - 0.5) * 180, pickSp, 1));
                }

                if (followSelected && selectedCreature && creatures.includes(selectedCreature) && !isFpvMode) {
                    camera.x += (selectedCreature.x - camera.x) * 0.14;
                    camera.y += (selectedCreature.y - camera.y) * 0.14;
                }

                updateColoniesAndTrade(dt);
                if (simTick % 20 === 0) recordTelemetryPoint();
                if (simTick % 12 === 0) {
                    updateHUD();
                    updateInspectorHUD();
                    if (!document.getElementById('telemetryCard').classList.contains('hidden')) drawTelemetryChart();
                }
            }

            let lastFrameTime = performance.now();
            function mainLoop(now) {
                const rawDt = Math.min(2.5, Math.max(0.2, (now - lastFrameTime) / 16.667));
                lastFrameTime = now;

                if (!isPaused) {
                    const steps = Math.max(1, Math.min(5, speedMultiplier));
                    for (let s = 0; s < steps; s++) stepSimulation(rawDt);
                }

                syncThreeFrame();
                draw2DOverlay();
                if (isModalOpen) syncSpecimenLabModal();

                requestAnimationFrame(mainLoop);
            }

            resizeCanvases();
            initThreeWorld();
            seedInitialOreAndColonies();
            seedInitialSprings();
            seedInitialNutrients();
            seedInitialCreatures();
            setEra(0, false);
            syncSlidersFromParams();
            recordTelemetryPoint();
            updateHUD();
            requestAnimationFrame(mainLoop);
        })();
