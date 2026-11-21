import * as THREE from 'three';

const HALF = 3200;
const SIZE = HALF * 2;
const GRID = 128;
const state = { renderer: null, scene: null, camera: null, canvas: null, root: null, visible: true, initialized: false, width: 0, height: 0, zoom: -1 };

function elevation(x, z, seed) {
    const s = seed * 0.01;
    const n1 = Math.sin(x * 0.0018 + s) * Math.cos(z * 0.0018 - s);
    const n2 = Math.sin((x + z) * 0.0035 - s * 1.7) * 0.5;
    const n3 = Math.cos((x - z) * 0.007 + s * 2.3) * 0.25;
    return (n1 + n2 + n3) / 1.75;
}

function heightAt(e) {
    if (e < 0.10) return -28 + e * 15;
    if (e < 0.15) return -26.5 + (e - 0.10) * 630;
    return 5 + (e - 0.15) * 145;
}

function colorAt(e, x, z, seed, era = {}) {
    const noise = Math.sin(x * 0.031 + z * 0.019 + seed) * 0.035;
    if (e < 0.08) return new THREE.Color('#174355').lerp(new THREE.Color(era.oceanColor || '#075166'), 0.28).offsetHSL(0, 0, noise);
    if (e < 0.17) return new THREE.Color('#c4b57e').offsetHSL(0, 0, noise);
    if (e > 0.58) return new THREE.Color(e > 0.74 ? '#a29b85' : '#78805d').offsetHSL(0, 0, noise);
    const forest = Math.sin(x * 0.0024 + seed) * Math.cos(z * 0.0028 - seed * 0.4);
    const grass = new THREE.Color(forest > 0.25 ? '#456c3c' : '#68844a');
    if (era.landColor) grass.lerp(new THREE.Color(era.landColor), 0.2);
    return grass.offsetHSL(0, 0, noise);
}

function disposeRoot() {
    if (!state.root) return;
    state.scene.remove(state.root);
    state.root.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
        }
    });
    state.root = null;
}

function addTerrain(seed, era) {
    const positions = [];
    const colors = [];
    const indices = [];
    const row = GRID + 1;
    for (let j = 0; j <= GRID; j++) {
        const z = -HALF + (j / GRID) * SIZE;
        for (let i = 0; i <= GRID; i++) {
            const x = -HALF + (i / GRID) * SIZE;
            const e = elevation(x, z, seed);
            positions.push(x, heightAt(e), z);
            const color = colorAt(e, x, z, seed, era);
            colors.push(color.r, color.g, color.b);
            if (i < GRID && j < GRID) {
                const a = j * row + i, b = a + row, c = a + 1, d = b + 1;
                indices.push(a, b, c, b, d, c);
            }
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const land = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.02 }));
    land.receiveShadow = true;
    state.root.add(land);

    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(SIZE, SIZE),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(era.oceanColor || '#075166').lerp(new THREE.Color('#167185'), 0.32), roughness: 0.24, metalness: 0.28, transparent: true, opacity: 0.88 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -8;
    water.receiveShadow = true;
    state.root.add(water);
}

