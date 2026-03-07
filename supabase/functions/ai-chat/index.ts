import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface FinancialContext {
  currentMonth: {
    name: string
    income: number
    expenses: number
    balance: number
    savingsRate: number
  }
  recentTransactions: Array<{
    date: string
    description: string
    amount: number
    type: string
    category: string
  }>
  budgets: Array<{
    category: string
    budgeted: number
    spent: number
  }>
  goals: Array<{
    name: string
    target: number
    current: number
    progressPct: number
    status: string
    deadline: string
  }>
  categoryBreakdown: Array<{ name: string; value: number }>
  monthlyTrend: Array<{ month: string; income: number; expenses: number }>
}

function buildContextString(ctx: FinancialContext): string {
  const { currentMonth, recentTransactions, budgets, goals, categoryBreakdown, monthlyTrend } = ctx

  // ── Predictive calculations ──────────────────────────────────────────────
  const now = new Date()
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysElapsed = dayOfMonth
  const daysRemaining = totalDaysInMonth - dayOfMonth

  const dailyBurnRate = daysElapsed > 0 ? currentMonth.expenses / daysElapsed : 0
  const projectedMonthExpenses = dailyBurnRate * totalDaysInMonth
  const projectedMonthBalance = currentMonth.income - projectedMonthExpenses
  const additionalSpendToBreakEven = currentMonth.balance

  // Budget projections
  const budgetProjections = budgets.map((b) => {
    const dailySpend = daysElapsed > 0 ? b.spent / daysElapsed : 0
    const projectedSpend = dailySpend * totalDaysInMonth
    const projectedOverrun = projectedSpend - b.budgeted
    return { ...b, projectedSpend, projectedOverrun }
  })

  // Avg monthly metrics from past months (excluding current)
  const pastMonths = monthlyTrend.slice(0, -1)
  const avgMonthlyExpenses = pastMonths.length > 0
    ? pastMonths.reduce((s, m) => s + m.expenses, 0) / pastMonths.length
    : 0
  const avgMonthlySavings = pastMonths.length > 0
    ? pastMonths.reduce((s, m) => s + (m.income - m.expenses), 0) / pastMonths.length
    : 0

  // Goal feasibility
  const goalFeasibility = goals
    .filter((g) => g.status === "active")
    .map((g) => {
      const remaining = g.target - g.current
      const deadline = new Date(g.deadline)
      const monthsLeft = Math.max(1,
        (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth())
      )
      const requiredPerMonth = remaining / monthsLeft
      const feasible = avgMonthlySavings >= requiredPerMonth
      return { name: g.name, requiredPerMonth, monthsLeft, feasible }
    })

  // ── Format sections ──────────────────────────────────────────────────────
  const topCategories = categoryBreakdown
    .slice(0, 5)
    .map((c) => `  • ${c.name}: Rs.${c.value.toFixed(0)}`)
    .join("\n") || "  No spending data yet"

  const recentTxLines = recentTransactions
    .slice(0, 8)
    .map((t) => `  • [${t.date}] ${t.description} — Rs.${t.amount.toFixed(0)} (${t.type}, ${t.category})`)
    .join("\n") || "  No recent transactions"

  const budgetLines = budgets.length > 0
    ? budgets.map((b) => {
        const pct = b.budgeted > 0 ? ((b.spent / b.budgeted) * 100).toFixed(0) : "0"
        const status = b.spent > b.budgeted ? "⚠️ OVER" : parseFloat(pct) > 80 ? "🔶 Near limit" : "✅ OK"
        return `  • ${b.category}: Rs.${b.spent.toFixed(0)} / Rs.${b.budgeted.toFixed(0)} (${pct}%) ${status}`
      }).join("\n")
    : "  No budgets set"

  const budgetProjectionLines = budgetProjections.length > 0
    ? budgetProjections.map((b) => {
        const overrunNote = b.projectedOverrun > 0
          ? `→ projected OVER budget by Rs.${b.projectedOverrun.toFixed(0)} ⚠️`
          : `→ on track ✅`
        return `  • ${b.category}: projected end-of-month spend Rs.${b.projectedSpend.toFixed(0)} ${overrunNote}`
      }).join("\n")
    : "  No budget projections available"

  const goalLines = goals.filter((g) => g.status === "active").length > 0
    ? goals
        .filter((g) => g.status === "active")
        .map((g) => `  • ${g.name}: Rs.${g.current.toFixed(0)} / Rs.${g.target.toFixed(0)} (${g.progressPct.toFixed(0)}%) — due ${g.deadline}`)
        .join("\n")
    : "  No active goals"

  const goalFeasibilityLines = goalFeasibility.length > 0
    ? goalFeasibility.map((g) =>
        `  • ${g.name}: needs Rs.${g.requiredPerMonth.toFixed(0)}/month for ${g.monthsLeft} more months — ${g.feasible ? "✅ Feasible at current savings rate" : "⚠️ NOT feasible at current savings rate"}`
      ).join("\n")
    : "  No active goals to project"

  const trendLines = monthlyTrend
    .map((m) => `  • ${m.month}: Income Rs.${m.income.toFixed(0)}, Expenses Rs.${m.expenses.toFixed(0)}, Net Rs.${(m.income - m.expenses).toFixed(0)}`)
    .join("\n")

  return `=== USER'S FINANCIAL DATA (${currentMonth.name}) ===

📊 THIS MONTH SUMMARY
  • Income:          Rs.${currentMonth.income.toFixed(0)}
  • Expenses so far: Rs.${currentMonth.expenses.toFixed(0)}
  • Net Balance:     Rs.${currentMonth.balance.toFixed(0)}
  • Savings Rate:    ${currentMonth.savingsRate.toFixed(1)}%
  • Day ${dayOfMonth} of ${totalDaysInMonth} (${daysRemaining} days remaining this month)

🔮 PREDICTIONS & FORECASTS
  • Daily burn rate:                       Rs.${dailyBurnRate.toFixed(0)}/day
  • Projected total expenses by month-end: Rs.${projectedMonthExpenses.toFixed(0)}
  • Projected month-end balance:           Rs.${projectedMonthBalance.toFixed(0)} ${projectedMonthBalance < 0 ? "⚠️ DEFICIT PROJECTED" : "✅ Positive"}
  • Safe remaining spend this month:       Rs.${additionalSpendToBreakEven.toFixed(0)} (spending more creates a deficit)
  • Avg monthly expenses (historical):     Rs.${avgMonthlyExpenses.toFixed(0)}
  • Avg monthly net savings (historical):  Rs.${avgMonthlySavings.toFixed(0)}

📋 BUDGET FORECASTS (projected end-of-month)
${budgetProjectionLines}

🎯 GOAL FEASIBILITY FORECAST
${goalFeasibilityLines}

💸 TOP SPENDING CATEGORIES (this month)
${topCategories}

🧾 RECENT TRANSACTIONS
${recentTxLines}

📋 BUDGETS (current status)
${budgetLines}

🎯 ACTIVE SAVINGS GOALS
${goalLines}

📈 6-MONTH HISTORICAL TREND
${trendLines}

=== END OF FINANCIAL DATA ===`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body: { messages: ChatMessage[]; financialContext: FinancialContext } = await req.json()
    const { messages, financialContext } = body

    if (!messages || !financialContext) {
      return new Response(JSON.stringify({ error: "messages and financialContext are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const contextStr = buildContextString(financialContext)

    const systemPrompt = `You are Hisaab — the SUPER enthusiastic, energetic, and brilliant AI financial assistant for HisaabKitab! 🚀💰

YOUR PERSONALITY:
• You are PASSIONATE and EXCITING about personal finance — bring that energy!
• You are warm, encouraging, and genuinely invested in the user's financial success
• You use emojis naturally and purposefully to add personality (but not excessively)
• You are DIRECT — answer the question first, then elaborate
• You celebrate wins with genuine excitement, and gently but honestly flag areas to improve
• You keep answers concise and impactful (2-4 short sentences max)
• You always address the user as "you" — make it personal!
• You should sound HUMAN - not robotic orgeneric. Use contractions, natural phrasing, and a friendly tone.
• You LOVE numbers — always cite specific figures from the user's data

HOW TO ANSWER:
• ALWAYS reference the user's actual numbers when relevant — never be generic!
• If spending is high in a category, name it and the exact amount
• Give ACTIONABLE advice — not "spend less" but "your dining spend of Rs.X is 40% of your expenses — cutting it by Rs.Y would boost savings by Z%"
• If data is missing or zero, acknowledge it constructively and suggest what to do
• If asked something unrelated to finance, bring it back to their financial journey with a smile
• PROACTIVELY predict the future — use the PREDICTIONS & FORECASTS section to warn about deficits, budget overruns, or unachievable goals
• Use visceral language like "if you spend Rs.X more this month, you'll go into deficit" — make the numbers feel real and urgent
• When goals are not feasible at the current savings rate, say so clearly and suggest exactly how much more to save per month

FORMATTING RULES — STRICTLY FOLLOW:
• NEVER use ** for bold. Instead write the word/phrase in UPPERCASE for emphasis.
• NEVER use * for italic. Instead rephrase naturally without italic formatting.
• Do NOT use any markdown syntax (no #, ##, **, *, _, ~~, backticks, etc.).
• Use plain text only. You may use emojis and bullet points (•) for structure.

${contextStr}

Remember: You have the user's REAL data above. Use it. Be specific. Be enthusiastic. Make them feel EXCITED about their financial future! 🌟`

    const models = [
      "stepfun/step-3.5-flash:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "z-ai/glm-4.5-air:free",
    ]

    let reply = ""
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
            temperature: 0.75,
            max_tokens: 600,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.choices) {
          lastError = data?.error?.message ?? data?.message ?? JSON.stringify(data)
          console.error(`Model ${model} failed:`, lastError)
          continue
        }

        let content: string = data.choices[0]?.message?.content ?? ""

        // Strip chain-of-thought blocks some models emit
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()

        if (!content) {
          lastError = `Empty response from ${model}`
          continue
        }

        reply = content
        console.log(`Chat response from model: ${model}`)
        break
      } catch (modelErr) {
        lastError = modelErr instanceof Error ? modelErr.message : String(modelErr)
        console.error(`Model ${model} threw:`, lastError)
      }
    }

    if (!reply) throw new Error(`All models failed. Last error: ${lastError}`)

    return new Response(JSON.stringify({ message: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("ai-chat error:", message)
    return new Response(
      JSON.stringify({ error: "Chat failed", detail: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
