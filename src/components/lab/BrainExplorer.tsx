import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {BRAIN_REGIONS} from '@/lib/engine/anatomy';

/** WebGL educational viewer; approximate markers are not MRI segmentation. */
export function BrainExplorer({activation}:{activation:Record<string,number>}){
 const mount=useRef<HTMLDivElement>(null);
 const [cut,setCut]=useState(true),[shellOpacity,setShellOpacity]=useState(.24);
 const [showMarkers,setShowMarkers]=useState(true),[selected,setSelected]=useState('thalamus');
 const [asset,setAsset]=useState<string|null>(null),[status,setStatus]=useState('Procedural cutaway');
 const selectedInfo=useMemo(()=>BRAIN_REGIONS.find(x=>x.id===selected),[selected]);
 useEffect(()=>()=>{if(asset)URL.revokeObjectURL(asset)},[asset]);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x080808);
  const width=Math.max(host.clientWidth,300),height=400;
  const camera=new THREE.PerspectiveCamera(42,width/height,.01,100);
  camera.position.set(2.3,1.3,3.4);camera.lookAt(0,0,0);
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setStatus('WebGL unavailable on this device');return;}
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(width,height);renderer.localClippingEnabled=true;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x202020,2));
  const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,4,5);scene.add(light);
  const group=new THREE.Group();scene.add(group);
  const clip=new THREE.Plane(new THREE.Vector3(1,0,0),.05);
  const surface=()=>new THREE.MeshPhysicalMaterial({color:0xbebebe,roughness:.86,metalness:0,side:THREE.DoubleSide,transparent:true,opacity:shellOpacity,depthWrite:false,clippingPlanes:cut?[clip]:[]});
  const addEllipsoid=(pos:[number,number,number],scale:[number,number,number],material:THREE.Material)=>{
   const m=new THREE.Mesh(new THREE.SphereGeometry(1,30,22),material);m.position.set(...pos);m.scale.set(...scale);group.add(m);return m;
  };
  const base=surface();
  const fallback=new THREE.Group();group.add(fallback);
  // Layered schematic cortical shell, cerebellum, brainstem and inner gray/white structures.
  const cortical=[
   [[-.39,.17,0],[.58,.67,.87]],[[.39,.17,0],[.58,.67,.87]],
   [[-.36,.35,.42],[.48,.42,.44]],[[.36,.35,.42],[.48,.42,.44]],
   [[-.35,.42,-.35],[.49,.46,.50]],[[.35,.42,-.35],[.49,.46,.50]]
  ] as [number[],number[]][];
  for(const [p,s] of cortical){
   const m=new THREE.Mesh(new THREE.SphereGeometry(1,36,26),base.clone());
   m.position.set(p[0],p[1],p[2]);m.scale.set(s[0],s[1],s[2]);fallback.add(m);
  }
  const innerMat=new THREE.MeshStandardMaterial({color:0x898989,roughness:.9,transparent:true,opacity:.44});
  const parts=[
   [[0,.07,.06],[.20,.14,.22]],[[0,-.38,-.35],[.13,.32,.15]],
   [[0,-.48,-.65],[.43,.28,.3]],[[-.12,.27,.04],[.25,.07,.28]],
   [[-.3,-.25,-.1],[.18,.09,.25]],[[.3,-.25,-.1],[.18,.09,.25]]
  ] as [number[],number[]][];
  for(const [p,s] of parts){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),innerMat.clone());m.position.set(p[0],p[1],p[2]);m.scale.set(s[0],s[1],s[2]);fallback.add(m);}
  // Simplified axonal connections help illustrate distributed activity, not biological tractography.
  const fibers=['prefrontal','thalamus','hippocampus','amygdala','hypothalamus','pons','cerebellum','occipital'];
  const path=fibers.map(id=>BRAIN_REGIONS.find(r=>r.id===id)!.position);
  for(let i=1;i<path.length;i++){
   const a=new THREE.Vector3(...path[i-1]),b=new THREE.Vector3(...path[i]);
   const curve=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:0x555555,transparent:true,opacity:.65}));group.add(curve);
  }
  const pickerMeshes:THREE.Mesh[]=[];
  if(showMarkers)for(const region of BRAIN_REGIONS){
   const power=activation[region.id]??.12;
   const radius=region.system==='CSF'?.012:.024+.035*power;
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,12,10),new THREE.MeshBasicMaterial({color:region.id===selected?0xffffff:power>.45?0xffffff:0x8d8d8d,transparent:true,opacity:region.id===selected?1:.25+.68*power,depthTest:false}));
   mesh.position.set(...region.position);mesh.userData.region=region.id;mesh.renderOrder=2;group.add(mesh);pickerMeshes.push(mesh);
  }
  let disposed=false;
  if(asset){
   new GLTFLoader().load(asset,g=>{
    if(disposed)return;
    const bbox=new THREE.Box3().setFromObject(g.scene);
    const size=bbox.getSize(new THREE.Vector3());const center=bbox.getCenter(new THREE.Vector3());
    const largest=Math.max(size.x,size.y,size.z)||1;
    g.scene.position.sub(center);g.scene.scale.multiplyScalar(1.9/largest);
    g.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.material=surface();o.renderOrder=0;}});
    group.remove(fallback);group.add(g.scene);setStatus('Uploaded GLB loaded · cutaway and markers active');
   },undefined,()=>{if(!disposed)setStatus('Unable to read GLB · using procedural fallback');});
  }
  const canvas=renderer.domElement,ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let yaw=.15,pitch=-.14,zoom=1,down=false,lastX=0,lastY=0,movement=0,frame=0;
  const onDown=(e:PointerEvent)=>{down=true;movement=0;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
  const onMove=(e:PointerEvent)=>{if(!down)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;movement+=Math.abs(dx)+Math.abs(dy);yaw+=dx*.008;pitch=Math.max(-1.2,Math.min(1.2,pitch+dy*.006));lastX=e.clientX;lastY=e.clientY;};
  const onUp=(e:PointerEvent)=>{down=false;if(movement>5)return;const rect=canvas.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(pickerMeshes);if(hits.length)setSelected(hits[0].object.userData.region as string);};
  const onWheel=(e:WheelEvent)=>{e.preventDefault();zoom=Math.max(.5,Math.min(2.8,zoom+e.deltaY*.001));};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
  const animate=()=>{group.rotation.y=yaw;group.rotation.x=pitch;camera.position.set(2.3*zoom,1.3*zoom,3.4*zoom);camera.lookAt(0,0,0);renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
  const observer=new ResizeObserver(()=>{const w=Math.max(host.clientWidth,300);camera.aspect=w/height;camera.updateProjectionMatrix();renderer.setSize(w,height);});observer.observe(host);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('wheel',onWheel);
   scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}if(o instanceof THREE.Line){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();if(host.contains(canvas))host.removeChild(canvas);
  };
 },[activation,asset,cut,shellOpacity,showMarkers,selected]);
 return <div className="space-y-3">
  <div className="flex flex-wrap items-center gap-3 text-xs">
   <label className="flex items-center gap-1"><input type="checkbox" checked={cut} onChange={e=>setCut(e.target.checked)}/> Sagittal cutaway</label>
   <label className="flex items-center gap-1"><input type="checkbox" checked={showMarkers} onChange={e=>setShowMarkers(e.target.checked)}/> Region markers</label>
   <label>Shell opacity <input type="range" min=".05" max="1" step=".05" value={shellOpacity} onChange={e=>setShellOpacity(+e.target.value)}/></label>
  </div>
  <div ref={mount} className="w-full min-h-[400px] border border-border" role="img" aria-label="Interactive educational 3D brain cutaway"/>
  <div className="flex flex-wrap gap-2 items-center justify-between">
   <span className="text-[11px] text-muted-foreground">{status} · Drag to rotate · Scroll to zoom · Click marker to inspect</span>
   <label className="cursor-pointer border border-border px-2 py-1 text-xs">LOAD YOUR BRAIN GLB<input className="sr-only" type="file" accept=".glb,model/gltf-binary" onChange={e=>{const file=e.target.files?.[0];if(file){if(file.size>80000000){setStatus('Choose a model under 80 MB');return;}setAsset(URL.createObjectURL(file));setStatus('Loading uploaded GLB…');}}}/></label>
  </div>
  <select className="w-full border border-border bg-background px-2 py-2 text-sm" aria-label="Select anatomical structure" value={selected} onChange={e=>setSelected(e.target.value)}>
   {BRAIN_REGIONS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
  </select>
  <p className="text-xs">{selectedInfo?.system} · illustrative response index {Math.round(100*(activation[selected]??0))}/100</p>
  <p className="text-xs text-muted-foreground">{selectedInfo?.note}. Coordinates are approximate, not atlas-registered and cannot reveal real neural firing.</p>
 </div>;
}
