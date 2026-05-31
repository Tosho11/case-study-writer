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
    // The system prompt sets the voice and quality bar; the user message
    // supplies the project details and section structure to follow.
    const prompt = `You are a senior UX writer and portfolio coach who has helped designers land roles at Google, Airbnb, and Spotify. You write case studies that are specific, confident, and compelling — the kind that make hiring managers stop scrolling.

Rules:
- Write in first person, past tense
- Be specific — use numbers, timelines, and real details wherever possible
- Never use vague phrases like "I leveraged", "I utilised", "I drove impact", "I collaborated with stakeholders", or "I ensured"
- Never use bullet points, dashes, or lists — write in flowing paragraphs only
- Never use em dashes
- Each section should feel like it was written by the designer themselves, not by an AI
- The opening hook must be a single punchy sentence that captures the core tension or challenge
- The process section should show real thinking — what was tried, what failed, what was learned
- The outcomes section must be concrete — if no metrics are given, describe qualitative impact clearly
- Total length: 350 to 450 words
- Tone: confident, human, direct — like a great designer talking about their work in an interview

Now write a portfolio case study based on the following project details. Some fields may be missing — use only what's provided and write the best possible case study from it. Do not mention or reference any missing information.

${providedFields}

Structure the case study with these sections (include a section only if there is enough information to write it meaningfully):

## Opening Hook
A single punchy sentence that captures the core tension or challenge.

## The Challenge
A specific description of the problem, context, constraints, and why it mattered.

## My Approach
A detailed walkthrough showing real thinking — what was tried, what failed, what was learned.

## Key Decisions
The critical decisions made, the trade-offs considered, and the reasoning behind each choice.

## Outcomes
Concrete results and impact. Use metrics if provided; otherwise describe qualitative outcomes clearly.`;

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
