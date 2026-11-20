import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Network } from 'lucide-react'
import { requestPasswordReset } from './auth-api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)

    try {
      const response = await requestPasswordReset(email)
      setMessage(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process your request.')
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
          <h1>Forgot your password?</h1>
          <p>Enter your registered email address. If an account exists, you'll receive password reset instructions.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </label>

          {message && <p className="auth-success" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>

        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        <p className="auth-footer">Your account details remain private and secure.</p>
      </section>
    </main>
  )
}