function addBiomeInstances(seed) {
    const trunkGeometry = new THREE.CylinderGeometry(2.5, 4.6, 1, 5);
    const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#68452a', roughness: 0.91 });
    const crownMaterial = new THREE.MeshStandardMaterial({ color: '#4b8a43', roughness: 0.82 });
    const rockMaterial = new THREE.MeshStandardMaterial({ color: '#81877f', roughness: 0.97 });
    const groveMaterial = new THREE.MeshStandardMaterial({ color: '#5f8542', roughness: 0.95, side: THREE.DoubleSide });
    const fruitMaterial = new THREE.MeshStandardMaterial({ color: '#d84d3d', roughness: 0.6 });
    const stumpMaterial = new THREE.MeshStandardMaterial({ color: '#795335', roughness: 0.92 });
    const stumpTopMaterial = new THREE.MeshStandardMaterial({ color: '#c29b68', roughness: 0.9 });
    const treeData = [];
    const rockData = [];
    const groveData = [];
    const fruitData = [];
    const stumpData = [];
    const step = 96;
    for (let x = -HALF + step / 2; x < HALF; x += step) {
        for (let z = -HALF + step / 2; z < HALF; z += step) {
            const e = elevation(x, z, seed);
            const hash = Math.abs(Math.sin(x * 0.013 + z * 0.017 + seed * 1.7) * 43758.5453) % 1;
            const grove = Math.sin(x * 0.0031 + seed * 0.73) * Math.cos(z * 0.0027 - seed * 0.41)
                + Math.sin((x + z) * 0.0019 + seed) * 0.34;
            if (e > 0.18 && grove > 0.3 && hash > 0.13) {
                const size = 0.72 + hash * 0.62;
                const trunkHeight = 22 + hash * 20;
                treeData.push({ x, z, y: heightAt(e), size, trunkHeight, tint: hash > 0.82 ? '#587c39' : hash > 0.58 ? '#3e8040' : '#4c9148' });
                groveData.push({ x, z, y: heightAt(e) + 0.5, scale: 32 + hash * 19, tint: hash > 0.7 ? '#71964b' : '#557c3d' });
                if (hash > 0.78) {
                    for (const [fx, fz] of [[-0.42, -0.2], [0.2, 0.38], [0.48, -0.16]]) {
                        fruitData.push({ x: x + fx * trunkHeight, z: z + fz * trunkHeight, y: heightAt(e) + trunkHeight * 1.2 });
                    }
                }
            } else if (e > 0.2 && hash > 0.075 && hash < 0.12) {
                stumpData.push({ x, z, y: heightAt(e), size: 8 + hash * 28 });
            } else if (e > 0.21 && hash < 0.055) {
                rockData.push({ x, z, y: heightAt(e), size: 8 + hash * 120 });
            }
        }
    }

    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeData.length);
    const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, treeData.length);
    const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, rockData.length);
    const groves = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 9), groveMaterial, groveData.length);
    const fruits = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), fruitMaterial, fruitData.length);
    const stumps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 1, 1, 6), stumpMaterial, stumpData.length);
    const stumpTops = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 6), stumpTopMaterial, stumpData.length);
    const dummy = new THREE.Object3D();
    treeData.forEach((tree, i) => {
        dummy.position.set(tree.x, tree.y + tree.trunkHeight / 2, tree.z);
        dummy.scale.set(tree.size, tree.trunkHeight, tree.size);
        dummy.rotation.y = ((i * 2.399) % (Math.PI * 2));
        dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tree.x, tree.y + tree.trunkHeight + 10 * tree.size, tree.z);
        dummy.scale.set(13 * tree.size, 19 * tree.size, 13 * tree.size);
        dummy.rotation.set(0, ((i * 1.618) % (Math.PI * 2)), 0);
        dummy.updateMatrix(); crowns.setMatrixAt(i, dummy.matrix);
        crowns.setColorAt(i, new THREE.Color(tree.tint));
    });
    rockData.forEach((rock, i) => {
        dummy.position.set(rock.x, rock.y + rock.size * 0.38, rock.z);
        dummy.scale.set(rock.size, rock.size * 0.75, rock.size * 0.9);
        dummy.rotation.set(i * 0.17, i * 0.31, i * 0.09);
        dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    });
    groveData.forEach((patch, i) => {
        dummy.position.set(patch.x, patch.y, patch.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(patch.scale, patch.scale * 0.78, 1);
        dummy.updateMatrix(); groves.setMatrixAt(i, dummy.matrix);
        groves.setColorAt(i, new THREE.Color(patch.tint));
    });
    fruitData.forEach((fruit, i) => {
        dummy.position.set(fruit.x, fruit.y, fruit.z);
        dummy.scale.set(3.6, 3.6, 3.6);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix(); fruits.setMatrixAt(i, dummy.matrix);
    });
    stumpData.forEach((stump, i) => {
        dummy.position.set(stump.x, stump.y + stump.size * 0.45, stump.z);
        dummy.scale.set(stump.size * 0.55, stump.size, stump.size * 0.55);
        dummy.rotation.set(0, i * 0.37, 0);
        dummy.updateMatrix(); stumps.setMatrixAt(i, dummy.matrix);
        dummy.position.set(stump.x, stump.y + stump.size * 0.94, stump.z);
        dummy.scale.set(stump.size * 0.58, 1.4, stump.size * 0.58);
        dummy.updateMatrix(); stumpTops.setMatrixAt(i, dummy.matrix);
    });

    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    rocks.instanceMatrix.needsUpdate = true;
    groves.instanceMatrix.needsUpdate = true;
    fruits.instanceMatrix.needsUpdate = true;
    stumps.instanceMatrix.needsUpdate = true;
    stumpTops.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    if (groves.instanceColor) groves.instanceColor.needsUpdate = true;

    trunks.castShadow = true; crowns.castShadow = true; rocks.castShadow = true;
    fruits.castShadow = true; stumps.castShadow = true;
    trunks.receiveShadow = true; crowns.receiveShadow = true; rocks.receiveShadow = true;
    groves.receiveShadow = true;
    state.root.add(groves, trunks, crowns, fruits, stumps, stumpTops, rocks);
}

