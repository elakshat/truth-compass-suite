import { Globe, Search, Award } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Globe,
    title: "Browse",
    description: "Read articles across the web as you normally would."
  },
  {
    number: "2",
    icon: Search,
    title: "Analyze",
    description: "Veritas Lens automatically scans for bias, sensationalism, and source issues."
  },
  {
    number: "3",
    icon: Award,
    title: "Get Score",
    description: "Receive an instant trust score and detailed breakdown of any concerns."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to more informed reading
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connector Line (hidden on mobile) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-primary/20 z-0" />
                  )}
                  
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 mb-6 relative">
                      <Icon className="h-10 w-10 text-primary" />
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;