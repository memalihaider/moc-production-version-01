import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/shared/Header";
import { MapPin, Star, Clock, Phone, User, Scissors, Award, ArrowLeft, CheckCircle2, Sparkles, ChevronRight, Crown, Shield, Users, Calendar, Mail, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const branchData = {
  downtown: {
    name: "Downtown Premium",
    address: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
    rating: 4.9,
    reviewCount: 247,
    description: "Our flagship location in the heart of downtown, featuring state-of-the-art equipment and our most experienced master barbers. A sanctuary of style for the modern executive.",
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621605815841-aa887ad43639?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop"
    ],
    barbers: [
      { name: "Mike Johnson", role: "Master Barber", rating: 4.9, specialties: ["Fades", "Classic Cuts"], experience: "8 years", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2070&auto=format&fit=crop" },
      { name: "Sarah Chen", role: "Stylist", rating: 4.8, specialties: ["Color", "Styling"], experience: "6 years", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop" },
      { name: "Alex Rodriguez", role: "Barber", rating: 4.7, specialties: ["Beard", "Modern Cuts"], experience: "5 years", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop" },
    ],
    services: [
      { name: "Classic Haircut", price: 35, duration: "30 min", description: "Traditional cut with precision styling and hot towel finish." },
      { name: "Premium Package", price: 65, duration: "60 min", description: "The ultimate ritual: Haircut, beard trim, and steam treatment." },
      { name: "Beard Grooming", price: 25, duration: "20 min", description: "Professional beard trimming, shaping, and oil treatment." },
    ],
    reviews: [
      { name: "John D.", rating: 5, text: "Best haircut I've ever had. Mike is amazing!", date: "2024-11-25" },
      { name: "Mike R.", rating: 5, text: "Great atmosphere and professional service.", date: "2024-11-20" },
      { name: "Alex T.", rating: 5, text: "Worth every penny. Highly recommend!", date: "2024-11-18" },
    ],
  },
};

export default function BranchPage({ params }: { params: { id: string } }) {
  const branch = branchData[params.id as keyof typeof branchData];

  if (!branch) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Header />
        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-5xl font-serif font-bold text-white">Sanctuary Not Found</h1>
          <p className="text-gray-400 max-w-md mx-auto font-light">The location you are seeking is currently unavailable or does not exist in our collection.</p>
          <Button asChild className="bg-secondary text-primary font-black tracking-widest px-10 py-8 rounded-2xl">
            <Link href="/branches">EXPLORE ALL LOCATIONS</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Premium Hero Section */}
      <section className="relative h-[70vh] overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img src={branch.images[0]} alt={branch.name} className="w-full h-full object-cover opacity-40 scale-105" />
          <div className="absolute inset-0 bg-linear-to-b from-primary/80 via-primary/40 to-primary/90"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-10 left-10 animate-bounce delay-500">
            <Crown className="w-8 h-8 text-secondary/30" />
          </div>
          <div className="absolute top-20 right-20 animate-bounce delay-1000">
            <Award className="w-6 h-6 text-secondary/20" />
          </div>
          <div className="absolute bottom-20 left-20 animate-bounce delay-1500">
            <Shield className="w-7 h-7 text-secondary/25" />
          </div>
          <div className="absolute bottom-10 right-10 animate-bounce delay-2000">
            <Sparkles className="w-5 h-5 text-secondary/20" />
          </div>
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Link href="/branches" className="inline-flex items-center gap-2 text-secondary font-black tracking-[0.3em] text-[10px] uppercase hover:text-white transition-colors mb-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <ArrowLeft className="w-3 h-3" /> BACK TO LOCATIONS
            </Link>
            <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-4 border border-secondary/30 backdrop-blur-sm">
              <Crown className="w-4 h-4 text-secondary" />
              <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Flagship Studio</span>
              <Crown className="w-4 h-4 text-secondary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">{branch.name}</h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed italic">
              "{branch.description}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                <Star className="w-5 h-5 fill-secondary text-secondary" />
                <div className="text-left">
                  <div className="text-white font-bold text-lg">{branch.rating}</div>
                  <div className="text-white/70 text-xs font-black uppercase tracking-widest">({branch.reviewCount} REVIEWS)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                <MapPin className="w-5 h-5 text-secondary" />
                <div className="text-left">
                  <div className="text-white font-medium">{branch.address}</div>
                  <div className="text-white/70 text-xs font-black uppercase tracking-widest">Downtown District</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                <Users className="w-5 h-5 text-secondary" />
                <div className="text-left">
                  <div className="text-white font-bold text-lg">50+</div>
                  <div className="text-white/70 text-xs font-black uppercase tracking-widest">Daily Clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20 pb-32">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          <Card className="p-10 rounded-[2.5rem] border-none shadow-2xl bg-white group hover:bg-primary transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary transition-all">
                <Clock className="w-6 h-6 text-secondary group-hover:text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary mb-3 group-hover:text-white">Studio Hours</h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/70 font-light leading-relaxed">
                Mon-Sat: 9AM - 7PM<br />
                Sunday: 10AM - 5PM
              </p>
            </div>
          </Card>
          
          <Card className="p-10 rounded-[2.5rem] border-none shadow-2xl bg-white group hover:bg-primary transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary transition-all">
                <Phone className="w-6 h-6 text-secondary group-hover:text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary mb-3 group-hover:text-white">Concierge</h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/70 font-light leading-relaxed">
                Direct: {branch.phone}<br />
                Email: {params.id}@manofcave.com
              </p>
            </div>
          </Card>

          <Card className="p-10 rounded-[2.5rem] border-none shadow-2xl bg-white group hover:bg-primary transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary transition-all">
                <Calendar className="w-6 h-6 text-secondary group-hover:text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-primary mb-3 group-hover:text-white">Next Available</h3>
              <p className="text-sm text-muted-foreground group-hover:text-white/70 font-light leading-relaxed">
                Today: 2:00 PM<br />
                Tomorrow: 9:00 AM
              </p>
            </div>
          </Card>

          <Card className="p-10 rounded-[2.5rem] border-none shadow-2xl bg-secondary flex flex-col justify-center items-center text-center group hover:scale-105 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <Sparkles className="w-10 h-10 text-primary mb-6 animate-pulse" />
              <h3 className="text-2xl font-serif font-bold text-primary mb-6">Ready for your ritual?</h3>
              <Button asChild className="w-full h-16 bg-primary hover:bg-white text-white hover:text-primary font-black tracking-widest rounded-2xl transition-all duration-500 shadow-xl">
                <Link href="/booking">BOOK APPOINTMENT</Link>
              </Button>
            </div>
          </Card>
        </div>


        {/* Artisans Section */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary font-black tracking-[0.3em] text-[10px] uppercase">
                <div className="w-10 h-[1px] bg-secondary"></div>
                THE MASTERS
                <Crown className="w-4 h-4" />
              </div>
              <h2 className="text-5xl font-serif font-bold text-primary">Our Artisans</h2>
            </div>
            <p className="text-muted-foreground max-w-md font-light leading-relaxed">
              Meet the dedicated professionals who transform grooming into an art form. Each artisan brings years of expertise and a unique vision to every chair.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {branch.barbers.map((barber, index) => (
              <div key={index} className="group relative">
                <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
                  <img src={barber.image} alt={barber.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                  <div className="absolute inset-0 bg-linear-to-t from-primary via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                  
                  {/* Premium Badge */}
                  <div className="absolute top-6 right-6 z-20">
                    <div className="bg-secondary/90 backdrop-blur-md text-primary border-none px-3 py-1.5 rounded-xl font-black text-xs shadow-xl flex items-center gap-1.5">
                      <Award className="w-3 h-3" />
                      {barber.rating}
                    </div>
                  </div>
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-secondary font-black tracking-widest text-[10px] uppercase">{barber.role}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          <span className="text-white text-xs font-bold">{barber.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-white mb-4">{barber.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {barber.specialties.map((spec, i) => (
                          <span key={i} className="text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-white/20 text-white rounded-full border border-white/30">
                            {spec}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-white/70 text-xs">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {barber.experience} experience
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          200+ clients
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services & Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
          {/* Signature Services */}
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary font-black tracking-[0.3em] text-[10px] uppercase">
                <div className="w-10 h-[1px] bg-secondary"></div>
                THE MENU
                <Scissors className="w-4 h-4" />
              </div>
              <h2 className="text-5xl font-serif font-bold text-primary">Signature Services</h2>
            </div>

            <div className="space-y-6">
              {branch.services.map((service, index) => (
                <div key={index} className="group p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-secondary/30 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full blur-xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors">{service.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                            <Clock className="w-3 h-3" /> {service.duration}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[10px] font-black tracking-widest text-secondary uppercase">Premium Service</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-primary">AED {service.price}</span>
                        <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mt-1">Starting from</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1 h-16 bg-primary text-white font-black tracking-widest rounded-2xl hover:bg-secondary hover:text-primary transition-all duration-500">
                <Link href="/booking">VIEW FULL SERVICE MENU <ChevronRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-16 border-secondary text-secondary font-black tracking-widest rounded-2xl hover:bg-secondary hover:text-primary transition-all duration-500">
                <Link href="/services">COMPARE SERVICES</Link>
              </Button>
            </div>
          </div>

          {/* Visual Gallery */}
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary font-black tracking-[0.3em] text-[10px] uppercase">
                <div className="w-10 h-[1px] bg-secondary"></div>
                THE STUDIO
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-5xl font-serif font-bold text-primary">Visual Experience</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 h-[600px]">
              <div className="space-y-6">
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-[280px]">
                  <img src={branch.images[1]} alt="Studio Interior" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="bg-primary rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-6 h-[280px]">
                  <Award className="w-12 h-12 text-secondary" />
                  <p className="text-white font-serif text-xl italic">"Voted Best Luxury Barbershop 2024"</p>
                  <div className="flex items-center gap-2 text-white/70 text-xs font-black uppercase tracking-widest">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    4.9 Rating • 500+ Reviews
                  </div>
                </div>
              </div>
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                <img src={branch.images[2]} alt="Studio Detail" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Sparkles className="w-12 h-12 text-secondary mx-auto animate-pulse" />
                    <p className="text-white font-serif text-xl italic">Experience Luxury</p>
                    <p className="text-white/70 text-sm font-light">State-of-the-art facilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <section className="bg-primary rounded-[4rem] p-16 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] -ml-48 -mb-48"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-16">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-secondary font-black tracking-[0.3em] text-[10px] uppercase">
                <div className="w-10 h-[1px] bg-secondary"></div>
                VOICES
                <div className="w-10 h-[1px] bg-secondary"></div>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight">Client Testimonials</h2>
              <p className="text-gray-300 font-light max-w-2xl mx-auto">Real experiences from our valued clients who trust us with their grooming needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {branch.reviews.map((review, index) => (
                <div key={index} className="group relative">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl space-y-6 hover:bg-white/20 transition-all duration-500">
                    <div className="flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-secondary text-secondary group-hover:scale-110 transition-transform" />
                      ))}
                    </div>
                    <p className="text-gray-300 font-light italic leading-relaxed text-lg">"{review.text}"</p>
                    <div className="space-y-1">
                      <h4 className="text-white font-serif font-bold">{review.name}</h4>
                      <p className="text-secondary font-black tracking-widest text-[9px] uppercase">{review.date}</p>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Quote className="w-3 h-3 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="bg-secondary rounded-[4rem] p-16 md:p-24 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070')] bg-cover bg-center opacity-10 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary font-black tracking-[0.3em] uppercase text-[10px]">Limited Time Offer</span>
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-primary leading-tight">
                Ready for Your Premium Experience?
              </h2>
              <p className="text-xl text-primary/80 font-light max-w-xl mx-auto">
                Book your appointment at {branch.name} today and experience the pinnacle of grooming. First-time clients receive complimentary consultation.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <Button asChild size="lg" className="h-20 px-12 bg-primary text-white font-black tracking-[0.2em] text-xs rounded-2xl hover:bg-primary/90 transition-all duration-500 shadow-2xl">
                  <Link href="/booking">BOOK APPOINTMENT NOW</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-20 px-12 border-primary text-primary font-black tracking-[0.2em] text-xs rounded-2xl hover:bg-primary hover:text-white transition-all duration-500">
                  <Link href={`tel:${branch.phone}`}>CALL FOR RESERVATIONS</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