function addWorldBoundary() {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#172e35', roughness: 0.8, metalness: 0.18 });
    const beaconMaterial = new THREE.MeshBasicMaterial({ color: '#39d8d0' });
    const wallHeight = 58;
    const wallThickness = 46;
    const walls = [
        { x: -HALF, z: 0, w: wallThickness, d: SIZE }, { x: HALF, z: 0, w: wallThickness, d: SIZE },
        { x: 0, z: -HALF, w: SIZE, d: wallThickness }, { x: 0, z: HALF, w: SIZE, d: wallThickness }
    ];
    for (const wall of walls) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wallHeight, wall.d), wallMaterial);
        mesh.position.set(wall.x, wallHeight / 2 - 8, wall.z);
        mesh.castShadow = true;
        state.root.add(mesh);
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(wall.w + 2, 2.4, wall.d + 2), beaconMaterial);
        beacon.position.set(wall.x, wallHeight - 7, wall.z);
        state.root.add(beacon);
    }
    const cornerGeometry = new THREE.CylinderGeometry(18, 24, 52, 8);
    for (const x of [-HALF, HALF]) for (const z of [-HALF, HALF]) {
        const marker = new THREE.Mesh(cornerGeometry, new THREE.MeshStandardMaterial({ color: '#22d3c5', emissive: '#087d77', emissiveIntensity: 1.4 }));
        marker.position.set(x, 20, z);
        state.root.add(marker);
    }
}

function rebuild(seed, era = {}) {
    if (!state.initialized) return false;
    disposeRoot();
    state.root = new THREE.Group();
    addTerrain(seed, era);
    addBiomeInstances(seed);
    addWorldBoundary();
    state.scene.background.set(era.oceanColor || '#03121a');
    state.scene.fog.color.set(era.oceanColor || '#061821');
    state.scene.add(state.root);
    return true;
}

function triangleGeometry(triangles) {
    const positions = [];
    triangles.forEach((triangle) => triangle.forEach(([x, y, z]) => positions.push(x, y, z)));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
}

