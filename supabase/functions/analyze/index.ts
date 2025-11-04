import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all keywords from the database
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('*');

    if (keywordsError) {
      console.error('Error fetching keywords:', keywordsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch keywords" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perform analysis
    const textLower = text.toLowerCase();
    let score = 100;
    let sensationalCount = 0;
    let biasedCount = 0;
    let sourceCount = 0;

    keywords.forEach((keyword: any) => {
      const termLower = keyword.term.toLowerCase();
      const regex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = textLower.match(regex);
      
      if (matches) {
        const count = matches.length;
        score -= keyword.weight * count;
        
        if (keyword.type === 'sensational') sensationalCount += count;
        else if (keyword.type === 'biased') biasedCount += count;
        else if (keyword.type === 'source') sourceCount += count;
      }
    });

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine flag levels
    const sensationalism = sensationalCount >= 3 ? "High" : sensationalCount >= 1 ? "Medium" : "Low";
    const biasedLanguage = biasedCount >= 1 ? "Detected" : "Not Detected";
    const sourceVerification = sourceCount >= 1 ? "Unverified Claims Found" : "Appears Sourced";

    const result = {
      trustScore: score,
      sensationalism,
      biasedLanguage,
      sourceVerification
    };

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (!userError && user) {
          // Save to analysis history
          const snippet = text.substring(0, 200);
          await supabase.from('analysis_history').insert({
            user_id: user.id,
            text_snippet: snippet,
            trust_score: score,
            analysis_details: result
          });
        }
      } catch (e) {
        console.log('Auth error (non-fatal):', e);
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: "An error occurred during analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});