import {describe,it,expect} from 'vitest';
import {BRAIN_REGIONS} from './anatomy';
import {DEFAULT_PROFILE,simulateNarrative,simulateGut} from './neuralScenario';
describe('Neural narrative prototype',()=>{
 it('has unique anatomical regions',()=>{expect(BRAIN_REGIONS.length).toBeGreaterThanOrEqual(50);expect(new Set(BRAIN_REGIONS.map(x=>x.id)).size).toBe(BRAIN_REGIONS.length)});
 it('is deterministic',()=>{expect(simulateNarrative(DEFAULT_PROFILE,'danger threat')).toEqual(simulateNarrative(DEFAULT_PROFILE,'danger threat'))});
 it('is narrative-sensitive',()=>{expect(simulateNarrative(DEFAULT_PROFILE,'danger threat attack').metrics.stress).toBeGreaterThan(simulateNarrative(DEFAULT_PROFILE,'rest and sleep').metrics.stress)});
 it('does not claim CSF fires',()=>{expect(simulateNarrative(DEFAULT_PROFILE,'danger').regions.find(r=>r.id==='aqueduct')?.index).toBe(0)});
 it('returns 5 gut indicators',()=>{expect(simulateGut({fiber:12,fermented:.2,protein:25,fat:20,added_sugar:12,time_hours:6}).indicators).toHaveLength(5)});
});
