import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthContext } from '../contexts/AuthContext'

const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignUpFormData = z.infer<typeof signUpSchema>

// ── Icons ──────────────────────────────────────────────────────────────────────
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

// ── Password strength meter ────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Too weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-400' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Good', color: 'bg-blue-400' },
    { label: 'Strong', color: 'bg-[#00F0FF]' },
  ]
  return { score, ...map[score] }
}

function StrengthMeter({ value }: { value: string }) {
  const { score, label, color } = getStrength(value)
  if (!value) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-orange-400' : score === 3 ? 'text-yellow-400' : 'text-[#00F0FF]'}`}>
        {label}
      </p>
    </div>
  )
}

// ── Step indicators ────────────────────────────────────────────────────────────
const steps = ['Account', 'Security', 'Done']

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuthContext()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) })

  const passwordValue = watch('password', '')

  const onSubmit = async (data: SignUpFormData) => {
    setServerError('')
    const { error } = await signUp(data.email, data.password, data.fullName)
    if (error) {
      setServerError(error.message ?? 'Failed to create account. Please try again.')
    } else {
      setSuccess(true)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0f] px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00F0FF]/[0.06] rounded-full blur-[150px]" />
        </div>
        <div className="relative w-full max-w-sm text-center">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-10">
            <div className="mx-auto mb-6 relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-[#00F0FF]/20 animate-ping opacity-75" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                <svg className="h-9 w-9 text-[#00F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              We've sent a verification link to your email. Click it to activate your account and get started.
            </p>
            <button
              onClick={() => navigate('/sign-in')}
              className="w-full py-3 rounded-xl bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black font-semibold text-sm
                transition-all shadow-lg shadow-[#00F0FF]/20 active:scale-[0.98]"
            >
              Go to Sign In
            </button>
            <p className="mt-4 text-xs text-gray-600">Didn't receive it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Sign up form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#0c0c0f]">
      {/* ── Left branding panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative overflow-hidden bg-[#0e0e12]">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#00F0FF]/[0.06] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#00F0FF]/[0.04] rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoMark />
          <span className="text-white font-bold text-xl tracking-tight">HisaabKitab</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-8">
          <div>
                <p className="text-xs font-semibold tracking-widest text-[#00F0FF]/70 uppercase mb-4">Start for free</p>
            <h2 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              Your money,<br />
              <span className="text-[#00F0FF]">your story</span>
            </h2>
            <p className="mt-5 text-gray-400 text-[15px] leading-relaxed max-w-[320px]">
              Join thousands of people who have taken control of their personal finances with HisaabKitab.
            </p>
          </div>

          {/* Social proof */}
          <div className="space-y-4">
            {[
              { stat: '10k+', label: 'Active users' },
              { stat: 'Rs. 2Cr+', label: 'Expenses tracked' },
              { stat: '100%', label: 'Free forever' },
            ].map((item) => (
              <div
                key={item.stat}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4"
              >
                <span className="text-2xl font-extrabold text-[#00F0FF]">{item.stat}</span>
                <span className="text-sm text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <p className="text-sm text-gray-400 italic">"Beware of little expenses; a small leak will sink a great ship."</p>
          <p className="mt-2 text-xs text-gray-600">— Benjamin Franklin</p>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:block w-px bg-white/[0.06] shrink-0" />

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-14 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/[0.04] rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="text-white font-bold text-xl">HisaabKitab</span>
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                  ${i < 2 ? 'bg-[#00F0FF] text-black' : 'bg-white/10 text-gray-500'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium ${i < 2 ? 'text-[#00F0FF]' : 'text-gray-600'}`}>{step}</span>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-white/10 ml-1" />}
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="mt-2 text-sm text-gray-500">Start managing your finances for free — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Talha Zaheer"
                {...register('fullName')}
                className={`w-full rounded-xl px-4 py-3 bg-white/[0.05] border text-white text-sm placeholder-gray-600
                  focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/40 focus:border-[#00F0FF]/40 transition-all duration-150
                  ${errors.fullName ? 'border-red-500/60 bg-red-500/[0.05]' : 'border-white/10 hover:border-white/20'}`}
              />
              <FieldError msg={errors.fullName?.message} />
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
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
              <StrengthMeter value={passwordValue} />
              <FieldError msg={errors.password?.message} />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                  className={`w-full rounded-xl px-4 py-3 pr-11 bg-white/[0.05] border text-white text-sm placeholder-gray-600
                    focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/40 focus:border-[#00F0FF]/40 transition-all duration-150
                    ${errors.confirmPassword ? 'border-red-500/60 bg-red-500/[0.05]' : 'border-white/10 hover:border-white/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword?.message} />
            </div>

            {/* Terms note */}
            <p className="text-xs text-gray-600 leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="#" className="text-gray-400 hover:text-[#00F0FF] transition-colors underline underline-offset-2">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-gray-400 hover:text-[#00F0FF] transition-colors underline underline-offset-2">Privacy Policy</a>.
            </p>

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
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.05]" />
            <span className="text-xs text-gray-600">Already have an account?</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>

          <Link
            to="/sign-in"
            className="mt-4 flex w-full items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/10
              hover:bg-white/[0.08] hover:border-white/20 text-sm font-medium text-gray-300 transition-all duration-150"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  )
}
