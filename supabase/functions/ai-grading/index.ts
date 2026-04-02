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
      { headers: { apikey: STANDALONE_ANON_KEY, "Content-Type": "application/json" } }
    );
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) return rows[0].key_value || null;
  } catch { return null; }
  return null;
}

async function callOpenAI(
  openaiKey: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 500
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: maxTokens, temperature: 0.4 }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

const TYPE_CONTEXT: Record<string, string> = {
  python:     "Python task (.py files). Use Python-specific syntax, built-ins, and idioms.",
  jupyter:    "Jupyter Notebook task (.ipynb). Reference cells, markdown, and Python code cells. Think data analysis, visualisation, or step-by-step exploration.",
  html:       "HTML web task (.html files). Reference HTML structure, semantic tags, and optionally CSS/JS linking.",
  javascript: "JavaScript task (.js files). Reference JS syntax, DOM manipulation, events, or algorithms.",
  css:        "CSS styling task (.css files). Reference selectors, properties, responsive design, and visual principles.",
  general:    "General programming task. Use whatever language fits best.",
};

const FILE_HINTS: Record<string, string> = {
  python: `- A starter .py with imports/function stubs (NOT the solution)
- A .csv or .txt data file if data processing is involved
- A reference .py showing syntax for relevant concepts (NOT solving the task)`,
  jupyter: `- REQUIRED: A starter .ipynb with markdown section headings and empty/partial code cells (valid Jupyter JSON format)
- A .csv or .txt data file if data is involved`,
  html: `- A scaffolded starter .html (DOCTYPE, head, body structure, placeholder content)
- A reference .txt showing example HTML tags
- A .css stub if styling is needed`,
  javascript: `- A starter .js with function stubs and guiding comments
- An .html file to link the JS to if browser interaction is involved
- A reference .txt cheat sheet of relevant JS methods`,
  css: `- REQUIRED: A pre-built .html file for students to style (with classes/IDs set up)
- A starter .css with commented sections to fill in
- A reference .txt of relevant CSS properties`,
  general: `- A reference cheat sheet for syntax they'll need
- A worked example of a DIFFERENT similar problem (not solving the task)
- A data file to work with (.txt or .csv) if relevant`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, taskTitle, taskDescription, markingScheme, submissionFiles, adminDescription } = body;

    const openaiKey = await getOpenAIKey();
    if (!openaiKey) return jsonResponse({ error: "OpenAI API key not configured" }, 400);

    if (action === "generate_task_from_description") {
      const taskType = (body.taskType as string) || "general";
      const typeCtx = TYPE_CONTEXT[taskType] || TYPE_CONTEXT["general"];
      const fileHint = FILE_HINTS[taskType] || FILE_HINTS["general"];

      const instructionsPrompt = `You are an experienced programming teacher creating a task for students.

Admin description: "${adminDescription}"
Task type: ${typeCtx}

Create:
1. A clear, engaging task title
2. Detailed, friendly student-facing instructions that:
   - Explain the goal clearly
   - List numbered requirements
   - Include helpful hints

Respond in EXACT JSON (no markdown, no extra text):
{"title":"<title>","instructions":"<full instructions>"}`;

      const filesPrompt = `You are an experienced programming teacher. Generate supporting files for this task.

Admin description: "${adminDescription}"
Task type: ${typeCtx}

Consider these file types for this task type:
${fileHint}

Rules:
- Do NOT create a solution file
- Only include files that genuinely help students
- Generate real, substantive content — no placeholders

Respond in EXACT JSON (no markdown, no extra text):
{"files":[{"filename":"<name.ext>","type":"<ext without dot>","purpose":"<one sentence>","content":"<full content>"}]}

If no files needed: {"files":[]}`;

      const [instructionsRaw, filesRaw] = await Promise.all([
        callOpenAI(openaiKey, [{ role: "user", content: instructionsPrompt }], 1000),
        callOpenAI(openaiKey, [{ role: "user", content: filesPrompt }], 3500),
      ]);

      let title = "", instructions = "";
      try {
        const p = JSON.parse(instructionsRaw);
        title = p.title || "";
        instructions = p.instructions || "";
      } catch {
        return jsonResponse({ error: "Failed to parse AI task response" }, 500);
      }

      let files: Array<{ filename: string; type: string; purpose: string; content: string }> = [];
      try {
        const p = JSON.parse(filesRaw);
        files = Array.isArray(p.files) ? p.files : [];
      } catch {
        files = [];
      }

      return jsonResponse({ title, instructions, files });
    }

    if (action === "generate_marking_scheme") {
      const prompt = `You are an experienced teacher creating a marking scheme for a programming assessment.

Task Title: ${taskTitle}
Task Description/Instructions: ${taskDescription}

Create a clear, detailed marking scheme. Include:
1. Key requirements with marks for each
2. What a full-mark solution looks like
3. Common mistakes to watch for
4. A total marks value (e.g. out of 10 or 20)

Format it clearly with sections and point values. Be specific and practical.`;

      const scheme = await callOpenAI(openaiKey, [{ role: "user", content: prompt }], 800);
      return jsonResponse({ marking_scheme: scheme });
    }

    if (action === "grade_submission") {
      if (!submissionFiles) return jsonResponse({ error: "Missing submission files" }, 400);

      const filesSummary = Object.entries(submissionFiles as Record<string, string>)
        .map(([name, content]) => `=== ${name} ===\n${content}`)
        .join("\n\n");

      const prompt = markingScheme
        ? `You are an encouraging and supportive teacher grading a student's programming submission.

Task: ${taskTitle || "Programming submission"}
${taskDescription ? `Instructions: ${taskDescription}` : ""}

Marking Scheme:
${markingScheme}

Student's Submission:
${filesSummary}

LINE 1: Score only (e.g. "7/10") — nothing else
LINE 2+: Encouraging feedback (under 180 words) that celebrates strengths, justifies marks, and frames gaps as growth opportunities.`
        : `You are an encouraging teacher reviewing a student's programming work.

${taskTitle ? `Task: ${taskTitle}` : "General programming submission."}

Student's Submission:
${filesSummary}

LINE 1: Score out of 10 (e.g. "8/10") — nothing else
LINE 2+: Encouraging feedback (under 180 words) celebrating strengths and suggesting one or two improvements.`;

      const result = await callOpenAI(openaiKey, [{ role: "user", content: prompt }], 500);
      return jsonResponse({ grade: result });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
