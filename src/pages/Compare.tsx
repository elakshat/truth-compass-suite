import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, FileText, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AnalysisResult {
  trustScore: number;
  sensationalism: string;
  biasedLanguage: string;
  sourceVerification: string;
}

const Compare = () => {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result1, setResult1] = useState<AnalysisResult | null>(null);
  const [result2, setResult2] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeText = async (text: string): Promise<AnalysisResult | null> => {
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
      return data;
    } catch (error) {
      console.error("Analysis error:", error);
      return null;
    }
  };

  const compareBoth = async () => {
    if (!text1.trim() || !text2.trim()) {
      toast({
        title: "Both Texts Required",
        description: "Please enter text in both fields to compare.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult1(null);
    setResult2(null);

    try {
      const [data1, data2] = await Promise.all([
        analyzeText(text1),
        analyzeText(text2)
      ]);

      if (data1 && data2) {
        setResult1(data1);
        setResult2(data2);
        toast({
          title: "Comparison Complete",
          description: "Both articles analyzed successfully!"
        });
      } else {
        throw new Error("One or both analyses failed");
      }
    } catch (error) {
      toast({
        title: "Comparison Failed",
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

  const renderAnalysisResult = (result: AnalysisResult | null, title: string) => {
    if (!result) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-2xl font-bold text-center mb-4">{title}</h3>
        
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
        <div className="grid gap-4">
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
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Compare Articles</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze and compare two news articles side-by-side
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Article 1 */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Article 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste first news article here..."
                    value={text1}
                    onChange={(e) => setText1(e.target.value)}
                    className="min-h-[300px] text-base resize-none"
                  />
                </CardContent>
              </Card>

              {/* Article 2 */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Article 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste second news article here..."
                    value={text2}
                    onChange={(e) => setText2(e.target.value)}
                    className="min-h-[300px] text-base resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-8">
              <Button 
                onClick={compareBoth} 
                disabled={loading}
                className="gradient-hero text-lg py-6 px-12"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Both Articles...
                  </>
                ) : (
                  "Compare Articles"
                )}
              </Button>
            </div>

            {(result1 || result2) && (
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  {renderAnalysisResult(result1, "Article 1 Results")}
                </div>
                <div>
                  {renderAnalysisResult(result2, "Article 2 Results")}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
