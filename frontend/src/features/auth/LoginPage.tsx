import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Network } from 'lucide-react'
import { useAuth } from './auth-context-value'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const notice = (location.state as { notice?: string } | null)?.notice

  const destination = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email, password })
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.')
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
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>Sign in to your workspace</h1>
          <p>Enter your account details to continue.</p>
        </div>

        {notice && <p className="auth-success" role="status">{notice}</p>}

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

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          <div className="auth-form-meta">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-footer">Secure access to TBO Inventory Intelligence</p>
      </section>
    </main>
  )
}


