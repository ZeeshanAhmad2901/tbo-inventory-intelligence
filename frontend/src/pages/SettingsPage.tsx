import { useState } from 'react'
import {
  Bell,
  Check,
  ChevronRight,
  Globe2,
  Monitor,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  AlertCircle,
  LockKeyhole,
  Smartphone,
  Mail,
} from 'lucide-react'

type SettingsTab =
  | 'general'
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'security'

type SettingsState = {
  workspaceName: string
  language: string
  timezone: string
  dateFormat: string
  displayName: string
  email: string
  emailNotifications: boolean
  reviewAlerts: boolean
  supplierAlerts: boolean
  weeklySummary: boolean
  inAppNotifications: boolean
  displayDensity: 'Comfortable' | 'Compact'
}

const initialSettings: SettingsState = {
  workspaceName: 'Travel Intelligence',
  language: 'English',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD MMM YYYY',
  displayName: 'Workspace Admin',
  email: 'admin@tbo-demo.com',
  emailNotifications: true,
  reviewAlerts: true,
  supplierAlerts: true,
  weeklySummary: false,
  inAppNotifications: true,
  displayDensity: 'Comfortable',
}

const tabs: {
  id: SettingsTab
  label: string
  description: string
  icon: typeof Globe2
}[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Workspace and regional preferences',
    icon: SlidersHorizontal,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Your account information',
    icon: UserRound,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts and communication preferences',
    icon: Bell,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Customize your workspace',
    icon: Monitor,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Account and session information',
    icon: ShieldCheck,
  },
]

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="settings-section">
      <div className="settings-section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="settings-section-content">{children}</div>
    </section>
  )
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="settings-preference-row">
      <div className="settings-preference-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        className={`settings-switch ${checked ? 'settings-switch-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [settings, setSettings] = useState<SettingsState>(initialSettings)
  const [savedSettings, setSavedSettings] = useState<SettingsState>(initialSettings)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState<'success' | 'error' | null>(null)

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings)

  const profileInitials =
    settings.displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'WA'

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setNotice('')
    setNoticeType(null)
  }

  const saveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextSettings = {
      ...settings,
      workspaceName: settings.workspaceName.trim(),
      displayName: settings.displayName.trim(),
      email: settings.email.trim(),
    }
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextSettings.email)

    if (!nextSettings.workspaceName) {
      setActiveTab('general')
      setNotice('Enter a workspace name before applying changes.')
      setNoticeType('error')
      return
    }

    if (!nextSettings.displayName || !emailIsValid) {
      setActiveTab('profile')
      setNotice(
        !nextSettings.displayName
          ? 'Enter a display name before applying changes.'
          : 'Enter a valid email address before applying changes.',
      )
      setNoticeType('error')
      return
    }

    setSettings(nextSettings)
    setSavedSettings(nextSettings)
    setNotice('Preferences applied for this demonstration session.')
    setNoticeType('success')
  }

  const resetSettings = () => {
    setSettings({ ...savedSettings })
    setNotice('Unsaved changes have been discarded.')
    setNoticeType('success')
  }

  const activeTabDetails = tabs.find((tab) => tab.id === activeTab)!

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE CONFIGURATION</div>
          <h1>Settings</h1>
          <p className="page-description">
            Manage your workspace preferences, account details and experience.
          </p>
        </div>
        <div className="heading-actions">
          <span className="demo-label"><span /> DEMO MODE</span>
        </div>
      </div>

      <div className="settings-intro">
        <div className="settings-intro-icon">
          <SlidersHorizontal size={21} />
        </div>
        <div>
          <strong>Workspace preferences</strong>
          <p>
            Configure how you interact with TBO Inventory Intelligence.
            Your changes are currently limited to this browser session.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar" aria-label="Settings categories">
          <div className="settings-sidebar-label">PREFERENCES</div>
          <nav className="settings-tabs">
            {tabs.map(({ id, label, description, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={`settings-tab ${activeTab === id ? 'settings-tab-active' : ''}`}
                onClick={() => {
                  setActiveTab(id)
                  setNotice('')
                  setNoticeType(null)
                }}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <span className="settings-tab-icon"><Icon size={17} /></span>
                <span className="settings-tab-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <ChevronRight size={15} className="settings-tab-arrow" />
              </button>
            ))}
          </nav>

          <div className="settings-sidebar-note">
            <ShieldCheck size={17} />
            <div>
              <strong>Workspace access</strong>
              <span>Administrator privileges</span>
            </div>
          </div>
        </aside>

        <form className="settings-content panel" onSubmit={saveSettings} noValidate>
          <div className="settings-content-header">
            <div>
              <div className="settings-content-eyebrow">SETTINGS</div>
              <h2>{activeTabDetails.label}</h2>
              <p>{activeTabDetails.description}</p>
            </div>
            <span className="settings-content-icon">
              <activeTabDetails.icon size={20} />
            </span>
          </div>

          {activeTab === 'general' && (
            <>
              <SettingsSection
                title="Workspace details"
                description="Manage the basic identity of your workspace."
              >
                <div className="settings-field">
                  <label htmlFor="settings-workspace">Workspace name</label>
                  <input
                    id="settings-workspace"
                    value={settings.workspaceName}
                    onChange={(event) =>
                      updateSetting('workspaceName', event.target.value)
                    }
                    maxLength={60}
                    required
                  />
                  <small>This name identifies your current workspace.</small>
                </div>
              </SettingsSection>

              <SettingsSection
                title="Regional preferences"
                description="Choose how dates, times and language are presented."
              >
                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label htmlFor="settings-language">Language</label>
                    <select
                      id="settings-language"
                      value={settings.language}
                      onChange={(event) =>
                        updateSetting('language', event.target.value)
                      }
                    >
                      <option>English</option>
                    </select>
                  </div>
                  <div className="settings-field">
                    <label htmlFor="settings-timezone">Time zone</label>
                    <select
                      id="settings-timezone"
                      value={settings.timezone}
                      onChange={(event) =>
                        updateSetting('timezone', event.target.value)
                      }
                    >
                      <option value="Asia/Kolkata">India Standard Time (UTC+05:30)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="Europe/London">London (UTC+00:00)</option>
                      <option value="America/New_York">New York (UTC-05:00)</option>
                      <option value="Asia/Singapore">Singapore (UTC+08:00)</option>
                    </select>
                  </div>
                  <div className="settings-field">
                    <label htmlFor="settings-date">Date format</label>
                    <select
                      id="settings-date"
                      value={settings.dateFormat}
                      onChange={(event) =>
                        updateSetting('dateFormat', event.target.value)
                      }
                    >
                      <option value="DD MMM YYYY">17 Nov 2026</option>
                      <option value="MM/DD/YYYY">11/17/2026</option>
                      <option value="YYYY-MM-DD">2026-11-17</option>
                    </select>
                  </div>
                </div>
              </SettingsSection>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <SettingsSection
                title="Personal information"
                description="Manage the profile information displayed in your workspace."
              >
                <div className="settings-profile-card">
                  <div className="settings-profile-avatar">{profileInitials}</div>
                  <div>
                    <strong>{settings.displayName || 'Workspace Admin'}</strong>
                    <span>Workspace Administrator</span>
                  </div>
                  <span className="settings-role-badge">ADMIN</span>
                </div>
                <div className="settings-field-grid">
                  <div className="settings-field">
                    <label htmlFor="settings-display-name">Display name</label>
                    <input
                      id="settings-display-name"
                      value={settings.displayName}
                      onChange={(event) =>
                        updateSetting('displayName', event.target.value)
                      }
                      maxLength={60}
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label htmlFor="settings-email">Email address</label>
                    <input
                      id="settings-email"
                      type="email"
                      value={settings.email}
                      onChange={(event) =>
                        updateSetting('email', event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection
                title="Account role"
                description="Your current workspace access level."
              >
                <div className="settings-readonly-row">
                  <div>
                    <strong>Administrator</strong>
                    <span>Full access within the demonstration workspace.</span>
                  </div>
                  <span className="settings-status-pill">Active</span>
                </div>
              </SettingsSection>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <SettingsSection
                title="Email notifications"
                description="Choose which updates you would like to receive."
              >
                <PreferenceRow
                  title="Email notifications"
                  description="Enable or disable email notification preferences."
                  checked={settings.emailNotifications}
                  onChange={(value) => updateSetting('emailNotifications', value)}
                />
                <PreferenceRow
                  title="Review queue alerts"
                  description="Receive updates about pending hotel listing reviews."
                  checked={settings.reviewAlerts}
                  disabled={!settings.emailNotifications}
                  onChange={(value) => updateSetting('reviewAlerts', value)}
                />
                <PreferenceRow
                  title="Supplier connection alerts"
                  description="Receive notifications about supplier connection status."
                  checked={settings.supplierAlerts}
                  disabled={!settings.emailNotifications}
                  onChange={(value) => updateSetting('supplierAlerts', value)}
                />
                <PreferenceRow
                  title="Weekly activity summary"
                  description="Receive a weekly overview of workspace activity."
                  checked={settings.weeklySummary}
                  disabled={!settings.emailNotifications}
                  onChange={(value) => updateSetting('weeklySummary', value)}
                />
              </SettingsSection>

              <SettingsSection
                title="In-app notifications"
                description="Manage notification preferences within the workspace."
              >
                <PreferenceRow
                  title="In-app alerts"
                  description="Show notification preferences for workspace activity."
                  checked={settings.inAppNotifications}
                  onChange={(value) => updateSetting('inAppNotifications', value)}
                />
              </SettingsSection>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <SettingsSection
                title="Display preferences"
                description="Adjust the density of information across your workspace."
              >
                <div className="settings-density-options">
                  {(['Comfortable', 'Compact'] as const).map((density) => (
                    <button
                      type="button"
                      key={density}
                      className={`settings-density-card ${settings.displayDensity === density ? 'settings-density-active' : ''}`}
                      onClick={() => updateSetting('displayDensity', density)}
                      aria-pressed={settings.displayDensity === density}
                    >
                      <span className={`settings-density-preview ${density.toLowerCase()}`}>
                        <i /><i /><i />
                      </span>
                      <span className="settings-density-copy">
                        <strong>{density}</strong>
                        <small>
                          {density === 'Comfortable'
                            ? 'More spacing between elements'
                            : 'More information in less space'}
                        </small>
                      </span>
                      <span className="settings-density-check">
                        {settings.displayDensity === density && <Check size={14} />}
                      </span>
                    </button>
                  ))}
                </div>
              </SettingsSection>

              <SettingsSection
                title="Interface theme"
                description="The current demonstration interface uses a light theme."
              >
                <div className="settings-theme-card">
                  <span className="settings-theme-preview">
                    <i /><i /><i />
                  </span>
                  <div>
                    <strong>Light appearance</strong>
                    <span>Warm neutral surfaces with navy and muted teal accents.</span>
                  </div>
                  <span className="settings-status-pill">Current</span>
                </div>
              </SettingsSection>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div className="settings-security-notice">
                <AlertCircle size={18} />
                <div>
                  <strong>Authentication is not connected</strong>
                  <p>
                    Account security controls require a backend authentication
                    service. The actions below are informational and are not active.
                  </p>
                </div>
              </div>

              <SettingsSection
                title="Account security"
                description="Information about your current demonstration account."
              >
                <div className="settings-security-row">
                  <span className="settings-security-icon"><LockKeyhole size={18} /></span>
                  <div>
                    <strong>Password management</strong>
                    <span>Password changes are not available in demo mode.</span>
                  </div>
                  <button type="button" className="button button-secondary" disabled>
                    Change password
                  </button>
                </div>
                <div className="settings-security-row">
                  <span className="settings-security-icon"><Smartphone size={18} /></span>
                  <div>
                    <strong>Active sessions</strong>
                    <span>Current browser session · Demonstration environment</span>
                  </div>
                  <span className="settings-status-pill">Current</span>
                </div>
                <div className="settings-security-row">
                  <span className="settings-security-icon"><Mail size={18} /></span>
                  <div>
                    <strong>Two-factor authentication</strong>
                    <span>Multi-factor authentication is not configured.</span>
                  </div>
                  <span className="settings-status-muted">Unavailable</span>
                </div>
              </SettingsSection>
            </>
          )}

          <div className="settings-form-footer">
            <div
              className={`settings-save-message ${noticeType === 'error' ? 'settings-save-message-error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {notice && (
                <>
                  {noticeType === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
                  {notice}
                </>
              )}
            </div>
            {activeTab !== 'security' && (
              <div className="settings-form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={resetSettings}
                  disabled={!hasChanges}
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={!hasChanges}
                >
                  <Save size={14} /> Apply changes
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="settings-demo-footnote">
        <Globe2 size={14} />
        <span>
          Demonstration settings only. Preferences are held in local page state
          and are not persisted to an account or server.
        </span>
      </div>
    </div>
  )
}
