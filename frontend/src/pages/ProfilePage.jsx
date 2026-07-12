import { useState } from 'react'
import { User, Mail, Lock, Shield, Save, KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'

const ROLE_LABELS = {
  fleet_manager:     'Fleet Manager',
  driver:            'Driver',
  safety_officer:    'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth()
  const toast = useToast()

  /* Profile edit state */
  const [profileForm, setProfileForm] = useState({
    full_name: user?.name  || '',
    email:     user?.email || '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError,  setProfileError]  = useState('')

  /* Password change state */
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  })
  const [savingPw, setSavingPw] = useState(false)
  const [pwError,  setPwError]  = useState('')
  const [showPws,  setShowPws]  = useState({ cur: false, new: false, conf: false })

  function handleProfileChange(e) {
    setProfileForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setProfileError('')
  }

  function handlePwChange(e) {
    setPwForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setPwError('')
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    if (!profileForm.full_name.trim()) { setProfileError('Name cannot be empty.'); return }
    setSavingProfile(true)
    try {
      await updateProfile({ full_name: profileForm.full_name.trim(), email: profileForm.email })
      toast({ type: 'success', message: 'Profile updated successfully.' })
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePwSave(e) {
    e.preventDefault()
    if (!pwForm.current_password) { setPwError('Current password is required.'); return }
    if (!pwForm.new_password)     { setPwError('New password is required.'); return }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.')
      return
    }
    setSavingPw(true)
    try {
      await changePassword(pwForm.current_password, pwForm.new_password)
      toast({ type: 'success', message: 'Password changed successfully.' })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setPwError(err.message || 'Failed to change password.')
    } finally {
      setSavingPw(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">My Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Manage your account details and password</p>
      </div>

      {/* Avatar + Role Badge */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow">
          {(user.name || 'U')[0].toUpperCase()}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
            <Shield size={11} />
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <User size={16} className="text-gray-400" />
          Account Information
        </h3>

        {profileError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={profileForm.full_name}
              onChange={handleProfileChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="profile_email" className="block text-sm font-medium text-gray-700 mb-1">
              <Mail size={13} className="inline mr-1 text-gray-400" />
              Email Address
            </label>
            <input
              id="profile_email"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-60"
            >
              {savingProfile
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save size={14} />Save Profile</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-gray-400" />
          Change Password
        </h3>

        {pwError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePwSave} className="space-y-4">
          {[
            { id: 'current_password', label: 'Current Password', key: 'cur' },
            { id: 'new_password',     label: 'New Password',     key: 'new' },
            { id: 'confirm_password', label: 'Confirm New Password', key: 'conf' },
          ].map(({ id, label, key }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  id={id}
                  name={id}
                  type={showPws[key] ? 'text' : 'password'}
                  value={pwForm[id]}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  autoComplete={id === 'current_password' ? 'current-password' : 'new-password'}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPws(s => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPws[key] ? 'Hide' : 'Show'}
                >
                  <Lock size={14} />
                </button>
              </div>
              {id === 'confirm_password' && pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
              {id === 'confirm_password' && pwForm.confirm_password && pwForm.new_password === pwForm.confirm_password && pwForm.new_password.length >= 8 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} />Passwords match</p>
              )}
            </div>
          ))}

          <p className="text-xs text-gray-400">Min 8 chars, uppercase, lowercase, digit & special character.</p>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-60"
            >
              {savingPw
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</>
                : <><KeyRound size={14} />Change Password</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
