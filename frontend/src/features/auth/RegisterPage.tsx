import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Network } from 'lucide-react'
import { useAuth } from './auth-context-value'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

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
      await register({ full_name: fullName, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.')
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
          <p className="auth-eyebrow">GET STARTED</p>
          <h1>Create your account</h1>
          <p>Set up your account to access the workspace.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={120}
              placeholder="Your full name"
              required
            />
          </label>

          <label>
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={255}
              placeholder="you@company.com"
              required
            />
          </label>

          <label>
            Password
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
            Confirm password
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

          <button className="button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-footer">New accounts receive Viewer access by default.</p>
      </section>
    </main>
  )
}

