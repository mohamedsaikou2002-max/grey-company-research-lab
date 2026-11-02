import {useEffect,useMemo,useState} from 'react';
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
 useEffect(()=>{try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))setProfiles(data.filter(p=>p&&typeof p.name==='string'&&p.traits));}catch{setNotice('Saved profiles could not be opened.');}},[]);
 const store=(next:PersonalityProfile[])=>{try{localStorage.setItem(KEY,JSON.stringify(next));setProfiles(next);return true;}catch{setNotice('Storage unavailable; use EXPORT.');return false;}};
 const save=()=>{const name=profile.name.trim();if(!name||name.length>90){setNotice('Use a name with 1–90 characters.');return;}
  const saved={...profile,id:profile.id==='new'?crypto.randomUUID():profile.id,name,created_at:new Date().toISOString()};
  const list=[saved,...profiles.filter(x=>x.id!==saved.id)].slice(0,50);if(store(list)){setProfile(saved);setNotice('Saved to this browser. Cross-device account sync is not enabled.');}
 };
 const erase=()=>{if(profile.id==='new')return;if(store(profiles.filter(p=>p.id!==profile.id))){setProfile({...DEFAULT_PROFILE,traits:{...DEFAULT_PROFILE.traits}});setNotice('Deleted local profile.');}};
 const activation=useMemo(()=>Object.fromEntries(result?.regions.map(x=>[x.id,x.index])||[]),[result]);
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
    <BrainExplorer activation={activation}/>
   </Panel>
  </div>
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
