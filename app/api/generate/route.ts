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
    // The prompt instructs Claude to write a professional case study using only
    // the provided fields, structured into named sections, in flowing prose.
    const prompt = `You are an expert portfolio writer helping professionals craft compelling case studies. Write a portfolio case study based on the following project details. Some fields may be missing — use only what's provided and write the best possible case study from it. Do not mention or reference any missing information.

${providedFields}

Write a professional, engaging portfolio case study with these sections (include a section only if there is enough information to write it meaningfully):

## Opening Hook
A compelling 2-3 sentence hook that grabs attention and highlights the most impressive outcome or challenge.

## The Challenge
A clear description of the problem, context, constraints, and why it mattered. Be specific about the stakes.

## My Approach
A detailed walkthrough of the process, methodology, and how you tackled the problem. Show your thinking.

## Key Decisions
The critical decisions made, trade-offs considered, and the reasoning behind each. This shows strategic thinking.

## Outcomes
Concrete results, metrics, and impact. Include both quantitative and qualitative outcomes. End with a brief reflection on what you learned.

Write in first person, professional yet conversational tone. Be specific and avoid vague buzzwords. Make it sound authentic and human.

IMPORTANT FORMATTING RULES:
- Never use bullet points, dashes, or numbered lists anywhere in the output.
- Write exclusively in flowing, connected paragraphs.
- Every section must be prose only.`;

    // ── Call the Claude API with streaming enabled ────────────────────────────
    // If the API call itself fails (e.g. bad key, wrong model), catch and return
    // a clear error response so the UI can display a useful message.
    let stream;
    try {
      stream = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
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
