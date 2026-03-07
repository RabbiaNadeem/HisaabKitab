import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { X, Send, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAiChat, type ChatMessage } from '@/hooks/useAiChat'

// ─── Suggested questions shown on the welcome screen ─────────────────────────

const SUGGESTED_QUESTIONS = [
  { text: 'How am I doing this month?', emoji: '📊' },
  { text: 'Where am I spending the most?', emoji: '💸' },
  { text: 'Am I on track with my goals?', emoji: '🎯' },
  { text: 'How can I improve my savings?', emoji: '💰' },
]

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2 mb-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 ring-1 ring-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary/30 text-primary-foreground rounded-tr-sm'
            : 'bg-muted/90 text-foreground rounded-tl-sm',
        )}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {message.content}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2 mb-3">
      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: '160ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: '320ms' }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isLoading, sendMessage, clearMessages } = useAiChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages update or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedQuestion = async (q: string) => {
    await sendMessage(q)
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`
  }

  const showWelcome = messages.length === 0

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-[5.5rem] right-6 z-50',
          'w-[90vw] sm:w-[370px]',
          'flex flex-col rounded-2xl border border-border bg-background',
          'shadow-[0_8px_40px_rgba(0,0,0,0.18)]',
          'transition-all duration-300 ease-out origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-3 pointer-events-none',
        )}
        style={{ height: '530px' }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border rounded-t-2xl bg-gradient-to-r from-primary/5 via-primary/3 to-transparent shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 overflow-hidden">
              <img src="/hk-logo-removebg.png" alt="Hisaab AI" className="h-7 w-7 object-contain" />
              </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Hisaab AI</p>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[10px] text-muted-foreground">Your financial assistant</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
              title="Clear chat"
              tabIndex={isOpen ? 0 : -1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            tabIndex={isOpen ? 0 : -1}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth"
        >
          {showWelcome ? (
            /* Welcome screen */
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 overflow-hidden">
              <img src="/hk-logo-removebg.png" alt="Hisaab AI" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">
                  Hey! I'm Hisaab, your finance AI!
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask me anything about your money — I have access to your actual financial data!
                </p>
              </div>
              <div className="w-full flex flex-col gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => handleSuggestedQuestion(`${q.emoji} ${q.text}`)}
                    className="flex items-center gap-2.5 text-left text-xs px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground group"
                    tabIndex={isOpen ? 0 : -1}
                  >
                    <span className="text-base shrink-0">{q.emoji}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="py-1">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
          <div className="px-3 pb-3 pt-2 border-t border-border shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances…"
              className={cn(
                'flex-1 min-h-[40px] max-h-[100px] resize-none rounded-xl text-sm py-2.5 px-3',
                'bg-muted border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30',
                'placeholder:text-muted-foreground text-foreground outline-none transition-colors',
                'scrollbar-thin',
              )}
              rows={1}
              disabled={isLoading}
              tabIndex={isOpen ? 0 : -1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 rounded-xl shrink-0"
              tabIndex={isOpen ? 0 : -1}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
            Powered by AI · Your data stays private 🔒
          </p>
        </div>
      </div>

      {/* ── Floating Action Button ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring — shown when chat is closed & has no messages */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/15 pointer-events-none" />
        )}
        <Button
          onClick={() => setIsOpen((o) => !o)}
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-lg shadow-primary/25',
            'bg-gradient-to-br from-primary/60 to-primary/40 hover:from-primary/70 hover:to-primary/50',
            'transition-all duration-300',
            isOpen && 'rotate-[360deg]',
          )}
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <img src="/hk-logo-removebg.png" alt="Hisaab AI" className="h-9 w-9 object-contain" />
          )}
        </Button>
      </div>
    </>
  )
}