const WING_GEOMETRY = triangleGeometry([
    [[-0.32, 0, 0.2], [-2.0, 0, -0.55], [-0.4, 0, 1.05]],
    [[0.32, 0, 0.2], [2.0, 0, -0.55], [0.4, 0, 1.05]],
    [[-0.2, 0, -0.55], [0, 0, -1.4], [0.2, 0, -0.55]]
]);
const TAIL_GEOMETRY = triangleGeometry([
    [[-0.12, 0, -0.75], [-0.88, 0, -1.9], [0, 0, -1.48]],
    [[0, 0, -1.48], [0.88, 0, -1.9], [0.12, 0, -0.75]]
]);
const DORSAL_GEOMETRY = triangleGeometry([[[0, 0.02, 0.1], [-0.38, 0.02, 0.76], [0.38, 0.02, 0.76]]]);
const LEAF_GEOMETRY = triangleGeometry([
    [[0, 0, 0], [-0.36, 0, 0.85], [0, 0, 0.56]],
    [[0, 0, 0], [0.36, 0, 0.85], [0, 0, 0.56]]
]);
const STRIPE_GEOMETRY = triangleGeometry([
    [[-0.34, 0.55, -0.35], [-0.16, 0.55, -0.35], [-0.34, 0.55, 0.35]],
    [[-0.34, 0.55, 0.35], [-0.16, 0.55, -0.35], [-0.16, 0.55, 0.35]],
    [[0.16, 0.55, -0.35], [0.34, 0.55, -0.35], [0.16, 0.55, 0.35]],
    [[0.16, 0.55, 0.35], [0.34, 0.55, -0.35], [0.34, 0.55, 0.35]]
]);
const CORE_RING_GEOMETRY = new THREE.TorusGeometry(0.35, 0.07, 5, 18);
const BODY_GEOMETRY = new THREE.SphereGeometry(1, 12, 8);
const HEAD_GEOMETRY = new THREE.SphereGeometry(1, 10, 8);
const FOOT_GEOMETRY = new THREE.SphereGeometry(1, 6, 5);
const SHELL_PLATE_GEOMETRY = new THREE.SphereGeometry(1, 8, 6);
const TENTACLE_GEOMETRY = new THREE.SphereGeometry(1, 6, 5);
const JELLY_BELL_GEOMETRY = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const SELECT_RING_GEOMETRY = new THREE.RingGeometry(1.72, 1.92, 28);
const DEFENSE_RING_GEOMETRY = new THREE.RingGeometry(1.5, 1.67, 24);
const MAX_CREATURES = 130;
const creatureBatches = new Map();
const creatureColorCache = new WeakMap();
const FIXED_INSTANCE_COLORS = {
    selected: new THREE.Color('#ffd166'),
    eye: new THREE.Color('#f3f5df'),
    pupil: new THREE.Color('#07161e')
};
const rootTransform = new THREE.Object3D();
const partTransform = new THREE.Object3D();
const composedMatrix = new THREE.Matrix4();

function addCreaturePart(batch, partName, geometry, colorMode, layout, materialOptions = {}) {
    const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.58, side: THREE.DoubleSide, ...materialOptions });
    const mesh = new THREE.InstancedMesh(geometry, material, MAX_CREATURES * 6);
    mesh.count = 0;
    mesh.castShadow = partName === 'body' || partName === 'shell' || partName === 'bell';
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    state.creatureRoot.add(mesh);
    batch.parts.push({ name: partName, mesh, colorMode, layout });
}

