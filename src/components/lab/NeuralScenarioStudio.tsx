import {useEffect,useMemo,useState} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {nativeNeuralStatus,runNativeNeural} from '@/lib/neurophysics.functions';
import {Line,LineChart,ResponsiveContainer,XAxis,YAxis,Tooltip} from 'recharts';
import {Panel,Tag} from '@/components/lab/Shell';
import {Field,inputCls,download} from '@/components/lab/controls';
import {BrainExplorer} from './BrainExplorer';
import {DEFAULT_PROFILE,TRAIT_LABELS,simulateNarrative,simulateGut,type PersonalityProfile,type TraitKey,type FoodInput} from '@/lib/engine/neuralScenario';
const KEY='greycompany-neural-personality-v1';
const traits=Object.keys(TRAIT_LABELS) as TraitKey[];
const baseline:FoodInput={fiber:12,fermented:.2,protein:25,fat:20,added_sugar:12,time_hours:6};
const cl=(n:number)=>Math.min(1,Math.max(0,n));
export function NeuralScenarioStudio(){
 const [profiles,setProfiles]=useState<PersonalityProfile[]>([]);
 const [profile,setProfile]=useState<PersonalityProfile>({...DEFAULT_PROFILE,traits:{...DEFAULT_PROFILE.traits}});
 const [narrative,setNarrative]=useState('A colleague asks for help with a difficult project under an approaching deadline.');
 const [result,setResult]=useState<ReturnType<typeof simulateNarrative>|null>(null);
 const [food,setFood]=useState<FoodInput>(baseline),[gut,setGut]=useState<ReturnType<typeof simulateGut>|null>(null);
 const [notice,setNotice]=useState('');
 const fNative=useServerFn(runNativeNeural),fNativeStatus=useServerFn(nativeNeuralStatus);
 const [nativeAvailable,setNativeAvailable]=useState(false);
 const [nativeBusy,setNativeBusy]=useState(false),[nativeError,setNativeError]=useState('');
 const [nativeRun,setNativeRun]=useState<Awaited<ReturnType<typeof runNativeNeural>>|null>(null);
 const [nativeAlcohol,setNativeAlcohol]=useState<number|null>(null);
 const [nativeSeconds,setNativeSeconds]=useState(3),[nativeSeed,setNativeSeed]=useState(19);
 useEffect(()=>{fNativeStatus().then(s=>setNativeAvailable(s.configured)).catch(()=>setNativeAvailable(false));},[fNativeStatus]);
 const runPhysics=async()=>{setNativeBusy(true);setNativeError('');try{
  const result=await fNative({data:{
   narrative,seed:nativeSeed,seconds:nativeSeconds,alcohol:nativeAlcohol,
   stress:null,attention:null,arousal:null,stress_tolerance:profile.traits.stress_tolerance
  }});
  setNativeRun(result);
 }catch(e){setNativeRun(null);setNativeError((e as Error).message);}finally{setNativeBusy(false);}};

 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))setProfiles(data.filter(p=>p&&typeof p.name==='string'&&p.traits));}catch{setNotice('Saved profiles could not be opened.');}},[]);
 const store=(next:PersonalityProfile[])=>{try{localStorage.setItem(KEY,JSON.stringify(next));setProfiles(next);return true;}catch{setNotice('Storage unavailable; use EXPORT.');return false;}};
 const save=()=>{const name=profile.name.trim();if(!name||name.length>90){setNotice('Use a name with 1–90 characters.');return;}
  const saved={...profile,id:profile.id==='new'?crypto.randomUUID():profile.id,name,created_at:new Date().toISOString()};
  const list=[saved,...profiles.filter(x=>x.id!==saved.id)].slice(0,50);if(store(list)){setProfile(saved);setNotice('Saved to this browser. Cross-device account sync is not enabled.');}
 };
 const erase=()=>{if(profile.id==='new')return;if(store(profiles.filter(p=>p.id!==profile.id))){setProfile({...DEFAULT_PROFILE,traits:{...DEFAULT_PROFILE.traits}});setNotice('Deleted local profile.');}};
 const activation=useMemo(()=>nativeRun
  ?Object.fromEntries(nativeRun.actual.regions.map(r=>[r.id,r.mean_excitation]))
  :Object.fromEntries(result?.regions.map(x=>[x.id,x.index])||[]),[result,nativeRun]);
 return <div className="space-y-4">
  <div className="grid gap-4 lg:grid-cols-12">
   <Panel title="01 / Personality library" className="lg:col-span-3" actions={<Tag>SAVEABLE PROFILE</Tag>}>
    <div className="space-y-3">
     <Field label="Load named profile"><select className={inputCls} value={profiles.some(p=>p.id===profile.id)?profile.id:'new'} onChange={e=>setProfile(profiles.find(p=>p.id===e.target.value)||{...DEFAULT_PROFILE,traits:{...DEFAULT_PROFILE.traits}})}><option value="new">New / example personality</option>{profiles.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></Field>
     <Field label="Personality name"><input className={inputCls} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} maxLength={90}/></Field>
     <Field label="Describe personality in text"><textarea rows={5} className={inputCls} value={profile.description} onChange={e=>setProfile({...profile,description:e.target.value})} placeholder="Traits, habits, goals, stress responses, social tendencies…"/></Field>
     <details><summary className="cursor-pointer text-xs">Adjust baseline traits</summary><div className="mt-2 space-y-2">{traits.map(k=><label className="block text-xs" key={k}><span>{TRAIT_LABELS[k]} · {profile.traits[k].toFixed(2)}</span><input type="range" min="0" max="1" step=".05" value={profile.traits[k]} className="block w-full" onChange={e=>setProfile({...profile,traits:{...profile.traits,[k]:cl(+e.target.value)}})}/></label>)}</div></details>
     <p className="text-[11px] text-muted-foreground">Personality-text keywords adjust selected traits by ±0.08. This is an explicit research heuristic, not a psychometric diagnosis.</p>
     <div className="flex flex-wrap gap-2"><button className="bg-white px-3 py-2 text-xs text-black" type="button" onClick={save}>SAVE</button><button className="border border-border px-3 py-2 text-xs" type="button" onClick={erase} disabled={profile.id==='new'}>DELETE</button><button className="border border-border px-3 py-2 text-xs" type="button" onClick={()=>download('neural-personality.json',JSON.stringify(profile,null,2))}>EXPORT</button></div>
     {notice&&<p className="text-xs text-muted-foreground" role="status">{notice}</p>}
    </div>
   </Panel>
   <Panel title="02 / Narrative → response" className="lg:col-span-4" actions={<Tag>ONE FICTIONAL PERSON</Tag>}>
    <div className="space-y-3">
     <Field label="Describe an event or dilemma"><textarea className={inputCls} rows={7} value={narrative} onChange={e=>setNarrative(e.target.value)} placeholder="What happens to the saved personality?"/></Field>
     <button className="bg-white px-4 py-2 text-sm text-black" type="button" onClick={()=>{if(!narrative.trim()){setNotice('Enter a narrative.');return;}setResult(simulateNarrative(profile,narrative));}}>RUN SYNTHETIC RESPONSE</button>
     <p className="text-xs text-muted-foreground">Input: named traits + descriptive text + narrative. Output: transparent heuristic response, illustrative brain-region indices and possible neurochemical-signaling hypotheses.</p>
     {result&&<>
      <div className="grid grid-cols-2 gap-2">{Object.entries(result.metrics).map(([k,v])=><div className="border border-border p-2" key={k}><div className="text-[11px] capitalize">{k.replaceAll('_',' ')}</div><strong className="font-mono text-lg">{Math.round(v*100)}/100</strong></div>)}</div>
      <div className="h-32"><ResponsiveContainer><LineChart data={result.timeline}><XAxis dataKey="second" hide/><YAxis domain={[0,1]} hide/><Tooltip/><Line type="monotone" dataKey="stress" stroke="#ffffff" dot={false}/><Line type="monotone" dataKey="attention" stroke="#888888" dot={false}/><Line type="monotone" dataKey="reward" stroke="#555555" strokeDasharray="4 3" dot={false}/></LineChart></ResponsiveContainer></div>
      <p className="text-[11px] text-muted-foreground">Text cues: {result.applied.length?result.applied.join('; '):'none, using baseline traits'}</p>
      <button className="border border-border px-3 py-2 text-xs" onClick={()=>download('neural-scenario.json',JSON.stringify(result,null,2))}>EXPORT RESPONSE DATA</button>
     </>}
    </div>
   </Panel>
   <Panel title="03 / 3D brain & inner anatomy" className="lg:col-span-5" actions={<Tag>50 STRUCTURES</Tag>}>
    <BrainExplorer activation={activation} delta={nativeRun?.marker_deltas}/>
   </Panel>
  </div>
  <Panel title="04 / Native neural-mass electricity · C++" actions={<Tag>{nativeAvailable?"NATIVE CONFIGURED":"NATIVE NOT DEPLOYED"}</Tag>}>
   <div className="grid gap-3 md:grid-cols-4">
    <Field label="Assumed alcohol intensity (not BAC)">
     <select className={inputCls} value={nativeAlcohol===null?"auto":String(nativeAlcohol)} onChange={e=>setNativeAlcohol(e.target.value==="auto"?null:Number(e.target.value))}>
      <option value="auto">Narrative auto-cue</option>
      <option value="0">0 · no alcohol</option><option value="0.25">0.25 · hypothetical low</option>
      <option value="0.5">0.5 · hypothetical medium</option><option value="0.75">0.75 · hypothetical high</option>
      <option value="1">1 · maximum stress-test</option>
     </select>
    </Field>
    <Field label="Seconds"><input className={inputCls} type="number" min={1} max={5} step={1} value={nativeSeconds} onChange={e=>setNativeSeconds(Math.max(1,Math.min(5,Math.round(+e.target.value)||3)))}/></Field>
    <Field label="Seed"><input className={inputCls} type="number" min={0} max={1000000} step={1} value={nativeSeed} onChange={e=>setNativeSeed(Math.max(0,Math.min(1000000,Math.round(+e.target.value)||0)))}/></Field>
    <div className="flex flex-col justify-end gap-1">
     <button type="button" className="bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40" disabled={!nativeAvailable||nativeBusy||!narrative.trim()} onClick={runPhysics}>{nativeBusy?"SIMULATING…":"RUN NATIVE C++"}</button>
     <p className="text-[10px] text-muted-foreground">Server executable required.</p>
    </div>
   </div>
   {!nativeAvailable&&<p className="mt-2 text-xs text-muted-foreground">Native C++ is not configured on this host. Build native/neurophysics.cpp and set the server-only NEUROPHYSICS_BIN path. The existing TypeScript narrative model remains available.</p>}
   {nativeError&&<p className="mt-2 text-xs text-red-400" role="alert">{nativeError}</p>}
   {nativeRun&&<div className="mt-3 space-y-3">
    <div className="text-xs text-muted-foreground">AI buffer: {nativeRun.source.replaceAll("_"," ")} · C++ model: {nativeRun.actual.model} · seed {nativeRun.actual.seed} · {nativeRun.actual.regions.length} anatomy markers</div>
    <p className="text-xs text-muted-foreground">{nativeRun.caveat}</p>
    <div className="grid gap-3 md:grid-cols-2">
     <div className="border border-border p-3">
      <div className="mb-2 text-xs font-semibold">Synthetic EEG-frequency-band shares (virtual sensor)</div>
      {Object.entries(nativeRun.actual.band_shares).map(([band,p])=><div className="flex justify-between text-xs font-mono" key={band}><span>{band}</span><span>{(100*p).toFixed(1)}%</span></div>)}
     </div>
     <div className="border border-border p-3">
      <div className="mb-2 text-xs font-semibold">User-selected scenario assumptions</div>
      {Object.entries(nativeRun.assumptions).map(([k,v])=><div className="flex justify-between text-xs font-mono" key={k}><span>{k}</span><span>{Number(v).toFixed(2)}</span></div>)}
     </div>
    </div>
    <div className="h-36"><ResponsiveContainer><LineChart data={nativeRun.actual.sensor_proxy.map((v,i)=>({t:i*nativeRun.actual.seconds/nativeRun.actual.sensor_proxy.length,signal:v}))}><XAxis dataKey="t" hide/><YAxis hide/><Tooltip/><Line dataKey="signal" type="monotone" dot={false} stroke="#ffffff" isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
    <button className="border border-border px-3 py-2 text-xs" onClick={()=>download("native-neurophysics-result.json",JSON.stringify(nativeRun,null,2))}>EXPORT NATIVE COMPARISON</button>
   </div>}
  </Panel>
  <div className="grid gap-4 lg:grid-cols-12">
   <Panel title="Neurochemical signaling indices" className="lg:col-span-7" actions={<Tag>NOT MEASURED</Tag>}>
    {result?<div className="grid gap-3 sm:grid-cols-2">{result.neurochemistry.map(x=><div key={x.id}><div className="flex justify-between gap-2 text-xs"><span>{x.name}</span><span>{Math.round(x.index*100)}/100</span></div><div className="mt-1 h-2 bg-zinc-800"><div className="h-full bg-white" style={{width:(x.index*100)+'%'}}/></div><p className="text-[10px] text-muted-foreground mt-1">{x.meaning}</p></div>)}</div>:<p className="text-xs text-muted-foreground">Run a narrative to explore dopamine, norepinephrine, cortisol, serotonin, acetylcholine, glutamate, GABA and oxytocin as model indices, not concentrations.</p>}
   </Panel>
   <Panel title="Gut–brain axis educational sandbox" className="lg:col-span-5" actions={<Tag>TOY MODEL</Tag>}>
    <div className="grid grid-cols-2 gap-2">{(Object.keys(food) as (keyof FoodInput)[]).map(k=><Field label={k.replaceAll('_',' ')} key={k}><input className={inputCls} type="number" min={0} max={k==='time_hours'?48:120} step={k==='fermented'?.1:1} value={food[k]} onChange={e=>setFood({...food,[k]:Math.max(0,Number(e.target.value)||0)})}/></Field>)}</div>
    <p className="my-2 text-[10px] text-muted-foreground">Fiber, protein, fat and added sugar in grams; fermented food as 0–1 relative index; time in hours.</p>
    <button className="border border-border px-3 py-2 text-xs" onClick={()=>setGut(simulateGut(food))}>MODEL GUT AXIS</button>
    {gut&&<div className="mt-3 space-y-2">{gut.indicators.map(x=><div className="flex justify-between text-xs" key={x.label}><span>{x.label}</span><span>{Math.round(x.index*100)}/100</span></div>)}<p className="text-xs text-muted-foreground">{gut.caveat}</p></div>}
   </Panel>
  </div>
  <p className="text-xs text-muted-foreground">SYNTHETIC / UNVALIDATED. Personality prose cannot reveal actual thought, firing activity, gut response, neurotransmitters or hormones. Anatomical positions are approximate educational markers. Medical or experimental use requires real datasets and independent calibration.</p>
 </div>;
}
