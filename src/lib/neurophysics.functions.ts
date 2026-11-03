/**
 * Native C++ / research-cue adapter. Requires a separately provisioned Linux
 * executable at NEUROPHYSICS_BIN on the server; browser never runs Node/C++.
 * Scientific validity: regional Wilson-Cowan model with heuristic parameters,
 * NOT a model of an individual's exact activity or neurochemical concentrations.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CueInput = z.object({
  narrative: z.string().min(1).max(1800),
  seed: z.number().int().min(0).max(1000000).default(19),
  seconds: z.number().int().min(1).max(5).default(3),
  alcohol: z.number().min(0).max(1).nullable().default(null),
  stress: z.number().min(0).max(1).nullable().default(null),
  attention: z.number().min(0).max(1).nullable().default(null),
  arousal: z.number().min(0).max(1).nullable().default(null),
  stress_tolerance: z.number().min(0).max(1).default(0.5),
});

const bound=(v:number)=>Math.max(0,Math.min(1,v));
function localCues(text:string,stressTolerance:number){
  const n=text.toLowerCase();
  // These are labels and arbitrarily chosen stress-test magnitudes, NOT BAC,
  // medically meaningful doses or predictions of actual physiology.
  return {
    alcohol: /\b(drunk|intoxicated|intoxication|alcohol|ethanol|inebriated)\b/.test(n)?0.5:0,
    stress: bound(0.25+(/\b(stress|threat|fear|panic|anxiety|danger)\b/.test(n)?0.35:0)-0.2*stressTolerance),
    attention: /\b(focus|studying|attentive|concentrat(?:e|ing|ion))\b/.test(n)?0.7:0.45,
    arousal: /\b(excited|alert|hypervigilant)\b/.test(n)?0.7:0.5,
  };
}
type Params=ReturnType<typeof localCues>;

async function cueFromGemini(narrative:string):Promise<Params|null>{
  const key=process.env["GEMINI_API_KEY"];
  if(!key)return null;
  const ctl=new AbortController();
  const timeout=setTimeout(()=>ctl.abort(),5000);
  try{
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
      method:"POST",signal:ctl.signal,
      headers:{"content-type":"application/json","x-goog-api-key":key},
      body:JSON.stringify({
        systemInstruction:{parts:[{text:"Extract only explicitly stated fictional circumstances. Output a JSON object of 0..1 illustrative cue assumptions: alcohol, stress, attention, arousal. Never claim personal physiological measurements; never infer actual dopamine or EEG or emotions. Alcohol=0 unless explicitly mentioned, and if mentioned choose 0.5 as a hypothetical demo default independent of dose. Other unspecified values: stress .25, attention .45, arousal .5. No extra prose."}]},
        contents:[{role:"user",parts:[{text:narrative}]}],
        generationConfig:{responseMimeType:"application/json",temperature:0},
      }),
    });
    if(!r.ok)return null;
    const data=await r.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
    const raw=data.candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("")??"";
    const p=JSON.parse(raw) as Record<string,unknown>;
    if(["alcohol","stress","attention","arousal"].some(k=>typeof p[k]!=="number"||!Number.isFinite(p[k])||(p[k] as number)<0||(p[k] as number)>1))return null;
    return {alcohol:p.alcohol as number,stress:p.stress as number,attention:p.attention as number,arousal:p.arousal as number};
  }catch{return null;}
  finally{clearTimeout(timeout);}
}
type NativeOutput={
 model:string;label:string;sampling_hz:number;seconds:number;seed:number;
 parameters:Record<string,number>;
 band_shares:Record<string,number>;
 regions:{id:string;neural:boolean;mean_excitation:number;source_current_magnitude:number}[];
 sensor_proxy:number[];
 limitations:string;
};

export const nativeNeuralStatus=createServerFn({method:"GET"}).handler(async()=>({
  configured:Boolean((process.env["NEUROPHYSICS_URL"]&&process.env["NEURO_SERVICE_TOKEN"])||process.env["NEUROPHYSICS_BIN"]),
  engine:"native C++ Wilson-Cowan v0.1",
  note:"Remote Python C++ service via NEUROPHYSICS_URL + NEURO_SERVICE_TOKEN, or compiled executable on a Node-capable server.",
}));

export const runNativeNeural=createServerFn({method:"POST"})
 .inputValidator((raw:unknown)=>CueInput.parse(raw))
 .handler(async({data})=>{
  const binary=process.env["NEUROPHYSICS_BIN"];
  const remote=process.env["NEUROPHYSICS_URL"]?.replace(/\/$/,"");
  const token=process.env["NEURO_SERVICE_TOKEN"];
  if(!(remote&&token)&&!binary)throw new Error("Native C++ unavailable: configure NEUROPHYSICS_URL and NEURO_SERVICE_TOKEN for the Python/C++ service.");
  const ai=await cueFromGemini(data.narrative);
  const heuristic=localCues(data.narrative,data.stress_tolerance);
  const source=ai?"gemini_json_cues":"explicit_lexical_cues";
  const cues={
   alcohol:data.alcohol??ai?.alcohol??heuristic.alcohol,
   stress:data.stress??ai?.stress??heuristic.stress,
   attention:data.attention??ai?.attention??heuristic.attention,
   arousal:data.arousal??ai?.arousal??heuristic.arousal,
  };
  const command=async(params:Params):Promise<NativeOutput>=>{
    let result:NativeOutput;
    if(remote&&token){
      // Cloudflare/Lovable runtimes cannot spawn native processes. Use a
      // private authenticated Python service over HTTPS instead.
      const r=await fetch(remote+"/api/neurophysics/simulate",{
        method:"POST",signal:AbortSignal.timeout(20000),
        headers:{"content-type":"application/json","authorization":"Bearer "+token},
        body:JSON.stringify({...params,seconds:data.seconds,seed:data.seed}),
      });
      if(!r.ok)throw new Error("Native service error HTTP "+r.status);
      result=await r.json() as NativeOutput;
    }else{
      // For self-hosted Node only; do not use on Cloudflare workers.
      const {execFile}=await import("node:child_process");
      const {promisify}=await import("node:util");
      const run=promisify(execFile);
      const argv=[params.alcohol,params.stress,params.attention,params.arousal,data.seconds,data.seed].map(String);
      const {stdout}=await run(binary!,argv,{timeout:15000,maxBuffer:200000,windowsHide:true});
      result=JSON.parse(stdout) as NativeOutput;
    }
    if(result?.model!=="wilson-cowan-regional-v0.1"||result.regions?.length!==50||result.sensor_proxy?.some(v=>!Number.isFinite(v)))throw new Error("Native model output invalid");
    return result;
  };
  const [actual,reference]=await Promise.all([command(cues),command({...cues,alcohol:0})]);
  const ref=new Map(reference.regions.map(x=>[x.id,x.mean_excitation]));
  const marker_deltas=Object.fromEntries(actual.regions.map(r=>[
    r.id,r.neural?Math.max(-1,Math.min(1,(r.mean_excitation-(ref.get(r.id)??r.mean_excitation))*4)):0,
  ]));
  return {
    source,assumptions:cues,
    label:"SYNTHETIC / UNCALIBRATED",actual,reference,marker_deltas,
    caveat:"Narrative cues, personality sliders and alcohol strength are scenario assumptions. Regional neural-mass equations are published; parameter values, anatomy positions and EEG projection are uncalibrated. Red/green depicts signed deviation from an alcohol-free reference, NOT good/bad health or moral value.",
  };
 });