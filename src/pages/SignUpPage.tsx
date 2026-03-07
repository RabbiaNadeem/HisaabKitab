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
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400/90">
      <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  )
}

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
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-white/[0.08]'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-orange-400' : score === 3 ? 'text-yellow-400' : 'text-[#00F0FF]'}`}>
        {label}
      </p>
    </div>
  )
}

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
      <div className="relative min-h-screen overflow-hidden px-4 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #06121a 0%, #08080e 30%, #071a1c 60%, #0a0a12 100%)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="auth-aura-1 absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F0FF] opacity-[0.05] blur-[180px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="glass-card-border rounded-3xl border border-white/[0.07] bg-white/[0.04] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <div className="mx-auto mb-7 relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-[#00F0FF]/20 animate-ping opacity-60" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/[0.08]">
                <svg className="h-9 w-9 text-[#00F0FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>Check your inbox</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              We've sent a verification link to your email. Click it to activate your account and get started.
            </p>
            <button
              onClick={() => navigate('/sign-in')}
              className="w-full rounded-xl bg-[#00F0FF] py-3 text-sm font-semibold text-black
                shadow-[0_0_24px_rgba(0,240,255,0.22)] transition-all duration-200
                hover:bg-[#00F0FF]/90 hover:shadow-[0_0_32px_rgba(0,240,255,0.32)] active:scale-[0.98]"
            >
              Go to Sign In
            </button>
            <p className="mt-4 text-xs text-white/20">Didn't receive it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Sign up form ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #06121a 0%, #08080e 30%, #071a1c 60%, #0a0a12 100%)' }}>

      {/* ── Mesh-gradient base blobs ────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-blob absolute -top-48 -right-32 h-[520px] w-[520px] rounded-full bg-[#00F0FF] opacity-[0.06] blur-[160px]" />
        <div className="auth-blob-2 absolute left-[-120px] top-1/3 h-[480px] w-[480px] rounded-full bg-[#36454F] opacity-[0.12] blur-[140px]" />
        <div className="auth-blob-3 absolute bottom-[-60px] right-1/3 h-[400px] w-[400px] rounded-full bg-[#003B3F] opacity-[0.08] blur-[130px]" />
      </div>

      {/* ── Aura spheres (5% opacity, slow oscillation) ─────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-aura-1 absolute top-[15%] right-[15%] h-[460px] w-[460px] rounded-full bg-[#00E68A] opacity-[0.05] blur-[180px]" />
        <div className="auth-aura-2 absolute bottom-[12%] left-[10%] h-[500px] w-[500px] rounded-full bg-[#0066FF] opacity-[0.05] blur-[180px]" />
      </div>

      {/* ── Floating 3D geometric shapes (Electric Teal) ────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Toroid / ring */}
        <div className="auth-shape-1 absolute left-[-5%]">
          <div className="h-60 w-60 rounded-full border-[6px] border-[#00F0FF]/[0.07]"
            style={{ boxShadow: 'inset 0 0 20px rgba(0,240,255,0.04), 0 0 30px rgba(0,240,255,0.03)' }} />
        </div>
        {/* Glass sphere */}
        <div className="auth-shape-2 absolute bottom-[18%] right-[12%]">
          <div className="h-100 w-100 rounded-full bg-[#00F0FF]/[0.04] border border-[#00F0FF]/[0.08]"
            style={{ boxShadow: 'inset 4px -4px 12px rgba(0,240,255,0.05), 0 0 40px rgba(0,240,255,0.03)', backdropFilter: 'blur(6px)' }} />
        </div>
        {/* Large double-ring */}
        <div className="auth-shape-3 absolute top-[15%] right-[2%]">
          <div className="h-60 w-60 rounded-full border-[10px] border-[#00F0FF]/[0.10]"
            style={{ boxShadow: 'inset 0 0 30px rgba(0,240,255,0.04), 0 0 40px rgba(0,240,255,0.03)' }}>
            <div className="absolute inset-4 rounded-full border-[2px] border-[#00F0FF]/[0.06]" />
          </div>
        </div>
        {/* Glass sphere */}
        <div className="auth-shape-4 absolute top-[50%] left-[10%]">
          <div className="h-48 w-48 rounded-full bg-[#00F0FF]/[0.04] border border-[#00F0FF]/[0.08]"
            style={{ boxShadow: 'inset 4px -4px 12px rgba(0,240,255,0.05), 0 0 40px rgba(0,240,255,0.03)', backdropFilter: 'blur(6px)' }} />
        </div>
        {/* Large circle outline */}
        <div className="auth-shape-5 absolute bottom-[50%] right-[50%]">
          <div className="h-120 w-120 rounded-full border-[2px] border-[#00F0FF]/[0.08] bg-[#00F0FF]/[0.02]"
            style={{ boxShadow: '0 0 50px rgba(0,240,255,0.04)' }} />
        </div>
        {/* Large double-ring */}
        <div className="auth-shape-3 absolute bottom-[4%] left-[32%]">
          <div className="h-20 w-20 rounded-full border-[10px] border-[#00F0FF]/[0.10]"
            style={{ boxShadow: 'inset 0 0 10px rgba(0,240,255,0.04), 0 0 10px rgba(0,240,255,0.03)' }}>
            <div className="absolute inset-4 rounded-full border-[2px] border-[#00F0FF]/[0.06]" />
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] py-6">
        {/* Branding */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <img
            src="/hk-logo-removebg.png"
            alt="HisaabKitab Logo"
            className="h-20 w-auto"
          />
        </div>

        {/* Frosted glass card */}
        <div className="glass-card-border rounded-3xl border border-white/[0.07] bg-white/[0.04] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="mb-7">
            <h1 className="text-[1.65rem] font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>Create your account</h1>
            <p className="mt-1.5 text-sm text-white/35">Free forever — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-[13px] font-medium text-white/55">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                {...register('fullName')}
                className={`w-full rounded-xl border bg-white/[0.10] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200
                  focus:border-[#00F0FF]/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(0,240,255,0.12),0_0_18px_rgba(0,240,255,0.10)]
                  ${errors.fullName ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
              />
              <FieldError msg={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-white/55">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={`w-full rounded-xl border bg-white/[0.10] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200
                  focus:border-[#00F0FF]/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(0,240,255,0.12),0_0_18px_rgba(0,240,255,0.10)]
                  ${errors.email ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-white/55">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  {...register('password')}
                  className={`w-full rounded-xl border bg-white/[0.10] px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-200
                    focus:border-[#00F0FF]/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(0,240,255,0.12),0_0_18px_rgba(0,240,255,0.10)]
                    ${errors.password ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
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
              <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium text-white/55">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                  className={`w-full rounded-xl border bg-white/[0.10] px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-200
                    focus:border-[#00F0FF]/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(0,240,255,0.12),0_0_18px_rgba(0,240,255,0.10)]
                    ${errors.confirmPassword ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError msg={errors.confirmPassword?.message} />
            </div>

            {/* Terms note */}
            <p className="text-[12px] text-white/25 leading-relaxed">
              By creating an account you agree to our{' '}
              <a href="#" className="text-white/40 transition-colors hover:text-[#00F0FF] underline underline-offset-2">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-white/40 transition-colors hover:text-[#00F0FF] underline underline-offset-2">Privacy Policy</a>.
            </p>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-400">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl bg-[#00F0FF] py-3 text-sm font-semibold tracking-wide text-black
                shadow-[0_0_24px_rgba(0,240,255,0.22)] transition-all duration-200
                hover:bg-[#00F0FF]/90 hover:shadow-[0_0_32px_rgba(0,240,255,0.32)]
                active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-white/30">
            Already have an account?{' '}
            <Link to="/sign-in" className="font-medium text-[#00F0FF]/70 transition-colors hover:text-[#00F0FF]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