function setupCreatureBatches() {
    state.creatureRoot = new THREE.Group();
    state.scene.add(state.creatureRoot);
    const definitions = {
        aeroglider: (batch) => {
            addCreaturePart(batch, 'body', BODY_GEOMETRY, 'base', () => [{ position: [0, 0.06, 0], scale: [0.68, 0.46, 1.15] }]);
            addCreaturePart(batch, 'wings', WING_GEOMETRY, 'accent', (organism) => [{ position: [0, 0.18, 0], scale: [0.68 + organism.genome.appendages * 0.025, 0.8, 0.78] }]);
        },
        grazer: (batch) => {
            addCreaturePart(batch, 'body', BODY_GEOMETRY, 'base', (organism) => [{ position: [0, 0, 0], scale: [0.72 * organism.genome.aspectRatio, 0.72, 0.96] }]);
            addCreaturePart(batch, 'head', HEAD_GEOMETRY, 'base', () => [{ position: [0, 0.12, 0.82], scale: [0.42, 0.42, 0.44] }]);
            addCreaturePart(batch, 'eyes', FOOT_GEOMETRY, 'eye', () => [-1, 1].map(side => ({ position: [side * 0.25, 0.36, 1.0], scale: [0.14, 0.14, 0.14] })));
            addCreaturePart(batch, 'pupils', FOOT_GEOMETRY, 'pupil', () => [-1, 1].map(side => ({ position: [side * 0.27, 0.42, 1.08], scale: [0.065, 0.07, 0.08] })));
            addCreaturePart(batch, 'legs', FOOT_GEOMETRY, 'accent', () => [-1, 1].flatMap(side => [-1, 1].map(front => ({ position: [side * 0.7, -0.56, front * 0.54], scale: [0.19, 0.17, 0.22] }))));
            addCreaturePart(batch, 'leaf crest', LEAF_GEOMETRY, 'accent', () => [{ position: [0, 0.34, 0.58], scale: [0.45, 0.5, 0.45] }]);
        },
        swimbot: (batch) => {
            addCreaturePart(batch, 'body', BODY_GEOMETRY, 'base', () => [{ position: [0, 0, 0], scale: [0.7, 0.55, 1.18] }]);
            addCreaturePart(batch, 'tail fin', TAIL_GEOMETRY, 'accent', (organism) => [{ position: [0, 0.04, 0], scale: [0.58 + organism.genome.appendages * 0.03, 0.8, 0.54 + organism.genome.appendages * 0.03] }]);
            addCreaturePart(batch, 'dorsal fin', DORSAL_GEOMETRY, 'accent', (organism) => [{ position: [0, 0.38, 0], scale: [0.58 + organism.genome.appendages * 0.03, 0.76, 0.5 + organism.genome.appendages * 0.03] }]);
            addCreaturePart(batch, 'head', HEAD_GEOMETRY, 'accent', () => [{ position: [0, 0.1, 0.84], scale: [0.3, 0.3, 0.3] }]);
            addCreaturePart(batch, 'eyes', FOOT_GEOMETRY, 'eye', () => [-1, 1].map(side => ({ position: [side * 0.34, 0.38, 0.68], scale: [0.13, 0.13, 0.13] })));
            addCreaturePart(batch, 'pupils', FOOT_GEOMETRY, 'pupil', () => [-1, 1].map(side => ({ position: [side * 0.37, 0.43, 0.76], scale: [0.06, 0.065, 0.075] })));
        },
        hunter: (batch) => {
            addCreaturePart(batch, 'body', BODY_GEOMETRY, 'base', () => [{ position: [0, 0, 0], scale: [0.84, 0.62, 1.36] }]);
            addCreaturePart(batch, 'tail fin', TAIL_GEOMETRY, 'accent', (organism) => [{ position: [0, 0.02, -0.05], scale: [0.72 + organism.genome.appendages * 0.035, 0.88, 0.68 + organism.genome.appendages * 0.03] }]);
            addCreaturePart(batch, 'dorsal fin', DORSAL_GEOMETRY, 'accent', (organism) => [{ position: [0, 0.43, 0.02], scale: [0.7 + organism.genome.appendages * 0.04, 0.92, 0.64 + organism.genome.appendages * 0.035] }]);
            addCreaturePart(batch, 'snout', HEAD_GEOMETRY, 'base', () => [{ position: [0, 0.1, 1.05], scale: [0.42, 0.35, 0.62] }]);
            addCreaturePart(batch, 'eyes', FOOT_GEOMETRY, 'eye', () => [-1, 1].map(side => ({ position: [side * 0.46, 0.43, 0.68], scale: [0.15, 0.15, 0.15] })));
            addCreaturePart(batch, 'pupils', FOOT_GEOMETRY, 'pupil', () => [-1, 1].map(side => ({ position: [side * 0.49, 0.48, 0.77], scale: [0.07, 0.07, 0.08] })));
        },
        lithocrawler: (batch) => {
            addCreaturePart(batch, 'body', BODY_GEOMETRY, 'base', () => [{ position: [0, 0, 0], scale: [0.95, 0.48, 1.27] }]);
            addCreaturePart(batch, 'shell plates', SHELL_PLATE_GEOMETRY, 'accent', () => [-0.72, -0.25, 0.22, 0.68].map((z, i) => ({ position: [0, 0.28, z], scale: [0.77 - i * 0.035, 0.28, 0.31] })));
            addCreaturePart(batch, 'legs', FOOT_GEOMETRY, 'accent', () => [-1, 1].flatMap(side => [-0.56, 0, 0.56].map(z => ({ position: [side * 0.92, -0.49, z], scale: [0.16, 0.14, 0.22] }))));
        },
        medusa: (batch) => {
            addCreaturePart(batch, 'bell', JELLY_BELL_GEOMETRY, 'base', () => [{ position: [0, 0.12, 0.1], scale: [0.92, 0.54, 0.85] }], { transparent: true, opacity: 0.88, roughness: 0.28, emissive: '#211042', emissiveIntensity: 0.22 });
            addCreaturePart(batch, 'tentacles', TENTACLE_GEOMETRY, 'accent', () => [-0.72, -0.42, 0, 0.42, 0.72].map(x => ({ position: [x, 0.02, -0.72 - Math.abs(x) * 0.2], scale: [0.14, 0.12, 0.62] })));
        }
    };
    for (const [species, defineParts] of Object.entries(definitions)) {
        const batch = { parts: [] };
        defineParts(batch);
        addCreaturePart(batch, 'genome stripes', STRIPE_GEOMETRY, 'accent', (organism) => organism.genome.pattern === 'Striped'
            ? [{ position: [0, 0, 0], scale: [1, 1, 1] }]
            : []);
        addCreaturePart(batch, 'genome spots', FOOT_GEOMETRY, 'accent', (organism) => organism.genome.pattern === 'Spotted'
            ? [-1, 0, 1].map((side, index) => ({ position: [side * 0.34, 0.56, index === 1 ? 0.3 : -0.22], scale: [0.15, 0.07, 0.18] }))
            : []);
        addCreaturePart(batch, 'genome core ring', CORE_RING_GEOMETRY, 'accent', (organism) => organism.genome.pattern === 'Core-Ring'
            ? [{ position: [0, 0.58, 0.15], rotation: [Math.PI / 2, 0, 0], scale: [0.7, 0.7, 0.7] }]
            : []);
        addCreaturePart(batch, 'genome dorsal fin', DORSAL_GEOMETRY, 'accent', (organism) => organism.genome.pattern === 'Dorsal-Fin'
            ? [{ position: [0, 0.34, -0.18], scale: [0.75, 0.82, 0.78] }]
            : []);
        addCreaturePart(batch, 'genome lights', FOOT_GEOMETRY, 'accent', (organism) => organism.genome.pattern === 'Bioluminescent'
            ? [-1, 1].map(side => ({ position: [side * 0.36, 0.6, 0.12], scale: [0.18, 0.08, 0.18] }))
            : [], { emissive: '#164d80', emissiveIntensity: 0.8 });
        addCreaturePart(batch, 'selected', SELECT_RING_GEOMETRY, 'selected', (organism) => organism.genome.id === state.selectedId
            ? [{ position: [0, -0.68, 0], rotation: [Math.PI / 2, 0, 0], scale: [1.32, 1.32, 1] }]
            : [], { color: '#ffffff', emissive: '#775600', emissiveIntensity: 0.42, roughness: 0.45 });
        addCreaturePart(batch, 'defense effect', DEFENSE_RING_GEOMETRY, 'shield', (organism) => organism.defenseTimer > 0
            ? [{ position: [0, -0.68, 0], rotation: [Math.PI / 2, 0, 0], scale: [1.55, 1.55, 1] }]
            : [], { transparent: true, opacity: 0.8, emissive: '#167e94', emissiveIntensity: 0.55 });
        creatureBatches.set(species, batch);
    }
}

