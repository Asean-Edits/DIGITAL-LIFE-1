/*
 * Three.js runtime loader
 * Loads the pinned Three.js r128 browser build before script.js executes.
 * The Digital Life scene, shaders, materials, terrain and rendering logic
 * are kept in script.js so they can share the simulation's existing state.
 */
document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\\/script>');
