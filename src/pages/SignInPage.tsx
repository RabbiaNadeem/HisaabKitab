import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthContext } from '../contexts/AuthContext'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Smart Analytics',
    desc: 'Visual charts for income, expenses & trends',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Expense Tracking',
    desc: 'Log every rupee instantly',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'End-to-end encrypted with Supabase Auth',
  },
]

// ── FieldError helper ──────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="text-xs text-red-400 flex items-center gap-1 mt-1.5">
      <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  )
}

// ── Logo mark ──────────────────────────────────────────────────────────────────
function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className={`${dim} rounded-xl bg-[#00F0FF] flex items-center justify-center shadow-lg shadow-[#00F0FF]/25`}>
      <svg className={`${icon} text-black`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
  )
}

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const { signIn } = useAuthContext()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) })

  const onSubmit = async (data: SignInFormData) => {
    setServerError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError(error.message ?? 'Invalid credentials. Please try again.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0c0c0f]">
      {/* ── Left branding panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden bg-[#0e0e12]">
        {/* ambient glows */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#00F0FF]/[0.07] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#00F0FF]/[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark />
          <span className="text-white font-bold text-xl tracking-tight">HisaabKitab</span>
        </div>

        {/* Hero copy + feature cards */}
        <div className="relative z-10 space-y-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#00F0FF]/70 uppercase mb-4">Personal Finance</p>
            <h2 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              Take control of<br />
              <span className="text-[#00F0FF]">your money</span>
            </h2>
            <p className="mt-5 text-gray-400 text-[15px] leading-relaxed max-w-[340px]">
              Track every rupee, understand your spending patterns, and hit your savings goals — all from one clean dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/15">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <p className="text-sm text-gray-400 italic leading-relaxed">
            "Do not save what is left after spending, but spend what is left after saving."
          </p>
          <p className="mt-2 text-xs text-gray-600">— Warren Buffett</p>
        </div>
      </div>

      {/* ── Vertical divider ─────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-px bg-white/[0.06] shrink-0" />

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-14 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/[0.04] rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="text-white font-bold text-xl">HisaabKitab</span>
        </div>

        <div className="w-full max-w-[380px] relative z-10">
          <div className="mb-9">
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={`w-full rounded-xl px-4 py-3 bg-white/[0.05] border text-white text-sm placeholder-gray-600
                  focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/40 focus:border-[#00F0FF]/40 transition-all duration-150
                  ${errors.email ? 'border-red-500/60 bg-red-500/[0.05]' : 'border-white/10 hover:border-white/20'}`}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                <a href="#" className="text-xs text-[#00F0FF] hover:text-[#00F0FF]/80 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`w-full rounded-xl px-4 py-3 pr-11 bg-white/[0.05] border text-white text-sm placeholder-gray-600
                    focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/40 focus:border-[#00F0FF]/40 transition-all duration-150
                    ${errors.password ? 'border-red-500/60 bg-red-500/[0.05]' : 'border-white/10 hover:border-white/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.password?.message} />
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3">
                <svg className="h-4 w-4 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-400">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/80 active:scale-[0.98]
                text-black font-semibold text-sm tracking-wide transition-all duration-150
                shadow-lg shadow-[#00F0FF]/20
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0c0f]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Bottom link */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.05]" />
            <span className="text-xs text-gray-600">New to HisaabKitab?</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>

          <Link
            to="/sign-up"
            className="mt-4 flex w-full items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/10
              hover:bg-white/[0.08] hover:border-white/20 text-sm font-medium text-gray-300 transition-all duration-150"
          >
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  )
}
