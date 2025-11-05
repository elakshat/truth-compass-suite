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
    const wordCount = text.split(/\s+/).length;
    
    let score = 100;
    let sensationalCount = 0;
    let biasedCount = 0;
    let sourceCount = 0;
    let foundIssues: string[] = [];

    keywords.forEach((keyword: any) => {
      const termLower = keyword.term.toLowerCase();
      // Handle special characters and multi-word terms
      const escapedTerm = termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundaries for regular words, but not for punctuation
      const isPunctuation = /^[^a-zA-Z0-9]+$/.test(keyword.term);
      const regex = isPunctuation 
        ? new RegExp(escapedTerm, 'gi')
        : new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        const count = matches.length;
        score -= keyword.weight * count;
        foundIssues.push(`"${keyword.term}" (${count}x)`);
        
        if (keyword.type === 'sensational') sensationalCount += count;
        else if (keyword.type === 'biased') biasedCount += count;
        else if (keyword.type === 'source') sourceCount += count;
      }
    });

    // Additional heuristics for better scoring
    const hasAllCaps = /[A-Z]{4,}/.test(text);
    const excessivePunctuation = (text.match(/[!?]{2,}/g) || []).length;
    const hasClickbait = /you won't believe|what happened next|this will shock you/i.test(textLower);
    
    if (hasAllCaps) {
      score -= 5;
      foundIssues.push('Excessive capitalization');
    }
    if (excessivePunctuation > 0) {
      score -= excessivePunctuation * 3;
      foundIssues.push('Excessive punctuation');
    }
    if (hasClickbait) {
      score -= 15;
      foundIssues.push('Clickbait phrases');
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine flag levels
    const sensationalism = sensationalCount >= 3 ? "High" : sensationalCount >= 1 ? "Medium" : "Low";
    const biasedLanguage = biasedCount >= 2 ? "High" : biasedCount >= 1 ? "Medium" : "Low";
    const sourceVerification = sourceCount >= 2 ? "Multiple Unverified Claims" : sourceCount >= 1 ? "Unverified Claims Found" : "Appears Sourced";

    console.log('Analysis:', { score, sensationalCount, biasedCount, sourceCount, wordCount, foundIssues });

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