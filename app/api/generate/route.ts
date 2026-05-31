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
    //      Any fields the user left blank are automatically filled in using
    //      Claude's inference, so no section is ever left empty.
    //   3. Defines the exact 12-section structure Claude must follow, in order:
    //        PRODUCT OVERVIEW  — what the product is and who it's for
    //        GOALS             — 4–6 bold-titled goal paragraphs
    //        MY ROLE           — Responsibilities + Collaboration sub-sections
    //        USER RESEARCH     — methods, participants, and 3 key insights
    //        DESIGN PROCESS    — discovery → ideation → wireframe → prototype → test
    //        KEY DESIGN DECISIONS — 3–4 decisions including one that failed
    //        TOOLS USED        — tools across research, design, and testing
    //        TIMELINE          — duration and major milestones
    //        THE PROJECT       — Challenge + Outcome sub-sections
    //        KEY METRICS       — 3 headline numbers with descriptions
    //        WHERE WE ARE      — current state of the product
    //        FUTURE IMPROVEMENTS — 6–7 action-verb-led forward-looking paragraphs
    //
    // max_tokens is set to 2500 to comfortably cover the 800–1000 word target
    // (roughly 1,050–1,330 tokens) with headroom for longer inferred sections.
    const prompt = `You are a senior UX writer and portfolio coach who has helped designers land roles at Google, Airbnb, and Spotify. You write case studies that are specific, confident, and compelling — the kind that make hiring managers stop scrolling.

Here are the project details to base the case study on. If any information is missing for a section, intelligently infer realistic details from the context provided — do not leave sections empty or mention that information was not given.

${providedFields}

Structure the case study in this exact order using these exact headings:

## PRODUCT OVERVIEW
A clear, specific paragraph describing what the product is, who it is for, and what it does. Make it sound real and grounded.
[Sets the scene — gives the reader immediate context before any other section.]

## GOALS
Write 4 to 6 goals as short paragraphs. Each goal should have a bold title followed by a sentence explaining it. Cover user experience, business impact, and technical considerations.
[Shows the designer understood the wider purpose of the work, not just the visual output.]

## MY ROLE
Two sub-sections written as flowing paragraphs: first, Responsibilities — what the designer owned end to end. Then, Collaboration — who they worked with and how.
[Helps hiring managers understand scope of ownership and ability to work cross-functionally.]

## USER RESEARCH
Describe who was spoken to, how many people, what method was used (interviews, surveys, usability testing), and the top 3 insights that shaped the design direction. Write in flowing paragraphs.
[Proves the work was grounded in real user needs, not assumptions.]

## DESIGN PROCESS
Walk through the stages: discovery, ideation, wireframing, prototyping, and testing. Be specific about what happened at each stage and what was learned. Write in flowing paragraphs.
[The heart of the case study — shows how the designer thinks, not just what they made.]

## KEY DESIGN DECISIONS
3 to 4 critical decisions made during the project. For each one, explain what the options were, what was chosen, and why. Include one decision that did not work and what was done instead. Write in flowing paragraphs.
[Including a failure shows maturity and self-awareness — traits hiring managers look for.]

## TOOLS USED
A short paragraph listing the tools used across research, design, collaboration, and testing — and what each was used for.
[Quick signal of technical fluency without turning the case study into a CV.]

## TIMELINE
A brief paragraph covering how long the project took and what the major milestones were at each phase.
[Gives the reader a sense of pace and project scale.]

## THE PROJECT
Two sub-sections written as flowing paragraphs: first, Challenge — 3 to 4 specific challenges faced. Then, Outcome — 4 to 6 outcomes achieved, each with a bold title.
[Bookends the story with the problem and resolution — the classic narrative arc.]

## KEY METRICS
3 headline metrics, each with a percentage or number followed by a short description. If the user provided metrics use them; otherwise generate realistic ones based on the context. Write as flowing paragraphs, not a list.
[Numbers make outcomes credible and scannable — hiring managers look for these first.]

## WHERE WE ARE
A grounding paragraph about the current state of the product and what has been achieved so far.
[Shows the project is ongoing and the designer stayed engaged beyond the initial launch.]

## FUTURE IMPROVEMENTS
6 to 7 forward-looking improvements written as short, punchy paragraphs each starting with an action verb.
[Demonstrates strategic thinking and that the designer is never satisfied with "done".]

Rules:
- Write in first person throughout
- Never use bullet points, dashes, or numbered lists — flowing paragraphs only
- Never use em dashes
- Be specific — use real details, numbers, and context wherever possible
- Avoid vague phrases like "leveraged", "utilised", "ensured", "stakeholders"
- Tone: confident, human, direct
- Make it feel like a real designer wrote it, not an AI
- Total length: 800 to 1000 words`;

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
