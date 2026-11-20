import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Network } from 'lucide-react'
import { resetPassword } from './auth-api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('This password reset link is missing its token.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 12) {
      setError('Password must contain at least 12 characters.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      navigate('/login', {
        replace: true,
        state: { notice: 'Password updated successfully. Please sign in.' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark"><Network size={23} /></span>
          <span><strong>TBO</strong><small>INVENTORY INTELLIGENCE</small></span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Set a new password</h1>
          <p>Choose a new password for your account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              placeholder="At least 12 characters"
              required
            />
          </label>

          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              placeholder="Enter your password again"
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button-primary auth-submit" type="submit" disabled={submitting || !token}>
            {submitting ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        <p className="auth-footer">Reset links expire and can only be used once.</p>
      </section>
    </main>
  )
}
