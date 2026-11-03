# NeuroAtlas Native C++ Regional Electrophysiology (v0.1)

## Scope and validation status

This is a **region-level research prototype**, NOT a virtual reconstruction of every biological cell or synapse in an average human brain. A reference atlas is a *parcellation*, not a predictive complete-brain physical simulation. The Research Lab's existing 50 markers include non-neural tissue, ventricles and cranial nerves; those are represented as **structural markers without fictitious firing rates**. Their coordinates are schematic and unregistered to MRI.

The C++ executable is `native/neurophysics.cpp`. The source-code models are inspired by peer-reviewed dynamics, but **all coupling coefficients, non-invasive EEG projection weights, stimulation defaults and alcohol modulation strengths are hypothetical**, not calibrated to human imaging, EEG, pharmacology or individual traits. If a user narrative mentions an intervention or a drug, the AI buffer produces an **assumed scenario parameter**; a person's actual physiology cannot be estimated from text.

## Published mathematical basis

### 1. Wilson–Cowan neural populations

Wilson HR, Cowan JD (1972), *Excitatory and inhibitory interactions in localized populations of model neurons*, Biophysical Journal 12:1–24, DOI [10.1016/S0006-3495(72)86068-5](https://doi.org/10.1016/S0006-3495(72)86068-5).

The code integrates a simplified coupled excitatory/inhibitory neural-population equation (Euler integration at 512 Hz):

```text
tau_E dE_j/dt = -E_j + S( g_GLUT*(w_EE*E_j + g_ij*sum_k W_jk E_k)
                           - g_GABA*w_EI*I_j + external_j(t) )
tau_I dI_j/dt = -I_j + S( w_IE*E_j - w_II*I_j + Q_j )
S(z) = 1/(1 + exp(-4(z - 0.5)))
W_jk ∝ exp(-||x_j - x_k||^2 / (2 sigma^2)), normalized per row
```

The coordinates x_j and Gaussian connectivity are **schematic**. They are NOT diffusion-tractography connectivity and do not reproduce published human connectome matrices. The equations are a pedagogical instantiation of the Wilson–Cowan family, **not an exact replication of any calibrated published human model**.

### 2. Oscillations and measured EEG vs projected proxy

Jansen BH, Rit VG (1995), *Electroencephalogram and visual evoked potential generation in a mathematical model of coupled cortical columns*, Biological Cybernetics 73:357–366, DOI [10.1007/BF00199471](https://doi.org/10.1007/BF00199471).

Buzsáki G, Anastassiou CA, Koch C (2012), *The origin of extracellular fields and currents: EEG, ECoG, LFP and spikes*, Nature Reviews Neuroscience 13:407–420, DOI [10.1038/nrn3241](https://doi.org/10.1038/nrn3241).

Native model generates a **dimensionless virtual sensor** using weighted excitatory-minus-inhibitory population signals, then estimates delta/theta/alpha/beta/gamma energy shares through a Hann-window DFT. It does NOT solve the electromagnetic volume-conductor boundary value problem or produce real scalp voltages (microvolts), MEG (femtotesla), source localization or an accurate lead-field matrix.

### 3. Anatomical parcellation and whole-brain methods

Glasser MF et al. (2016), *A multi-modal parcellation of human cerebral cortex*, Nature 536:171–178, DOI [10.1038/nature18933](https://doi.org/10.1038/nature18933): 180 areas per hemisphere, cortex only.

Schaefer A et al. (2018), *Local-global parcellation of the human cerebral cortex from intrinsic functional connectivity MRI*, Cerebral Cortex 28:3095–3114, DOI [10.1093/cercor/bhx179](https://doi.org/10.1093/cercor/bhx179): reference atlases at 400, 600, 800 and 1000 parcels.

Sanz Leon P et al. (2013), *The Virtual Brain: a simulator of primate brain network dynamics*, Frontiers in Neuroinformatics 7:10, DOI [10.3389/fninf.2013.00010](https://doi.org/10.3389/fninf.2013.00010).

To improve anatomical and electrical fidelity: import a licensed, MRI-registered parcellation with voxel-to-parcel mapping; obtain measured diffusion MRI connectome; register sensor and head geometry; build a FEM/BEM lead-field; perform explicit parameter identifiability/calibration and held-out EEG tests. No software can promise an exact average brain response to arbitrary narrative text.

### 4. Alcohol example: receptor modulation versus real concentrations

Lovinger DM, Roberto M (2018), *Alcohol and the Brain: Neuronal Molecular Targets, Synapses, and Circuits* [open-access review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6566861/).

Acute alcohol can affect GABA_A and ionotropic glutamate receptor function in heterogeneous, region- and dose-dependent ways. The simulation adjusts hypothetical inhibitory gain (g_GABA=1+0.25*intensity) and excitatory gain (g_GLUT=1-0.20*intensity), plus a **weak frontal-cortex perturbation**. These constants are **arbitrary scenario coefficients** and NOT measured receptor occupancy, GABA concentration, NMDA conductance, BAC, patient biomarkers, or an established medical prediction. The amygdala is not indiscriminately "turned down"; its response is context dependent.

The AI narrative buffer first converts natural language into bounded scenario **assumptions**, optionally through Gemini JSON extraction, otherwise a deterministic lexical parser. Both disclose their source and cannot attest that an input occurred in the real world.

## Run locally

```bash
g++ -std=c++17 -O2 -Wall -Wextra native/neurophysics.cpp -o /tmp/neurophysics
/tmp/neurophysics 0.5 0.25 0.45 0.5 3 19 | python3 -m json.tool | head -50
```

CLI: `alcohol stress attention arousal seconds seed` (0..1 for first four, 1..8 seconds, seed 0..1,000,000).

`src/lib/neurophysics.functions.ts` launches the binary **server-side** with `execFile` and numeric argument validation, bounded output, and a timeout. It runs an alcohol-free matched reference with the **same other conditions and seed**, computes region-level differences, and sends them to `BrainExplorer`. Red represents *below reference*, green *above reference*; colors are not evidence of disease, good/bad moral status, or a causal personal forecast. The outer app remains monochrome.

**Deployment requirements:** a hosting environment that permits running a native executable, `NEUROPHYSICS_BIN=/absolute/path/to/neurophysics`, and an authenticated server. Hosted Lovable runtime may not support native binaries: check deployment provider before claiming it is live. The UI deliberately reports **NATIVE NOT DEPLOYED** until configured; it never claims that the TypeScript proxy is the C++ kernel.

## Python Occult Killer v3 adapter

The repository's `src/lib/lab.functions.ts` can call the independently hosted Python backend from the supplied `NeuroAtlas_Occult_Killer_Integrated_v3.zip` archive when `PYTHON_SIM_URL` is set to the *server base URL*. It checks `GET /api/occult-killer` before enabling `POST /api/occult-killer/compare`.

Python v3 models 1–12 **abstract rounds** of aggregate group responses, not persistent individual neurons, not financial forecasts, and **not** the TypeScript v4.2 absolute-evil adversarial mode. It is exposed only as a marked **neutral comparison**.

To start this backend from the supplied archive on a separate service:

```bash
cd NeuroAtlas_Combined/python
python3 -m group_sim.server
```

The original server may be bound to loopback for safety; configure a trusted authenticated reverse proxy if exposing it to the Research Lab. Do not expose unrestricted ingestion endpoints to the public. Neither a GitHub PR nor a frontend bundle alone deploys the separate Python server.

## Verification

GitHub CI compiles the native C++ program and checks the complete JSON output, region counts, finite values and normalized EEG band shares, then runs `bun run test` and `bun run build`. More rigorous verification requires human EEG/multimodal recordings, realistic head geometry, region-wise ground truth and parameter validation against independent subjects.
