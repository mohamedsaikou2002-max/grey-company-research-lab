# Neural Atlas — Personality × Narrative × Brain Viewer
This implementation adds a directly-coded Three.js WebGL viewer, 50 anatomy markers, a named personality library, narrative inputs, and synthetic neurochemical signaling + gut-brain indices.
The /neural-atlas page is still separate from /occult-killer and /research-ai. The prior EEG proxy application is preserved under an advanced collapsible panel.

## Brain GLB
The viewer works immediately with a procedural grayscale brain cutaway. Click LOAD YOUR BRAIN GLB to select the Meshy GLB (or the optimized cutaway) from your computer. It renders directly in the browser and does not upload personal data. The mesh is normalized for display; internal anatomical markers are schematic and do not derive from the artistic mesh. The supplied binary GLB is **not embedded in this Git commit**. Optionally add the optimized file to public/models/ in a future asset upload.

## Profiles, narrative, and outputs
Create a named personality, edit text and baseline traits, SAVE or LOAD it within the same browser. Saved profiles use localStorage; no cross-device sync. Enter a narrative and RUN SYNTHETIC RESPONSE. Text tokens map onto broad functional categories, then onto transparent heuristic indices for brain regions, stress, attention, reward and neuromodulation hypotheses. CSV/JSON exports and original EEG sandbox are available.

## Gut–brain axis
Browser educational proxy displays fermentation substrate, short-chain fatty acid potential, gastric emptying delay, glucose potential and vagal signalling. native/gut_brain.cpp is a separate C++17 educational time-stepping compartment prototype and is not connected to the browser. g++ -O2 -std=c++17 native/gut_brain.cpp -o gut_brain

## Validity and privacy
NO inference of actual neural firing, neurotransmitter concentrations, emotions, or clinical states from personality prose. No clinical validation. For empirical accuracy use atlas-registered structural MRI, measured EEG/fMRI and assays, validated instruments, reproducible studies and held-out calibration. Do not use this simulator to diagnose, prescribe, or claim exact personal reactions.