function creatureColor(organism, colorMode) {
    if (FIXED_INSTANCE_COLORS[colorMode]) return FIXED_INSTANCE_COLORS[colorMode];
    let colors = creatureColorCache.get(organism);
    if (!colors) {
        const hueByDefense = { 'ARMOUR': 44, 'CAMOUFLAGE': 145, 'SPEED BURST': 194, 'GROUP DEFENCE': 203, 'BURROWING': 32, 'BIO-SHOCK': 278 };
        const baseHue = ((organism.genome.hue % 360) + 360) % 360 / 360;
        const accentHue = ((organism.genome.accentHue % 360) + 360) % 360 / 360;
        colors = {
            base: new THREE.Color().setHSL(baseHue, 0.72, 0.54),
            accent: new THREE.Color().setHSL(accentHue, 0.78, 0.72),
            shield: new THREE.Color().setHSL((hueByDefense[organism.genome.defense] || 190) / 360, 0.9, 0.62)
        };
        creatureColorCache.set(organism, colors);
    }
    return colors[colorMode] || colors.base;
}

function syncOrganisms(organisms, selectedId, worldSeed) {
    if (!state.creatureRoot) return;
    state.selectedId = selectedId;
    const bySpecies = new Map([...creatureBatches.keys()].map(species => [species, []]));
    for (const organism of organisms || []) {
        if (!organism.burrowed && bySpecies.has(organism.species)) bySpecies.get(organism.species).push(organism);
    }
    for (const [species, batch] of creatureBatches) {
        const members = bySpecies.get(species) || [];
        for (const part of batch.parts) {
            let index = 0;
            for (const organism of members) {
                const e = elevation(organism.x, organism.y, worldSeed);
                const surfaceY = e > 0.15 ? heightAt(e) : -4;
                const floatHeight = organism.genome.sphereAffinity === 'ATMOSPHERE' ? 34 : 0;
                rootTransform.position.set(organism.x, surfaceY + organism.genome.size * 0.72 + floatHeight, organism.y);
                rootTransform.rotation.set(0, Math.PI / 2 - organism.angle, 0);
                rootTransform.scale.setScalar(organism.genome.size);
                rootTransform.updateMatrix();
                for (const layout of part.layout(organism)) {
                    partTransform.position.set(...layout.position);
                    partTransform.rotation.set(...(layout.rotation || [0, 0, 0]));
                    partTransform.scale.set(...layout.scale);
                    partTransform.updateMatrix();
                    composedMatrix.multiplyMatrices(rootTransform.matrix, partTransform.matrix);
                    part.mesh.setMatrixAt(index, composedMatrix);
                    part.mesh.setColorAt(index, creatureColor(organism, part.colorMode));
                    index++;
                }
            }
            part.mesh.count = index;
            part.mesh.instanceMatrix.needsUpdate = true;
            if (part.mesh.instanceColor) part.mesh.instanceColor.needsUpdate = true;
        }
    }
}

