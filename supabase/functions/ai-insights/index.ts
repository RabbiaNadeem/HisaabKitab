import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface CategoryData {
  name: string
  amount: number
  percentage: number
}

interface MonthData {
  month: string
  income: number
  expenses: number
}

interface FinancialSummary {
  currentMonth: { name: string; income: number; expenses: number; savingsRate: number }
  prevMonth: { name: string; income: number; expenses: number }
  categoryBreakdown: CategoryData[]
  monthlyTrend: MonthData[]
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const summary: FinancialSummary = await req.json()

    if (!summary?.currentMonth) {
      return new Response(JSON.stringify({ error: "Financial summary required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { currentMonth, prevMonth, categoryBreakdown } = summary

    const topCategories = categoryBreakdown
      .slice(0, 5)
      .map((c) => `- ${c.name}: Rs.${c.amount.toFixed(0)} (${c.percentage.toFixed(1)}% of expenses)`)
      .join("\n")

    const incomeChange =
      prevMonth.income > 0
        ? (((currentMonth.income - prevMonth.income) / prevMonth.income) * 100).toFixed(1)
        : null

    const expenseChange =
      prevMonth.expenses > 0
        ? (((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100).toFixed(1)
        : null

    const systemPrompt = `You are a personal finance coach. Analyze the financial data provided and generate exactly 4 concise, actionable insights.

Return ONLY valid JSON — no explanations, no markdown:
{
  "insights": [
    { "type": "positive" | "warning" | "info" | "negative", "text": "insight text" }
  ]
}

Rules for the insights:
- Generate EXACTLY 4 insights.
- Each insight must be one sentence, under 18 words, and reference specific numbers or percentages from the data.
- "positive" = good financial behaviour (e.g. high savings, income growth, low spending).
- "warning" = a pattern worth watching but not yet critical (e.g. slightly high category spend).
- "negative" = a concerning pattern that needs attention (e.g. expenses exceed income, very low savings).
- "info" = neutral observation (e.g. top spending category, income unchanged).
- Never repeat the same insight type more than twice.
- Be direct and conversational — avoid generic advice.`

    const sign = (n: string) => (parseFloat(n) >= 0 ? `+${n}` : n)
    const userMessage = `Financial data for ${currentMonth.name}:
Income: Rs.${currentMonth.income.toFixed(0)}${incomeChange ? ` (${sign(incomeChange)}% vs ${prevMonth.name})` : ""}
Expenses: Rs.${currentMonth.expenses.toFixed(0)}${expenseChange ? ` (${sign(expenseChange)}% vs ${prevMonth.name})` : ""}
Net Balance: Rs.${(currentMonth.income - currentMonth.expenses).toFixed(0)}
Savings Rate: ${currentMonth.savingsRate.toFixed(1)}%

Top Spending Categories:
${topCategories || "No expense data available yet."}`

    const models = [
      "stepfun/step-3.5-flash:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "z-ai/glm-4.5-air:free",
    ]

    let result: unknown = null
    let lastError = ""

    for (const model of models) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.choices) {
          lastError = data?.error?.message ?? data?.message ?? JSON.stringify(data)
          console.error(`Model ${model} failed:`, lastError)
          continue
        }

        let aiText: string = data.choices[0].message.content ?? ""

        // Strip <think>...</think> blocks (some models emit chain-of-thought)
        aiText = aiText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()

        // Strip markdown code fences
        aiText = aiText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()

        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          lastError = `No JSON found in response from ${model}`
          console.error(lastError)
          continue
        }

        const parsed = JSON.parse(jsonMatch[0])
        if (!parsed?.insights || !Array.isArray(parsed.insights)) {
          lastError = `Invalid shape from ${model}`
          continue
        }

        result = parsed
        console.log(`Insights generated using model: ${model}`)
        break
      } catch (modelErr) {
        lastError = modelErr instanceof Error ? modelErr.message : String(modelErr)
        console.error(`Model ${model} threw:`, lastError)
      }
    }

    if (!result) throw new Error(`All models failed. Last error: ${lastError}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("ai-insights error:", message)
    return new Response(
      JSON.stringify({ error: "AI insights generation failed", detail: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
