import { Zap, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Real-Time Analysis",
    description: "Get instant feedback on any news article with our advanced AI engine that processes content in milliseconds."
  },
  {
    icon: Eye,
    title: "Bias & Language Detection",
    description: "Identify loaded language, emotional manipulation, and biased phrasing that might influence your perception."
  },
  {
    icon: CheckCircle,
    title: "Source Verification",
    description: "Spot unverified claims, anonymous sources, and lack of attribution that compromise article credibility."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Veritas Lens?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you navigate the information landscape with confidence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="p-8">
                  <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;