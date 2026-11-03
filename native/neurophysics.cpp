// NeuroAtlas research prototype: region-level Wilson-Cowan population model.
// References: Wilson & Cowan 1972 doi:10.1016/S0006-3495(72)86068-5;
// Jansen & Rit 1995 doi:10.1007/BF00199471 (context, not exact implementation);
// Buzsaki et al. 2012 doi:10.1038/nrn3241 (EEG origins);
// Sanz Leon et al. 2013 doi:10.3389/fninf.2013.00010 (whole-brain modelling).
// Region locations are schematic UI markers, NOT registered structural MRI.
// Parameters and pseudo-EEG projection are hypothetical, not calibrated.
// Does NOT compute real EEG microvolts, neurotransmitter concentrations,
// magnetic fields, thoughts, or an individual's actual response.
//
// Build: g++ -std=c++17 -O2 -Wall -Wextra native/neurophysics.cpp -o neurophysics
// Usage: ./neurophysics [alcohol 0..1] [stress 0..1] [attention 0..1]
//       [arousal 0..1] [seconds 1..8] [seed 0..1000000]
// Output: bounded JSON, relative/unitless electrophysiology indices.
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <limits>
#include <random>
#include <stdexcept>
#include <string>
#include <vector>
struct Region {const char *id; const char *system; double x,y,z;};
const std::array<Region, 50> REGIONS = {{
  {"prefrontal", "Cortex", 0.000, 0.290, 0.700},
  {"dlpfc", "Cortex", -0.450, 0.340, 0.490},
  {"vm_pfc", "Cortex", 0.000, 0.060, 0.630},
  {"ofc", "Cortex", 0.340, 0.040, 0.590},
  {"acc", "Cortex", 0.000, 0.330, 0.300},
  {"pcc", "Cortex", 0.000, 0.350, -0.290},
  {"insula", "Cortex", -0.550, 0.080, 0.100},
  {"frontal", "Cortex", 0.480, 0.480, 0.440},
  {"parietal", "Cortex", -0.490, 0.540, -0.130},
  {"temporal", "Cortex", 0.540, -0.120, 0.030},
  {"occipital", "Cortex", 0.000, 0.340, -0.750},
  {"motor", "Cortex", 0.400, 0.610, 0.210},
  {"somatosensory", "Cortex", -0.420, 0.640, 0.080},
  {"broca", "Cortex", -0.550, 0.170, 0.440},
  {"wernicke", "Cortex", -0.540, 0.020, -0.420},
  {"auditory_cortex", "Cortex", -0.500, -0.140, -0.130},
  {"visual_cortex", "Cortex", 0.000, 0.170, -0.820},
  {"gray_matter", "Tissue", 0.600, 0.550, 0.200},
  {"white_matter", "Tissue", 0.120, 0.310, 0.000},
  {"corpus_callosum", "Fiber tracts", 0.000, 0.250, 0.070},
  {"internal_capsule", "Fiber tracts", -0.170, -0.080, 0.100},
  {"thalamus", "Diencephalon", 0.000, 0.050, 0.060},
  {"hypothalamus", "Diencephalon", 0.000, -0.150, 0.170},
  {"pituitary", "Diencephalon", 0.000, -0.330, 0.240},
  {"pineal", "Diencephalon", 0.000, 0.090, -0.260},
  {"mammillary", "Diencephalon", 0.000, -0.200, -0.070},
  {"hippocampus", "Limbic", -0.350, -0.280, -0.130},
  {"amygdala", "Limbic", 0.340, -0.280, 0.240},
  {"basal_ganglia", "Subcortical", 0.200, 0.050, 0.230},
  {"caudate", "Subcortical", -0.190, 0.140, 0.240},
  {"putamen", "Subcortical", 0.280, -0.030, 0.180},
  {"pallidum", "Subcortical", 0.220, -0.080, 0.050},
  {"accumbens", "Subcortical", 0.000, -0.120, 0.320},
  {"substantia_nigra", "Midbrain", 0.110, -0.280, -0.190},
  {"vta", "Midbrain", -0.090, -0.280, -0.230},
  {"midbrain", "Brainstem", 0.000, -0.330, -0.290},
  {"superior_colliculus", "Midbrain", 0.000, -0.240, -0.390},
  {"inferior_colliculus", "Midbrain", 0.000, -0.390, -0.420},
  {"cerebral_peduncle", "Brainstem", 0.200, -0.360, -0.210},
  {"pons", "Brainstem", 0.000, -0.480, -0.370},
  {"medulla", "Brainstem", 0.000, -0.660, -0.470},
  {"cerebellum", "Hindbrain", 0.000, -0.440, -0.630},
  {"arbor_vitae", "Hindbrain", 0.000, -0.490, -0.680},
  {"cerebellar_peduncle", "Hindbrain", -0.220, -0.450, -0.490},
  {"aqueduct", "CSF", 0.000, -0.320, -0.320},
  {"lateral_ventricles", "CSF", -0.200, 0.190, 0.060},
  {"third_ventricle", "CSF", 0.000, -0.040, -0.020},
  {"fourth_ventricle", "CSF", 0.000, -0.460, -0.540},
  {"trigeminal", "Cranial nerves", 0.350, -0.510, -0.330},
  {"vagus", "Cranial nerves", -0.260, -0.780, -0.540}
}};
constexpr double PI=3.14159265358979323846;
double clamp(double n,double lo=0,double hi=1){return std::max(lo,std::min(hi,n));}
double sigmoid(double x){return 1.0/(1.0+std::exp(-4.0*(x-0.5)));}
double read(int argc,char**argv,int at,double fallback,double maximum){
 if(at>=argc)return fallback;
 char*end=nullptr;double d=std::strtod(argv[at],&end);
 if(end==argv[at]||*end!='\0'||!std::isfinite(d)||d<0||d>maximum)throw std::invalid_argument("invalid numeric input");
 return d;
}
bool neural(const Region&r){
 const std::string s=r.system;
 return s!="CSF"&&s!="Tissue"&&s!="Fiber tracts"&&s!="Cranial nerves";
}
struct State {double e=0.20,i=0.16;};
struct Node {double e=0.20,i=0.16,baseE=0.20,baseI=0.16;};
double near(const Region&a,const Region&b){
 double dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
 return std::exp(-(dx*dx+dy*dy+dz*dz)/(2*0.55*0.55));
}
int main(int argc,char**argv){
 try{
 const double alcohol=read(argc,argv,1,0,1),stress=read(argc,argv,2,.25,1);
 const double attention=read(argc,argv,3,.45,1),arousal=read(argc,argv,4,.50,1);
 const int seconds=int(read(argc,argv,5,3,8)), seed=int(read(argc,argv,6,19,1000000));
 constexpr int fs=128,integratorHz=512,substeps=integratorHz/fs;
 const int samples=seconds*fs,N=int(REGIONS.size());
 const double dt=1.0/integratorHz,tauE=.020,tauI=.010;
 std::vector<Node> nodes(N);
 std::vector<std::vector<double>> edges(N,std::vector<double>(N,0));
 for(int j=0;j<N;j++)if(neural(REGIONS[j])){
   double row=0;
   for(int k=0;k<N;k++)if(k!=j&&neural(REGIONS[k])){
      edges[j][k]=near(REGIONS[j],REGIONS[k]);row+=edges[j][k];
   }
   if(row>0)for(int k=0;k<N;k++)edges[j][k]/=row;
 }
 std::mt19937 rng(seed);std::normal_distribution<double> noise(0,1);
 std::vector<double> samplesOut;samplesOut.reserve(samples);
 std::vector<double> epochAbs(N,0),epochSum(N,0);
 // These multipliers are qualitative perturbations inspired by ethanol's
 // heterogeneous GABA_A and glutamate-receptor effects, NOT dose-response curves.
 const double gabaGain=1+0.25*alcohol;
 const double glutamateGain=1-0.20*alcohol;
 for(int t=0;t<samples*substeps;t++){
   const double time=double(t)/integratorHz;
   std::vector<State> updated(N);
   for(int j=0;j<N;j++){
     if(!neural(REGIONS[j])){updated[j]={0,0};continue;}
     const auto&r=REGIONS[j];
     const std::string id=r.id;
     const bool frontal=(id.find("prefrontal")!=std::string::npos||id=="dlpfc"||id=="vm_pfc"||id=="ofc"||id=="frontal");
     const bool amyg=(id=="amygdala");
     const bool cortex=(std::string(r.system)=="Cortex");
     const double oscillation=(cortex?0.045*std::sin(2*PI*10*time+j*0.13):0.025*std::sin(2*PI*6*time+j*0.17));
     double afferent=0;for(int k=0;k<N;k++)afferent+=edges[j][k]*nodes[k].e;
     const double alcoholFrontalBias=frontal?(-0.12*alcohol):0.0;
     // Amygdala response is task/context dependent: no blanket suppression.
     const double amygBias=amyg?(0.03*stress-0.025*alcohol):0.0;
     const double external=.12+.12*attention*(frontal?1:0.45)+.11*stress+oscillation+alcoholFrontalBias+amygBias;
     const double eDrive=glutamateGain*(1.65*nodes[j].e+0.26*afferent)-gabaGain*1.15*nodes[j].i+external;
     const double iDrive=1.35*nodes[j].e-0.40*nodes[j].i+.10+.07*arousal;
     double de=(-nodes[j].e+sigmoid(eDrive))/tauE;
     double di=(-nodes[j].i+sigmoid(iDrive))/tauI;
     updated[j].e=clamp(nodes[j].e+dt*de);
     updated[j].i=clamp(nodes[j].i+dt*di);
   }
   for(int j=0;j<N;j++){nodes[j].e=updated[j].e;nodes[j].i=updated[j].i;}
   if(t%substeps==0){
     double channel=0,weights=0;
     for(int j=0;j<N;j++)if(neural(REGIONS[j])){
       const auto&r=REGIONS[j];
       const double lead=(std::string(r.system)=="Cortex"?1.0:0.25)*std::exp(-std::pow(r.x-0.3,2)/.65);
       const double current=nodes[j].e-nodes[j].i;
       channel+=lead*current;weights+=lead;
       epochAbs[j]+=std::fabs(current);epochSum[j]+=nodes[j].e;
     }
     // One virtual sensor. Linear source projection is illustrative only,
     // NOT a head-conductivity/Maxwell forward solution.
     const double pseudoEeg=(channel/std::max(1.0,weights)-0.05)+0.004*noise(rng);
     samplesOut.push_back(pseudoEeg);
   }
 }
 // Estimate band shares using a direct discrete Fourier transform; O(N^2)
 // bounded by 8s*128 samples. No user EEG is involved.
 const int M=int(samplesOut.size());double mean=0;
 for(double v:samplesOut)mean+=v;mean/=M;
 std::array<double,5> band={0,0,0,0,0};double total=0;
 const std::array<double,6> borders={.5,4,8,13,30,64};
 for(int k=1;k<=M/2;k++){
   double freq=double(k)*fs/M;if(freq<.5||freq>=64)continue;
   double re=0,im=0;
   for(int n=0;n<M;n++){
     const double window=.5*(1-std::cos(2*PI*n/(M-1)));
     const double ang=2*PI*k*n/M,v=(samplesOut[n]-mean)*window;
     re+=v*std::cos(ang);im-=v*std::sin(ang);
   }
   const double p=(re*re+im*im)/(M*M);
   for(int b=0;b<5;b++)if(freq>=borders[b]&&freq<borders[b+1]){band[b]+=p;total+=p;break;}
 }
 std::cout<<std::fixed<<std::setprecision(6);
 std::cout<<"{\"model\":\"wilson-cowan-regional-v0.1\",\"label\":\"SYNTHETIC / UNCALIBRATED\","
          <<"\"sampling_hz\":"<<fs<<",\"seconds\":"<<seconds<<",\"seed\":"<<seed
          <<",\"parameters\":{\"alcohol_assumed\":"<<alcohol<<",\"stress_assumed\":"<<stress
          <<",\"attention_assumed\":"<<attention<<",\"arousal_assumed\":"<<arousal
          <<",\"relative_gaba_gain\":"<<gabaGain<<",\"relative_glutamate_gain\":"<<glutamateGain
          <<"},\"band_shares\":{\"delta\":"<<band[0]/std::max(1e-20,total)
          <<",\"theta\":"<<band[1]/std::max(1e-20,total)
          <<",\"alpha\":"<<band[2]/std::max(1e-20,total)
          <<",\"beta\":"<<band[3]/std::max(1e-20,total)
          <<",\"gamma\":"<<band[4]/std::max(1e-20,total)<<"},\"regions\":[";
 for(int j=0;j<N;j++){
   if(j)std::cout<<",";
   const bool active=neural(REGIONS[j]);
   std::cout<<"{\"id\":\""<<REGIONS[j].id<<"\",\"neural\":"<<(active?"true":"false")
       <<",\"mean_excitation\":"<<(active?epochSum[j]/samples:0)
       <<",\"source_current_magnitude\":"<<(active?epochAbs[j]/samples:0)<<"}";
 }
 std::cout<<"],\"sensor_proxy\":[";
 const int stride=std::max(1,M/256);
 for(int i=0,k=0;i<M;i+=stride,k++){if(k)std::cout<<",";std::cout<<samplesOut[i];}
 std::cout<<"],\"limitations\":\"Population dynamics and source projection only. No validated lead field, actual EEG, neurotransmitter concentration, electromagnetism or personal prediction.\"}"<<"\n";
 return 0;
 }catch(const std::exception&e){std::cerr<<"error: "<<e.what()<<"\n";return 2;}
}
