import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AnalysisHistory {
  id: number;
  text_snippet: string;
  trust_score: number;
  analysis_details: {
    trustScore: number;
    sensationalism: string;
    biasedLanguage: string;
    sourceVerification: string;
  };
  analyzed_at: string;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchHistory(session.access_token);
    };

    checkAuth();
  }, [navigate]);

  const fetchHistory = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load your analysis history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-accent">High Trust</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Moderate</Badge>;
    return <Badge variant="destructive">Low Trust</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Analysis Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              View your past analysis history and track trust scores
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-2xl font-semibold mb-2">No Analysis History Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Try analyzing some text on the home page to see your results here
                </p>
                <a href="/#demo" className="text-primary hover:underline font-medium">
                  Go to Demo →
                </a>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <Card key={item.id} className="border-2 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span>Trust Score: {item.trust_score}</span>
                            {getScoreBadge(item.trust_score)}
                          </div>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(item.analyzed_at), "PPpp")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Text Snippet:</h4>
                      <p className="text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                        {item.text_snippet}
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Sensationalism</div>
                        <div className="font-semibold">{item.analysis_details.sensationalism}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Biased Language</div>
                        <div className="font-semibold">{item.analysis_details.biasedLanguage}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Source Verification</div>
                        <div className="font-semibold">{item.analysis_details.sourceVerification}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;