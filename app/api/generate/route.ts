// ─────────────────────────────────────────────────────────────────────────────
// app/api/generate/route.ts — AI generation API endpoint
//
// This is the server-side route that handles POST requests from the form.
// It:
//   • Receives the form data (project name, role, problem, etc.)
//   • Builds a prompt from whichever fields were filled in
//   • Sends the prompt to Claude via the Anthropic SDK
//   • Streams the response back to the browser chunk by chunk
//     so the user sees the text appear in real time
// ─────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// Initialise the Anthropic client once at module level.
// The API key is stored in Vercel's environment variables (never in the code).
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // ── Parse the incoming form data from the request body ──────────────────
    const body = await req.json();
    const {
      projectName,
      role,
      problem,
      process: approach,   // Renamed to avoid clashing with Node's global `process`
      keyDecisions,
      outcomes,
      tools,
      duration,
    } = body;

    console.log("[generate] starting generation for project:", projectName);

    // ── Build the list of filled-in fields only ──────────────────────────────
    // Optional fields that are empty are filtered out so the AI isn't
    // told about missing information or asked to fill in blanks.
    const providedFields = [
      `Project Name: ${projectName}`,
      role && `Role: ${role}`,
      problem && `Problem/Challenge: ${problem}`,
      approach && `Process/Approach: ${approach}`,
      keyDecisions && `Key Decisions: ${keyDecisions}`,
      outcomes && `Outcomes/Results: ${outcomes}`,
      tools && `Tools Used: ${tools}`,
      duration && `Duration: ${duration}`,
    ]
      .filter(Boolean)  // Remove any false/empty entries
      .join("\n");

    // ── Construct the full prompt sent to Claude ─────────────────────────────
    // The prompt does three things:
    //   1. Sets the persona — senior UX writer and portfolio coach — so Claude
    //      writes with the right voice and quality bar from the first word.
    //   2. Passes in the user's form data (providedFields) as the raw material.
    //      Any fields the user left blank are intelligently inferred by Claude
    //      so no section is ever empty or flagged as missing.
    //   3. Defines the exact 12-section structure Claude must follow, in order:
    //        PRODUCT OVERVIEW     — one grounded paragraph: what it is and who it's for
    //        GOALS                — 4–6 bold-titled paragraphs (one sentence each)
    //        MY ROLE              — Responsibilities + Collaboration sub-sections
    //        USER RESEARCH        — 3–4 bold-titled insight paragraphs (one sentence each)
    //        DESIGN PROCESS       — one flowing paragraph covering all five stages
    //        KEY DESIGN DECISIONS — 3–4 bold-titled decision paragraphs (1–2 sentences each)
    //        TOOLS USED           — one comma-separated line of tool names only
    //        TIMELINE             — one sentence only
    //        THE PROJECT          — challenges + outcomes, each as bold-titled paragraphs
    //        KEY METRICS          — 3 bold numbers/percentages with one-sentence descriptions
    //        WHERE WE ARE         — one short status paragraph
    //        FUTURE IMPROVEMENTS  — 6–7 bold-titled action-verb-led paragraphs
    //
    // Each section has a tight format constraint (bold title + one sentence)
    // to keep the output scannable and prevent AI padding.
    // max_tokens is set to 2500 to cover the 600–800 word target with headroom.
    const prompt = `You are a senior UX writer and portfolio coach who has helped designers land roles at Google, Airbnb, and Spotify. You write case studies that are specific, confident, and compelling.

IMPORTANT — before writing anything, read the project details below and check if they describe a real design or product project. If the input is gibberish, random words, nonsense, a test, or clearly not a real project (for example: "asdf", "test test", "hello world", "I don't know", "123456"), respond with this exact message and nothing else:

CASELY_ERROR: Please provide more details on your product so we can generate a compelling story.

Only continue to write the case study if the input clearly describes a real project.

Here are the project details to base the case study on. If any information is missing for a section, intelligently infer realistic details from the context provided — do not leave sections empty or mention that information was not given.

${providedFields}

Structure the case study in this exact order using these exact headings:

## PRODUCT OVERVIEW
A clear, specific paragraph describing what the product is, who it is for, and what it does. Make it sound real and grounded.

## GOALS
Write 4 to 6 goals as short paragraphs — each with a bold title followed by one sentence explaining it.

## MY ROLE
Two sub-sections:
Responsibilities — one paragraph describing what the designer owned.
Collaboration — one paragraph describing who they worked with and how.

## USER RESEARCH
Write 3 to 4 insights as short paragraphs — each with a bold title followed by one sentence. Same format as the goals section.

## DESIGN PROCESS
Walk through the stages: discovery, ideation, wireframing, prototyping, and testing. One flowing paragraph only. Be specific but concise.

## KEY DESIGN DECISIONS
Write 3 to 4 decisions as short paragraphs — each with a bold title followed by one to two sentences explaining the decision and why it was made. Same format as the goals section.

## TOOLS USED
List the tools in one short line separated by commas. Nothing else. Example: Figma, FigJam, Maze, Notion, Google Analytics.

## TIMELINE
One sentence only. Example: This project ran for six months from kickoff to launch.

## THE PROJECT
Write 3 to 4 challenges and 4 to 6 outcomes — each as short paragraphs with a bold title followed by one to two sentences. Keep them punchy and specific.

## KEY METRICS
3 headline metrics — each with a bold percentage or number, followed by one sentence describing what it means.

## WHERE WE ARE
One short grounding paragraph about the current state of the product.

## FUTURE IMPROVEMENTS
6 to 7 improvements — each as a short paragraph with a bold title followed by one sentence. Start each with an action verb.

Rules:
- Write in first person throughout
- Never use bullet points, dashes, or numbered lists — flowing paragraphs only
- Never use em dashes
- Be specific — use real details, numbers, and context wherever possible
- Avoid vague phrases like "leveraged", "utilised", "ensured", "stakeholders"
- If the user has not provided information for a section, intelligently infer realistic details based on the context they have given
- Tone: confident, human, direct
- Make it feel like a real designer wrote it, not an AI
- Total length: 600 to 800 words`;

    // ── Call the Claude API with streaming enabled ────────────────────────────
    // If the API call itself fails (e.g. bad key, wrong model), catch and return
    // a clear error response so the UI can display a useful message.
    let stream;
    try {
      stream = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2500,
        stream: true,  // Enables token-by-token streaming
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        // Log the full error details to Vercel's function logs for debugging
        console.error("[generate] Anthropic API error:", {
          status: err.status,
          name: err.name,
          message: err.message,
          error: err.error,
        });
        // Return the error details as a plain text response so the UI can show them
        return new Response(
          `Anthropic API error (${err.status}): ${err.message}`,
          { status: err.status ?? 500 }
        );
      }
      throw err; // Re-throw any non-API errors to the outer catch
    }

    // ── Set up a ReadableStream to forward Claude's output to the browser ─────
    // Each chunk of text from Claude is encoded and sent immediately,
    // so the user sees words appear as they are generated.
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            // Only process text delta events (the actual generated content)
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              // Encode the text chunk and push it into the stream
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          // Signal the stream is finished once all tokens have been sent
          controller.close();
          console.log("[generate] stream completed for project:", projectName);
        } catch (streamErr) {
          // If the stream breaks mid-way, log it and close with an error
          console.error("[generate] stream error:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    // ── Return the stream as a plain text HTTP response ───────────────────────
    // The browser reads this incrementally as it arrives
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache", // Prevent any caching of the streamed response
      },
    });

  } catch (err) {
    // ── Catch-all for any unexpected errors (e.g. bad JSON in request body) ──
    console.error("[generate] unexpected error:", err);
    return new Response(
      err instanceof Error ? err.message : "Unexpected server error",
      { status: 500 }
    );
  }
}
