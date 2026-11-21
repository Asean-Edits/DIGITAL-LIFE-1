
        import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

        /**
         * DIGITAL LIFE: ISOMETRIC BIOSPHERE & BIOINFORMATIC LAB (v8.0)
         * - Bounded Terraced Voxel/Isometric Island World (2,800 x 2,800) surrounded by Deep Abyssal Ocean
         * - Real-world ecological landmarks: Apple Orchards, Freshwater Springs, Gathering Pads, Timber Groves, Coastal Reefs
         * - Thought bubbles over living agents showing real-time ecological needs (Apple/Food, Water/Spring, Rest/Gather, Alert)
         * - Full 3D Isometric Three.js terrain + instanced 3D organisms + interactive 2D HUD overlay
         */

        const simCanvas = document.getElementById('simCanvas');
        const ctx = simCanvas.getContext('2d');
        const chartCanvas = document.getElementById('chartCanvas');
        const chartCtx = chartCanvas.getContext('2d');
        const neuralCanvas = document.getElementById('neuralCanvas');
        const neuralCtx = neuralCanvas.getContext('2d');
        const world3dCanvas = document.getElementById('world3dCanvas');

        // Bounded World Constants (Terraced Island surrounded by Deep Ocean)
        const WORLD_HALF_SIZE = 1400;
        const WORLD_SIZE = WORLD_HALF_SIZE * 2;
        const TILE_STEP = 56;
        const BIOSPHERE_ISLANDS = [
            { name: 'Sanctuary', x: 0, y: 0, radius: 390 },
            { name: 'Hadean Caldera', x: -850, y: -650, radius: 330 },
            { name: 'Archean Lagoon', x: 0, y: -930, radius: 330 },
            { name: 'Proterozoic Reef', x: 850, y: -650, radius: 330 },
            { name: 'Cambrian Key', x: -850, y: 650, radius: 330 },
            { name: 'Carboniferous Canopy', x: 0, y: 930, radius: 330 },
            { name: 'Cretaceous Craton', x: 850, y: 650, radius: 330 }
        ];

        // Global State
        let worldSeed = 2026.88;
        let is3DView = true;
        let isPaused = false;
        let speedMultiplier = 1;
        let clickMode = 'inspect';
        let showThoughtBubbles = true;
        let showAtmosphereClouds = true;
        let showZoneLabels = true;
        let currentEraIndex = 6;
        let eraProgress = 0;
        let simTick = 0;
        let renderFrame = 0;
        let maxGeneration = 1;
        let selectedCreature = null;
        let followSelected = false;

        const STARTING_POPULATION = 100_000_000;
        const POPULATION_PER_AGENT = 1_000_000;

        // Camera State (Isometric Angle + Pan + Zoom)
        const camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            hasMoved: false
        };

        const params = {
            foodRate: 6,
            mutationRate: 0.30,
            burnRate: 1.0
        };

        const environment = { temperature: 22, oxygen: 21, nutrients: 100, toxin: 0, predatorPressure: 100 };
        let lifetimePlasticityEnabled = false;
        let sensitivitySweepRunning = false;
        let lineageSerial = 0;
        let organismSerial = 0;
        const researchState = {
            checkpoint: null,
            eventLog: [],
            speciesStats: {},
            minPopulation: Infinity,
            peakPopulation: 0,
            maxGeneration: 1,
            sweepResults: []
        };

        const spawnedGenomeSignatures = new Set();

        // Real-World Ecological Landmarks (inspired by Production Center / Park / Sea Surface beacons)
        let worldLandmarks = [
            { id: 'sanctuary', name: 'Living Biosphere', subtitle: 'Central mixed-species sanctuary', x: 0, y: 0, color: '#2dd4bf', type: 'ISLAND' },
            { id: 'hadean', name: 'Hadean Caldera Isle', subtitle: 'Volcanic basalt & thermal pools', x: -850, y: -650, color: '#fb923c', type: 'ISLAND' },
            { id: 'archean', name: 'Archean Lagoon Atoll', subtitle: 'Warm lagoons & microbial mats', x: 0, y: -930, color: '#34d399', type: 'ISLAND' },
            { id: 'proterozoic', name: 'Proterozoic Reef Isle', subtitle: 'Oxygenated coastal reef habitat', x: 850, y: -650, color: '#38bdf8', type: 'ISLAND' },
            { id: 'cambrian', name: 'Cambrian Trilobite Key', subtitle: 'Shallow shelf & armored grazers', x: -850, y: 650, color: '#2dd4bf', type: 'ISLAND' },
            { id: 'carboniferous', name: 'Carboniferous Canopy', subtitle: 'Lush forest and glider habitat', x: 0, y: 930, color: '#4ade80', type: 'ISLAND' },
            { id: 'cretaceous', name: 'Cretaceous Impact Craton', subtitle: 'Rocky refuge for impact survivors', x: 850, y: 650, color: '#fb7185', type: 'ISLAND' },
            { id: 'orchard', name: 'Apple Orchard Sector', subtitle: 'Primary Fruit & Spore Production', x: -260, y: -210, color: '#34d399', type: 'ORCHARD' },
            { id: 'spring', name: 'Freshwater Spring', subtitle: 'Hydration & Thermal Cleansing Pool', x: 40, y: 120, color: '#38bdf8', type: 'SPRING' },
            { id: 'meadow', name: 'Gathering Sanctuary', subtitle: 'Social Colony & Resting Grounds', x: 250, y: -180, color: '#fbbf24', type: 'MEADOW' }
        ];

        const EARTH_ERAS = [
            { name: "Hadean Eon", years: "4.6â€“4.0 BYA", subtitle: "Volcanic basalt island, steaming mineral pools & early extremophiles", eventName: "Volcanic Surge", oceanColor: "#04111a", landColor: "#3a261f", grassTop: "#57392e", atmosphereTint: "rgba(251, 146, 60, 0.10)", nutrientBoost: 0.8, mutationBoost: 1.5, allowedSpecies: ["lithocrawler", "swimbot"] },
            { name: "Archean Eon", years: "4.0â€“2.5 BYA", subtitle: "Coastal microbial mats & shallow warm lagoons emerge", eventName: "Hydrothermal Bloom", oceanColor: "#041924", landColor: "#3c3526", grassTop: "#5b5c34", atmosphereTint: "rgba(52, 211, 153, 0.06)", nutrientBoost: 1.1, mutationBoost: 1.2, allowedSpecies: ["grazer", "swimbot", "lithocrawler"] },
            { name: "Proterozoic Eon", years: "2.5 BYAâ€“541 MYA", subtitle: "Oxygenation clears the sky and expands coastal reefs", eventName: "Great Oxidation", oceanColor: "#041e2c", landColor: "#38462c", grassTop: "#5a7a3a", atmosphereTint: "rgba(56, 189, 248, 0.08)", nutrientBoost: 1.2, mutationBoost: 1.1, allowedSpecies: ["grazer", "swimbot", "medusa", "lithocrawler"] },
            { name: "Cambrian Explosion", years: "541â€“485 MYA", subtitle: "Complex sensory organs, armored trilobites & reef predators", eventName: "Cambrian Radiation", oceanColor: "#042233", landColor: "#3a4d2b", grassTop: "#64893b", atmosphereTint: "rgba(16, 185, 129, 0.07)", nutrientBoost: 1.4, mutationBoost: 1.3, allowedSpecies: ["grazer", "swimbot", "hunter", "lithocrawler", "medusa"] },
            { name: "Carboniferous Period", years: "359â€“299 MYA", subtitle: "Lush forest groves, giant canopy gliders & rich soil humus", eventName: "Forest Canopy Bloom", oceanColor: "#042436", landColor: "#2d4c27", grassTop: "#598c36", atmosphereTint: "rgba(125, 211, 252, 0.08)", nutrientBoost: 1.6, mutationBoost: 1.0, allowedSpecies: ["aeroglider", "grazer", "swimbot", "hunter", "lithocrawler", "medusa"] },
            { name: "Cretaceous Impact", years: "66 MYA", subtitle: "Asteroid shockwave tests resilience across land, sea & sky", eventName: "Asteroid Shockwave", oceanColor: "#061522", landColor: "#382c24", grassTop: "#594836", atmosphereTint: "rgba(244, 63, 94, 0.12)", nutrientBoost: 0.7, mutationBoost: 1.5, allowedSpecies: ["aeroglider", "grazer", "swimbot", "hunter", "lithocrawler", "medusa"] },
            { name: "Living Terraced Biosphere", years: "Presentâ€“Future", subtitle: "Interconnected orchards, freshwater springs, coastal reefs & grazing meadows", eventName: "Seasonal Fruit Harvest", oceanColor: "#031522", landColor: "#375928", grassTop: "#6d9c38", atmosphereTint: "rgba(45, 212, 191, 0.04)", nutrientBoost: 1.35, mutationBoost: 1.0, allowedSpecies: ["aeroglider", "grazer", "swimbot", "hunter", "lithocrawler", "medusa"] }
        ];

        const ERA_ENVIRONMENT = [
            { temperature: 48, oxygen: 3, nutrients: 50, toxin: 18, predatorPressure: 135 },
            { temperature: 38, oxygen: 7, nutrients: 72, toxin: 8, predatorPressure: 100 },
            { temperature: 29, oxygen: 13, nutrients: 92, toxin: 2, predatorPressure: 95 },
            { temperature: 24, oxygen: 18, nutrients: 115, toxin: 0, predatorPressure: 115 },
            { temperature: 22, oxygen: 25, nutrients: 165, toxin: 0, predatorPressure: 82 },
            { temperature: 36, oxygen: 15, nutrients: 58, toxin: 24, predatorPressure: 175 },
            { temperature: 22, oxygen: 21, nutrients: 100, toxin: 0, predatorPressure: 100 }
        ];

        const makeSpecies = (commonName, scientificName, role, sphere, habitat, diet, color, hueRange, baseSpeed, baseVision, baseSize, defense, ecology, extra = {}) => ({
            name: `${commonName} · ${role}`, commonName, scientificName, role, sphere, habitat, diet, color, hueRange,
            baseSpeed, baseVision, baseSize, defense, ecology,
            visualProfile: extra.visualProfile || (extra.predator ? 'predator' : sphere === 'OCEAN' ? 'aquatic' : sphere === 'ATMOSPHERE' ? 'winged' : habitat.includes('SOIL') || habitat.includes('SUBTERRANEAN') ? 'burrower' : 'terrestrial'),
            predator: false, trophic: 'consumer', names: ['Ari', 'Nori', 'Tavi', 'Mika', 'Sora', 'Pip'], ...extra
        });
        const SPECIES_CONFIG = {
            grazer: makeSpecies('Capybara', 'Hydrochoerus hydrochaeris', 'Grazing Forager', 'LITHOSPHERE', 'MEADOW / ORCHARD', 'FRUGIVORE / GRAZER', '#fbbf24', [42, 54], 1.85, 160, 9.5, 'GROUP DEFENCE', 'Forages fallen orchard fruit and grazes meadow plants; gathers in social groups.', { names: ['Cora', 'Paco', 'Nina', 'Timo', 'Luma', 'Rafi'] }),
            redDeer: makeSpecies('Red Deer', 'Cervus elaphus', 'Terrace Browser', 'LITHOSPHERE', 'MEADOW / HIGHLAND', 'BROWSER', '#c084fc', [275, 292], 2.0, 170, 10, 'SPEED BURST', 'Browses shrubs and young trees across open terrace edges.'),
            bison: makeSpecies('Wild Bison', 'Bison bison', 'Herd Grazer', 'LITHOSPHERE', 'MEADOW', 'GRAZER', '#a3a3a3', [15, 27], 1.55, 150, 12, 'GROUP DEFENCE', 'Maintains grassland mosaics through herd grazing and trampling.', { names: ['Bram', 'Ona', 'Tusk', 'Moro', 'Koda', 'Runa'] }),
            hunter: makeSpecies('Jaguar', 'Panthera onca', 'Apex Stalker', 'LITHOSPHERE', 'FOREST / RIVERBANK', 'CARNIVORE', '#fb7185', [342, 358], 2.45, 190, 10.5, 'CAMOUFLAGE', 'Ambush predator that regulates herbivore populations.', { predator: true, trophic: 'predator', names: ['Onca', 'Jade', 'Rex', 'Maya', 'Sol', 'Nox'] }),
            snowLeopard: makeSpecies('Snow Leopard', 'Panthera uncia', 'Highland Predator', 'LITHOSPHERE', 'HIGHLAND / CLIFF', 'CARNIVORE', '#e2e8f0', [195, 210], 2.25, 205, 10, 'CAMOUFLAGE', 'Cliff ambush predator adapted to cold, sparse highlands.', { predator: true, trophic: 'predator' }),
            lithocrawler: makeSpecies('Woodlouse', 'Oniscidea', 'Detritus Decomposer', 'LITHOSPHERE', 'SOIL / DETRITUS', 'DETRITIVORE', '#fb923c', [24, 38], 1.45, 125, 9, 'BURROWING', 'Breaks down leaf litter and returns nutrients to the soil.', { names: ['Rolly', 'Moss', 'Chip', 'Fern', 'Pebble', 'Twig'] }),
            earthworm: makeSpecies('Earthworm', 'Lumbricina', 'Soil Aerator', 'LITHOSPHERE', 'SOIL / SUBTERRANEAN', 'DETRITIVORE', '#f87171', [0, 12], 1.15, 112, 8, 'BURROWING', 'Aerates soil and decomposes organic matter below the surface.'),
            armadillo: makeSpecies('Armadillo', 'Dasypodidae', 'Armored Forager', 'LITHOSPHERE', 'DRY MEADOW / SOIL', 'OMNIVORE', '#a78bfa', [250, 268], 1.45, 135, 10, 'ARMOUR', 'Uses protective armor while probing soil for insects and roots.'),
            pangolin: makeSpecies('Pangolin', 'Manis javanica', 'Insectivore Burrower', 'LITHOSPHERE', 'ORCHARD / SOIL', 'INSECTIVORE', '#d6a56d', [28, 40], 1.35, 145, 9, 'ARMOUR', 'Feeds on social insects and retreats into burrows when threatened.'),
            moleRat: makeSpecies('Mole Rat', 'Heterocephalus glaber', 'Tunnel Excavator', 'LITHOSPHERE', 'SUBTERRANEAN / SOIL', 'ROOT GRAZER', '#f0abfc', [285, 305], 1.1, 120, 8.5, 'BURROWING', 'Builds underground tunnels and feeds on roots and tubers.'),
            aeroglider: makeSpecies('Honeybee', 'Apis mellifera', 'Orchard Pollinator', 'ATMOSPHERE', 'CANOPY / ORCHARD', 'NECTAR / POLLEN', '#67e8f9', [182, 204], 2.5, 185, 9, 'CAMOUFLAGE', 'Pollinates flowering plants and disperses pollen between groves.', { names: ['Dottie', 'Buzz', 'Pollen', 'Clover', 'Meli', 'Beea'] }),
            hummingbird: makeSpecies('Hummingbird', 'Trochilidae', 'Nectar Glider', 'ATMOSPHERE', 'CANOPY / SKY', 'NECTARIVORE', '#34d399', [145, 164], 3.05, 195, 8, 'SPEED BURST', 'Feeds from flowers in rapid, energy-intensive flight.'),
            albatross: makeSpecies('Albatross', 'Diomedeidae', 'Oceanic Soarer', 'ATMOSPHERE', 'SKY / OPEN OCEAN', 'PISCIVORE', '#cbd5e1', [210, 225], 2.65, 220, 10, 'SPEED BURST', 'Soars over open water and searches for fish and floating food.'),
            peregrine: makeSpecies('Peregrine Falcon', 'Falco peregrinus', 'Aerial Hunter', 'ATMOSPHERE', 'SKY / CLIFF', 'CARNIVORE', '#60a5fa', [205, 222], 3.2, 220, 9, 'SPEED BURST', 'Aerial predator that dives on smaller flying organisms.', { predator: true, trophic: 'predator' }),
            flyingSquirrel: makeSpecies('Flying Squirrel', 'Pteromyini', 'Canopy Glider', 'ATMOSPHERE', 'CANOPY / FOREST', 'FRUGIVORE', '#f59e0b', [32, 46], 2.35, 175, 8.5, 'CAMOUFLAGE', 'Glides between canopy trees while feeding on seeds and fruit.'),
            swimbot: makeSpecies('Clownfish', 'Amphiprioninae', 'Reef Swimmer', 'OCEAN', 'REEF / LAGOON', 'OMNIVORE', '#38bdf8', [195, 218], 2.2, 155, 8.5, 'SPEED BURST', 'Shelters among reef structures and feeds on small plankton.'),
            medusa: makeSpecies('Moon Jelly', 'Aurelia aurita', 'Tide Filterer', 'OCEAN', 'LAGOON / OPEN WATER', 'FILTER FEEDER', '#c084fc', [268, 292], 1.35, 145, 9.5, 'GROUP DEFENCE', 'Filters plankton from coastal currents and drifts with tides.'),
            seaOtter: makeSpecies('Sea Otter', 'Enhydra lutris', 'Kelp Forager', 'OCEAN', 'KELP / COASTAL', 'SHELLFISH FORAGER', '#a3e635', [75, 95], 1.95, 165, 10, 'ARMOUR', 'Forages shellfish in kelp forests and helps maintain coastal balance.'),
            mantaRay: makeSpecies('Manta Ray', 'Mobula birostris', 'Pelagic Glider', 'OCEAN', 'PELAGIC / OPEN SEA', 'FILTER FEEDER', '#818cf8', [230, 248], 2.05, 205, 11, 'SPEED BURST', 'Filters plankton while gliding through open ocean.'),
            nautilus: makeSpecies('Nautilus', 'Nautilidae', 'Shelled Swimmer', 'OCEAN', 'REEF / DEEP SEA', 'SCAVENGER', '#fb923c', [15, 32], 1.25, 160, 9.5, 'ARMOUR', 'Shelled scavenger that moves between reef slope and deep water.')
        };
        const createSpeciesStats = () => ({ births: 0, deaths: 0, predationDeaths: 0, metabolicDeaths: 0, extinctions: 0, extinctRecorded: false, deadSpeed: 0, deadVision: 0, deadBrainMagnitude: 0, foodEnergy: 0, energySpent: 0, escapes: 0, reproduction: 0 });
        researchState.speciesStats = Object.fromEntries(Object.keys(SPECIES_CONFIG).map(key => [key, createSpeciesStats()]));
        let genomeSerial = 0;
        let lastIndividualNameBySpecies = {};
        const cultureState = { stage: 0, knowledgeXP: 0, activeLeaders: 0, camps: [], lastMilestone: 0 };

        const PATTERNS = ["Striped", "Spotted", "Core-Ring", "Dorsal-Fin", "Bioluminescent"];

        let creatures = [];
        let nutrients = [];
        let springs = [];
        let clouds = [];
        let shockwaves = [];
        const telemetryHistory = [];

        // Bounded archipelago elevation (-1.0 Deep Ocean -> +1.0 High Terrace).
        function getWorldElevation(x, y) {
            const s = worldSeed * 0.01;
            let raw = -0.72;
            for (const island of BIOSPHERE_ISLANDS) {
                const dx = (x - island.x) * 0.96;
                const dy = (y - island.y) * 1.04;
                const normalizedDistance = Math.hypot(dx, dy) / island.radius;
                const islandMask = 1 - Math.pow(Math.max(0, normalizedDistance / 0.96), 3.2);
                if (islandMask <= 0) continue;
                const localX = x - island.x, localY = y - island.y;
                const n1 = Math.sin(localX * 0.004 + s) * Math.cos(localY * 0.004 - s);
                const n2 = Math.sin((localX + localY) * 0.007 - s * 1.4) * 0.35;
                raw = Math.max(raw, islandMask * 0.85 + (n1 + n2) * 0.16);
            }

            // Carve an inland freshwater spring pond on the central sanctuary island.
            const distPond = Math.hypot(x - 40, y - 120);
            if (distPond < 135) return -0.18;

            return Math.max(-1, Math.min(1, raw));
        }

        // Quantize elevation into crisp stepped voxel/isometric terraces like the reference image
        function getTerraceStep(elev) {
            if (elev < -0.05) return -1; // Deep Ocean / Lagoon
            if (elev < 0.08) return 0;   // Coastal Shallow Shelf
            if (elev < 0.34) return 1;   // Lower Meadow Terrace
            if (elev < 0.62) return 2;   // Mid Orchard Terrace
            return 3;                    // Upper Highland Terrace
        }

        function getTerrainSphereAt(x, y) {
            return getWorldElevation(x, y) > 0.05 ? "LITHOSPHERE" : "OCEAN";
        }

        function clampWorldCoordinate(value, margin = 32) {
            return Math.max(-WORLD_HALF_SIZE + margin, Math.min(WORLD_HALF_SIZE - margin, value));
        }

        function clampCameraToWorld() {
            if (!simCanvas) return;
            const viewHalfW = simCanvas.width / (2 * camera.zoom);
            const viewHalfH = simCanvas.height / (2 * camera.zoom);
            const maxPanX = Math.max(200, WORLD_HALF_SIZE - viewHalfW * 0.5);
            const maxPanY = Math.max(200, WORLD_HALF_SIZE - viewHalfH * 0.5);
            camera.x = Math.max(-maxPanX, Math.min(maxPanX, camera.x));
            camera.y = Math.max(-maxPanY, Math.min(maxPanY, camera.y));
        }

        // Compact organisms use 5->6->2; cognitive leaders use 8->12->6->3 plus persistent working memory.
        class NeuralBrain {
            constructor(weights = null, cognitive = false) {
                this.cognitive = Boolean(weights?.cognitive || cognitive);
                this.inSize = this.cognitive ? 8 : 5;
                this.hidSize = this.cognitive ? 12 : 6;
                this.midSize = this.cognitive ? 6 : 0;
                this.outSize = this.cognitive ? 3 : 2;
                this.lastInputs = Array(this.inSize).fill(0);
                this.lastHidden = Array(this.cognitive ? 6 : 6).fill(0);
                this.lastHiddenPrimary = [];
                this.lastOutputs = Array(this.outSize).fill(0);
                this.workingMemory = weights?.workingMemory ? [...weights.workingMemory] : [0, 0, 0];
                this.socialMemory = Number(weights?.socialMemory) || 0;
                if (weights?.w1 && weights?.w2) {
                    this.w1 = weights.w1.map(r => [...r]); this.b1 = [...weights.b1];
                    this.w2 = weights.w2.map(r => [...r]); this.b2 = [...weights.b2];
                    if (this.cognitive) {
                        this.w3 = (weights.w3 || Array.from({ length: 3 }, () => Array.from({ length: 6 }, () => 0))).map(r => [...r]);
                        this.b3 = [...(weights.b3 || Array(3).fill(0))];
                    }
                } else {
                    this.w1 = Array.from({ length: this.hidSize }, () => Array.from({ length: this.inSize }, () => (Math.random() * 2 - 1) * 0.9));
                    this.b1 = Array.from({ length: this.hidSize }, () => (Math.random() * 2 - 1) * 0.25);
                    this.w2 = Array.from({ length: this.cognitive ? 6 : 2 }, () => Array.from({ length: this.hidSize }, () => (Math.random() * 2 - 1) * 0.8));
                    this.b2 = Array.from({ length: this.cognitive ? 6 : 2 }, () => (Math.random() * 2 - 1) * 0.2);
                    if (this.cognitive) {
                        this.w3 = Array.from({ length: 3 }, () => Array.from({ length: 6 }, () => (Math.random() * 2 - 1) * 0.8));
                        this.b3 = Array.from({ length: 3 }, () => (Math.random() * 2 - 1) * 0.2);
                    }
                }
            }

            forward(inputs) {
                const vector = Array.from({ length: this.inSize }, (_, i) => Number(inputs[i]) || 0);
                this.lastInputs = vector;
                this.workingMemory = this.workingMemory.map((value, i) => value * 0.94 + (vector[i + 5] || 0) * 0.06);
                const hidden1 = this.w1.map((row, h) => Math.tanh(this.b1[h] + row.reduce((sum, weight, i) => sum + vector[i] * weight, 0)));
                this.lastHiddenPrimary = hidden1;
                if (!this.cognitive) {
                    this.lastHidden = hidden1;
                    this.lastOutputs = this.w2.map((row, o) => Math.tanh(this.b2[o] + row.reduce((sum, weight, i) => sum + hidden1[i] * weight, 0)));
                    return this.lastOutputs;
                }
                const hidden2 = this.w2.map((row, h) => Math.tanh(this.b2[h] + row.reduce((sum, weight, i) => sum + hidden1[i] * weight, 0)));
                const contextual = hidden2.map((value, i) => Math.tanh(value + this.workingMemory[i % this.workingMemory.length] * 0.35));
                this.lastHidden = contextual;
                this.lastOutputs = this.w3.map((row, o) => Math.tanh(this.b3[o] + row.reduce((sum, weight, i) => sum + contextual[i] * weight, 0)));
                this.socialMemory = this.socialMemory * 0.96 + this.lastOutputs[2] * 0.04;
                return this.lastOutputs;
            }

            cloneAndMutate(rate, cognitive = this.cognitive) {
                const child = new NeuralBrain(null, cognitive);
                const transfer = (source, target) => {
                    if (!source || !target) return;
                    for (let r = 0; r < Math.min(source.length, target.length); r++) {
                        for (let c = 0; c < Math.min(source[r].length, target[r].length); c++) target[r][c] = source[r][c];
                    }
                };
                transfer(this.w1, child.w1); transfer(this.w2, child.w2);
                if (this.cognitive) transfer(this.w3, child.w3);
                else if (child.cognitive) transfer(this.w2, child.w3);
                const mutate = values => values?.forEach((row, i) => {
                    if (Array.isArray(row)) row.forEach((v, j) => { if (Math.random() < rate) row[j] = v + (Math.random() * 2 - 1) * 0.4; });
                    else if (Math.random() < rate) values[i] = row + (Math.random() * 2 - 1) * 0.4;
                });
                mutate(child.w1); mutate(child.b1); mutate(child.w2); mutate(child.b2); mutate(child.w3); mutate(child.b3);
                return child;
            }

            reinforce(reward) {
                if (!Number.isFinite(reward) || reward === 0) return;
                const rate = Math.max(-1, Math.min(1, reward)) * 0.003;
                const outputWeights = this.cognitive ? this.w3 : this.w2;
                const hidden = this.lastHidden;
                for (let o = 0; o < outputWeights.length; o++) {
                    for (let h = 0; h < outputWeights[o].length; h++) {
                        outputWeights[o][h] = Math.max(-1.5, Math.min(1.5, outputWeights[o][h] + rate * hidden[h] * Math.sign(this.lastOutputs[o] || 0.1)));
                    }
                }
                this.learningUpdates = (this.learningUpdates || 0) + 1;
            }
        }

        function generateUniqueGenome(speciesKey, parentGenome = null) {
            const cfg = SPECIES_CONFIG[speciesKey];
            const mut = params.mutationRate * EARTH_ERAS[currentEraIndex].mutationBoost;
            let attempts = 0;
            while (attempts < 35) {
                attempts++;
                const hue = parentGenome
                    ? (parentGenome.hue + (Math.random() < mut ? (Math.random() * 20 - 10) : 0) + 360) % 360
                    : cfg.hueRange[0] + Math.random() * (cfg.hueRange[1] - cfg.hueRange[0]);
                const accentHue = parentGenome
                    ? (parentGenome.accentHue + (Math.random() < mut ? (Math.random() * 26 - 13) : 0) + 360) % 360
                    : (hue + 145) % 360;
                const speed = parentGenome
                    ? Math.max(0.9, Math.min(4.2, parentGenome.speed + (Math.random() < mut ? (Math.random() * 0.4 - 0.2) : 0)))
                    : cfg.baseSpeed * (0.88 + Math.random() * 0.26);
                const vision = parentGenome
                    ? Math.max(85, Math.min(250, parentGenome.vision + (Math.random() < mut ? (Math.random() * 20 - 10) : 0)))
                    : cfg.baseVision * (0.9 + Math.random() * 0.25);
                const size = parentGenome
                    ? Math.max(7, Math.min(13.5, parentGenome.size + (Math.random() < mut ? (Math.random() - 0.5) : 0)))
                    : cfg.baseSize * (0.9 + Math.random() * 0.22);
                const appendages = parentGenome ? parentGenome.appendages : (2 + Math.floor(Math.random() * 4));
                const pattern = parentGenome ? parentGenome.pattern : PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
                const sig = `${speciesKey}-${Math.round(hue)}-${speed.toFixed(2)}-${Math.round(vision)}-${attempts}`;
                if (!spawnedGenomeSignatures.has(sig)) {
                    spawnedGenomeSignatures.add(sig);
                    return {
                        id: `GEN-${(++genomeSerial).toString(36).toUpperCase().padStart(4, '0')}`,
                        signature: sig,
                        species: speciesKey,
                        sphereAffinity: cfg.sphere,
                        habitatAffinity: cfg.habitat,
                        hue,
                        accentHue,
                        speed,
                        vision,
                        size,
                        appendages,
                        pattern,
                        defense: cfg.defense
                    };
                }
            }
            return {
                id: `GEN-${(++genomeSerial).toString(36).toUpperCase().padStart(4, '0')}`,
                species: speciesKey,
                sphereAffinity: cfg.sphere,
                habitatAffinity: cfg.habitat,
                hue: cfg.hueRange[0],
                accentHue: 210,
                speed: cfg.baseSpeed,
                vision: cfg.baseVision,
                size: cfg.baseSize,
                appendages: 2,
                pattern: "Striped",
                defense: cfg.defense
            };
        }

        function determineLineage(speciesKey, genome, brain, parentGenome, parentBrain) {
            if (!parentGenome) return `${speciesKey}-L${++lineageSerial}`;
            const hueDelta = Math.abs(((genome.hue - parentGenome.hue + 540) % 360) - 180);
            const traitShift = Math.max(
                Math.abs(genome.speed - parentGenome.speed) / Math.max(1, parentGenome.speed),
                Math.abs(genome.vision - parentGenome.vision) / Math.max(1, parentGenome.vision),
                Math.abs(genome.size - parentGenome.size) / Math.max(1, parentGenome.size),
                hueDelta / 45
            );
            let neuralShift = 0;
            if (parentBrain) {
                const parentWeights = [...parentBrain.w1.flat(), ...parentBrain.w2.flat(), ...(parentBrain.w3 || []).flat()];
                const childWeights = [...brain.w1.flat(), ...brain.w2.flat(), ...(brain.w3 || []).flat()];
                const total = Math.min(parentWeights.length, childWeights.length);
                let diff = 0;
                for (let i = 0; i < total; i++) diff += Math.abs(childWeights[i] - parentWeights[i]);
                neuralShift = total ? diff / total : 0;
            }
            if (traitShift > 0.20 || neuralShift > 0.24) return `${speciesKey}-L${++lineageSerial}`;
            return parentGenome.lineageId || `${speciesKey}-L${++lineageSerial}`;
        }

        function recordOutcome(c, outcome) {
            if (!c || c._outcomeRecorded) return;
            c._outcomeRecorded = true;
            const s = researchState.speciesStats[c.species];
            if (s) {
                s.deaths++;
                if (outcome === 'predation') s.predationDeaths++;
                else s.metabolicDeaths++;
                s.deadSpeed += c.genome.speed || 0;
                s.deadVision += c.genome.vision || 0;
                const weights = [...c.brain.w1.flat(), ...c.brain.w2.flat()];
                s.deadBrainMagnitude += weights.reduce((n, weight) => n + Math.abs(weight), 0) / Math.max(1, weights.length);
            }
            researchState.maxGeneration = Math.max(researchState.maxGeneration, c.generation || 1);
            if (outcome === 'predation') c.deathCause = 'predation';
            else c.deathCause = 'metabolic';
        }

        function recordLabEvent(title, details = '') {
            const counts = {};
            for (const key of Object.keys(SPECIES_CONFIG)) counts[key] = creatures.reduce((n, c) => n + (c.species === key ? c.representedPopulation : 0), 0);
            const summary = populationSummary();
            const traitMean = key => creatures.length ? creatures.reduce((n, c) => n + (Number(c.genome[key]) || 0), 0) / creatures.length : 0;
            const event = { tick: simTick, era: EARTH_ERAS[currentEraIndex].name, title, details, population: summary.represented, counts, traits: { meanSpeed: traitMean('speed'), meanVision: traitMean('vision'), meanEnergy: summary.avgEnergy, meanGeneration: summary.avgGeneration, activeLineages: summary.lineages } };
            researchState.eventLog.unshift(event);
            if (researchState.eventLog.length > 40) researchState.eventLog.pop();
            renderResearchLog();
            return event;
        }

        function renderResearchLog() {
            const list = document.getElementById('labEventLog');
            if (!list) return;
            list.replaceChildren();
            if (!researchState.eventLog.length) {
                const item = document.createElement('li'); item.textContent = 'Waiting for a scenario or historical event.'; list.append(item); return;
            }
            for (const event of researchState.eventLog.slice(0, 12)) {
                const item = document.createElement('li');
                item.textContent = `T${event.tick} Â· ${event.title} Â· ${formatPopulation(event.population)} represented Â· ${event.details}`;
                list.append(item);
            }
        }

        class Organism {
            constructor(x, y, speciesKey, generation = 1, parentGenome = null, parentBrain = null, cognitiveOverride = null) {
                this.x = clampWorldCoordinate(x, 40);
                this.y = clampWorldCoordinate(y, 40);
                this.species = speciesKey;
                this.generation = generation;
                this.agentId = `AGENT-${++organismSerial}`;
                this.isCognitiveLeader = cognitiveOverride === null ? organismSerial % 10 === 0 : Boolean(cognitiveOverride);
                const cfg = SPECIES_CONFIG[speciesKey];
                const namePool = cfg.names;
                let personalName = namePool[Math.floor(Math.random() * namePool.length)];
                if (namePool.length > 1 && personalName === lastIndividualNameBySpecies[speciesKey]) {
                    personalName = namePool[(namePool.indexOf(personalName) + 1 + Math.floor(Math.random() * (namePool.length - 1))) % namePool.length];
                }
                lastIndividualNameBySpecies[speciesKey] = personalName;
                this.realName = `${personalName} the ${cfg.commonName}`;
                this.name = this.realName;
                this.genome = generateUniqueGenome(speciesKey, parentGenome);
                this.brain = parentBrain
                    ? parentBrain.cloneAndMutate(params.mutationRate * EARTH_ERAS[currentEraIndex].mutationBoost, this.isCognitiveLeader)
                    : new NeuralBrain(null, this.isCognitiveLeader);
                this.lineageId = determineLineage(speciesKey, this.genome, this.brain, parentGenome, parentBrain);
                this.genome.lineageId = this.lineageId;

                this.angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(this.angle) * this.genome.speed;
                this.vy = Math.sin(this.angle) * this.genome.speed;
                this.energy = 115;
                this.maxEnergy = 220;
                this.hydration = 100;
                this.age = 0;
                this.growthProgress = 0;
                this.lifeStage = 'JUVENILE';
                this.survivalExperience = parentGenome?.survivalExperience || 0;
                this.defenseCooldown = 0;
                this.isBurrowed = false;
                this.escapeBurstTicks = 0;
                this.developmentalMilestone = 'Hatched into the biosphere';
                this.mentorBoost = 0;
                this.offspring = 0;
                this.walkPhase = Math.random() * Math.PI * 2;
                this.stateLabel = "FORAGING";
                this.thoughtIcon = "APPLE";
                this.successfulEscapes = 0;
                this.representedPopulation = POPULATION_PER_AGENT;
                this.vitalityHistory = Array(24).fill(this.energy / this.maxEnergy);
                this.foodEnergyGained = 0;
                this.energySpent = 0;
                this.aliveTicks = 0;
                this.predationEncounters = 0;
                this._outcomeRecorded = false;
                if (researchState.speciesStats[this.species]) {
                    researchState.speciesStats[this.species].births++;
                    researchState.speciesStats[this.species].extinctRecorded = false;
                }
                const priorRecordGeneration = researchState.maxGeneration;
                researchState.maxGeneration = Math.max(researchState.maxGeneration, this.generation);
                if (this.generation > priorRecordGeneration) recordLabEvent('Generation record', `generation ${this.generation} reached by ${SPECIES_CONFIG[this.species].name} Â· ${this.lineageId}`);
                if (parentGenome?.lineageId && parentGenome.lineageId !== this.lineageId) recordLabEvent('Lineage divergence', `${this.lineageId} diverged from ${parentGenome.lineageId} by inherited ANN or trait shift`);

                if (this.generation > maxGeneration) maxGeneration = this.generation;
            }

            updateDevelopment() {
                const thermalStress = Math.max(0, Math.abs(environment.temperature - 22) - 8) / 42;
                const oxygenStress = Math.max(0, 21 - environment.oxygen) / 21;
                const growthHealth = Math.max(0.35, 1 - thermalStress * 0.35 - oxygenStress * 0.3 - environment.toxin / 400);
                this.age += (this.energy > this.maxEnergy * 0.6 ? 1.2 : 0.85) * growthHealth;
                const priorStage = this.lifeStage;
                const thresholds = { JUVENILE: 0, ADOLESCENT: 240, MATURE: 720, ELDER: 2200 };
                if (this.age < thresholds.ADOLESCENT) this.lifeStage = 'JUVENILE';
                else if (this.age < thresholds.MATURE) this.lifeStage = 'ADOLESCENT';
                else if (this.age < thresholds.ELDER) this.lifeStage = 'MATURE';
                else this.lifeStage = 'ELDER';
                const stageStart = thresholds[this.lifeStage];
                const stageEnd = this.lifeStage === 'JUVENILE' ? thresholds.ADOLESCENT : this.lifeStage === 'ADOLESCENT' ? thresholds.MATURE : this.lifeStage === 'MATURE' ? thresholds.ELDER : thresholds.ELDER + 1400;
                this.growthProgress = Math.max(0, Math.min(1, (this.age - stageStart) / Math.max(1, stageEnd - stageStart)));
                this.genome.stageScale = this.lifeStage === 'JUVENILE' ? 0.62 + this.growthProgress * 0.18 : this.lifeStage === 'ADOLESCENT' ? 0.8 + this.growthProgress * 0.2 : this.lifeStage === 'ELDER' ? Math.max(0.92, 1 - (this.age - thresholds.ELDER) / 10000) : 1;
                this.maxEnergy = 220 * (0.72 + 0.28 * this.genome.stageScale);
                this.genome.survivalExperience = this.survivalExperience;
                if (priorStage !== this.lifeStage) {
                    this.developmentalMilestone = this.lifeStage === 'ADOLESCENT' ? 'Sensory range expanding' : this.lifeStage === 'MATURE' ? 'Adult traits reached; reproduction enabled' : 'Elder experience improving risk judgment';
                    if (selectedCreature === this) showToast(`${this.realName} reached ${this.lifeStage.toLowerCase()}`);
                }
                this.defenseCooldown = Math.max(0, this.defenseCooldown - 1);
                this.burrowTicks = Math.max(0, (this.burrowTicks || 0) - 1);
                this.isBurrowed = this.burrowTicks > 0;
                this.escapeBurstTicks = Math.max(0, this.escapeBurstTicks - 1);
                this.mentorBoost = Math.max(0, this.mentorBoost - 0.02);
                if (this.lifeStage === 'ELDER') this.survivalExperience += 0.01;
            }

            update() {
                this.updateDevelopment();
                const speciesConfig = SPECIES_CONFIG[this.species];
                const vision = this.genome.vision * (0.78 + this.growthProgress * 0.22) * (this.lifeStage === 'ELDER' ? 1.08 : 1);
                let nearestFood = null;
                let nearestFoodDist = Infinity;

                for (let i = 0; i < nutrients.length; i++) {
                    const n = nutrients[i];
                    if (speciesConfig.predator) break;
                    const d = Math.hypot(n.x - this.x, n.y - this.y);
                    if (d < vision && d < nearestFoodDist) {
                        nearestFoodDist = d;
                        nearestFood = n;
                    }
                }

                let nearestThreat = null;
                let nearestThreatDist = Infinity;
                let nearestPrey = null;
                let nearestPreyDist = Infinity;
                let nearbyAllies = 0;

                for (let i = 0; i < creatures.length; i++) {
                    const other = creatures[i];
                    if (other === this || other.isBurrowed) continue;
                    const d = Math.hypot(other.x - this.x, other.y - this.y);
                    const otherConfig = SPECIES_CONFIG[other.species];
                    const detectionRange = speciesConfig.predator && other.genome.defense === 'CAMOUFLAGE' ? vision * 0.72 : vision;
                    if (d > detectionRange) continue;
                    if (!otherConfig.predator && !speciesConfig.predator) nearbyAllies++;
                    if (speciesConfig.predator && !otherConfig.predator) {
                        if (d < nearestPreyDist) { nearestPreyDist = d; nearestPrey = other; }
                    } else if (otherConfig.predator && !speciesConfig.predator) {
                        if (d < nearestThreatDist) { nearestThreatDist = d; nearestThreat = other; }
                    }
                }

                if (nearestThreat && speciesConfig.defense === 'BURROWING' && this.defenseCooldown === 0 && nearestThreatDist < Math.max(90, vision * 0.52) && getTerrainSphereAt(this.x, this.y) === 'LITHOSPHERE') {
                    this.burrowTicks = 45;
                    this.isBurrowed = true;
                    this.defenseCooldown = 150;
                    this.stateLabel = 'BURROWING TO EVADE';
                    this.thoughtIcon = 'ALERT';
                    this.survivalExperience += 0.5;
                }

                // Target selection & Thought Bubble state (Apple, Water/Spring, Social Gather, Alert)
                let target = speciesConfig.predator ? nearestPrey : nearestFood;
                let targetDist = speciesConfig.predator ? nearestPreyDist : nearestFoodDist;

                if (nearestThreat) {
                    this.stateLabel = "EVADING PREDATOR";
                    this.thoughtIcon = "ALERT";
                } else if (speciesConfig.predator && nearestPrey) {
                    this.stateLabel = "HUNTING PREY";
                    this.thoughtIcon = "PREY";
                } else if (this.hydration < 45 && springs.length > 0) {
                    target = springs[0];
                    targetDist = Math.hypot(target.x - this.x, target.y - this.y);
                    this.stateLabel = "SEEKING SPRING";
                    this.thoughtIcon = "WATER";
                } else if (target) {
                    this.stateLabel = "HARVESTING FRUIT";
                    this.thoughtIcon = "APPLE";
                } else {
                    this.stateLabel = "GATHERING COLONY";
                    this.thoughtIcon = "SOCIAL";
                }
                if (nearestThreat) { this.predationEncounters++; this.survivalExperience += 0.025; }

                let targetAngleSin = 0;
                let targetProximity = 0;
                if (target) {
                    const rel = Math.atan2(target.y - this.y, target.x - this.x) - this.angle;
                    targetAngleSin = Math.sin(rel);
                    targetProximity = 1 - Math.min(1, targetDist / Math.max(vision, 220));
                }

                let threatSignal = 0;
                if (nearestThreat) {
                    const relT = Math.atan2(nearestThreat.y - this.y, nearestThreat.x - this.x) - this.angle;
                    threatSignal = Math.sin(relT) * (1 - nearestThreatDist / vision);
                }

                const terrainHere = getTerrainSphereAt(this.x, this.y);
                const sphereMatch = this.genome.sphereAffinity === "ATMOSPHERE" || this.genome.sphereAffinity === terrainHere ? 1.0 : -0.7;

                const riskSignal = (nearestThreat ? Math.max(0, 1 - nearestThreatDist / Math.max(1, vision)) : 0) * (1 - Math.min(0.22, this.survivalExperience * 0.001));
                const baseInputs = [
                    targetAngleSin,
                    targetProximity,
                    threatSignal,
                    sphereMatch,
                    this.energy / this.maxEnergy
                ];
                const outputs = this.brain.forward(this.isCognitiveLeader ? [...baseInputs, riskSignal, Math.min(1, nearbyAllies / 5), this.growthProgress] : baseInputs);
                const steerOut = outputs[0] || 0, thrustOut = outputs[1] || 0;
                const socialIntent = this.isCognitiveLeader ? outputs[2] || 0 : 0;

                let steerDelta = steerOut * 0.12 + (Number.isFinite(this.sharedHeading) ? Math.atan2(Math.sin(this.sharedHeading - this.angle), Math.cos(this.sharedHeading - this.angle)) * 0.025 * this.mentorBoost : 0);
                if (target) {
                    const direct = Math.atan2(target.y - this.y, target.x - this.x);
                    const diff = Math.atan2(Math.sin(direct - this.angle), Math.cos(direct - this.angle));
                    steerDelta += diff * 0.09;
                }
                if (nearestThreat) {
                    const away = Math.atan2(this.y - nearestThreat.y, this.x - nearestThreat.x);
                    const diff = Math.atan2(Math.sin(away - this.angle), Math.cos(away - this.angle));
                    steerDelta += diff * 0.16;
                    if (speciesConfig.defense === 'SPEED BURST' && this.defenseCooldown === 0) {
                        this.escapeBurstTicks = 20;
                        this.defenseCooldown = 95;
                    }
                }

                if (this.isCognitiveLeader && socialIntent > -0.2 && nearbyAllies > 0) {
                    const broadcast = Math.max(0, Math.min(1, (socialIntent + 0.2) / 1.2));
                    for (const peer of creatures) {
                        if (peer === this || peer.species === this.species && peer.isCognitiveLeader) continue;
                        if (Math.hypot(peer.x - this.x, peer.y - this.y) <= 300) {
                            peer.mentorBoost = Math.max(peer.mentorBoost, broadcast);
                            peer.sharedHeading = this.angle;
                            if (peer.lifeStage === 'JUVENILE') peer.survivalExperience += 0.002 * broadcast;
                        }
                    }
                }

                // Keep land species inside the terraced island landmass
                const elev = getWorldElevation(this.x + Math.cos(this.angle) * 45, this.y + Math.sin(this.angle) * 45);
                if (this.genome.sphereAffinity === "LITHOSPHERE" && elev < 0.06) {
                    const toCenter = Math.atan2(-this.y, -this.x);
                    const diff = Math.atan2(Math.sin(toCenter - this.angle), Math.cos(toCenter - this.angle));
                    steerDelta += diff * 0.25;
                } else if (this.genome.sphereAffinity === "OCEAN" && elev > 0.08) {
                    const toOuterSea = Math.atan2(this.y, this.x);
                    const diff = Math.atan2(Math.sin(toOuterSea - this.angle), Math.cos(toOuterSea - this.angle));
                    steerDelta += diff * 0.25;
                }

                this.angle += steerDelta + (Math.random() - 0.5) * 0.06;
                const oxygenFactor = Math.max(0.45, Math.min(1.08, environment.oxygen / 21));
                const cultureStage = localCultureStageAt(this.x, this.y);
                const growthMobility = this.lifeStage === 'JUVENILE' ? 0.82 : this.lifeStage === 'ADOLESCENT' ? 0.94 : 1;
                const speed = this.genome.speed * (0.7 + (thrustOut + 1) * 0.3) * oxygenFactor * growthMobility * (this.escapeBurstTicks > 0 ? 1.7 : 1) * (cultureStage >= 3 ? 1.04 : 1) * (this.isBurrowed ? 0.12 : 1);
                this.vx = Math.cos(this.angle) * speed;
                this.vy = Math.sin(this.angle) * speed;
                this.x = clampWorldCoordinate(this.x + this.vx, 36);
                this.y = clampWorldCoordinate(this.y + this.vy, 36);
                this.walkPhase += 0.22 + speed * 0.07;

                const thermalLoad = Math.max(0, Math.abs(environment.temperature - 22) - 8) * 0.0025;
                const oxygenLoad = Math.max(0, 21 - environment.oxygen) * 0.004;
                const toxinLoad = environment.toxin * 0.0008;
                const traitCost = 1 + Math.max(0, this.genome.speed - 1.5) * 0.10 + Math.max(0, this.genome.vision - 120) * 0.00045 + Math.max(0, this.genome.size - 8) * 0.025;
                const wisdom = this.lifeStage === 'ELDER' ? Math.min(0.12, this.survivalExperience * 0.002) : 0;
                const cultureRelief = cultureStage >= 4 ? 0.1 : cultureStage >= 3 ? 0.04 : 0;
                const elderAgingLoad = this.lifeStage === 'ELDER' ? 1 + Math.min(0.25, Math.max(0, this.age - 2200) * 0.0001) : 1;
                const metabolicCost = (0.075 + this.genome.speed * 0.022) * params.burnRate * traitCost * (1 + thermalLoad + oxygenLoad + toxinLoad) * elderAgingLoad * (1 - wisdom - cultureRelief - this.mentorBoost * 0.025);
                this.energy -= metabolicCost;
                this.energySpent += metabolicCost;
                const fitnessStats = researchState.speciesStats[this.species];
                if (fitnessStats) fitnessStats.energySpent += metabolicCost;
                this.aliveTicks++;
                this.hydration = Math.max(0, this.hydration - (0.06 * params.burnRate + thermalLoad * 0.04 + toxinLoad * 0.02));
                if (simTick % 8 === 0) {
                    this.vitalityHistory.push(Math.max(0.08, Math.min(1.0, this.energy / this.maxEnergy)));
                    if (this.vitalityHistory.length > 28) this.vitalityHistory.shift();
                }

                // Replenish hydration near freshwater springs
                for (const sp of springs) {
                    if (Math.hypot(sp.x - this.x, sp.y - this.y) < sp.radius + 18) {
                        this.hydration = Math.min(100, this.hydration + 1.5);
                        this.energy = Math.min(this.maxEnergy, this.energy + 0.15);
                    }
                }

                // Eat fallen apples / plankton nutrients
                for (let i = nutrients.length - 1; i >= 0; i--) {
                    const n = nutrients[i];
                    if (speciesConfig.predator) break;
                    if (Math.hypot(n.x - this.x, n.y - this.y) < this.genome.size + n.size + 4) {
                        const foodYield = n.energy * (cultureStage >= 2 ? 1.15 : cultureStage >= 1 ? 1.05 : 1) * (this.mentorBoost > 0 ? 1.04 : 1);
                        this.energy = Math.min(this.maxEnergy, this.energy + foodYield);
                        this.foodEnergyGained += foodYield;
                        this.survivalExperience += 0.015;
                        const stats = researchState.speciesStats[this.species];
                        if (stats) stats.foodEnergy += foodYield;
                        if (lifetimePlasticityEnabled) this.brain.reinforce(0.6);
                        nutrients.splice(i, 1);
                        break;
                    }
                }

                // Predation check
                if (speciesConfig.predator) {
                    for (let i = creatures.length - 1; i >= 0; i--) {
                        const prey = creatures[i];
                        if (prey === this || SPECIES_CONFIG[prey.species].predator || prey.isBurrowed) continue;
                        if (Math.hypot(prey.x - this.x, prey.y - this.y) < this.genome.size + prey.genome.size) {
                            const preyConfig = SPECIES_CONFIG[prey.species];
                            const nearbyDefenders = creatures.reduce((n, ally) => n + (ally !== prey && !SPECIES_CONFIG[ally.species].predator && Math.hypot(ally.x - prey.x, ally.y - prey.y) < 115 ? 1 : 0), 0);
                            const campDefense = localCultureStageAt(prey.x, prey.y) >= 1 ? 0.06 : 0;
                            const defenseBonus = preyConfig.defense === 'ARMOUR' ? 0.08 : preyConfig.defense === 'CAMOUFLAGE' ? 0.13 : preyConfig.defense === 'SPEED BURST' && prey.escapeBurstTicks > 0 ? 0.22 : preyConfig.defense === 'GROUP DEFENCE' ? Math.min(0.24, nearbyDefenders * 0.06) : 0;
                            const stageRisk = prey.lifeStage === 'JUVENILE' ? -0.1 : prey.lifeStage === 'ELDER' ? 0.04 : 0;
                            const escapeChance = Math.max(0.04, Math.min(0.82, 0.28 - (environment.predatorPressure - 100) * 0.0015 + defenseBonus + campDefense + stageRisk + Math.min(0.12, prey.survivalExperience * 0.001)));
                            if (Math.random() < escapeChance) {
                                prey.successfulEscapes++;
                                prey.survivalExperience += 1;
                                const preyStats = researchState.speciesStats[prey.species];
                                if (preyStats) preyStats.escapes++;
                                if (lifetimePlasticityEnabled) prey.brain.reinforce(1);
                                prey.angle = Math.atan2(prey.y - this.y, prey.x - this.x);
                                continue;
                            }
                            const armorReduction = preyConfig.defense === 'ARMOUR' ? 0.38 : 0;
                            const groupReduction = preyConfig.defense === 'GROUP DEFENCE' ? Math.min(0.25, nearbyDefenders * 0.06) : 0;
                            const shelterReduction = localCultureStageAt(prey.x, prey.y) >= 3 ? 0.1 : 0;
                            const damage = 62 * (1 - armorReduction - groupReduction - shelterReduction) * (prey.lifeStage === 'JUVENILE' ? 1.2 : 1);
                            prey.energy -= damage;
                            this.energy = Math.min(this.maxEnergy, this.energy + damage * 0.45);
                            if (prey.energy <= 0) {
                                recordOutcome(prey, 'predation');
                                if (selectedCreature === prey) deselectCreature();
                                creatures.splice(i, 1);
                            } else {
                                prey.stateLabel = `INJURED · ${Math.round(prey.energy)} ENERGY`;
                                prey.angle = Math.atan2(prey.y - this.y, prey.x - this.x);
                            }
                            break;
                        }
                    }
                }

                // Reproduction
                if (this.lifeStage === 'MATURE' || this.lifeStage === 'ELDER') {
                    if (this.energy >= 190 && creatures.length < 110) {
                    this.energy *= 0.5;
                    this.offspring++;
                    if (researchState.speciesStats[this.species]) researchState.speciesStats[this.species].reproduction++;
                    creatures.push(new Organism(
                        this.x + (Math.random() - 0.5) * 24,
                        this.y + (Math.random() - 0.5) * 24,
                        this.species,
                        this.generation + 1,
                        this.genome,
                        this.brain,
                        (organismSerial + 1) % 10 === 0
                    ));
                    }
                }
            }
        }

        // ==========================================
        // THREE.JS ISOMETRIC TERRACED WORLD ENGINE
        // ==========================================
        const threeState = {
            renderer: null,
            scene: null,
            camera: null,
            worldGroup: null,
            creatureMeshes: new Map(),
            nutrientMesh: null,
            initialized: false,
            width: 0,
            height: 0
        };

        function terraceHeightY(elev) {
            const step = getTerraceStep(elev);
            if (step === -1) return -22;
            if (step === 0) return -6;
            if (step === 1) return 14;
            if (step === 2) return 34;
            return 54;
        }

        function initThreeWorld() {
            if (!world3dCanvas) return false;
            try {
                threeState.renderer = new THREE.WebGLRenderer({ canvas: world3dCanvas, antialias: true, powerPreference: 'high-performance' });
                threeState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
                threeState.renderer.setSize(window.innerWidth, window.innerHeight, false);
                threeState.renderer.shadowMap.enabled = true;
                threeState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                threeState.renderer.outputColorSpace = THREE.SRGBColorSpace;

                threeState.scene = new THREE.Scene();
                threeState.scene.background = new THREE.Color('#031522');

                // Orthographic Isometric Camera
                const aspect = window.innerWidth / Math.max(1, window.innerHeight);
                const frustum = 900;
                threeState.camera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 1, 10000);
                threeState.camera.up.set(0, 1, 0);

                // Warm sunlight + cool sky fill for crisp terraced voxel shadows
                const hemi = new THREE.HemisphereLight('#d9f99d', '#0f293a', 1.45);
                threeState.scene.add(hemi);

                const sun = new THREE.DirectionalLight('#fffbeb', 2.4);
                sun.position.set(-1100, 1800, 950);
                sun.castShadow = true;
                sun.shadow.mapSize.set(2048, 2048);
                sun.shadow.camera.left = -1800;
                sun.shadow.camera.right = 1800;
                sun.shadow.camera.top = 1800;
                sun.shadow.camera.bottom = -1800;
                sun.shadow.bias = -0.0004;
                threeState.scene.add(sun);

                setup3DCreatureBatches();
                threeState.initialized = true;
                return true;
            } catch (err) {
                console.warn('3D renderer fallback:', err);
                return false;
            }
        }

        function rebuildTerracedWorld() {
            if (!threeState.initialized) return;
            if (threeState.worldGroup) {
                threeState.scene.remove(threeState.worldGroup);
            }
            const group = new THREE.Group();
            const era = EARTH_ERAS[currentEraIndex];
            threeState.scene.background.set(era.oceanColor);

            // 1. Deep Ocean Base Plane
            const oceanGeo = new THREE.PlaneGeometry(9000, 9000);
            const oceanMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(era.oceanColor).lerp(new THREE.Color('#083344'), 0.45),
                roughness: 0.35,
                metalness: 0.2
            });
            const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
            oceanMesh.rotation.x = -Math.PI / 2;
            oceanMesh.position.y = -18;
            oceanMesh.receiveShadow = true;
            group.add(oceanMesh);

            // 2. Stepped Voxel/Terraced Island Blocks (inspired by the terraced grid in Screenshot 1)
            const blockPositions = [];
            const treePositions = [];
            const rockPositions = [];
            const stumpPositions = [];
            const padPositions = [];

            for (let x = -WORLD_HALF_SIZE + TILE_STEP; x <= WORLD_HALF_SIZE - TILE_STEP; x += TILE_STEP) {
                for (let z = -WORLD_HALF_SIZE + TILE_STEP; z <= WORLD_HALF_SIZE - TILE_STEP; z += TILE_STEP) {
                    const elev = getWorldElevation(x, z);
                    const step = getTerraceStep(elev);
                    if (step < 0) continue;

                    const topY = terraceHeightY(elev);
                    const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233 + worldSeed) * 43758.5453) % 1;

                    blockPositions.push({ x, z, topY, step, hash });

                    if (step >= 1) {
                        // Place orchard apple trees, stone boulders, cut stumps & circular gathering pads
                        if (hash > 0.86) {
                            treePositions.push({ x, z, y: topY, fruiting: hash > 0.91, scale: 0.9 + (hash - 0.86) * 2.5 });
                        } else if (hash > 0.82 && hash <= 0.86) {
                            rockPositions.push({ x, z, y: topY, scale: 0.8 + hash * 0.5 });
                        } else if (hash > 0.79 && hash <= 0.82) {
                            stumpPositions.push({ x, z, y: topY });
                        } else if (hash > 0.775 && hash <= 0.79 && step === 1) {
                            padPositions.push({ x, z, y: topY + 0.8 });
                        }
                    }
                }
            }

            // Instanced Terraced Land Columns
            const colGeo = new THREE.BoxGeometry(TILE_STEP * 1.01, 70, TILE_STEP * 1.01);
            const colMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.04 });
            const colInst = new THREE.InstancedMesh(colGeo, colMat, blockPositions.length);
            colInst.receiveShadow = true;
            colInst.castShadow = true;

            const dummy = new THREE.Object3D();
            const color = new THREE.Color();
            blockPositions.forEach((b, i) => {
                dummy.position.set(b.x, b.topY - 35, b.z);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                colInst.setMatrixAt(i, dummy.matrix);

                if (b.step === 0) {
                    color.set('#2dd4bf').lerp(new THREE.Color('#0e7490'), 0.45);
                } else if (b.step === 1) {
                    color.set(era.grassTop).offsetHSL(0, 0, (b.hash - 0.5) * 0.04);
                } else if (b.step === 2) {
                    color.set(era.landColor).lerp(new THREE.Color(era.grassTop), 0.55);
                } else {
                    color.set('#78716c').lerp(new THREE.Color(era.grassTop), 0.35);
                }
                colInst.setColorAt(i, color);
            });
            colInst.instanceMatrix.needsUpdate = true;
            if (colInst.instanceColor) colInst.instanceColor.needsUpdate = true;
            group.add(colInst);

            // Instanced Orchard Trees (Trunks + Lush Canopies + Red Apples)
            if (treePositions.length > 0) {
                const trunkInst = new THREE.InstancedMesh(
                    new THREE.CylinderGeometry(3.2, 4.8, 22, 7),
                    new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 0.9 }),
                    treePositions.length
                );
                const crownInst = new THREE.InstancedMesh(
                    new THREE.IcosahedronGeometry(16, 1),
                    new THREE.MeshStandardMaterial({ color: '#3f8f38', roughness: 0.78 }),
                    treePositions.length
                );
                const applePositions = [];

                treePositions.forEach((t, i) => {
                    dummy.position.set(t.x, t.y + 11 * t.scale, t.z);
                    dummy.scale.set(t.scale, t.scale, t.scale);
                    dummy.updateMatrix();
                    trunkInst.setMatrixAt(i, dummy.matrix);

                    dummy.position.set(t.x, t.y + 26 * t.scale, t.z);
                    dummy.scale.set(t.scale, t.scale * 0.95, t.scale);
                    dummy.updateMatrix();
                    crownInst.setMatrixAt(i, dummy.matrix);
                    crownInst.setColorAt(i, new THREE.Color(t.fruiting ? '#449e3c' : '#2f7a32'));

                    if (t.fruiting) {
                        applePositions.push(
                            { x: t.x - 9 * t.scale, y: t.y + 24 * t.scale, z: t.z + 10 * t.scale },
                            { x: t.x + 10 * t.scale, y: t.y + 28 * t.scale, z: t.z + 6 * t.scale },
                            { x: t.x + 2 * t.scale, y: t.y + 21 * t.scale, z: t.z - 11 * t.scale }
                        );
                    }
                });
                trunkInst.castShadow = true;
                crownInst.castShadow = true;
                crownInst.receiveShadow = true;
                group.add(trunkInst, crownInst);

                if (applePositions.length > 0) {
                    const appleInst = new THREE.InstancedMesh(
                        new THREE.SphereGeometry(2.6, 8, 8),
                        new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.35 }),
                        applePositions.length
                    );
                    applePositions.forEach((a, i) => {
                        dummy.position.set(a.x, a.y, a.z);
                        dummy.scale.set(1, 1, 1);
                        dummy.updateMatrix();
                        appleInst.setMatrixAt(i, dummy.matrix);
                    });
                    group.add(appleInst);
                }
            }

            // Instanced Stone Boulders
            if (rockPositions.length > 0) {
                const rockInst = new THREE.InstancedMesh(
                    new THREE.DodecahedronGeometry(11, 0),
                    new THREE.MeshStandardMaterial({ color: '#787e7a', roughness: 0.92 }),
                    rockPositions.length
                );
                rockPositions.forEach((r, i) => {
                    dummy.position.set(r.x, r.y + 6 * r.scale, r.z);
                    dummy.scale.set(r.scale, r.scale * 0.75, r.scale);
                    dummy.rotation.set(0, i * 0.8, 0);
                    dummy.updateMatrix();
                    rockInst.setMatrixAt(i, dummy.matrix);
                });
                rockInst.castShadow = true;
                rockInst.receiveShadow = true;
                group.add(rockInst);
            }

            // Instanced Wood Stumps
            if (stumpPositions.length > 0) {
                const stumpInst = new THREE.InstancedMesh(
                    new THREE.CylinderGeometry(5.5, 6.5, 8, 8),
                    new THREE.MeshStandardMaterial({ color: '#855832', roughness: 0.88 }),
                    stumpPositions.length
                );
                stumpPositions.forEach((s, i) => {
                    dummy.position.set(s.x, s.y + 4, s.z);
                    dummy.scale.set(1, 1, 1);
                    dummy.rotation.set(0, 0, 0);
                    dummy.updateMatrix();
                    stumpInst.setMatrixAt(i, dummy.matrix);
                });
                stumpInst.castShadow = true;
                group.add(stumpInst);
            }

            // Instanced Circular Gathering Pads (inspired by the multi-colored circular pads in Screenshot 1)
            if (padPositions.length > 0) {
                const padInst = new THREE.InstancedMesh(
                    new THREE.CylinderGeometry(24, 25, 2.5, 16),
                    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.65 }),
                    padPositions.length
                );
                padPositions.forEach((p, i) => {
                    dummy.position.set(p.x, p.y, p.z);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    padInst.setMatrixAt(i, dummy.matrix);
                });
                padInst.receiveShadow = true;
                group.add(padInst);
            }

            // Inland Freshwater Spring Ring
            const springRing = new THREE.Mesh(
                new THREE.TorusGeometry(132, 6, 8, 36),
                new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.5 })
            );
            springRing.rotation.x = Math.PI / 2;
            springRing.position.set(40, -4, 120);
            group.add(springRing);

            threeState.worldGroup = group;
            threeState.scene.add(group);
        }

        function setup3DCreatureBatches() {
            const maxCount = 130;
            const bodyGeo = new THREE.CapsuleGeometry(0.65, 0.85, 6, 12);
            const headGeo = new THREE.SphereGeometry(0.68, 12, 10);
            const earGeo = new THREE.BoxGeometry(0.28, 0.55, 0.22);

            const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
            const accentMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.08 });

            const bodyInst = new THREE.InstancedMesh(bodyGeo, bodyMat, maxCount);
            const headInst = new THREE.InstancedMesh(headGeo, bodyMat, maxCount);
            const earLInst = new THREE.InstancedMesh(earGeo, accentMat, maxCount);
            const earRInst = new THREE.InstancedMesh(earGeo, accentMat, maxCount);
            const leaderHalo = new THREE.InstancedMesh(
                new THREE.TorusGeometry(12, 1.25, 6, 18),
                new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#0e7490', emissiveIntensity: 1.1, roughness: 0.25 }),
                maxCount
            );
            leaderHalo.name = 'Cognitive Leader halos';

            bodyInst.castShadow = true;
            headInst.castShadow = true;
            bodyInst.frustumCulled = false;
            headInst.frustumCulled = false;
            earLInst.frustumCulled = false;
            earRInst.frustumCulled = false;

            threeState.scene.add(bodyInst, headInst, earLInst, earRInst, leaderHalo);
            threeState.creatureMeshes.set('body', bodyInst);
            threeState.creatureMeshes.set('head', headInst);
            threeState.creatureMeshes.set('earL', earLInst);
            threeState.creatureMeshes.set('earR', earRInst);
            threeState.creatureMeshes.set('leaders', leaderHalo);

            // Fallen apples / nutrients in 3D
            const nutGeo = new THREE.SphereGeometry(3.4, 10, 10);
            const nutMat = new THREE.MeshStandardMaterial({ roughness: 0.35 });
            threeState.nutrientMesh = new THREE.InstancedMesh(nutGeo, nutMat, 300);
            threeState.nutrientMesh.castShadow = true;
            threeState.nutrientMesh.frustumCulled = false;
            threeState.scene.add(threeState.nutrientMesh);
        }

        function syncAndRender3D() {
            if (!threeState.initialized) return;

            const width = window.innerWidth;
            const height = window.innerHeight;
            if (threeState.width !== width || threeState.height !== height) {
                threeState.renderer.setSize(width, height, false);
                threeState.width = width;
                threeState.height = height;
            }

            const aspect = width / Math.max(1, height);
            const frustum = 780 / camera.zoom;
            threeState.camera.left = -frustum * aspect;
            threeState.camera.right = frustum * aspect;
            threeState.camera.top = frustum;
            threeState.camera.bottom = -frustum;
            threeState.camera.updateProjectionMatrix();

            // Isometric 45-degree angle when 3D Isometric is active, or straight top-down in 2D mode
            if (is3DView) {
                threeState.camera.position.set(camera.x + 1200, 1450, camera.y + 1200);
                threeState.camera.lookAt(camera.x, 12, camera.y);
            } else {
                threeState.camera.position.set(camera.x, 2200, camera.y + 0.01);
                threeState.camera.lookAt(camera.x, 0, camera.y);
            }

            // Sync 3D Organisms
            const bodyInst = threeState.creatureMeshes.get('body');
            const headInst = threeState.creatureMeshes.get('head');
            const earLInst = threeState.creatureMeshes.get('earL');
            const earRInst = threeState.creatureMeshes.get('earR');
            const leaderHalo = threeState.creatureMeshes.get('leaders');
            let leaderIndex = 0;

            const dummy = new THREE.Object3D();
            const color = new THREE.Color();
            const accentColor = new THREE.Color();

            creatures.forEach((c, i) => {
                const elev = getWorldElevation(c.x, c.y);
                const groundY = terraceHeightY(elev);
                const skyLift = c.genome.sphereAffinity === 'ATMOSPHERE' ? 38 : 0;
                const hop = Math.abs(Math.sin(c.walkPhase)) * 2.5;
                const s = c.genome.size * (c.genome.stageScale || 1) * (c.isBurrowed ? 0.34 : 1);
                const buriedOffset = c.isBurrowed ? -10 : 0;
                const profile = SPECIES_CONFIG[c.species].visualProfile;

                color.setHSL((c.genome.hue % 360) / 360, 0.82, 0.56);
                accentColor.setHSL((c.genome.accentHue % 360) / 360, 0.85, 0.52);

                // Torso / Overalls
                dummy.position.set(c.x, groundY + s * 0.85 + skyLift + hop + buriedOffset, c.y);
                dummy.rotation.set(0, Math.PI / 2 - c.angle, 0);
                dummy.scale.set(s * (profile === 'predator' ? 1.12 : profile === 'burrower' ? 0.92 : 1), s * (profile === 'aquatic' ? 0.78 : 1), s);
                dummy.updateMatrix();
                bodyInst.setMatrixAt(i, dummy.matrix);
                bodyInst.setColorAt(i, accentColor);

                // Head
                dummy.position.set(c.x, groundY + s * 1.78 + skyLift + hop + buriedOffset, c.y);
                dummy.scale.set(s * 1.05, s * 0.95, s * 1.05);
                dummy.updateMatrix();
                headInst.setMatrixAt(i, dummy.matrix);
                headInst.setColorAt(i, color);

                // Expressive Ears / Wings
                const wingSpread = profile === 'winged' ? (c.species === 'aeroglider' ? 2.4 : c.species === 'albatross' ? 2.8 : 1.75) : c.species === 'mantaRay' ? 2.6 : profile === 'predator' ? 0.78 : 0.95;
                const earOffset = s * 0.68;
                const cosA = Math.cos(c.angle);
                const sinA = Math.sin(c.angle);

                dummy.position.set(c.x - sinA * earOffset, groundY + s * 2.25 + skyLift + hop + buriedOffset, c.y + cosA * earOffset);
                dummy.rotation.set(0, Math.PI / 2 - c.angle, 0.35 * wingSpread);
                dummy.scale.set(s * wingSpread, s, s);
                dummy.updateMatrix();
                earLInst.setMatrixAt(i, dummy.matrix);
                earLInst.setColorAt(i, color);

                dummy.position.set(c.x + sinA * earOffset, groundY + s * 2.25 + skyLift + hop + buriedOffset, c.y - cosA * earOffset);
                dummy.rotation.set(0, Math.PI / 2 - c.angle, -0.35 * wingSpread);
                dummy.scale.set(s * wingSpread, s, s);
                dummy.updateMatrix();
                earRInst.setMatrixAt(i, dummy.matrix);
                earRInst.setColorAt(i, color);

                if (c.isCognitiveLeader && !c.isBurrowed && leaderHalo && leaderIndex < 130) {
                    dummy.position.set(c.x, groundY + 2.2 + skyLift + hop, c.y);
                    dummy.rotation.set(Math.PI / 2, 0, c.walkPhase * 0.06);
                    dummy.scale.set(s / 9, s / 9, s / 9);
                    dummy.updateMatrix();
                    leaderHalo.setMatrixAt(leaderIndex, dummy.matrix);
                    leaderHalo.setColorAt(leaderIndex, color.set(c.lifeStage === 'ELDER' ? '#fbbf24' : '#22d3ee'));
                    leaderIndex++;
                }
            });

            bodyInst.count = creatures.length;
            headInst.count = creatures.length;
            earLInst.count = creatures.length;
            earRInst.count = creatures.length;
            if (leaderHalo) leaderHalo.count = leaderIndex;
            bodyInst.instanceMatrix.needsUpdate = true;
            headInst.instanceMatrix.needsUpdate = true;
            earLInst.instanceMatrix.needsUpdate = true;
            earRInst.instanceMatrix.needsUpdate = true;
            if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
            if (headInst.instanceColor) headInst.instanceColor.needsUpdate = true;
            if (earLInst.instanceColor) earLInst.instanceColor.needsUpdate = true;
            if (earRInst.instanceColor) earRInst.instanceColor.needsUpdate = true;
            if (leaderHalo) {
                leaderHalo.instanceMatrix.needsUpdate = true;
                if (leaderHalo.instanceColor) leaderHalo.instanceColor.needsUpdate = true;
            }

            // Sync 3D Nutrients (Red Apples & Plankton)
            if (threeState.nutrientMesh) {
                nutrients.forEach((n, i) => {
                    const elev = getWorldElevation(n.x, n.y);
                    const gy = terraceHeightY(elev);
                    dummy.position.set(n.x, gy + 3.5, n.y);
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(1, 1, 1);
                    dummy.updateMatrix();
                    threeState.nutrientMesh.setMatrixAt(i, dummy.matrix);
                    threeState.nutrientMesh.setColorAt(i, color.set(n.color));
                });
                threeState.nutrientMesh.count = nutrients.length;
                threeState.nutrientMesh.instanceMatrix.needsUpdate = true;
                if (threeState.nutrientMesh.instanceColor) threeState.nutrientMesh.instanceColor.needsUpdate = true;
            }

            threeState.renderer.render(threeState.scene, threeState.camera);
        }

        // Project 3D World Coordinates onto 2D Overlay Canvas for Thought Bubbles & Project Mode Sector Pins
        function projectWorldToScreen(wx, wy, wz) {
            if (!threeState.initialized || !threeState.camera) {
                return {
                    x: (wx - camera.x) * camera.zoom + simCanvas.width / 2,
                    y: (wz - camera.y) * camera.zoom + simCanvas.height / 2
                };
            }
            const vec = new THREE.Vector3(wx, wy, wz);
            vec.project(threeState.camera);
            return {
                x: (vec.x * 0.5 + 0.5) * simCanvas.width,
                y: (-vec.y * 0.5 + 0.5) * simCanvas.height
            };
        }

        function screenToWorldRay(sx, sy) {
            if (!threeState.initialized || !threeState.camera) {
                return {
                    x: (sx - simCanvas.width / 2) / camera.zoom + camera.x,
                    y: (sy - simCanvas.height / 2) / camera.zoom + camera.y
                };
            }
            const ndcX = (sx / simCanvas.width) * 2 - 1;
            const ndcY = -(sy / simCanvas.height) * 2 + 1;
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), threeState.camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -14);
            const hit = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, hit);
            return hit ? { x: hit.x, y: hit.z } : { x: camera.x, y: camera.y };
        }

        // ==========================================
        // 2D OVERLAY: THOUGHT BUBBLES & SECTOR PINS
        // ==========================================
        function drawThoughtBubble(screenX, screenY, type, isSelected) {
            ctx.save();
            const bw = 34;
            const bh = 24;
            const bx = screenX - bw / 2;
            const by = screenY - 38;

            // Pixel-styled rounded speech bubble (matching Screenshot 1)
            ctx.fillStyle = isSelected ? '#fef08a' : 'rgba(241, 245, 249, 0.94)';
            ctx.strokeStyle = isSelected ? '#f59e0b' : '#0f172a';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 5);
            ctx.fill();
            ctx.stroke();

            // Speech tail
            ctx.beginPath();
            ctx.moveTo(screenX - 4, by + bh);
            ctx.lineTo(screenX, by + bh + 6);
            ctx.lineTo(screenX + 4, by + bh);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Ecological Need Icon inside bubble
            if (type === 'APPLE') {
                // Crisp Red Apple
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(screenX, by + 13, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(screenX - 1, by + 5, 4, 3);
            } else if (type === 'WATER') {
                // Freshwater Droplet
                ctx.fillStyle = '#0ea5e9';
                ctx.beginPath();
                ctx.arc(screenX, by + 14, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'ALERT') {
                // Predator Alert
                ctx.fillStyle = '#e11d48';
                ctx.font = 'bold 13px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('!', screenX, by + 17);
            } else {
                // Social Gathering Beachball / Colony Icon
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(screenX, by + 12, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(screenX, by + 12, 5.5, 0, Math.PI);
                ctx.fill();
            }
            ctx.restore();
        }

        function drawProjectSectorPins() {
            if (!showZoneLabels) return;
            for (const lm of worldLandmarks) {
                const elev = getWorldElevation(lm.x, lm.y);
                const wy = terraceHeightY(elev);
                const pt = projectWorldToScreen(lm.x, wy + 18, lm.y);
                if (pt.x < -120 || pt.x > simCanvas.width + 120 || pt.y < -80 || pt.y > simCanvas.height + 80) continue;

                // Glowing ground ring beacon (inspired by Screenshot 3)
                ctx.save();
                ctx.strokeStyle = lm.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(pt.x, pt.y + 18, 26, 12, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Vertical pin stem
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y + 18);
                ctx.lineTo(pt.x, pt.y - 16);
                ctx.stroke();

                // Floating glass pill label
                const labelW = ctx.measureText(lm.name).width + 26;
                ctx.fillStyle = 'rgba(4, 16, 28, 0.85)';
                ctx.strokeStyle = lm.color;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(pt.x - labelW / 2, pt.y - 38, labelW, 22, 11);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#f8fafc';
                ctx.font = '600 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(lm.name, pt.x, pt.y - 24);
                ctx.restore();
            }
        }

        function renderOverlay2D() {
            ctx.clearRect(0, 0, simCanvas.width, simCanvas.height);

            // 1. Project Mode Real-World Sector Pins
            drawProjectSectorPins();

            for (const camp of cultureState.camps) {
                const cp = projectWorldToScreen(camp.x, terraceHeightY(getWorldElevation(camp.x, camp.y)) + 4, camp.y);
                ctx.save(); ctx.strokeStyle = ['#94a3b8', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'][Math.min(4, camp.stage)]; ctx.globalAlpha = 0.45;
                ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(cp.x, cp.y, 28 + camp.stage * 5, 12 + camp.stage * 2, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
            }

            // 2. Selection Halos & Organism Thought Bubbles
            for (const c of creatures) {
                const elev = getWorldElevation(c.x, c.y);
                const wy = terraceHeightY(elev) + c.genome.size * (c.genome.stageScale || 1) * 2.2 + (c.genome.sphereAffinity === 'ATMOSPHERE' ? 38 : 0);
                const pt = projectWorldToScreen(c.x, wy, c.y);

                const defense = c.genome.defense;
                if (c.isCognitiveLeader || selectedCreature === c || c.escapeBurstTicks > 0 || c.isBurrowed) {
                    ctx.save();
                    if (c.isCognitiveLeader) {
                        ctx.strokeStyle = c.lifeStage === 'ELDER' ? '#fbbf24' : '#22d3ee'; ctx.lineWidth = 1.8;
                        ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 18, 15 + Math.sin(c.walkPhase) * 1.5, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
                        ctx.fillStyle = '#fde68a'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('✦', pt.x, pt.y - 13);
                    }
                    if (selectedCreature === c) {
                        ctx.strokeStyle = defense === 'ARMOUR' ? '#fbbf24' : defense === 'BURROWING' ? '#a16207' : defense === 'GROUP DEFENCE' ? '#34d399' : defense === 'CAMOUFLAGE' ? '#a5f3fc' : '#60a5fa';
                        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 18, 22, 11, 0, 0, Math.PI * 2); ctx.stroke();
                        if (defense === 'ARMOUR') {
                            ctx.beginPath(); ctx.moveTo(pt.x, pt.y - 4); ctx.lineTo(pt.x + 8, pt.y + 2); ctx.lineTo(pt.x + 6, pt.y + 13); ctx.lineTo(pt.x, pt.y + 18); ctx.lineTo(pt.x - 6, pt.y + 13); ctx.lineTo(pt.x - 8, pt.y + 2); ctx.closePath(); ctx.stroke();
                        } else if (defense === 'CAMOUFLAGE') {
                            ctx.setLineDash([2, 3]); ctx.globalAlpha = .45; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 14, 18, 12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                        } else if (defense === 'GROUP DEFENCE') {
                            ctx.globalAlpha = .6; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 18, 31, 17, 0, 0, Math.PI * 2); ctx.stroke();
                        }
                        if (c.escapeBurstTicks > 0) { ctx.globalAlpha = .7; for (let streak = 0; streak < 3; streak++) { ctx.beginPath(); ctx.moveTo(pt.x - c.vx * (5 + streak * 3), pt.y + 8 + streak * 3); ctx.lineTo(pt.x - c.vx * (12 + streak * 4), pt.y + 8 + streak * 3); ctx.stroke(); } }
                        if (c.isBurrowed) { ctx.fillStyle = '#d6b98c'; ctx.globalAlpha = .75; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 22, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); }
                    }
                    if (c.escapeBurstTicks > 0 && selectedCreature !== c) {
                        ctx.strokeStyle = '#60a5fa'; ctx.globalAlpha = .55; ctx.lineWidth = 1.5;
                        for (let streak = 0; streak < 2; streak++) { ctx.beginPath(); ctx.moveTo(pt.x - c.vx * (5 + streak * 4), pt.y + 10 + streak * 4); ctx.lineTo(pt.x - c.vx * (12 + streak * 5), pt.y + 10 + streak * 4); ctx.stroke(); }
                    }
                    ctx.restore();
                }

                if (showThoughtBubbles && (selectedCreature === c || camera.zoom >= 0.85)) {
                    drawThoughtBubble(pt.x, pt.y, c.thoughtIcon, selectedCreature === c);
                }
                if (selectedCreature === c) {
                    ctx.save(); ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e0f2fe'; ctx.shadowColor = '#0891b2'; ctx.shadowBlur = 8;
                    ctx.fillText(`${c.realName} · ${c.genome.id}${c.isCognitiveLeader ? ' · COG' : ''}`, pt.x, pt.y - 48); ctx.restore();
                }
            }

            // 3. Era Atmospheric Tint
            ctx.fillStyle = EARTH_ERAS[currentEraIndex].atmosphereTint;
            ctx.fillRect(0, 0, simCanvas.width, simCanvas.height);
        }

        // ==========================================
        // SIMULATION STEP & HUD UPDATES
        // ==========================================
        function spawnNutrient(x, y) {
            const cx = clampWorldCoordinate(x, 60);
            const cy = clampWorldCoordinate(y, 60);
            const isLand = getTerrainSphereAt(cx, cy) === "LITHOSPHERE";
            nutrients.push({
                x: cx,
                y: cy,
                size: 3.4,
                energy: (isLand ? 46 : 38) * Math.max(0.1, environment.nutrients / 100),
                color: isLand ? "#ef4444" : "#34d399" // Red apples on land, green plankton in sea
            });
        }

        const CULTURAL_AGES = ['Foraging Instincts', 'Stone Age · Tool & Shelter', 'Bronze / Cultivation Age', 'Iron / Architecture Age', 'Bio-Synthetic / Harmonic Era'];
        const CULTURE_THRESHOLDS = [0, 30, 100, 240, 500];
        function localCultureStageAt(x, y) {
            if (cultureState.stage >= 4) return 4;
            let localStage = 0;
            for (const camp of cultureState.camps) {
                if (Math.hypot(camp.x - x, camp.y - y) <= 420) localStage = Math.max(localStage, camp.stage || 1);
            }
            return localStage;
        }

        function updateCollectiveCulture() {
            cultureState.activeLeaders = creatures.reduce((count, c) => count + (c.isCognitiveLeader ? 1 : 0), 0);
            if (simTick % 8 !== 0 || !cultureState.activeLeaders) return;
            for (const leader of creatures) {
                if (!leader.isCognitiveLeader || !['MATURE', 'ELDER'].includes(leader.lifeStage) || leader.energy < 80) continue;
                const peers = creatures.filter(peer => peer !== leader && !SPECIES_CONFIG[peer.species].predator && Math.hypot(peer.x - leader.x, peer.y - leader.y) <= 320);
                if (peers.length < 2) continue;
                const socialIntent = Math.max(0.12, (Number(leader.brain.lastOutputs[2]) + 1) / 2);
                const pooledEnergy = leader.energy + peers.reduce((sum, peer) => sum + peer.energy, 0);
                if (pooledEnergy < 260) continue;
                cultureState.knowledgeXP += Math.min(4, peers.length * 0.32) * socialIntent;
                leader.energy = Math.max(1, leader.energy - 0.035);
                leader.survivalExperience += 0.025;
                for (const peer of peers) {
                    peer.energy = Math.max(1, peer.energy - 0.008);
                    peer.mentorBoost = Math.max(peer.mentorBoost, socialIntent * 0.7);
                }
                if (cultureState.stage >= 1 && !cultureState.camps.some(camp => Math.hypot(camp.x - leader.x, camp.y - leader.y) < 250) && cultureState.camps.length < 7) {
                    cultureState.camps.push({ x: leader.x, y: leader.y, stage: cultureState.stage, members: peers.length + 1 });
                }
            }
            let nextStage = cultureState.stage;
            while (nextStage < 4 && cultureState.knowledgeXP >= CULTURE_THRESHOLDS[nextStage + 1]) nextStage++;
            if (nextStage > cultureState.stage) {
                cultureState.stage = nextStage;
                cultureState.lastMilestone = simTick;
                for (const camp of cultureState.camps) camp.stage = Math.max(camp.stage, nextStage);
                if (cultureState.camps.length < 7) {
                    const leader = creatures.find(c => c.isCognitiveLeader && ['MATURE', 'ELDER'].includes(c.lifeStage));
                    if (leader) cultureState.camps.push({ x: leader.x, y: leader.y, stage: nextStage, members: 3 });
                }
                const milestone = CULTURAL_AGES[nextStage];
                recordLabEvent(`Collective milestone: ${milestone}`, `${cultureState.knowledgeXP.toFixed(1)} knowledge XP · ${cultureState.activeLeaders} cognitive leaders · ${cultureState.camps.length} active camps`);
                showToast(`Shared learning established ${milestone}`);
            }
        }

        function stepSimulation() {
            simTick++;
            const era = EARTH_ERAS[currentEraIndex];

            const autoEraEl = document.getElementById('toggleAutoEra');
            if (autoEraEl && autoEraEl.checked) {
                eraProgress += 0.04;
                if (eraProgress >= 100) setEra((currentEraIndex + 1) % EARTH_ERAS.length, false);
                const bar = document.getElementById('eraProgressBar');
                if (bar) bar.style.width = `${Math.min(100, eraProgress)}%`;
            }

            const cultivationBoost = cultureState.stage >= 2 ? 1.18 : 1;
            if (Math.random() < (params.foodRate / 14) * era.nutrientBoost * (environment.nutrients / 100) * cultivationBoost && nutrients.length < 220) {
                spawnNutrient((Math.random() - 0.5) * 2100, (Math.random() - 0.5) * 2100);
            }

            for (let i = creatures.length - 1; i >= 0; i--) {
                const c = creatures[i];
                c.update();
                if (c.energy <= 0) {
                    recordOutcome(c, 'metabolic');
                    if (selectedCreature === c) deselectCreature();
                    creatures.splice(i, 1);
                    const stats = researchState.speciesStats[c.species];
                    if (stats && !stats.extinctRecorded && !creatures.some(other => other.species === c.species)) {
                        stats.extinctions++;
                        stats.extinctRecorded = true;
                        recordLabEvent(`Local extinction: ${SPECIES_CONFIG[c.species].name}`, `last active organism lost Â· generation ${c.generation} Â· lineage ${c.lineageId}`);
                    }
                }
            }
            for (const [species, stats] of Object.entries(researchState.speciesStats)) {
                if (stats.births > 0 && !stats.extinctRecorded && !creatures.some(c => c.species === species)) {
                    stats.extinctions++;
                    stats.extinctRecorded = true;
                    recordLabEvent(`Local extinction: ${SPECIES_CONFIG[species].name}`, `no active organisms remain Â· tick ${simTick}`);
                }
            }

            if (creatures.length < 12) {
                const sp = era.allowedSpecies[Math.floor(Math.random() * era.allowedSpecies.length)];
                creatures.push(new Organism((Math.random() - 0.5) * 1200, (Math.random() - 0.5) * 1200, sp, maxGeneration));
            }
            const totalPopulation = creatures.reduce((n, c) => n + c.representedPopulation, 0);
            researchState.peakPopulation = Math.max(researchState.peakPopulation, totalPopulation);
            if (totalPopulation < researchState.minPopulation) {
                const previousMinimum = researchState.minPopulation;
                researchState.minPopulation = totalPopulation;
                if (Number.isFinite(previousMinimum) && previousMinimum > 0 && totalPopulation < previousMinimum * 0.9) {
                    recordLabEvent('Population bottleneck', `${formatPopulation(previousMinimum)} â†’ ${formatPopulation(totalPopulation)} represented`);
                }
            }
            updateCollectiveCulture();
        }

        function formatPopulation(val) {
            if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
            if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}M`;
            return val.toLocaleString();
        }

        function updateHUD() {
            const totalPop = creatures.reduce((s, c) => s + c.representedPopulation, 0);
            document.getElementById('hudPop').textContent = formatPopulation(totalPop);
            document.getElementById('hudAgentCount').textContent = creatures.length;
            document.getElementById('hudUniqueGenomes').textContent = spawnedGenomeSignatures.size;
            document.getElementById('chartPopulation').textContent = formatPopulation(totalPop);
            document.getElementById('hudCulture').textContent = CULTURAL_AGES[cultureState.stage] || CULTURAL_AGES[0];
            document.getElementById('hudKnowledge').textContent = `${cultureState.knowledgeXP.toFixed(1)} XP`;
            document.getElementById('hudLeaders').textContent = cultureState.activeLeaders;

            const counts = {};
            const spheres = { ATMOSPHERE: 0, OCEAN: 0, LITHOSPHERE: 0 };
            for (const c of creatures) {
                counts[c.species] = (counts[c.species] || 0) + c.representedPopulation;
                spheres[c.genome.sphereAffinity] = (spheres[c.genome.sphereAffinity] || 0) + 1;
            }
            document.getElementById('hudSpheresCount').textContent = `A:${spheres.ATMOSPHERE} O:${spheres.OCEAN} L:${spheres.LITHOSPHERE}`;

            const rosterEl = document.getElementById('speciesRosterList');
            if (rosterEl && simTick % 12 === 0) {
                rosterEl.innerHTML = Object.entries(SPECIES_CONFIG).map(([key, cfg]) => `
                    <div class="flex items-center justify-between bg-slate-950/65 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0 roster-species-dot roster-species-${key}" style="background-color:${cfg.color}"></span>
                            <div class="min-w-0">
                                <span class="text-slate-100 block truncate">${cfg.commonName} · ${cfg.role}</span>
                                <span class="text-[8px] text-slate-400 block truncate">${cfg.habitat} · ${cfg.ecology}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-teal-300 font-semibold">${formatPopulation(counts[key] || 0)}</span>
                            <button data-spawn-species="${key}" class="px-1.5 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/35 text-teal-200 border border-teal-400/40 text-[9px]">+1</button>
                        </div>
                    </div>
                `).join('');
            }

            if (simTick % 20 === 0) {
                telemetryHistory.push({ ...counts });
                if (telemetryHistory.length > 60) telemetryHistory.shift();
                drawTelemetryChart();
            }

            if (selectedCreature) updateInspectorHUD();
            if (isCryoModalOpen && selectedCreature) renderCryoDetailDashboard();
            updateResearchDashboard();
        }

        function updateInspectorHUD() {
            if (!selectedCreature || !creatures.includes(selectedCreature)) {
                window.deselectCreature();
                return;
            }
            const c = selectedCreature;
            const cfg = SPECIES_CONFIG[c.species];
            document.getElementById('dnaSpeciesTitle').textContent = `${c.realName} · ${c.genome.id}`;
            document.getElementById('dnaSpeciesDot').style.backgroundColor = cfg.color;
            document.getElementById('dnaDietBadge').textContent = `${cfg.commonName} · ${cfg.diet} · ${cfg.habitat}`;
            document.getElementById('dnaIdBadge').textContent = c.genome.id;
            document.getElementById('dnaEcology').textContent = cfg.ecology;
            document.getElementById('dnaGen').textContent = `Gen ${c.generation}`;
            document.getElementById('dnaChildren').textContent = c.offspring;
            document.getElementById('dnaSphereAffinity').textContent = c.genome.sphereAffinity;

            const pct = Math.max(0, Math.min(100, Math.round((c.energy / c.maxEnergy) * 100)));
            document.getElementById('dnaEnergyText').textContent = `${pct}%`;
            document.getElementById('dnaEnergyBar').style.width = `${pct}%`;
            document.getElementById('neuralStateLabel').textContent = c.stateLabel;
            document.getElementById('dnaSpeed').textContent = c.genome.speed.toFixed(2);
            document.getElementById('dnaVision').textContent = `${Math.round(c.genome.vision)} px`;
            document.getElementById('survivalDefense').textContent = c.genome.defense;
            document.getElementById('survivalEscapes').textContent = c.successfulEscapes;
            document.getElementById('dnaLifeStage').textContent = c.lifeStage;
            document.getElementById('dnaAgeMaturation').textContent = `${Math.floor(c.age)} ticks / ${Math.round(c.growthProgress * 100)}%`;
            document.getElementById('dnaMilestone').textContent = c.developmentalMilestone;
            document.getElementById('dnaCognition').textContent = c.isCognitiveLeader ? `COGNITIVE-ANN · Sapient Node · 8→12→6→3 · ${c.survivalExperience.toFixed(1)} XP · social memory ${c.brain.socialMemory.toFixed(2)}` : `Compact ANN · 5→6→2 · ${c.survivalExperience.toFixed(1)} survival XP`;
            document.getElementById('neuralArchitectureLabel').textContent = c.isCognitiveLeader ? 'COGNITIVE-ANN (8 → 12 → 6 → 3)' : 'NEURAL PATHWAYS (5 → 6 → 2)';

            const inputSelect = document.getElementById('labWeightInput');
            if (inputSelect && inputSelect.options.length !== c.brain.inSize) {
                const labels = ['Food angle', 'Food distance', 'Threat', 'Habitat', 'Energy', 'Risk memory', 'Nearby peers', 'Maturation'];
                inputSelect.replaceChildren(...Array.from({ length: c.brain.inSize }, (_, i) => new Option(labels[i] || `Signal ${i + 1}`, i)));
            }
            const hiddenSelect = document.getElementById('labWeightHidden');
            if (hiddenSelect && hiddenSelect.options.length !== c.brain.hidSize) hiddenSelect.replaceChildren(...Array.from({ length: c.brain.hidSize }, (_, i) => new Option(String(i), i)));
            drawNeuralGraph(c.brain);
        }

        function drawNeuralGraph(brain) {
            if (!neuralCtx || !brain) return;
            const w = neuralCanvas.width;
            const h = neuralCanvas.height;
            neuralCtx.clearRect(0, 0, w, h);
            const inputLabels = ['FOOD', 'DIST', 'THREAT', 'HABITAT', 'ENERGY', 'RISK', 'PEERS', 'GROWTH'];
            const outputLabels = brain.cognitive ? ['TURN', 'PACE', 'SOCIAL'] : ['TURN', 'PACE'];
            const layers = brain.cognitive
                ? [{ x: 28, n: 8, color: '#38bdf8' }, { x: 105, n: 12, color: '#2dd4bf' }, { x: 182, n: 6, color: '#818cf8' }, { x: 250, n: 3, color: '#fbbf24' }]
                : [{ x: 35, n: 5, color: '#38bdf8' }, { x: 140, n: 6, color: '#2dd4bf' }, { x: 238, n: 2, color: '#fbbf24' }];
            const ys = layers.map(layer => Array.from({ length: layer.n }, (_, i) => ((i + 1) / (layer.n + 1)) * (h - 12) + 6));
            const matrices = brain.cognitive ? [brain.w1, brain.w2, brain.w3] : [brain.w1, brain.w2];
            matrices.forEach((matrix, layerIndex) => {
                const source = ys[layerIndex], destination = ys[layerIndex + 1];
                matrix.forEach((row, r) => row.forEach((weight, col) => {
                    neuralCtx.strokeStyle = weight >= 0 ? `rgba(45,212,191,${Math.min(.72, Math.abs(weight) * .5)})` : `rgba(244,114,182,${Math.min(.72, Math.abs(weight) * .5)})`;
                    neuralCtx.lineWidth = Math.max(.45, Math.abs(weight) * .9);
                    neuralCtx.beginPath(); neuralCtx.moveTo(layers[layerIndex].x, source[col]); neuralCtx.lineTo(layers[layerIndex + 1].x, destination[r]); neuralCtx.stroke();
                }));
            });
            neuralCtx.font = brain.cognitive ? '6px monospace' : '7px monospace';
            layers.forEach((layer, li) => ys[li].forEach((y, i) => {
                neuralCtx.fillStyle = layer.color; neuralCtx.beginPath(); neuralCtx.arc(layer.x, y, brain.cognitive ? 2.6 : 3.4, 0, Math.PI * 2); neuralCtx.fill();
                if (li === 0 && i < inputLabels.length) { neuralCtx.fillStyle = '#94a3b8'; neuralCtx.textAlign = 'right'; neuralCtx.fillText(inputLabels[i], layer.x - 4, y + 2); }
                if (li === layers.length - 1 && i < outputLabels.length) { neuralCtx.fillStyle = '#e2e8f0'; neuralCtx.textAlign = 'left'; neuralCtx.fillText(outputLabels[i], layer.x + 4, y + 2); }
            }));
        }

        // ==========================================
        // CRYO-BIOINFORMATIC FULL-SCREEN DETAIL VIEW
        // ==========================================
        let isCryoModalOpen = false;
        let cryoMeshRotation = 0.4;
        let cryoMeshPitch = 0.25;
        let isDraggingCryoMesh = false;
        let cryoDragLastX = 0;
        let cryoDragLastY = 0;

        const SPECIES_MOLECULAR_DATA = {
            grazer: { strain: "TARGET_STRAIN_GRZ", protein: "FructoLyase-B", formula: "Câ‚‚â‚„Hâ‚„â‚Nâ‚ƒOâ‚â‚†", weight: "627.59 g/mol", mass: "16.5 kDa" },
            aeroglider: { strain: "TARGET_STRAIN_AER", protein: "NectarKinase-7", formula: "Câ‚â‚‰Hâ‚‚â‚ˆNâ‚„Oâ‚â‚", weight: "488.45 g/mol", mass: "14.2 kDa" },
            swimbot: { strain: "TARGET_STRAIN_AQV", protein: "HydroGill-Alpha", formula: "Câ‚‚â‚Hâ‚ƒâ‚…Nâ‚…Oâ‚‰S", weight: "533.60 g/mol", mass: "18.9 kDa" },
            hunter: { strain: "TARGET_STRAIN_APX", protein: "MyoActin-VX", formula: "Câ‚‚â‚‰Hâ‚„â‚‡Nâ‚‡Oâ‚â‚‚", weight: "685.72 g/mol", mass: "24.4 kDa" },
            lithocrawler: { strain: "TARGET_STRAIN_LTH", protein: "Chitinase-D4", formula: "Câ‚‚â‚‚Hâ‚ƒâ‚ˆNâ‚‚Oâ‚â‚„", weight: "554.54 g/mol", mass: "21.1 kDa" },
            medusa: { strain: "TARGET_STRAIN_MDS", protein: "Luciferin-BioX", formula: "Câ‚‚â‚€Hâ‚‚â‚‡Nâ‚ƒOâ‚‰Sâ‚‚", weight: "517.57 g/mol", mass: "15.8 kDa" }
        };

        function openCryoDetailModal(c) {
            selectedCreature = c;
            isCryoModalOpen = true;
            document.getElementById('inspectorCard').classList.remove('hidden');
            document.getElementById('cryoDetailModal').classList.remove('hidden');
            updateInspectorHUD();
            renderCryoDetailDashboard();
        }

        window.closeCryoDetailModal = () => {
            isCryoModalOpen = false;
            document.getElementById('cryoDetailModal').classList.add('hidden');
        };

        window.cycleSelectedCreature = (dir) => {
            if (!creatures.length) return;
            const idx = selectedCreature ? creatures.indexOf(selectedCreature) : 0;
            const nextIdx = (idx + dir + creatures.length) % creatures.length;
            openCryoDetailModal(creatures[nextIdx]);
        };

        window.toggleFollowFromCryo = () => {
            followSelected = true;
            document.getElementById('textFollowBot').textContent = 'Camera Follow: ON';
            window.closeCryoDetailModal();
            showToast(`Following ${selectedCreature.realName} · ${selectedCreature.genome.id}`);
        };

        window.boostSelectedOrganism = () => {
            if (!selectedCreature) return;
            selectedCreature.energy = Math.min(selectedCreature.maxEnergy, selectedCreature.energy + 65);
            selectedCreature.hydration = 100;
            showToast(`Synthesized Metabolic ATP Boost for ${selectedCreature.genome.id}`);
            renderCryoDetailDashboard();
        };

        function renderCryoDetailDashboard() {
            const c = selectedCreature;
            if (!c || !creatures.includes(c)) {
                window.closeCryoDetailModal();
                return;
            }
            const cfg = SPECIES_CONFIG[c.species];
            const mol = SPECIES_MOLECULAR_DATA[c.species] || SPECIES_MOLECULAR_DATA.grazer;
            document.getElementById('cryoArchitectName').textContent = `${c.realName} · ${c.genome.id}`;
            document.getElementById('cryoArchitectSub').textContent = c.isCognitiveLeader ? `COGNITIVE-ANN / SAPIENT NODE · MEMORY ${c.brain.workingMemory.map(value => value.toFixed(2)).join(' / ')} · SOCIAL ${c.brain.socialMemory.toFixed(2)}` : `${cfg.scientificName} · Individual neural organism`;

            // Left Resolution & Strain Readouts
            const resolution = Math.round(c.genome.vision);
            document.getElementById('cryoStrainCode').textContent = `${mol.strain} Â· ${c.genome.id}`;
            document.getElementById('cryoSpecimenName').textContent = `${cfg.commonName} · ${cfg.role}`;
            document.getElementById('cryoResolutionValue').textContent = `${resolution} Ã…`;
            document.getElementById('cryoResBadge').textContent = `ULTRA-HIGH RES â€¢ GEN ${c.generation}`;
            document.getElementById('cryoSphereTag').textContent = c.genome.sphereAffinity;
            document.getElementById('cryoBehaviorText').textContent = `${c.stateLabel} · ${c.genome.defense}${c.isBurrowed ? ' · HIDDEN' : ''}`;
            document.getElementById('cryoEcologyDesc').textContent = `${cfg.ecology} Life stage: ${c.lifeStage}; age ${Math.floor(c.age)} ticks, ${Math.round(c.growthProgress * 100)}% maturation. Milestone: ${c.developmentalMilestone}. ${c.isCognitiveLeader ? 'Sapient Node; peer mentor.' : 'Compact organism ANN.'}`;
            document.getElementById('cryoCoordsBadge').textContent = `X: ${Math.round(c.x)} Â· Y: ${Math.round(c.y)} Â· HYDRATION: ${Math.round(c.hydration)}%`;

            // Right Interaction Map Metrics
            const nearby = creatures.filter(o => o !== c && Math.hypot(o.x - c.x, o.y - c.y) <= c.genome.vision);
            const nearestPredator = nearby.filter(o => SPECIES_CONFIG[o.species].predator).reduce((best, o) => Math.min(best, Math.hypot(o.x - c.x, o.y - c.y)), Infinity);
            const activeNodes = c.brain.lastHidden.filter(value => Math.abs(value) >= 0.25).length;
            document.getElementById('cryoBindingEnergy').textContent = Number.isFinite(nearestPredator) ? Math.round(nearestPredator) : 'CLEAR';
            document.getElementById('cryoInterfaceArea').textContent = nearby.length;
            document.getElementById('cryoActiveNodes').textContent = `${activeNodes} / ${c.brain.lastHidden.length} active final-layer neurons`;
            document.getElementById('cryoResolutionValue').textContent = `${resolution} px`;
            document.getElementById('cryoStrainCode').textContent = `${c.genome.id} · ${c.lineageId}`;
            document.getElementById('cryoSpecimenName').textContent = `${c.realName} · ${cfg.commonName} · ${cfg.role}`;
            document.getElementById('cryoStrainCode').textContent = `${c.realName} · ${c.genome.id} · ${c.lineageId}`;
            document.getElementById('cryoArchitectName').textContent = `${c.realName} · ${c.genome.id}`;
            document.getElementById('cryoResBadge').textContent = `${c.lifeStage} · ${Math.round(c.growthProgress * 100)}% MATURE · GEN ${c.generation}`;
            document.getElementById('cryoResBadge').textContent = `VISION RANGE · GEN ${c.generation}`;

            // Bottom Cards Telemetry
            const vitalityPct = Math.max(5, Math.min(100, Math.round((c.energy / c.maxEnergy) * 100)));
            const allWeights = [...c.brain.w1.flat(), ...c.brain.w2.flat(), ...(c.brain.w3 || []).flat()];
            const meanAbsWeight = allWeights.reduce((sum, value) => sum + Math.abs(value), 0) / Math.max(1, allWeights.length);
            const foldPct = Math.min(100, Math.round(meanAbsWeight / 2 * 100));
            const synPct = Math.round(activeNodes / Math.max(1, c.brain.lastHidden.length) * 100);
            const ecoPct = Math.round(c.hydration);
            document.getElementById('pipeFoldPct').textContent = `${foldPct}%`;
            document.getElementById('pipeFoldBar').style.width = `${foldPct}%`;
            document.getElementById('pipeSynPct').textContent = `${synPct}%`;
            document.getElementById('pipeSynBar').style.width = `${synPct}%`;
            document.getElementById('pipeEcoPct').textContent = `${ecoPct}%`;
            document.getElementById('pipeEcoBar').style.width = `${ecoPct}%`;
            document.getElementById('pipeMetPct').textContent = `${vitalityPct}%`;
            document.getElementById('pipeMetBar').style.width = `${vitalityPct}%`;

            document.getElementById('cryoUniProt').textContent = `${c.genome.id} Â· ${cfg.sphere}`;
            document.getElementById('cryoProteinTitle').textContent = `${cfg.name} · ANN policy`;
            document.getElementById('cryoPatternTag').textContent = c.genome.pattern;
            document.getElementById('cryoMass').textContent = c.lineageId;
            document.getElementById('cryoSpeedVal').textContent = `${c.genome.speed.toFixed(2)} m/s`;
            document.getElementById('cryoVisionVal').textContent = `${Math.round(c.genome.vision)} px`;
            document.getElementById('cryoEscapesVal').textContent = c.successfulEscapes;

            document.getElementById('cryoFormula').textContent = c.isCognitiveLeader ? '8 → 12 → 6 → 3' : '5 → 6 → 2';
            document.getElementById('cryoMolWeight').textContent = `Mean |weight| ${meanAbsWeight.toFixed(2)}`;
            document.getElementById('cryoDefenseVal').textContent = c.genome.defense;

            const kdVal = vitalityPct;
            document.getElementById('cryoKdValue').textContent = kdVal;
            const badge = document.getElementById('cryoVitalityBadge');
            if (vitalityPct >= 60) {
                badge.textContent = "EXCELLENT";
                badge.className = "px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold";
            } else if (vitalityPct >= 30) {
                badge.textContent = "STABLE";
                badge.className = "px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold";
            } else {
                badge.textContent = "CRITICAL";
                badge.className = "px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-mono font-bold";
            }

            drawCryoBioLattice(c);
            drawCryoInteractionGraph(c, nearby);
            drawCryoProteinRibbon(c);
            drawCryoChemicalStructure(c);
            drawCryoTraitProfile(c);
            drawCryoWeightMatrix(c);
            drawCryoAffinityCurve(c);
        }

        // Center 3D Wireframe Bio-Lattice & Glowing Cytoplasmic Core (Inspired by Screenshot 2)
        function drawCryoBioLattice(c) {
            const canvas = document.getElementById('cryoMeshCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            g.clearRect(0, 0, w, h);

            if (!isDraggingCryoMesh) cryoMeshRotation += 0.008;

            const cx = w * 0.5;
            const cy = h * 0.5;
            const baseHue = c.genome.hue;
            const accentHue = c.genome.accentHue;

            // Ambient radial bio-luminescent aura
            const aura = g.createRadialGradient(cx, cy, 18, cx, cy, 210);
            aura.addColorStop(0, `hsla(${baseHue}, 95%, 62%, 0.34)`);
            aura.addColorStop(0.55, `hsla(${accentHue}, 90%, 48%, 0.14)`);
            aura.addColorStop(1, 'rgba(2, 10, 20, 0)');
            g.fillStyle = aura;
            g.fillRect(0, 0, w, h);

            // Floating molecular dust bokeh
            for (let i = 0; i < 34; i++) {
                const px = ((i * 137 + Math.round(cryoMeshRotation * 40)) % w);
                const py = ((i * 89 + i * 17) % h);
                g.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(52, 211, 153, 0.32)';
                g.beginPath();
                g.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
                g.fill();
            }

            // Build 3D peanut/capsid bio-lattice vertices
            const rings = 9;
            const segs = 12;
            const pts = [];
            const cosY = Math.cos(cryoMeshRotation);
            const sinY = Math.sin(cryoMeshRotation);
            const cosX = Math.cos(cryoMeshPitch);
            const sinX = Math.sin(cryoMeshPitch);

            for (let r = 0; r < rings; r++) {
                const u = (r / (rings - 1)) * 2 - 1; // -1 to 1 along major axis
                // Pinched capsid waist profile like the reference image
                const waist = 1.0 - 0.26 * Math.exp(-u * u * 6.5);
                const env = Math.sqrt(Math.max(0.04, 1 - u * u * 0.92)) * waist;
                const x3 = u * 185;

                for (let s = 0; s < segs; s++) {
                    const theta = (s / segs) * Math.PI * 2 + r * 0.28;
                    const jitter = 1 + 0.08 * Math.sin(theta * 3 + r * 2 + c.genome.appendages);
                    const rad = 108 * env * jitter;
                    const y3 = Math.cos(theta) * rad;
                    const z3 = Math.sin(theta) * rad;

                    // Rotate Y then X
                    const rx = x3 * cosY - z3 * sinY;
                    const rz1 = x3 * sinY + z3 * cosY;
                    const ry = y3 * cosX - rz1 * sinX;
                    const rz = y3 * sinX + rz1 * cosX;

                    const scale = 520 / (520 + rz);
                    pts.push({
                        x: cx + rx * scale,
                        y: cy + ry * scale,
                        z: rz,
                        r,
                        s
                    });
                }
            }

            // Inner glowing neural/cytoplasmic ribbons
            g.save();
            g.lineWidth = 2.2;
            for (let strand = 0; strand < 6; strand++) {
                g.strokeStyle = strand % 2 === 0 ? 'rgba(52, 211, 153, 0.55)' : 'rgba(56, 189, 248, 0.65)';
                g.beginPath();
                for (let t = 0; t <= 40; t++) {
                    const u = (t / 40) * 2 - 1;
                    const ang = u * 4.5 + strand * 1.05 + cryoMeshRotation * 1.6;
                    const rad = 58 * (1 - u * u * 0.75);
                    const x3 = u * 145;
                    const y3 = Math.cos(ang) * rad;
                    const z3 = Math.sin(ang) * rad;
                    const rx = x3 * cosY - z3 * sinY;
                    const rz1 = x3 * sinY + z3 * cosY;
                    const ry = y3 * cosX - rz1 * sinX;
                    const sx = cx + rx;
                    const sy = cy + ry;
                    if (t === 0) g.moveTo(sx, sy);
                    else g.lineTo(sx, sy);
                }
                g.stroke();
            }
            g.restore();

            // Outer triangulated lattice struts & glowing nodes
            for (let r = 0; r < rings; r++) {
                for (let s = 0; s < segs; s++) {
                    const idx = r * segs + s;
                    const nextS = r * segs + ((s + 1) % segs);
                    const p1 = pts[idx];
                    const p2 = pts[nextS];
                    const depthAlpha = p1.z < 0 ? 0.85 : 0.32;

                    g.strokeStyle = `rgba(56, 189, 248, ${depthAlpha})`;
                    g.lineWidth = p1.z < 0 ? 2.1 : 1.0;
                    g.beginPath();
                    g.moveTo(p1.x, p1.y);
                    g.lineTo(p2.x, p2.y);
                    g.stroke();

                    if (r < rings - 1) {
                        const pDown = pts[(r + 1) * segs + s];
                        const pDiag = pts[(r + 1) * segs + ((s + 1) % segs)];
                        g.beginPath();
                        g.moveTo(p1.x, p1.y);
                        g.lineTo(pDown.x, pDown.y);
                        g.lineTo(pDiag.x, pDiag.y);
                        g.stroke();
                    }
                }
            }

            // Vertex Nodes
            for (const p of pts) {
                const front = p.z < 10;
                g.fillStyle = front ? '#67e8f9' : 'rgba(56, 189, 248, 0.35)';
                g.beginPath();
                g.arc(p.x, p.y, front ? 3.2 : 1.8, 0, Math.PI * 2);
                g.fill();
            }
        }

        function drawCryoInteractionGraph(c, nearby) {
            const canvas = document.getElementById('cryoInteractionCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            g.clearRect(0, 0, w, h);

            const cx = w * 0.5;
            const cy = h * 0.5;

            // Build web of surrounding ecological & synaptic nodes
            const nodes = [];
            for (let i = 0; i < 16; i++) {
                const ang = (i / 16) * Math.PI * 2 + 0.3;
                const dist = 34 + (i % 3) * 26;
                const type = i % 5 === 0 ? 'predator' : (i % 2 === 0 ? 'symbiosis' : 'nutrient');
                nodes.push({
                    x: cx + Math.cos(ang) * dist,
                    y: cy + Math.sin(ang) * dist,
                    type,
                    r: 3.5 + (i % 3) * 1.4
                });
            }

            // Web edges
            g.strokeStyle = 'rgba(103, 232, 249, 0.22)';
            g.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 52) {
                        g.beginPath();
                        g.moveTo(nodes[i].x, nodes[i].y);
                        g.lineTo(nodes[j].x, nodes[j].y);
                        g.stroke();
                    }
                }
                g.beginPath();
                g.moveTo(cx, cy);
                g.lineTo(nodes[i].x, nodes[i].y);
                g.stroke();
            }

            // Colored nodes
            for (const n of nodes) {
                g.fillStyle = n.type === 'predator' ? '#fb7185' : (n.type === 'symbiosis' ? '#34d399' : '#38bdf8');
                g.beginPath();
                g.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                g.fill();
            }

            // Center focal node
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(cx, cy, 5.5, 0, Math.PI * 2);
            g.fill();
        }

        function drawCryoProteinRibbon(c) {
            const canvas = document.getElementById('cryoProteinCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            g.clearRect(0, 0, w, h);

            g.lineWidth = 3;
            for (let fold = 0; fold < 4; fold++) {
                g.strokeStyle = fold % 2 === 0 ? '#3b82f6' : '#38bdf8';
                g.beginPath();
                for (let i = 0; i <= 32; i++) {
                    const t = i / 32;
                    const x = 18 + t * (w - 36);
                    const y = h * 0.5 + Math.sin(t * 9 + fold * 1.4 + c.genome.hue * 0.05) * 24 + Math.cos(t * 5 - fold) * 10;
                    if (i === 0) g.moveTo(x, y);
                    else g.lineTo(x, y);
                }
                g.stroke();
            }
        }

        function drawCryoChemicalStructure(c) {
            const canvas = document.getElementById('cryoChemicalCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            g.clearRect(0, 0, w, h);

            g.strokeStyle = 'rgba(148, 163, 184, 0.78)';
            g.lineWidth = 1.5;
            g.font = '9px monospace';
            g.fillStyle = '#67e8f9';

            const rings = [
                { cx: 74, cy: 62, r: 22 },
                { cx: 126, cy: 52, r: 22 },
                { cx: 178, cy: 66, r: 22 },
                { cx: 226, cy: 48, r: 20 }
            ];

            rings.forEach((ring, idx) => {
                g.beginPath();
                for (let k = 0; k <= 6; k++) {
                    const a = (k / 6) * Math.PI * 2 + idx * 0.25;
                    const px = ring.cx + Math.cos(a) * ring.r;
                    const py = ring.cy + Math.sin(a) * ring.r;
                    if (k === 0) g.moveTo(px, py);
                    else g.lineTo(px, py);
                }
                g.stroke();
                g.fillText(idx % 2 === 0 ? 'OH' : 'NH', ring.cx - 8, ring.cy - ring.r - 4);
            });
        }

        function drawCryoTraitProfile(c) {
            const canvas = document.getElementById('cryoProteinCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
            g.clearRect(0, 0, w, h); g.fillStyle = '#061421'; g.fillRect(0, 0, w, h);
            const traits = [['speed', c.genome.speed, 4.2], ['vision', c.genome.vision, 250], ['size', c.genome.size, 13.5], ['appendages', c.genome.appendages, 6]];
            traits.forEach(([name, value, max], i) => {
                const y = 18 + i * 23;
                g.fillStyle = '#94a3b8'; g.font = '9px monospace'; g.fillText(name.toUpperCase(), 4, y);
                g.fillStyle = 'rgba(30,41,59,.95)'; g.fillRect(66, y - 9, 78, 7);
                g.fillStyle = '#2dd4bf'; g.fillRect(66, y - 9, 78 * Math.max(0, Math.min(1, value / max)), 7);
                g.fillStyle = '#e2e8f0'; g.fillText(Number(value).toFixed(name === 'vision' || name === 'appendages' ? 0 : 1), 148, y);
            });
        }

        function drawCryoWeightMatrix(c) {
            const canvas = document.getElementById('cryoChemicalCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
            g.clearRect(0, 0, w, h); g.fillStyle = '#061421'; g.fillRect(0, 0, w, h);
            const drawGrid = (matrix, x, y, cellW, cellH, title) => {
                g.fillStyle = '#94a3b8'; g.font = '9px monospace'; g.fillText(title, x, y - 4);
                matrix.forEach((row, r) => row.forEach((weight, col) => {
                    const alpha = Math.min(.95, .2 + Math.abs(weight) * .45);
                    g.fillStyle = weight >= 0 ? `rgba(45,212,191,${alpha})` : `rgba(251,113,133,${alpha})`;
                    g.fillRect(x + col * (cellW + 2), y + 3 + r * (cellH + 2), cellW, cellH);
                }));
            };
            if (c.isCognitiveLeader) {
                drawGrid(c.brain.w1, 5, 16, 5, 6, 'w1 · 8 inputs');
                drawGrid(c.brain.w2, 105, 16, 5, 6, 'w2 · 12 to 6');
                drawGrid(c.brain.w3, 210, 22, 6, 14, 'w3 · 6 to 3');
                g.fillStyle = '#2dd4bf'; g.fillText('+ excitatory', 8, h - 6);
                g.fillStyle = '#fb7185'; g.fillText('− inhibitory', 100, h - 6);
                return;
            }
            drawGrid(c.brain.w1, 8, 16, 12, 13, 'w1 · inputs → hidden');
            drawGrid(c.brain.w2, 194, 38, 12, 20, 'w2 · hidden → outputs');
            g.fillStyle = '#2dd4bf'; g.fillText('+ excitatory', 8, h - 6);
            g.fillStyle = '#fb7185'; g.fillText('− inhibitory', 100, h - 6);
        }

        function drawCryoAffinityCurve(c) {
            const canvas = document.getElementById('cryoAffinityCanvas');
            if (!canvas) return;
            const g = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            g.clearRect(0, 0, w, h);

            // Grid lines
            g.strokeStyle = 'rgba(148, 163, 184, 0.14)';
            g.lineWidth = 1;
            for (let y = 20; y < h; y += 26) {
                g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke();
            }

            const hist = c.vitalityHistory && c.vitalityHistory.length > 1 ? c.vitalityHistory : [c.energy / Math.max(1, c.maxEnergy)];
            g.strokeStyle = '#34d399';
            g.lineWidth = 2.4;
            g.beginPath();
            hist.forEach((val, i) => {
                const x = 14 + (i / (hist.length - 1)) * (w - 28);
                const y = h - 16 - val * (h - 32);
                if (i === 0) g.moveTo(x, y);
                else g.lineTo(x, y);
            });
            g.stroke();

            // Glowing end dot
            const lastX = w - 14;
            const lastY = h - 16 - hist[hist.length - 1] * (h - 32);
            g.fillStyle = '#67e8f9';
            g.beginPath();
            g.arc(lastX, lastY, 4, 0, Math.PI * 2);
            g.fill();
        }

        // Interactive rotation on the 3D Cryo-EM Bio-Lattice canvas
        const cryoMeshEl = document.getElementById('cryoMeshCanvas');
        if (cryoMeshEl) {
            cryoMeshEl.addEventListener('pointerdown', (e) => {
                isDraggingCryoMesh = true;
                cryoDragLastX = e.clientX;
                cryoDragLastY = e.clientY;
            });
            window.addEventListener('pointermove', (e) => {
                if (!isDraggingCryoMesh) return;
                cryoMeshRotation += (e.clientX - cryoDragLastX) * 0.012;
                cryoMeshPitch = Math.max(-1.1, Math.min(1.1, cryoMeshPitch + (e.clientY - cryoDragLastY) * 0.01));
                cryoDragLastX = e.clientX;
                cryoDragLastY = e.clientY;
                if (selectedCreature) drawCryoBioLattice(selectedCreature);
            });
            window.addEventListener('pointerup', () => {
                isDraggingCryoMesh = false;
            });
        }

        function drawTelemetryChart() {
            if (telemetryHistory.length < 2) return;
            const w = chartCanvas.width;
            const h = chartCanvas.height;
            chartCtx.clearRect(0, 0, w, h);

            let maxVal = 10_000_000;
            for (const snap of telemetryHistory) {
                for (const k of Object.keys(SPECIES_CONFIG)) {
                    if ((snap[k] || 0) > maxVal) maxVal = snap[k];
                }
            }

            Object.entries(SPECIES_CONFIG).forEach(([key, cfg]) => {
                chartCtx.strokeStyle = cfg.color;
                chartCtx.lineWidth = 2.2;
                chartCtx.beginPath();
                telemetryHistory.forEach((snap, idx) => {
                    const x = (idx / (telemetryHistory.length - 1)) * w;
                    const y = h - ((snap[key] || 0) / maxVal) * (h - 18) - 9;
                    if (idx === 0) chartCtx.moveTo(x, y);
                    else chartCtx.lineTo(x, y);
                });
                chartCtx.stroke();
            });
        }

        // ==========================================
        // INTERACTIVE CONTROLS & GLOBAL EXPORTS
        // ==========================================
        function showToast(msg) {
            const t = document.getElementById('simToast');
            if (!t) return;
            t.textContent = msg;
            t.style.opacity = '1';
            clearTimeout(t._timer);
            t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2800);
        }

        window.toggleViewMode = () => {
            is3DView = !is3DView;
            document.getElementById('hudViewMode').textContent = is3DView ? '3D ISOMETRIC' : '2D TOP-DOWN';
            showToast(is3DView ? '3D Isometric Terraced Island View' : '2D Top-Down Bioinformatic Map');
        };

        window.toggleZoneLabels = () => {
            showZoneLabels = !showZoneLabels;
            showToast(showZoneLabels ? 'Ecosystem Sector Pins Visible' : 'Ecosystem Sector Pins Hidden');
        };

        window.resetCamera = () => {
            camera.x = 0;
            camera.y = 0;
            camera.zoom = 1.0;
            document.getElementById('hudZoom').textContent = '100%';
            showToast('Camera Centered on Terraced Island');
        };

        window.toggleDrawer = (id) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden');
        };

        window.setClickMode = (mode) => {
            clickMode = mode;
            ['inspect', 'food', 'spawn', 'toxin'].forEach(m => {
                const btn = document.getElementById('tool' + m.charAt(0).toUpperCase() + m.slice(1));
                if (!btn) return;
                btn.className = m === mode
                    ? "px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0 bg-teal-500/25 text-teal-200 border border-teal-400/40"
                    : "px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 shrink-0";
            });
        };

        window.togglePause = () => {
            isPaused = !isPaused;
            document.getElementById('textPlayPause').textContent = isPaused ? 'Resume' : 'Pause';
        };

        window.setSpeedMultiplier = (mult) => {
            speedMultiplier = mult;
            [1, 2, 5].forEach(m => {
                const btn = document.getElementById(`spd${m}`);
                if (btn) btn.className = m === mult ? "px-2.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 font-semibold transition" : "px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition";
            });
        };

        window.setEra = (idx, manual = false) => {
            currentEraIndex = idx % EARTH_ERAS.length;
            eraProgress = 0;
            const era = EARTH_ERAS[currentEraIndex];
            document.getElementById('eraYearBadge').textContent = era.years;
            document.getElementById('eraTitleBadge').textContent = era.name;
            document.getElementById('eraSubtitle').textContent = era.subtitle;
            document.getElementById('historicalEventLabel').textContent = `Trigger: ${era.eventName}`;
            for (let i = 0; i < 7; i++) {
                const btn = document.getElementById(`eraBtn${i}`);
                if (btn) btn.className = i === currentEraIndex
                    ? "py-1 px-1 rounded-lg border text-center transition truncate bg-teal-500/25 border-teal-400/50 text-teal-200 font-semibold"
                    : "py-1 px-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white text-center transition truncate";
            }
            Object.assign(environment, ERA_ENVIRONMENT[currentEraIndex]);
            syncLabEnvironmentControls();
            rebuildTerracedWorld();
            recordLabEvent(`Era transition: ${era.name}`, `T ${environment.temperature}Â°C Â· Oâ‚‚ ${environment.oxygen}% Â· nutrients ${environment.nutrients}%`);
            if (manual) showToast(`Switched to ${era.name}`);
        };

        window.triggerHistoricalEvent = () => {
            const era = EARTH_ERAS[currentEraIndex];
            const profile = ERA_ENVIRONMENT[currentEraIndex];
            Object.assign(environment, profile);
            if (currentEraIndex === 5) {
                environment.toxin = Math.min(100, environment.toxin + 18);
                nutrients.splice(0, Math.floor(nutrients.length * 0.45));
                creatures.forEach(c => { c.energy = Math.max(15, c.energy - 18); });
            } else if (currentEraIndex === 0) {
                creatures.forEach(c => { c.energy = Math.max(15, c.energy - 8); });
            }
            syncLabEnvironmentControls();
            const nutrientPulse = currentEraIndex === 5 ? 6 : (currentEraIndex === 0 ? 12 : 30);
            for (let i = 0; i < nutrientPulse; i++) {
                spawnNutrient((Math.random() - 0.5) * 1600, (Math.random() - 0.5) * 1600);
            }
            if (environment.predatorPressure > 145 && !creatures.some(c => c.species === 'hunter')) {
                const hunter = new Organism(0, 0, 'hunter', maxGeneration);
                creatures.push(hunter);
            }
            recordLabEvent(`Historical event: ${era.eventName}`, `T ${environment.temperature}Â°C Â· Oâ‚‚ ${environment.oxygen}% Â· toxin ${environment.toxin}% Â· food pulse ${nutrientPulse}`);
            showToast(`${era.eventName}: Environmental stress profile applied`);
        };

        window.updateSliders = () => {
            const f = document.getElementById('sliderFoodRate');
            const m = document.getElementById('sliderMutation');
            const b = document.getElementById('sliderBurnRate');
            params.foodRate = Number(f.value);
            params.mutationRate = Number(m.value) / 100;
            params.burnRate = Number(b.value) / 10;
            document.getElementById('valMutation').textContent = `${m.value}%`;
            document.getElementById('valBurnRate').textContent = `${params.burnRate.toFixed(1)}x`;
        };

        function syncLabEnvironmentControls() {
            const mapping = [
                ['labTemperature', 'temperature', 'labTempValue', ' Â°C'],
                ['labOxygen', 'oxygen', 'labOxygenValue', '%'],
                ['labNutrients', 'nutrients', 'labNutrientValue', '%'],
                ['labToxin', 'toxin', 'labToxinValue', '%'],
                ['labPredator', 'predatorPressure', 'labPredatorValue', '%']
            ];
            for (const [inputId, key, outputId, suffix] of mapping) {
                const input = document.getElementById(inputId), output = document.getElementById(outputId);
                if (input) input.value = environment[key];
                if (output) output.textContent = `${Math.round(environment[key])}${suffix}`;
            }
        }

        function updateLabSliderReadouts() {
            const entries = [
                ['labTemperature', 'labTempValue', ' Â°C'], ['labOxygen', 'labOxygenValue', '%'],
                ['labNutrients', 'labNutrientValue', '%'], ['labToxin', 'labToxinValue', '%'],
                ['labPredator', 'labPredatorValue', '%']
            ];
            for (const [inputId, outputId, suffix] of entries) {
                const input = document.getElementById(inputId), output = document.getElementById(outputId);
                if (input && output) output.textContent = `${input.value}${suffix}`;
            }
        }

        function populationSummary() {
            const bySpecies = {}, lineages = new Set();
            const traitSums = {};
            let represented = 0, energy = 0, generation = 0;
            for (const key of Object.keys(SPECIES_CONFIG)) { bySpecies[key] = 0; traitSums[key] = { n: 0, speed: 0, vision: 0, energy: 0, generation: 0 }; }
            for (const c of creatures) {
                represented += c.representedPopulation || 0;
                energy += c.energy / Math.max(1, c.maxEnergy);
                generation += c.generation || 1;
                bySpecies[c.species] = (bySpecies[c.species] || 0) + (c.representedPopulation || 0);
                const t = traitSums[c.species];
                if (t) { t.n++; t.speed += c.genome.speed; t.vision += c.genome.vision; t.energy += c.energy / Math.max(1, c.maxEnergy); t.generation += c.generation || 1; }
                if (c.lineageId) lineages.add(c.lineageId);
            }
            const speciesTraits = Object.fromEntries(Object.entries(traitSums).map(([key, t]) => [key, { speed: t.n ? t.speed / t.n : 0, vision: t.n ? t.vision / t.n : 0, energy: t.n ? t.energy / t.n : 0, generation: t.n ? t.generation / t.n : 0 }]));
            return { represented, agents: creatures.length, bySpecies, speciesTraits, lineages: lineages.size, avgEnergy: creatures.length ? energy / creatures.length : 0, avgGeneration: creatures.length ? generation / creatures.length : 0 };
        }

        function updateResearchDashboard() {
            const fitness = document.getElementById('labFitness');
            if (fitness) {
                const live = populationSummary();
                const rows = Object.entries(SPECIES_CONFIG).map(([key, cfg]) => {
                    const s = researchState.speciesStats[key];
                    const active = creatures.filter(c => c.species === key);
                    const lineages = new Set(active.map(c => c.lineageId).filter(Boolean)).size;
                    const survival = s.births ? Math.max(0, 100 * (1 - s.deaths / s.births)).toFixed(0) : 'â€”';
                    const avgSpeed = active.length ? active.reduce((n, c) => n + c.genome.speed, 0) / active.length : 0;
                    const avgVision = active.length ? active.reduce((n, c) => n + c.genome.vision, 0) / active.length : 0;
                    const deadSpeed = s.deaths ? s.deadSpeed / s.deaths : 0;
                    const deadVision = s.deaths ? s.deadVision / s.deaths : 0;
                    const deadBrain = s.deaths ? s.deadBrainMagnitude / s.deaths : 0;
                    const liveBrain = active.length ? active.reduce((sum, c) => sum + [...c.brain.w1.flat(), ...c.brain.w2.flat()].reduce((n, w) => n + Math.abs(w), 0) / (c.brain.w1.flat().length + c.brain.w2.flat().length), 0) / active.length : 0;
                    return `${cfg.name}: ${formatPopulation(live.bySpecies[key] || 0)} alive Â· ${survival}% survival Â· ${s.reproduction} reproductions Â· ${s.escapes} escapes Â· ${s.predationDeaths} predator deaths Â· ${s.extinctions} extinctions Â· ${lineages} lineages\n  food ${Math.round(s.foodEnergy)} / metabolic cost ${Math.round(s.energySpent)} Â· speed surviving/lost ${avgSpeed.toFixed(2)}/${deadSpeed.toFixed(2)} Â· vision ${avgVision.toFixed(0)}/${deadVision.toFixed(0)} Â· ANN |w| ${liveBrain.toFixed(2)}/${deadBrain.toFixed(2)}`;
                });
                fitness.textContent = `Live population ${formatPopulation(live.represented)} Â· peak ${formatPopulation(researchState.peakPopulation)} Â· ${live.agents} simulated agents Â· ${live.lineages} active lineages Â· mean generation ${live.avgGeneration.toFixed(1)}\n` + rows.join('\n');
            }
            const brainReadout = document.getElementById('labBrainReadout');
            if (brainReadout) {
                const c = selectedCreature;
                if (!c || !creatures.includes(c)) brainReadout.textContent = 'Select an organism to inspect current sensory signals and outputs.';
                else {
                    const labels = ['food angle', 'food proximity', 'threat signal', 'habitat match', 'energy reserve', 'risk memory', 'nearby peers', 'maturation'];
                    const inputs = c.brain.lastInputs.map((v, i) => `${labels[i]} ${Number(v || 0).toFixed(2)}`).join(' Â· ');
                    brainReadout.textContent = `${c.realName} · ${c.genome.id} · ${c.isCognitiveLeader ? 'COGNITIVE-ANN' : 'COMPACT ANN'} · ${c.stateLabel}\nInputs: ${inputs}\nWorking memory: ${c.brain.workingMemory.map(v => v.toFixed(2)).join('  ')} · social memory ${c.brain.socialMemory.toFixed(2)}\nHidden activations: ${c.isCognitiveLeader ? `${c.brain.lastHiddenPrimary.map(v => Number(v || 0).toFixed(2)).join('  ')} | ` : ''}${c.brain.lastHidden.map(v => Number(v || 0).toFixed(2)).join('  ')}\nOutputs: turn ${Number(c.brain.lastOutputs[0] || 0).toFixed(2)} · pace ${Number(c.brain.lastOutputs[1] || 0).toFixed(2)} · social/craft ${c.isCognitiveLeader ? Number(c.brain.lastOutputs[2] || 0).toFixed(2) : 'n/a'} · lifetime updates ${c.brain.learningUpdates || 0}`;
                }
            }
            renderResearchLog();
        }

        function captureSnapshot() {
            return JSON.parse(JSON.stringify({
                version: 1, simTick, worldSeed, currentEraIndex, eraProgress, maxGeneration, lineageSerial, organismSerial, genomeSerial,
                params, environment, lifetimePlasticityEnabled, camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
                cultureState,
                selectedIndex: selectedCreature ? creatures.indexOf(selectedCreature) : -1,
                creatures: creatures.map(c => ({ ...c, genome: { ...c.genome }, brain: { cognitive: c.brain.cognitive, workingMemory: c.brain.workingMemory, socialMemory: c.brain.socialMemory, w1: c.brain.w1, b1: c.brain.b1, w2: c.brain.w2, b2: c.brain.b2, w3: c.brain.w3, b3: c.brain.b3, lastInputs: c.brain.lastInputs, lastHidden: c.brain.lastHidden, lastHiddenPrimary: c.brain.lastHiddenPrimary, lastOutputs: c.brain.lastOutputs, learningUpdates: c.brain.learningUpdates || 0 } })),
                nutrients, springs, clouds, shockwaves, telemetryHistory,
                speciesStats: researchState.speciesStats,
                minPopulation: researchState.minPopulation,
                peakPopulation: researchState.peakPopulation,
                maxRecordedGeneration: researchState.maxGeneration,
                spawnedGenomeSignatures: [...spawnedGenomeSignatures]
            }));
        }

        function restoreSnapshot(snapshot) {
            if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.creatures) || snapshot.creatures.length > 500) throw new Error('Unsupported or invalid simulation checkpoint.');
            simTick = snapshot.simTick || 0; worldSeed = snapshot.worldSeed || 2026.88; genomeSerial = snapshot.genomeSerial || 0;
            currentEraIndex = Math.max(0, Math.min(EARTH_ERAS.length - 1, snapshot.currentEraIndex || 0));
            eraProgress = snapshot.eraProgress || 0; maxGeneration = snapshot.maxGeneration || 1; lineageSerial = snapshot.lineageSerial || 0; organismSerial = snapshot.organismSerial || 0;
            Object.assign(params, snapshot.params || {});
            params.foodRate = clampFinite(params.foodRate, 1, 10, 6);
            params.mutationRate = clampFinite(params.mutationRate, 0, 0.8, 0.3);
            params.burnRate = clampFinite(params.burnRate, 0.5, 2.5, 1);
            Object.assign(environment, snapshot.environment || {});
            environment.temperature = clampFinite(environment.temperature, 0, 50, 22);
            environment.oxygen = clampFinite(environment.oxygen, 0, 30, 21);
            environment.nutrients = clampFinite(environment.nutrients, 10, 200, 100);
            environment.toxin = clampFinite(environment.toxin, 0, 100, 0);
            environment.predatorPressure = clampFinite(environment.predatorPressure, 0, 200, 100);
            lifetimePlasticityEnabled = !!snapshot.lifetimePlasticityEnabled;
            if (snapshot.cultureState) Object.assign(cultureState, snapshot.cultureState, { camps: Array.isArray(snapshot.cultureState.camps) ? snapshot.cultureState.camps : [] });
            else Object.assign(cultureState, { stage: 0, knowledgeXP: 0, activeLeaders: 0, camps: [], lastMilestone: 0 });
            const plasticityToggle = document.getElementById('labPlasticity');
            if (plasticityToggle) plasticityToggle.checked = lifetimePlasticityEnabled;
            const era = EARTH_ERAS[currentEraIndex];
            document.getElementById('eraYearBadge').textContent = era.years;
            document.getElementById('eraTitleBadge').textContent = era.name;
            document.getElementById('eraSubtitle').textContent = era.subtitle;
            document.getElementById('historicalEventLabel').textContent = `Trigger: ${era.eventName}`;
            const foodSlider = document.getElementById('sliderFoodRate'), mutationSlider = document.getElementById('sliderMutation'), burnSlider = document.getElementById('sliderBurnRate');
            if (foodSlider) foodSlider.value = params.foodRate;
            if (mutationSlider) mutationSlider.value = params.mutationRate * 100;
            if (burnSlider) burnSlider.value = params.burnRate * 10;
            camera.x = snapshot.camera?.x || 0; camera.y = snapshot.camera?.y || 0; camera.zoom = snapshot.camera?.zoom || 1;
            creatures = snapshot.creatures.map(saved => {
                const org = Object.create(Organism.prototype);
                Object.assign(org, saved);
                if (!org.agentId) org.agentId = `AGENT-${++organismSerial}`;
                const cfg = SPECIES_CONFIG[saved.species] || SPECIES_CONFIG.grazer;
                org.isCognitiveLeader = Boolean(saved.isCognitiveLeader || saved.brain?.cognitive);
                org.realName = saved.realName || `${cfg.names[organismSerial % cfg.names.length]} the ${cfg.commonName}`;
                org.name = org.realName;
                org.age = Number.isFinite(saved.age) ? saved.age : 0;
                org.lifeStage = saved.lifeStage || (org.age >= 2200 ? 'ELDER' : org.age >= 720 ? 'MATURE' : org.age >= 240 ? 'ADOLESCENT' : 'JUVENILE');
                org.growthProgress = Number.isFinite(saved.growthProgress) ? saved.growthProgress : Math.min(1, org.age / 240);
                org.developmentalMilestone = saved.developmentalMilestone || 'Restored from a saved simulation state';
                org.survivalExperience = Number(saved.survivalExperience) || 0;
                org.defenseCooldown = Number(saved.defenseCooldown) || 0;
                org.burrowTicks = Number(saved.burrowTicks) || 0;
                org.isBurrowed = Boolean(saved.isBurrowed && org.burrowTicks > 0);
                org.genome = { ...saved.genome };
                org.genome.habitatAffinity = org.genome.habitatAffinity || cfg.habitat;
                org.genome.stageScale = Number(saved.genome?.stageScale) || 1;
                org.brain = new NeuralBrain(saved.brain || null, org.isCognitiveLeader);
                org.brain.lastInputs = saved.brain?.lastInputs || Array(org.brain.inSize).fill(0);
                org.brain.lastHidden = saved.brain?.lastHidden || Array(6).fill(0);
                org.brain.lastHiddenPrimary = saved.brain?.lastHiddenPrimary || [];
                org.brain.lastOutputs = saved.brain?.lastOutputs || Array(org.brain.outSize).fill(0);
                org.brain.learningUpdates = saved.brain?.learningUpdates || 0;
                return org;
            });
            organismSerial = Math.max(organismSerial, creatures.length);
            genomeSerial = Math.max(genomeSerial, creatures.length);
            nutrients = Array.isArray(snapshot.nutrients) ? snapshot.nutrients.slice(0, 500) : [];
            springs = Array.isArray(snapshot.springs) ? snapshot.springs.slice(0, 100) : [];
            clouds = Array.isArray(snapshot.clouds) ? snapshot.clouds.slice(0, 200) : [];
            shockwaves = Array.isArray(snapshot.shockwaves) ? snapshot.shockwaves.slice(0, 100) : [];
            telemetryHistory.length = 0; telemetryHistory.push(...(snapshot.telemetryHistory || []));
            const savedStats = snapshot.speciesStats || {};
            researchState.speciesStats = Object.fromEntries(Object.keys(SPECIES_CONFIG).map(key => [key, { ...createSpeciesStats(), ...(savedStats[key] || {}) }]));
            researchState.minPopulation = snapshot.minPopulation ?? Infinity;
            researchState.peakPopulation = snapshot.peakPopulation || 0;
            researchState.maxGeneration = snapshot.maxRecordedGeneration || maxGeneration;
            spawnedGenomeSignatures.clear(); for (const signature of snapshot.spawnedGenomeSignatures || []) spawnedGenomeSignatures.add(signature);
            selectedCreature = snapshot.selectedIndex >= 0 ? creatures[snapshot.selectedIndex] || null : null;
            const inspector = document.getElementById('inspectorCard');
            if (inspector) inspector.classList.toggle('hidden', !selectedCreature);
            syncLabEnvironmentControls(); rebuildTerracedWorld(); updateHUD(); updateResearchDashboard();
        }

        function clampFinite(value, min, max, fallback) {
            const number = Number(value);
            return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
        }

        function applyLabScenario() {
            environment.temperature = Number(document.getElementById('labTemperature').value);
            environment.oxygen = Number(document.getElementById('labOxygen').value);
            environment.nutrients = Number(document.getElementById('labNutrients').value);
            environment.toxin = Number(document.getElementById('labToxin').value);
            environment.predatorPressure = Number(document.getElementById('labPredator').value);
            lifetimePlasticityEnabled = document.getElementById('labPlasticity').checked;
            if (environment.predatorPressure >= 150 && !creatures.some(c => c.species === 'hunter')) creatures.push(new Organism(0, 0, 'hunter', maxGeneration));
            recordLabEvent('Scenario applied', `T ${environment.temperature}Â°C Â· Oâ‚‚ ${environment.oxygen}% Â· nutrients ${environment.nutrients}% Â· toxins ${environment.toxin}% Â· predator pressure ${environment.predatorPressure}% Â· plasticity ${lifetimePlasticityEnabled ? 'on' : 'off'}`);
            document.getElementById('labStatus').textContent = `Applied at simulation tick ${simTick}. Changes now affect metabolism, food, and predation.`;
            syncLabEnvironmentControls(); updateResearchDashboard();
        }

        function compareCheckpoint() {
            if (!researchState.checkpoint) { document.getElementById('labComparison').textContent = 'Save a checkpoint before recording a comparison.'; return; }
            const before = researchState.checkpoint.summary, after = populationSummary();
            const lines = [`Checkpoint T${researchState.checkpoint.snapshot.simTick} â†’ current T${simTick}`, `Population: ${formatPopulation(before.represented)} â†’ ${formatPopulation(after.represented)} (${formatPopulation(after.represented - before.represented)})`, `Agents: ${before.agents} â†’ ${after.agents} Â· active lineages ${before.lineages} â†’ ${after.lineages}`, `Mean energy: ${(before.avgEnergy * 100).toFixed(0)}% â†’ ${(after.avgEnergy * 100).toFixed(0)}% Â· mean generation ${before.avgGeneration.toFixed(1)} â†’ ${after.avgGeneration.toFixed(1)}`];
            for (const key of Object.keys(SPECIES_CONFIG)) {
                const a = before.speciesTraits[key] || {}, b = after.speciesTraits[key] || {};
                lines.push(`${SPECIES_CONFIG[key].name}: ${formatPopulation(before.bySpecies[key] || 0)} â†’ ${formatPopulation(after.bySpecies[key] || 0)} Â· mean speed ${Number(a.speed || 0).toFixed(2)} â†’ ${Number(b.speed || 0).toFixed(2)} Â· vision ${Number(a.vision || 0).toFixed(0)} â†’ ${Number(b.vision || 0).toFixed(0)}`);
            }
            document.getElementById('labComparison').textContent = lines.join('\n');
            recordLabEvent('Checkpoint comparison', `population ${formatPopulation(before.represented)} â†’ ${formatPopulation(after.represented)}; active lineages ${before.lineages} â†’ ${after.lineages}`);
        }

        function saveCheckpoint() {
            const snapshot = captureSnapshot();
            researchState.checkpoint = { snapshot, summary: populationSummary() };
            document.getElementById('labStatus').textContent = `Checkpoint saved at T${simTick} with ${creatures.length} organisms and neural weights.`;
            recordLabEvent('Checkpoint saved', `${creatures.length} organisms Â· ${populationSummary().lineages} lineages Â· ANN weights captured`);
        }

        async function runBurnSensitivitySweep() {
            if (sensitivitySweepRunning) return;
            const base = captureSnapshot();
            sensitivitySweepRunning = true;
            const originalPaused = isPaused;
            const originalRandom = Math.random;
            const factors = [0.65, 0.85, 1, 1.2, 1.5];
            const duration = 300;
            const results = [];
            const baselineSummary = populationSummary();
            const thresholdMet = result => result.extinct.length === 0 && result.avgEnergy >= 0.2 && result.survival >= 60;
            isPaused = true;
            document.getElementById('labStatus').textContent = `Running paired burn-rate branches (${duration} ticks each)â€¦`;
            const runBranch = async factor => {
                Math.random = createSeededRandom(Math.floor(Math.abs(base.worldSeed * 1000)) + 941);
                restoreSnapshot(base);
                isPaused = true;
                params.burnRate = base.params.burnRate * factor;
                const curve = [populationSummary().represented];
                for (let t = 0; t < duration; t++) {
                    stepSimulation();
                    if (t % 10 === 9) curve.push(populationSummary().represented);
                    if (t % 20 === 19) await new Promise(resolve => setTimeout(resolve, 0));
                }
                const result = populationSummary();
                const births = Object.values(researchState.speciesStats).reduce((n, s) => n + s.births, 0);
                const deaths = Object.values(researchState.speciesStats).reduce((n, s) => n + s.deaths, 0);
                const baselineIds = new Set(base.creatures.map(c => c.agentId));
                const cohortAlive = creatures.filter(c => baselineIds.has(c.agentId)).length;
                return { factor, ...result, curve, survival: baselineIds.size ? 100 * cohortAlive / baselineIds.size : (births ? Math.max(0, 100 * (1 - deaths / births)) : 100), extinct: Object.keys(result.bySpecies).filter(key => baselineSummary.bySpecies[key] > 0 && result.bySpecies[key] === 0) };
            };
            let sweepError = null;
            try {
                for (const factor of factors) results.push(await runBranch(factor));
                results.sort((a, b) => a.factor - b.factor);
                let lower = null, upper = null;
                for (let i = 1; i < results.length; i++) {
                    if (thresholdMet(results[i - 1]) && !thresholdMet(results[i])) { lower = results[i - 1].factor; upper = results[i].factor; break; }
                }
                if (lower !== null) {
                    for (let precision = 0; precision < 3; precision++) {
                        const midpoint = (lower + upper) / 2;
                        const branch = await runBranch(midpoint);
                        results.push(branch);
                        if (thresholdMet(branch)) lower = midpoint; else upper = midpoint;
                    }
                }
            } catch (error) {
                sweepError = error;
            } finally {
                Math.random = originalRandom;
                restoreSnapshot(base);
                isPaused = originalPaused;
                sensitivitySweepRunning = false;
            }
            if (sweepError) {
                document.getElementById('labStatus').textContent = `Sensitivity sweep stopped safely: ${sweepError.message}. Original checkpoint restored.`;
                return;
            }
            results.sort((a, b) => a.factor - b.factor);
            researchState.sweepResults = results;
            drawSweepCurves(results);
            document.getElementById('labComparison').textContent = results.map(r =>
                `${r.factor.toFixed(2)}Ã— burn Â· ${formatPopulation(r.represented)} population Â· ${r.agents} agents Â· ${r.survival.toFixed(0)}% survival Â· avg energy ${(r.avgEnergy * 100).toFixed(0)}%${r.extinct.length ? ` Â· absent: ${r.extinct.join(', ')}` : ''}`
            ).join('\n');
            const bracket = results.find(r => !thresholdMet(r));
            const stableBelow = bracket ? results.filter(r => r.factor < bracket.factor && thresholdMet(r)).at(-1) : null;
            const tippingText = bracket && stableBelow ? `Observed tipping interval: ${stableBelow.factor.toFixed(3)}Ã—â€“${bracket.factor.toFixed(3)}Ã— burn.` : 'No stability boundary crossed within the tested burn-rate range.';
            document.getElementById('labComparison').textContent += `\n${tippingText} Stability criterion: no local extinctions, â‰¥60% cohort survival, and â‰¥20% mean energy.`;
            document.getElementById('labStatus').textContent = `Sweep complete: ${results.length} paired branches restored from one checkpoint (${duration} ticks each). ${tippingText}`;
            recordLabEvent('Sensitivity sweep', `${results.length} paired burn-rate branches Ã— ${duration} ticks; ${tippingText}`);
            updateResearchDashboard();
        }

        function createSeededRandom(seed) {
            let state = seed >>> 0;
            return () => {
                state += 0x6D2B79F5;
                let t = state;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        function drawSweepCurves(results) {
            const canvas = document.getElementById('labSweepCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#061421'; ctx.fillRect(0, 0, w, h);
            ctx.font = '10px monospace'; ctx.fillStyle = '#94a3b8'; ctx.fillText('POPULATION Â· % OF SHARED BRANCH START', 12, 16);
            const gridLabels = ['150%', '100%', '50%', '0%'];
            for (let row = 0; row < 4; row++) {
                const y = 34 + row * ((h - 62) / 3);
                ctx.strokeStyle = 'rgba(148,163,184,.12)'; ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(w - 10, y); ctx.stroke();
                ctx.fillStyle = '#64748b'; ctx.fillText(gridLabels[row], 5, y + 3);
            }
            if (!results.length) { ctx.fillStyle = '#64748b'; ctx.fillText('Run a sensitivity sweep to compare branch population trajectories.', 12, h - 14); return; }
            const colors = ['#38bdf8', '#2dd4bf', '#a3e635', '#fbbf24', '#fb7185'];
            const basePopulation = Math.max(1, results[0].curve?.[0] || 1);
            results.forEach((result, index) => {
                const curve = result.curve || [];
                if (curve.length < 2) return;
                ctx.strokeStyle = colors[index % colors.length]; ctx.lineWidth = 2; ctx.beginPath();
                curve.forEach((value, i) => {
                    const x = 40 + i / (curve.length - 1) * (w - 52);
                    const y = h - 28 - (Math.min(1.5, value / basePopulation) / 1.5) * (h - 62);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.fillStyle = colors[index % colors.length]; ctx.fillText(`${result.factor.toFixed(2)}Ã—`, 42 + index * 62, h - 8);
            });
        }

        function exportResearchJSON() {
            recordLabEvent('Experiment exported', 'Current organisms, inherited ANN weights, environment, and checkpoint saved as JSON');
            const payload = { application: 'Digital Life Research Lab', version: 1, exportedAt: new Date().toISOString(), snapshot: captureSnapshot(), checkpoint: researchState.checkpoint, events: researchState.eventLog, sweepResults: researchState.sweepResults };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = `digital-life-lab-tick-${simTick}.json`; link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function importResearchJSON(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const payload = JSON.parse(String(reader.result));
                    const snapshot = payload.snapshot || payload;
                    restoreSnapshot(snapshot);
                    researchState.checkpoint = payload.checkpoint || researchState.checkpoint;
                    researchState.eventLog = Array.isArray(payload.events) ? payload.events.slice(0, 40) : researchState.eventLog;
                    researchState.sweepResults = Array.isArray(payload.sweepResults) ? payload.sweepResults : [];
                    drawSweepCurves(researchState.sweepResults);
                    recordLabEvent('Experiment imported', `${creatures.length} organisms and saved neural weights restored`);
                    document.getElementById('labStatus').textContent = `Imported ${file.name} at T${simTick}.`;
                    updateResearchDashboard();
                } catch (error) {
                    document.getElementById('labStatus').textContent = `Import failed: ${error.message}`;
                }
            };
            reader.readAsText(file);
        }

        function perturbSelectedBrainWeight() {
            if (!selectedCreature) { document.getElementById('labStatus').textContent = 'Select an organism before perturbing its neural weights.'; return; }
            const input = Number(document.getElementById('labWeightInput').value);
            const hidden = Number(document.getElementById('labWeightHidden').value);
            const delta = Math.max(-0.5, Math.min(0.5, Number(document.getElementById('labWeightDelta').value) || 0));
            selectedCreature.brain.w1[hidden][input] = Math.max(-2, Math.min(2, selectedCreature.brain.w1[hidden][input] + delta));
            drawNeuralGraph(selectedCreature.brain);
            recordLabEvent('ANN weight perturbed', `${selectedCreature.genome.id} Â· input ${input} â†’ hidden ${hidden} Â· Î” ${delta.toFixed(2)}`);
            document.getElementById('labStatus').textContent = `Changed ${selectedCreature.genome.id} w1[${hidden}][${input}] by ${delta.toFixed(2)}. This organism's behavior can now diverge.`;
            updateResearchDashboard();
        }

        function addResearchNote() {
            const input = document.getElementById('labNoteText');
            const note = input.value.trim();
            if (!note) { document.getElementById('labStatus').textContent = 'Write a short hypothesis or observation first.'; return; }
            recordLabEvent('Lab note', note);
            input.value = '';
            document.getElementById('labStatus').textContent = 'Lab note saved with the current population and trait snapshot.';
        }

        function selectCreature(c) {
            selectedCreature = c;
            document.getElementById('inspectorCard').classList.remove('hidden');
            updateInspectorHUD();
            showToast(`Inspected ${c.realName} · ${c.genome.id}${c.isCognitiveLeader ? ' · Cognitive Leader' : ''}`);
        }

        window.deselectCreature = () => {
            selectedCreature = null;
            followSelected = false;
            document.getElementById('inspectorCard').classList.add('hidden');
            document.getElementById('textFollowBot').textContent = 'Camera Follow: OFF';
        };

        window.toggleFollowBot = () => {
            followSelected = !followSelected;
            document.getElementById('textFollowBot').textContent = followSelected ? 'Camera Follow: ON' : 'Camera Follow: OFF';
            if (followSelected && selectedCreature) showToast(`Following ${selectedCreature.realName} · ${selectedCreature.genome.id}`);
        };

        function populateSpeciesSelect() {
            const select = document.getElementById('spawnSpeciesSelect');
            if (!select) return;
            select.replaceChildren(new Option('Biome-matched species', 'random'), new Option('COGNITIVE-ANN Leader (Sapient Node)', 'cognitiveLeader'));
            for (const [key, cfg] of Object.entries(SPECIES_CONFIG)) select.add(new Option(`${cfg.commonName} — ${cfg.role}`, key));
        }

        function chooseSpeciesForPoint(x, y) {
            const sphere = getTerrainSphereAt(x, y);
            const candidates = Object.entries(SPECIES_CONFIG).filter(([, cfg]) => cfg.sphere === sphere || cfg.sphere === 'ATMOSPHERE');
            return candidates[Math.floor(Math.random() * candidates.length)]?.[0] || 'grazer';
        }

        window.spawnSingleSpecies = (key) => {
            const forceLeader = key === 'cognitiveLeader';
            const x = camera.x + (Math.random() - 0.5) * 600, y = camera.y + (Math.random() - 0.5) * 600;
            const speciesKey = forceLeader ? chooseSpeciesForPoint(x, y) : key === 'random' ? chooseSpeciesForPoint(x, y) : key;
            if (!SPECIES_CONFIG[speciesKey]) return;
            const org = new Organism(x, y, speciesKey, 1, null, null, forceLeader || null);
            creatures.push(org);
            showToast(`Introduced ${org.realName} · ${org.genome.id}${org.isCognitiveLeader ? ' · Sapient Node' : ''}`);
        };

        window.resetSimulation = () => {
            worldSeed = Math.random() * 5000;
            spawnedGenomeSignatures.clear();
            genomeSerial = 0;
            lastIndividualNameBySpecies = {};
            lineageSerial = 0;
            organismSerial = 0;
            creatures = [];
            nutrients = [];
            springs = [{ x: 40, y: 120, radius: 135 }];
            telemetryHistory.length = 0;
            maxGeneration = 1;
            cultureState.stage = 0; cultureState.knowledgeXP = 0; cultureState.activeLeaders = 0; cultureState.camps = []; cultureState.lastMilestone = 0;
            researchState.checkpoint = null;
            researchState.eventLog.length = 0;
            researchState.sweepResults = [];
            drawSweepCurves([]);
            researchState.minPopulation = Infinity;
            researchState.maxGeneration = 1;
            for (const key of Object.keys(researchState.speciesStats)) Object.assign(researchState.speciesStats[key], { births: 0, deaths: 0, predationDeaths: 0, metabolicDeaths: 0, extinctions: 0, extinctRecorded: false, deadSpeed: 0, deadVision: 0, deadBrainMagnitude: 0, foodEnergy: 0, energySpent: 0, escapes: 0, reproduction: 0 });
            Object.assign(environment, ERA_ENVIRONMENT[currentEraIndex]);
            researchState.peakPopulation = 0;
            lifetimePlasticityEnabled = false;
            const plasticityToggle = document.getElementById('labPlasticity');
            if (plasticityToggle) plasticityToggle.checked = false;
            window.deselectCreature();

            // Spawn balanced real-world island cohorts (heavy emphasis on Meadow Foragers & Pollinators on land + Reef Swimmers in water)
            const initialMix = Object.keys(SPECIES_CONFIG);
            for (let i = 0; i < 36; i++) {
                const sp = initialMix[i % initialMix.length];
                const isAquatic = SPECIES_CONFIG[sp].sphere === 'OCEAN';
                const island = BIOSPHERE_ISLANDS[i % BIOSPHERE_ISLANDS.length];
                const angle = Math.random() * Math.PI * 2;
                const radius = isAquatic ? island.radius * (1.12 + Math.random() * 0.32) : island.radius * Math.sqrt(Math.random()) * 0.72;
                creatures.push(new Organism(island.x + Math.cos(angle) * radius, island.y + Math.sin(angle) * radius, sp, 1));
            }

            const cohort = Math.floor(STARTING_POPULATION / creatures.length);
            creatures.forEach(c => { c.representedPopulation = cohort; });
            creatures[0].representedPopulation += STARTING_POPULATION - cohort * creatures.length;

            for (let i = 0; i < 95; i++) {
                spawnNutrient((Math.random() - 0.5) * 1800, (Math.random() - 0.5) * 1800);
            }

            researchState.minPopulation = creatures.reduce((n, c) => n + c.representedPopulation, 0);
            syncLabEnvironmentControls();
            recordLabEvent('New replicate started', `${creatures.length} organisms Â· ${formatPopulation(researchState.minPopulation)} represented Â· ${EARTH_ERAS[currentEraIndex].name}`);

            rebuildTerracedWorld();
            window.resetCamera();
            updateHUD();
            showToast('Generated new biosphere · 20 species · seven islands · collective knowledge reset');
        };

        // Pointer Pan, Zoom & Click Inspection
        function resizeCanvases() {
            simCanvas.width = window.innerWidth;
            simCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvases);

        const activeWorldPointers = new Map();
        let lastPinchDistance = 0;
        let pinchGestureActive = false;

        simCanvas.addEventListener('pointerdown', (e) => {
            activeWorldPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (activeWorldPointers.size > 1) {
                pinchGestureActive = true;
                camera.isDragging = false;
                camera.hasMoved = true;
                const pts = [...activeWorldPointers.values()];
                lastPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                return;
            }
            camera.isDragging = true;
            camera.hasMoved = false;
            camera.dragStartX = e.clientX;
            camera.dragStartY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            if (activeWorldPointers.has(e.pointerId)) activeWorldPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (activeWorldPointers.size > 1) {
                const pts = [...activeWorldPointers.values()];
                const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                if (lastPinchDistance > 0 && Math.abs(distance - lastPinchDistance) > 1) {
                    camera.zoom = Math.max(0.45, Math.min(2.4, camera.zoom * distance / lastPinchDistance));
                    document.getElementById('hudZoom').textContent = `${Math.round(camera.zoom * 100)}%`;
                }
                lastPinchDistance = distance;
                camera.hasMoved = true;
                return;
            }
            if (!camera.isDragging) return;
            const dx = e.clientX - camera.dragStartX;
            const dy = e.clientY - camera.dragStartY;
            if (Math.hypot(dx, dy) > 4) camera.hasMoved = true;

            if (is3DView) {
                // Isometric screen-to-world pan alignment
                camera.x -= (dx + dy) * 0.65 / camera.zoom;
                camera.y -= (dy - dx) * 0.65 / camera.zoom;
            } else {
                camera.x -= dx / camera.zoom;
                camera.y -= dy / camera.zoom;
            }
            clampCameraToWorld();
            camera.dragStartX = e.clientX;
            camera.dragStartY = e.clientY;
        });

        window.addEventListener('pointerup', (e) => {
            activeWorldPointers.delete(e.pointerId);
            if (pinchGestureActive) {
                if (activeWorldPointers.size) {
                    const remaining = [...activeWorldPointers.values()][0];
                    camera.dragStartX = remaining.x; camera.dragStartY = remaining.y; camera.isDragging = true;
                    lastPinchDistance = 0;
                    return;
                }
                pinchGestureActive = false; lastPinchDistance = 0; camera.isDragging = false;
                return;
            }
            if (sensitivitySweepRunning) { camera.isDragging = false; return; }
            if (!camera.isDragging) return;
            camera.isDragging = false;
            if (!camera.hasMoved) {
                const worldPt = screenToWorldRay(e.clientX, e.clientY);
                if (clickMode === 'inspect') {
                    let closest = null;
                    let bestDist = 42;
                    for (const c of creatures) {
                        const elev = getWorldElevation(c.x, c.y);
                        const pt = projectWorldToScreen(c.x, terraceHeightY(elev) + 12, c.y);
                        const d = Math.hypot(pt.x - e.clientX, pt.y - e.clientY);
                        if (d < bestDist) {
                            bestDist = d;
                            closest = c;
                        }
                    }
                    if (closest) {
                        selectCreature(closest);
                        openCryoDetailModal(closest);
                    } else {
                        window.deselectCreature();
                    }
                } else if (clickMode === 'food') {
                    for (let i = 0; i < 8; i++) {
                        spawnNutrient(worldPt.x + (Math.random() - 0.5) * 50, worldPt.y + (Math.random() - 0.5) * 50);
                    }
                    showToast('Dropped Fresh Apples & Nutrients');
                } else if (clickMode === 'spawn') {
                    const sel = document.getElementById('spawnSpeciesSelect').value;
                    const forceLeader = sel === 'cognitiveLeader';
                    const key = forceLeader ? 'grazer' : sel === 'random' ? chooseSpeciesForPoint(worldPt.x, worldPt.y) : sel;
                    const org = new Organism(worldPt.x, worldPt.y, key, 1, null, null, forceLeader || null);
                    creatures.push(org);
                    selectCreature(org);
                    showToast(`Spawned ${org.realName} · ${org.genome.id}${org.isCognitiveLeader ? ' · Sapient Node' : ''}`);
                } else if (clickMode === 'toxin') {
                    springs.push({ x: clampWorldCoordinate(worldPt.x, 80), y: clampWorldCoordinate(worldPt.y, 80), radius: 110 });
                    showToast('Added Freshwater Thermal Spring');
                }
            }
        });
        window.addEventListener('pointercancel', (e) => {
            activeWorldPointers.delete(e.pointerId);
            if (activeWorldPointers.size < 2) { pinchGestureActive = false; lastPinchDistance = 0; }
            if (!activeWorldPointers.size) camera.isDragging = false;
        });

        simCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 0.89;
            camera.zoom = Math.max(0.45, Math.min(2.4, camera.zoom * factor));
            document.getElementById('hudZoom').textContent = `${Math.round(camera.zoom * 100)}%`;
        }, { passive: false });

        // UI actions live in this module; HTML carries only data attributes.
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action], [data-era], [data-mode], [data-speed], [data-spawn-species]');
            if (!target) return;
            if (sensitivitySweepRunning) return;
            if (target.dataset.era !== undefined) return window.setEra(Number(target.dataset.era), true);
            if (target.dataset.mode) return window.setClickMode(target.dataset.mode);
            if (target.dataset.speed) return window.setSpeedMultiplier(Number(target.dataset.speed));
            if (target.dataset.spawnSpecies) return window.spawnSingleSpecies(target.dataset.spawnSpecies);
            switch (target.dataset.action) {
                case 'research': document.getElementById('researchCard').classList.toggle('hidden'); break;
                case 'normalize':
                    Object.assign(environment, ERA_ENVIRONMENT[currentEraIndex]);
                    lifetimePlasticityEnabled = false;
                    document.getElementById('labPlasticity').checked = false;
                    syncLabEnvironmentControls();
                    recordLabEvent('Environment normalized', `restored ${EARTH_ERAS[currentEraIndex].name} baseline`);
                    document.getElementById('labStatus').textContent = 'Environmental values restored to the selected era profile.';
                    break;
                case 'apply-scenario': applyLabScenario(); break;
                case 'checkpoint': saveCheckpoint(); break;
                case 'restore':
                    if (researchState.checkpoint) {
                        restoreSnapshot(researchState.checkpoint.snapshot);
                        document.getElementById('labStatus').textContent = `Restored checkpoint at T${simTick}; current branch state was replaced.`;
                        recordLabEvent('Checkpoint restored', `Returned to T${simTick} with stored population and brain weights`);
                    } else document.getElementById('labStatus').textContent = 'No checkpoint is saved in this session.';
                    break;
                case 'compare': compareCheckpoint(); break;
                case 'sweep': runBurnSensitivitySweep(); break;
                case 'weight-perturb': perturbSelectedBrainWeight(); break;
                case 'log-note': addResearchNote(); break;
                case 'export': exportResearchJSON(); break;
                case 'import': document.getElementById('labImportFile').click(); break;
                case 'view': window.toggleViewMode(); break;
                case 'zones': window.toggleZoneLabels(); break;
                case 'camera': window.resetCamera(); break;
                case 'charts': window.toggleDrawer('telemetryCard'); window.toggleDrawer('biodiversityCard'); break;
                case 'params': window.toggleDrawer('paramsCard'); break;
                case 'deselect': window.deselectCreature(); break;
                case 'follow': window.toggleFollowBot(); break;
                case 'reset': window.resetSimulation(); break;
                case 'event': window.triggerHistoricalEvent(); break;
                case 'cryo-prev': window.cycleSelectedCreature(-1); break;
                case 'cryo-next': window.cycleSelectedCreature(1); break;
                case 'cryo-follow': window.toggleFollowFromCryo(); break;
                case 'cryo-close': window.closeCryoDetailModal(); break;
                case 'cryo-boost': window.boostSelectedOrganism(); break;
                case 'pause': window.togglePause(); break;
            }
        });
        document.addEventListener('input', (event) => {
            if (sensitivitySweepRunning) return;
            if (event.target.matches('[data-input-action="sliders"]')) window.updateSliders();
            if (event.target.dataset.labEnv) updateLabSliderReadouts();
        });
        document.addEventListener('change', (event) => {
            if (sensitivitySweepRunning) return;
            const target = event.target;
            if (target.dataset.toggle === 'thought-bubbles') showThoughtBubbles = target.checked;
            if (target.dataset.toggle === 'atmosphere-clouds') showAtmosphereClouds = target.checked;
            if (target.dataset.modeOnChange) window.setClickMode(target.dataset.modeOnChange);
            if (target.id === 'labPlasticity') lifetimePlasticityEnabled = target.checked;
            if (target.id === 'labImportFile') importResearchJSON(target.files && target.files[0]);
        });

        function mainLoop() {
            if (!isPaused) {
                for (let s = 0; s < speedMultiplier; s++) stepSimulation();
            }
            if (followSelected && selectedCreature && creatures.includes(selectedCreature)) {
                camera.x += (selectedCreature.x - camera.x) * 0.1;
                camera.y += (selectedCreature.y - camera.y) * 0.1;
                clampCameraToWorld();
            }

            syncAndRender3D();
            renderOverlay2D();

            renderFrame++;
            if (renderFrame % 6 === 0) updateHUD();
            requestAnimationFrame(mainLoop);
        }

        window.addEventListener('load', () => {
            resizeCanvases();
            populateSpeciesSelect();
            initThreeWorld();
            window.resetSimulation();
            mainLoop();
        });
    
