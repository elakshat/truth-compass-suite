import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, FileText, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  trustScore: number;
  sensationalism: string;
  biasedLanguage: string;
  sourceVerification: string;
}

const Demo = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeText = async () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      
      if (session) {
        toast({
          title: "Analysis Complete",
          description: "Results saved to your dashboard!"
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High Trust";
    if (score >= 60) return "Moderate Trust";
    return "Low Trust";
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Try It Yourself</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste any news article snippet and see Veritas Lens in action
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste a news article snippet here to see Veritas Lens in action..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] mb-4 text-base resize-none"
              />
              <Button 
                onClick={analyzeText} 
                disabled={loading}
                className="w-full gradient-hero text-lg py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Text"
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Trust Score */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    Trust Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(result.trustScore)} mb-2`}>
                      {result.trustScore}
                    </div>
                    <div className="text-xl text-muted-foreground">{getScoreLabel(result.trustScore)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Details */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Sensationalism
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-xl">{result.sensationalism}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      Biased Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-xl">{result.biasedLanguage}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      Source Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold text-xl">{result.sourceVerification}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Demo;