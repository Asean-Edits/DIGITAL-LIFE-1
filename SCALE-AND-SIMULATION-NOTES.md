# Digital Life — Scale and simulation update

## Physical reference
- Human baseline: 1.7 m.
- The human mesh is calibrated using its current model proportions (approximately 26.4 world units tall).
- One rendered world unit is therefore approximately 0.0644 m.
- Species use approximate characteristic dimensions (height, body length or wingspan as appropriate); these are educational visual references, not precise zoological measurements.
- Default timber houses and voxel trees have been resized against the same conversion.
- Existing island coordinates and all legacy structures are not globally rescaled; the Scale Explorer explains this limitation.

## House interiors
Use **House Interior** to switch to cutaway mode. Default timber houses reveal a floor, partition, sleeping area, table, stool, hearth and storage. Toggle again or close the panel to restore the exterior.

## Competition and combat
- Existing predator-prey behaviour remains active.
- Human factions can diverge through high stress and low energy; the late civilization revolution can also create a rival faction.
- Opposing human factions engage at close range. Combat strength is influenced by ANN stage, leadership and civilization era.
- Combatants lose health, energy and stress stability; defeated agents are removed and survivors can recover.

## Validation
Run `node --check script.js` after changes. Then deploy and inspect the world at different zoom levels. The new physical scale is approximate and should be tuned further if the project later adopts a fully measured world coordinate system.
