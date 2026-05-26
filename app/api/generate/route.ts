import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectName,
      role,
      problem,
      process: approach,
      keyDecisions,
      outcomes,
      tools,
      duration,
    } = body;

    console.log("[generate] starting generation for project:", projectName);

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
      .filter(Boolean)
      .join("\n");

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

Write in first person, professional yet conversational tone. Be specific and avoid vague buzzwords. Make it sound authentic and human.`;

    let stream;
    try {
      stream = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error("[generate] Anthropic API error:", {
          status: err.status,
          name: err.name,
          message: err.message,
          error: err.error,
        });
        return new Response(
          `Anthropic API error (${err.status}): ${err.message}`,
          { status: err.status ?? 500 }
        );
      }
      throw err;
    }

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
          console.log("[generate] stream completed for project:", projectName);
        } catch (streamErr) {
          console.error("[generate] stream error:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[generate] unexpected error:", err);
    return new Response(
      err instanceof Error ? err.message : "Unexpected server error",
      { status: 500 }
    );
  }
}
