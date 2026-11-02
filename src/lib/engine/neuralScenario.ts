import { BRAIN_REGIONS,type FunctionalTag } from './anatomy';
export type TraitKey='openness'|'conscientiousness'|'extraversion'|'agreeableness'|'emotional_sensitivity'|'stress_tolerance';
export const TRAIT_LABELS:Record<TraitKey,string>={openness:'Openness',conscientiousness:'Conscientiousness',extraversion:'Extraversion',agreeableness:'Agreeableness',emotional_sensitivity:'Emotional sensitivity',stress_tolerance:'Stress tolerance'};
export type PersonalityProfile={id:string;name:string;description:string;traits:Record<TraitKey,number>;created_at:string};
export const DEFAULT_PROFILE:PersonalityProfile={id:'new',name:'Balanced fictional profile',description:'A thoughtful, composed, cooperative fictional person.',created_at:'',traits:{openness:.55,conscientiousness:.7,extraversion:.45,agreeableness:.6,emotional_sensitivity:.5,stress_tolerance:.6}};
export const MODEL_VERSION='neural-narrative-heuristic-v1';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));const q=(v:number)=>+v.toFixed(3);
const LEXICON:Record<FunctionalTag,string[]>={
 threat:['threat','danger','attack','risk','fear','unsafe','loss','rejection','hostile','fired','conflict'],
 emotion:['love','grief','sad','happy','joy','betrayal','angry','anxious','hope'],
 reward:['success','money','win','reward','promotion','profit','gain','prize','food'],
 memory:['remember','past','recall','memory','childhood','study','learn'],
 language:['speech','speak','write','read','listen','message','debate'],
 vision:['see','watch','visual','picture','movie','image'],
 auditory:['hear','sound','music','voice','noise'],
 movement:['run','dance','exercise','move','walk','drive','lift'],
 executive:['plan','focus','solve','decision','calculate','analyze','deadline','work','strategy'],
 homeostasis:['hunger','thirst','pain','stomach','gut','food','eat','sleep','stress','nausea'],
 social:['group','family','partner','colleague','friend','team','leader','trust','reputation'],
 sleep:['sleep','night','dream','rest','tired','insomnia'],
 relay:['sensory','signal','information','relay','connect']
};
const CUES:Partial<Record<TraitKey,[string[],string[]]>>={
 stress_tolerance:[['stoic','calm','resilient','patient','composed'],['panicked','overwhelmed','fragile']],
 emotional_sensitivity:[['sensitive','anxious','reactive','vulnerable'],['unflappable','detached']],
 extraversion:[['social','outgoing','gregarious'],['introverted','solitary','reserved']],
 agreeableness:[['kind','cooperative','compassionate'],['hostile','combative']],
 conscientiousness:[['disciplined','organized','diligent'],['impulsive','disorganized']],
 openness:[['curious','creative','exploratory'],['rigid','conventional']]
};
export function parsePersonality(profile:PersonalityProfile){
 const words=new Set(profile.description.toLowerCase().match(/[a-z]+/g)||[]);
 const traits={...profile.traits},applied:string[]=[];
 for(const [k,groups] of Object.entries(CUES) as [TraitKey,[string[],string[]]][]){
  for(const word of groups[0])if(words.has(word)){traits[k]=clamp(traits[k]+.08);applied.push(word+' → '+k+' +0.08');}
  for(const word of groups[1])if(words.has(word)){traits[k]=clamp(traits[k]-.08);applied.push(word+' → '+k+' -0.08');}
 }
 return {traits,applied};
}
export function simulateNarrative(profile:PersonalityProfile,narrative:string){
 const words=new Set(narrative.toLowerCase().match(/[a-z]+/g)||[]);
 const tags=Object.fromEntries(Object.entries(LEXICON).map(([tag,keys])=>[tag,q(clamp(keys.filter(word=>words.has(word)).length/2.5))])) as Record<FunctionalTag,number>;
 const {traits,applied}=parsePersonality(profile);
 const stress=clamp(.15+tags.threat*.56+tags.homeostasis*.2+traits.emotional_sensitivity*.22-traits.stress_tolerance*.23);
 const cognitive=clamp(.18+tags.executive*.45+tags.language*.2+traits.conscientiousness*.18);
 const novelty=clamp(.15+tags.reward*.45+traits.openness*.25);
 const social=clamp(.15+tags.social*.5+traits.agreeableness*.23+traits.extraversion*.12);
 const regions=BRAIN_REGIONS.map(region=>({id:region.id,label:region.label,system:region.system,note:region.note,index:region.system==='CSF'?0:q(clamp(.13+region.tags.reduce((s,k)=>s+tags[k],0)/region.tags.length*.55+(region.tags.includes('threat')?stress*.12:0)+(region.tags.includes('executive')?cognitive*.12:0)))}));
 const neurochemistry=[
  {id:'dopamine',name:'Dopamine',index:q(clamp(.32+novelty*.3+tags.reward*.2-stress*.09)),meaning:'Reward-prediction proxy'},
  {id:'norepinephrine',name:'Norepinephrine',index:q(clamp(.2+stress*.46+cognitive*.2)),meaning:'Arousal proxy'},
  {id:'cortisol',name:'Cortisol',index:q(clamp(.17+stress*.65)),meaning:'Stress-axis proxy'},
  {id:'serotonin',name:'Serotonin',index:q(clamp(.36+social*.16-stress*.13)),meaning:'Neuromodulation hypothesis, not mood'},
  {id:'acetylcholine',name:'Acetylcholine',index:q(clamp(.25+cognitive*.52)),meaning:'Attention proxy'},
  {id:'glutamate',name:'Glutamate',index:q(clamp(.3+cognitive*.22+tags.movement*.12)),meaning:'Excitatory signaling placeholder'},
  {id:'gaba',name:'GABA',index:q(clamp(.48+traits.stress_tolerance*.12-stress*.14)),meaning:'Inhibitory signaling placeholder'},
  {id:'oxytocin',name:'Oxytocin',index:q(clamp(.2+social*.28)),meaning:'Context-dependent social signal'}
 ];
 const timeline=Array.from({length:24},(_,i)=>{const t=i/23;return {second:Math.round(t*120),stress:q(stress*(.45+.55*Math.sin(Math.PI*t))),attention:q(cognitive*(.6+.4*t)),reward:q(novelty*(.5+.5*Math.sin(Math.PI*Math.min(1,t+.2))))};});
 return {version:MODEL_VERSION,kind:'SYNTHETIC / UNVALIDATED',profile_id:profile.id,narrative,applied,traits,tags,metrics:{stress:q(stress),cognitive_load:q(cognitive),reward_salience:q(novelty),social_salience:q(social)},regions,neurochemistry,timeline};
}
export type FoodInput={fiber:number;fermented:number;protein:number;fat:number;added_sugar:number;time_hours:number};
export function simulateGut(food:FoodInput){
 const f=clamp(food.fiber/30),ferm=clamp(food.fermented),fat=clamp(food.fat/60),protein=clamp(food.protein/100),sugar=clamp(food.added_sugar/60),t=clamp(food.time_hours/48);
 return {kind:'EDUCATIONAL TOY MODEL',indicators:[
 {label:'Fermentation substrate',index:q(clamp(.18+.58*f+.16*ferm))},
 {label:'SCFA formation potential',index:q(clamp(.2+.5*f*t+.15*ferm*t))},
 {label:'Gastric emptying delay',index:q(clamp(.15+.56*fat+.17*protein))},
 {label:'Glucose excursion potential',index:q(clamp(.2+.55*sugar+.1*(1-f)))},
 {label:'Vagal/interoceptive proxy',index:q(clamp(.2+.24*f+.16*fat+.12*protein))}
 ],caveat:'No validated microbiome, endocrine or individual physiology parameters; not suitable for medical decisions.'};
}
