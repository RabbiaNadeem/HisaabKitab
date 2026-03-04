import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: "Text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Build dates server-side so model always has correct reference
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    const systemPrompt = `You are a financial transaction parser.
CRITICAL DATE RULES — follow exactly:
- TODAY is ${today}. Use this when the user says "today".
- YESTERDAY is ${yesterdayStr}. Use this when the user says "yesterday".
- For any other relative day (e.g. "last Friday", "3 days ago"), calculate from TODAY = ${today}.
- If no date is mentioned, use TODAY = ${today}.

Return ONLY valid JSON, no explanations, no markdown:
{
  "amount": number,
  "type": "expense" | "income",
  "category": string,
  "date": "YYYY-MM-DD",
  "description": string
}`

    // Try models in order — free tiers can be flaky, fallback ensures reliability
    const models = [
      "stepfun/step-3.5-flash:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "z-ai/glm-4.5-air:free",
    ]

    let parsed: unknown = null
    let lastError = ""

    for (const model of models) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.choices) {
          lastError = data?.error?.message ?? data?.message ?? JSON.stringify(data)
          console.error(`Model ${model} failed:`, lastError)
          continue // try next model
        }

        let aiText: string = data.choices[0].message.content ?? ""

        // Strip <think>...</think> blocks
        aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()

        // Strip markdown code fences
        aiText = aiText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()

        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          lastError = `No JSON in response from ${model}`
          console.error(lastError)
          continue // try next model
        }

        parsed = JSON.parse(jsonMatch[0])
        console.log(`Parsed successfully using model: ${model}`)
        break // success — stop trying

      } catch (modelErr) {
        lastError = modelErr instanceof Error ? modelErr.message : String(modelErr)
        console.error(`Model ${model} threw:`, lastError)
        // continue to next model
      }
    }

    if (!parsed) throw new Error(`All models failed. Last error: ${lastError}`)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("ai-parse error:", message)
    return new Response(JSON.stringify({ error: "AI parsing failed", detail: message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})