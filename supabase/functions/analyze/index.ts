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

    // Perform analysis with improved keyword matching
    const textLower = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    
    let score = 100;
    let sensationalCount = 0;
    let biasedCount = 0;
    let sourceCount = 0;
    let foundIssues: string[] = [];

    console.log('Analyzing text:', text.substring(0, 100));
    console.log('Total keywords to check:', keywords?.length || 0);

    keywords.forEach((keyword: any) => {
      try {
        const term = keyword.term;
        const termLower = term.toLowerCase();
        
        // Escape special regex characters
        const escapedTerm = termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Check if it's just punctuation or contains letters
        const hasLetters = /[a-zA-Z]/.test(term);
        
        // Build regex pattern
        let regex;
        if (hasLetters) {
          // Use word boundaries for words
          regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
        } else {
          // No word boundaries for pure punctuation
          regex = new RegExp(escapedTerm, 'g');
        }
        
        // Match against original text for case-insensitive search
        const matches = text.match(regex);
        
        if (matches && matches.length > 0) {
          const count = matches.length;
          const penalty = keyword.weight * count;
          score -= penalty;
          foundIssues.push(`"${term}" found ${count}x (-${penalty} points)`);
          
          if (keyword.type === 'sensational') sensationalCount += count;
          else if (keyword.type === 'biased') biasedCount += count;
          else if (keyword.type === 'source') sourceCount += count;
          
          console.log(`Matched keyword: "${term}" ${count} times, type: ${keyword.type}`);
        }
      } catch (e) {
        console.error('Error processing keyword:', keyword.term, e);
      }
    });

    // Additional heuristics for better scoring
    const hasAllCaps = /[A-Z]{4,}/.test(text);
    const excessivePunctuation = (text.match(/[!?]{2,}/g) || []).length;
    const hasClickbait = /you won't believe|what happened next|this will shock you|must see|incredible|amazing discovery/i.test(textLower);
    
    if (hasAllCaps) {
      score -= 5;
      foundIssues.push('Excessive capitalization (-5)');
    }
    if (excessivePunctuation > 0) {
      const penalty = excessivePunctuation * 3;
      score -= penalty;
      foundIssues.push(`Excessive punctuation (-${penalty})`);
    }
    if (hasClickbait) {
      score -= 15;
      foundIssues.push('Clickbait phrases detected (-15)');
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine flag levels with better thresholds
    const sensationalism = sensationalCount >= 3 ? "High" : sensationalCount >= 1 ? "Medium" : "Low";
    const biasedLanguage = biasedCount >= 2 ? "High" : biasedCount >= 1 ? "Medium" : "Low";
    const sourceVerification = sourceCount >= 2 ? "Multiple Unverified Claims" : sourceCount >= 1 ? "Unverified Claims Found" : "Appears Sourced";

    console.log('Final Analysis:', { 
      score, 
      sensationalCount, 
      biasedCount, 
      sourceCount, 
      wordCount, 
      foundIssuesCount: foundIssues.length,
      foundIssues: foundIssues.slice(0, 5)
    });

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