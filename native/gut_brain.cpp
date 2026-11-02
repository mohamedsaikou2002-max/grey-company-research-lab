// Educational C++17 gut–brain compartment model, NOT validated human physiology.
// Build: g++ -O2 -std=c++17 native/gut_brain.cpp -o gut_brain
// Run: ./gut_brain fiber_g fermented_index fat_g protein_g sugar_g stress hours
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <stdexcept>
struct State{double stomach=0,small=0,colon=0,substrate=0,scfa=0,glucose=0,vagus=0,hpa=0,inflammation=0;};
double clamp(double n){return std::max(0.0,std::min(1.0,n));}
double arg(int argc,char**argv,int index,double fallback,double max){
 if(index>=argc)return fallback;
 char* end=nullptr;double n=std::strtod(argv[index],&end);
 if(end==argv[index]||*end!='\0'||!std::isfinite(n)||n<0||n>max)throw std::invalid_argument("Invalid argument");
 return n;
}
int main(int argc,char**argv){
 try{
 const double fiber=arg(argc,argv,1,15,70),fermented=arg(argc,argv,2,.25,1),fat=arg(argc,argv,3,20,120),protein=arg(argc,argv,4,25,150),sugar=arg(argc,argv,5,10,150),stress=arg(argc,argv,6,.4,1),hours=arg(argc,argv,7,48,240);
 State s;s.stomach=clamp((fiber+fat+protein+sugar)/160);s.substrate=clamp(fiber/70);
 const double dt=.05;
 std::cout<<"hour,stomach,small_intestine,colon,fermentation_substrate,scfa,glucose,vagal,hpa,inflammation\n";
 for(int n=0;n<=int(hours/dt);++n){
 const double t=n*dt;if(n%20==0)std::cout<<std::fixed<<std::setprecision(4)<<t<<','<<s.stomach<<','<<s.small<<','<<s.colon<<','<<s.substrate<<','<<s.scfa<<','<<s.glucose<<','<<s.vagus<<','<<s.hpa<<','<<s.inflammation<<'\n';
 const double empty=.34/(1+fat/65)*s.stomach,absorb=.4*s.small,transit=.2*s.small,colon_out=.06*s.colon,ferment=.1*s.substrate*(.6+.4*fermented),sugar_in=clamp(sugar/100)*absorb;
 s.stomach=clamp(s.stomach-dt*empty);s.small=clamp(s.small+dt*(empty-absorb-transit));
 s.colon=clamp(s.colon+dt*(transit-colon_out));s.substrate=clamp(s.substrate+dt*(.12*transit-ferment));
 s.scfa=clamp(s.scfa+dt*(.75*ferment-.06*s.scfa));s.glucose=clamp(s.glucose+dt*(sugar_in-.18*s.glucose));
 const double vagal_target=clamp(.2+.3*s.colon+.25*s.scfa+.18*s.glucose);
 s.vagus=clamp(s.vagus+dt*.5*(vagal_target-s.vagus));s.hpa=clamp(s.hpa+dt*.08*(stress+.15*s.glucose-s.hpa));
 s.inflammation=clamp(s.inflammation+dt*.025*(stress+.25*sugar/100-.35*s.scfa-s.inflammation));
 }
 return 0;
 }catch(const std::exception&e){std::cerr<<e.what()<<'\n';return 2;}
}
