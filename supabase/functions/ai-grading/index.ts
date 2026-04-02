import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STANDALONE_URL = "https://qfitpwdrswvnbmzvkoyd.supabase.co";
const STANDALONE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getOpenAIKey(): Promise<string | null> {
  try {
    const res = await fetch(
      `${STANDALONE_URL}/rest/v1/secrets?key_name=eq.OPENAI_API_KEY&select=key_value`,
      {
        headers: {
          apikey: STANDALONE_ANON_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0].key_value || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function callOpenAI(openaiKey: string, prompt: string, maxTokens = 500): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, taskTitle, taskDescription, markingScheme, submissionFiles } = body;

    const openaiKey = await getOpenAIKey();
    if (!openaiKey) {
      return jsonResponse({ error: "OpenAI API key not configured" }, 400);
    }

    if (action === "generate_marking_scheme") {
      const prompt = `You are an experienced teacher creating a marking scheme for a programming assessment.

Task Title: ${taskTitle}
Task Description/Instructions: ${taskDescription}

Create a clear, detailed marking scheme for this task. Include:
1. Key requirements that must be met (with marks for each)
2. What a full-mark solution looks like
3. Common mistakes to watch for
4. A total marks value (e.g. out of 10 or 20)

Format it clearly with sections and point values. Be specific and practical.`;

      const scheme = await callOpenAI(openaiKey, prompt, 800);
      return jsonResponse({ marking_scheme: scheme });
    }

    if (action === "grade_submission") {
      if (!submissionFiles) {
        return jsonResponse({ error: "Missing submission files" }, 400);
      }

      const filesSummary = Object.entries(submissionFiles as Record<string, string>)
        .map(([name, content]) => `=== ${name} ===\n${content}`)
        .join("\n\n");

      let prompt: string;

      if (markingScheme) {
        prompt = `You are an encouraging and supportive teacher grading a student's programming submission. Your feedback should be positive and motivating while being honest about areas for improvement.

Task: ${taskTitle || "Programming submission"}
${taskDescription ? `Instructions: ${taskDescription}` : ""}

Marking Scheme:
${markingScheme}

Student's Submission:
${filesSummary}

Grade this submission according to the marking scheme. Your response MUST follow this exact format:

LINE 1: Score only (e.g. "7/10" or "14/20") — nothing else on this line
LINE 2+: Encouraging feedback for the student that:
- Starts by celebrating what they did well and achieved
- Explains clearly why they earned the marks they did (justify each mark awarded)
- Frames any missing elements as growth opportunities with kind, constructive language
- Ends with a positive, motivating message

Keep the feedback under 180 words. Be warm, specific, and encouraging.`;
      } else {
        prompt = `You are an encouraging and supportive teacher reviewing a student's programming work. Your feedback should be positive and motivating.

${taskTitle ? `Task/Context: ${taskTitle}` : "This is a general programming submission."}

Student's Submission:
${filesSummary}

Review this submission and provide a general assessment. Your response MUST follow this exact format:

LINE 1: A simple overall score out of 10 (e.g. "8/10") — nothing else on this line
LINE 2+: Encouraging feedback for the student that:
- Starts by celebrating what they did well and achieved
- Points out specific things in their code that are impressive or well-done
- Suggests one or two friendly growth opportunities
- Ends with a positive, motivating message

Keep the feedback under 180 words. Be warm, specific, and encouraging.`;
      }

      const result = await callOpenAI(openaiKey, prompt, 500);
      return jsonResponse({ grade: result });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
