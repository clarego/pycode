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

async function callOpenAI(openaiKey: string, messages: Array<{role: string; content: string}>, maxTokens = 500): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
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
    const { action, taskTitle, taskDescription, markingScheme, submissionFiles, adminDescription } = body;

    const openaiKey = await getOpenAIKey();
    if (!openaiKey) {
      return jsonResponse({ error: "OpenAI API key not configured" }, 400);
    }

    if (action === "generate_task_from_description") {
      // Step 1: Generate the task title and instructions
      const taskGenPrompt = `You are an experienced programming teacher. An admin has given you this brief description of a task they want to assign to students:

Admin's description: "${adminDescription}"

Your job is to:
1. Create a clear, engaging task title
2. Write detailed student-facing instructions that are friendly, clear, and well-structured

The instructions should:
- Explain the goal clearly
- List specific requirements the student must meet (numbered)
- Include any hints or guidance that would help students succeed
- Be appropriate for a student learning to program

Respond in this EXACT JSON format (no markdown, no extra text):
{"title":"<task title>","instructions":"<full student instructions>"}`;

      const taskJson = await callOpenAI(openaiKey, [{ role: "user", content: taskGenPrompt }], 1000);

      let title = "";
      let instructions = "";
      try {
        const parsed = JSON.parse(taskJson);
        title = parsed.title || "";
        instructions = parsed.instructions || "";
      } catch {
        return jsonResponse({ error: "Failed to parse AI task response" }, 500);
      }

      // Step 2: Decide what supporting files would help students
      const fileDecisionPrompt = `You are an experienced programming teacher. You just created this task for students:

Title: ${title}
Instructions: ${instructions}

Now think carefully: what supporting files or documents would genuinely help a student complete this task?

Consider:
- A reference guide / cheat sheet for syntax they'll need
- A worked example of a DIFFERENT but similar problem (not solving their task)
- A data file they need to work with (e.g. a .txt or .csv file with sample data)
- A PDF guide explaining a concept relevant to the task
- A starter template file with some scaffolding

Only include files that are truly useful. Do NOT create a solution file. Do NOT create files that are redundant.

Respond in this EXACT JSON format (no markdown, no extra text):
{"files":[{"filename":"<filename with extension>","type":"<pdf|txt|py|csv|html>","purpose":"<one sentence: why this helps students>","content":"<the actual file content>"}]}

If no files are needed, respond with: {"files":[]}

Generate real, substantive content for each file — not placeholders.`;

      const filesJson = await callOpenAI(openaiKey, [{ role: "user", content: fileDecisionPrompt }], 3000);

      let files: Array<{filename: string; type: string; purpose: string; content: string}> = [];
      try {
        const parsed = JSON.parse(filesJson);
        files = Array.isArray(parsed.files) ? parsed.files : [];
      } catch {
        files = [];
      }

      return jsonResponse({ title, instructions, files });
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

      const scheme = await callOpenAI(openaiKey, [{ role: "user", content: prompt }], 800);
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

      const result = await callOpenAI(openaiKey, [{ role: "user", content: prompt }], 500);
      return jsonResponse({ grade: result });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