function resize(requestedZoom = 0.85) {
    if (!state.renderer || !state.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const zoom = Math.max(0.25, requestedZoom);
    if (width === state.width && height === state.height && zoom === state.zoom) return;
    if (width !== state.width || height !== state.height) {
        state.renderer.setSize(width, height, false);
        state.width = width;
        state.height = height;
    }
    const viewHeight = height / zoom;
    const viewWidth = viewHeight * (width / Math.max(1, height));
    state.camera.left = -viewWidth / 2;
    state.camera.right = viewWidth / 2;
    state.camera.top = viewHeight / 2;
    state.camera.bottom = -viewHeight / 2;
    state.zoom = zoom;
    state.camera.updateProjectionMatrix();
}

function init() {
    const canvas = document.getElementById('world3dCanvas');
    if (!canvas) return false;
    state.canvas = canvas;
    try {
        state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        state.renderer.setSize(window.innerWidth, window.innerHeight, false);
        state.renderer.shadowMap.enabled = true;
        state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        state.renderer.outputColorSpace = THREE.SRGBColorSpace;
        state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        state.scene = new THREE.Scene();
        state.scene.background = new THREE.Color('#03121a');
        state.scene.fog = new THREE.Fog('#061821', 4400, 9000);
        state.camera = new THREE.OrthographicCamera(-960, 960, 540, -540, 0.1, 10000);
        state.camera.up.set(0, 0, -1);
        state.scene.add(new THREE.HemisphereLight('#b5e4dc', '#1b302a', 2.0));
        const sun = new THREE.DirectionalLight('#fff0c9', 3.2);
        sun.position.set(-950, 1500, -1250);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1536, 1536);
        sun.shadow.camera.left = -HALF; sun.shadow.camera.right = HALF;
        sun.shadow.camera.top = HALF; sun.shadow.camera.bottom = -HALF;
        sun.shadow.camera.near = 1; sun.shadow.camera.far = 5000;
        sun.shadow.bias = -0.0003;
        state.scene.add(sun);
        setupCreatureBatches();
        state.initialized = true;
        resize();
        window.addEventListener('resize', resize);
        return true;
    } catch (error) {
        console.warn('Three.js renderer unavailable; using the bounded 2D terrain fallback.', error);
        canvas.style.display = 'none';
        return false;
    }
}

function render(cameraState, organisms, selectedId, worldSeed = 1337.42) {
    if (!state.initialized || !state.visible || !cameraState) return;
    syncOrganisms(organisms, selectedId, worldSeed);
    resize(cameraState.zoom);
    state.camera.position.set(cameraState.x, 6200, cameraState.y);
    state.camera.lookAt(cameraState.x, 0, cameraState.y);
    state.renderer.render(state.scene, state.camera);
}

window.THREE = THREE;
window.initThreeWorld = init;
window.rebuildThreeWorld = rebuild;
window.renderThreeWorld = render;
window.setThreeWorldVisible = (visible) => {
    state.visible = !!visible;
    if (state.canvas) state.canvas.style.display = state.visible ? 'block' : 'none';
};
window.THREE_WORLD_HALF_SIZE = HALF;

