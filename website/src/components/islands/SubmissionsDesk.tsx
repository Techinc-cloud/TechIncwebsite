import { useState, useEffect, useMemo } from 'react'

export interface SubmissionItem {
  name: string
  kind: 'contact' | 'consultation' | 'assessment' | 'ticket'
  status: 'New' | 'In Progress' | 'Closed'
  full_name: string
  email: string
  phone?: string
  organization?: string
  industry?: string
  employees?: string
  interest?: string
  message?: string
  subject?: string
  description?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  category?: string
  helpdesk_ticket?: string
  follow_up_notes?: string
  lead_doctype?: string
  lead?: string
  score?: number
  band?: string
  page?: string
  creation?: string
  modified?: string
}

export default function SubmissionsDesk() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Edit state for follow-up
  const [activeStatus, setActiveStatus] = useState<string>('New')
  const [activeNotes, setActiveNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  async function fetchSubmissions() {
    setLoading(true)
    try {
      const res = await fetch('/api/submissions')
      const data = await res.json()
      if (data.ok && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions)
        setIsLive(Boolean(data.live))
        setNotice(data.notice || '')
        if (data.submissions.length > 0) {
          const first = data.submissions[0]
          setSelectedId(first.name)
          setActiveStatus(first.status)
          setActiveNotes(first.follow_up_notes || '')
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  const selected = useMemo(() => {
    return submissions.find((s) => s.name === selectedId) || submissions[0]
  }, [submissions, selectedId])

  useEffect(() => {
    if (selected) {
      setActiveStatus(selected.status)
      setActiveNotes(selected.follow_up_notes || '')
      setSaveSuccess(false)
    }
  }, [selected])

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchKind = kindFilter === 'all' || s.kind === kindFilter
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.organization?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q)
      return matchKind && matchStatus && matchSearch
    })
  }, [submissions, kindFilter, statusFilter, search])

  async function handleSaveNotes() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selected.name,
          status: activeStatus,
          follow_up_notes: activeNotes,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setSubmissions((prev) =>
          prev.map((item) =>
            item.name === selected.name
              ? { ...item, status: activeStatus as any, follow_up_notes: activeNotes }
              : item,
          ),
        )
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatTime(iso?: string) {
    if (!iso) return ''
    try {
      const date = new Date(iso)
      const diffMin = Math.round((Date.now() - date.getTime()) / 60000)
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHours = Math.round(diffMin / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return iso
    }
  }

  function getKindBadge(kind: string) {
    switch (kind) {
      case 'consultation':
        return { label: 'Consultation', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' }
      case 'assessment':
        return { label: 'Assessment', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
      case 'ticket':
        return { label: 'Support Ticket', bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
      default:
        return { label: 'Contact Enquiry', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Closed':
        return { bg: '#ecfdf5', color: '#047857', dot: '#10b981' }
      case 'In Progress':
        return { bg: '#fff7ed', color: '#c2410c', dot: '#f97316' }
      default:
        return { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' }
    }
  }

  return (
    <div className="desk">
      {/* Top Navbar */}
      <header className="desk__header">
        <div className="desk__headerLeft">
          <div className="desk__brand">
            <span className="desk__logo">T</span>
            <span className="desk__title">Frappe Desk</span>
          </div>
          <span className="desk__slash">/</span>
          <span className="desk__crumb">Website Submissions TI</span>
          <span className={`desk__statusLive ${isLive ? 'desk__statusLive--online' : 'desk__statusLive--demo'}`}>
            <span className="desk__statusDot"></span>
            {isLive ? 'Frappe Connected' : 'Preview Mode'}
          </span>
        </div>

        <div className="desk__headerRight">
          <a href="/contact" className="desk__actionLink" target="_blank" rel="noreferrer">
            Open Website Form ↗
          </a>
          <button className="desk__refreshBtn" onClick={fetchSubmissions} disabled={loading}>
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {notice && !isLive && (
        <div className="desk__notice">
          ℹ️ {notice}. When your Frappe server is online, this view automatically populates with live CRM entries.
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="desk__body">
        {/* Left Column: Submissions List */}
        <aside className="desk__sidebar">
          <div className="desk__filters">
            <div className="desk__searchBox">
              <input
                type="text"
                placeholder="Search by name, org, enquiry notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="desk__input desk__input--search"
              />
            </div>
            <div className="desk__filterRow">
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                className="desk__select desk__select--sm"
              >
                <option value="all">All Types</option>
                <option value="consultation">Consultation</option>
                <option value="contact">Contact</option>
                <option value="assessment">Assessment</option>
                <option value="ticket">Ticket</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="desk__select desk__select--sm"
              >
                <option value="all">All Status</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="desk__list">
            {loading && submissions.length === 0 ? (
              <div className="desk__empty">Loading submissions…</div>
            ) : filtered.length === 0 ? (
              <div className="desk__empty">No submissions match the filters.</div>
            ) : (
              filtered.map((item) => {
                const isSelected = item.name === selected?.name
                const kindBadge = getKindBadge(item.kind)
                const statusBadge = getStatusBadge(item.status)
                const initials = item.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedId(item.name)}
                    className={`desk__item ${isSelected ? 'desk__item--selected' : ''}`}
                  >
                    <div className="desk__itemAvatar">{initials || 'U'}</div>
                    <div className="desk__itemMain">
                      <div className="desk__itemRow">
                        <span className="desk__itemName">{item.full_name}</span>
                        <span className="desk__itemTime">{formatTime(item.creation)}</span>
                      </div>
                      <div className="desk__itemOrg">{item.organization || item.email}</div>
                      <div className="desk__itemTags">
                        <span
                          className="desk__badge"
                          style={{
                            backgroundColor: kindBadge.bg,
                            color: kindBadge.color,
                            borderColor: kindBadge.border,
                          }}
                        >
                          {kindBadge.label}
                        </span>
                        <span
                          className="desk__statusBadge"
                          style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
                        >
                          <span
                            className="desk__badgeDot"
                            style={{ backgroundColor: statusBadge.dot }}
                          ></span>
                          {item.status}
                        </span>
                      </div>
                      {(item.message || item.description) && (
                        <p className="desk__itemSnippet">
                          {item.message || item.description}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right Column: Detailed Record View */}
        <main className="desk__content">
          {selected ? (
            <div className="desk__card">
              {/* Card Header Bar */}
              <div className="desk__cardHeader">
                <div>
                  <div className="desk__cardMeta">
                    <span
                      className="desk__badge desk__badge--lg"
                      style={getKindBadge(selected.kind)}
                    >
                      {getKindBadge(selected.kind).label}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selected.name)}
                      className="desk__idBadge"
                      title="Click to copy submission ID"
                    >
                      {selected.name} {copied ? '✓ Copied' : '📋'}
                    </button>
                    {selected.creation && (
                      <span className="desk__dateLabel">
                        Received {new Date(selected.creation).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h1 className="desk__cardTitle">{selected.full_name}</h1>
                </div>

                {/* Quick Actions */}
                <div className="desk__quickActions">
                  {selected.email && (
                    <a
                      href={`mailto:${selected.email}?subject=Regarding your consultation request - Techinc`}
                      className="desk__btn desk__btn--outline"
                    >
                      ✉ Reply via Email
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="desk__btn desk__btn--outline">
                      📞 Call Client
                    </a>
                  )}
                  {selected.lead && (
                    <span className="desk__leadTag" title="Linked CRM Lead ID">
                      CRM Lead: <strong>{selected.lead}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION: The Enquiry Notes (TELL US WHAT IS GOING ON) */}
              <div className="desk__section desk__section--highlight">
                <div className="desk__sectionHeader">
                  <div className="desk__sectionTitleRow">
                    <span className="desk__sectionIcon">📝</span>
                    <div>
                      <h2 className="desk__sectionTitle">Tell us what is going on (Enquiry Notes)</h2>
                      <p className="desk__sectionSubtitle">
                        Original message submitted by the client through the website intake form
                      </p>
                    </div>
                  </div>
                  <span className="desk__fieldPill">Form Field: message</span>
                </div>

                <div className="desk__notesBox">
                  <div className="desk__notesQuote">“</div>
                  <div className="desk__notesText">
                    {selected.message || selected.description || (
                      <em className="desk__dim">No enquiry notes were provided with this submission.</em>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: Client & Company Information */}
              <div className="desk__section">
                <h3 className="desk__sectionTitle">Client & Organisation Details</h3>
                <div className="desk__grid">
                  <div className="desk__field">
                    <label className="desk__label">Full Name</label>
                    <div className="desk__val">{selected.full_name}</div>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Work Email</label>
                    <div className="desk__val">
                      <a href={`mailto:${selected.email}`} className="desk__link">
                        {selected.email}
                      </a>
                    </div>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Phone Number</label>
                    <div className="desk__val">{selected.phone || '—'}</div>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Organisation</label>
                    <div className="desk__val">{selected.organization || '—'}</div>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Industry</label>
                    <div className="desk__val">{selected.industry || '—'}</div>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Company Size</label>
                    <div className="desk__val">{selected.employees || '—'}</div>
                  </div>

                  <div className="desk__field desk__field--full">
                    <label className="desk__label">What do you need? (Service Interest)</label>
                    <div className="desk__val desk__val--highlight">
                      {selected.interest || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: If Assessment */}
              {selected.kind === 'assessment' && selected.score !== undefined && (
                <div className="desk__section">
                  <h3 className="desk__sectionTitle">ERP Readiness Assessment Result</h3>
                  <div className="desk__assessmentBar">
                    <div className="desk__scoreCircle">
                      <span className="desk__scoreNum">{selected.score}</span>
                      <span className="desk__scoreMax">/100</span>
                    </div>
                    <div>
                      <div className="desk__bandTitle">
                        Readiness Band: <strong>{selected.band}</strong>
                      </div>
                      <p className="desk__bandText">
                        Assessed against Techinc's 10 ERP maturity dimensions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: If Support Ticket */}
              {selected.kind === 'ticket' && (
                <div className="desk__section">
                  <h3 className="desk__sectionTitle">Support Ticket Info</h3>
                  <div className="desk__grid">
                    <div className="desk__field desk__field--full">
                      <label className="desk__label">Subject</label>
                      <div className="desk__val"><strong>{selected.subject}</strong></div>
                    </div>
                    <div className="desk__field">
                      <label className="desk__label">Priority</label>
                      <div className="desk__val">{selected.priority}</div>
                    </div>
                    <div className="desk__field">
                      <label className="desk__label">Category</label>
                      <div className="desk__val">{selected.category || 'General'}</div>
                    </div>
                    <div className="desk__field">
                      <label className="desk__label">Helpdesk Ticket ID</label>
                      <div className="desk__val">{selected.helpdesk_ticket || 'Generated in Frappe'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Sales Follow-up & CRM Notes */}
              <div className="desk__section desk__section--followup">
                <div className="desk__sectionHeader">
                  <div>
                    <h3 className="desk__sectionTitle">Sales Follow-up & Internal Notes</h3>
                    <p className="desk__sectionSubtitle">
                      Update the status and record notes as your sales team engages this lead.
                    </p>
                  </div>
                </div>

                <div className="desk__grid">
                  <div className="desk__field">
                    <label className="desk__label">Follow-up Status</label>
                    <select
                      value={activeStatus}
                      onChange={(e) => setActiveStatus(e.target.value)}
                      className="desk__select"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="desk__field">
                    <label className="desk__label">Linked CRM Lead</label>
                    <div className="desk__val">
                      {selected.lead ? (
                        <span>
                          {selected.lead_doctype || 'Lead'}: <strong>{selected.lead}</strong>
                        </span>
                      ) : (
                        <span className="desk__dim">Auto-generates upon Frappe sync</span>
                      )}
                    </div>
                  </div>

                  <div className="desk__field desk__field--full">
                    <label className="desk__label">Internal Follow-up Notes (for your team)</label>
                    <textarea
                      rows={3}
                      value={activeNotes}
                      onChange={(e) => setActiveNotes(e.target.value)}
                      placeholder="Add notes about calls, discovery meetings, and next steps..."
                      className="desk__textarea"
                    />
                  </div>
                </div>

                <div className="desk__saveRow">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="desk__btn desk__btn--primary"
                  >
                    {saving ? 'Saving to Frappe…' : 'Save Status & Follow-up Notes'}
                  </button>
                  {saveSuccess && (
                    <span className="desk__saveSuccess">✓ Saved successfully!</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="desk__emptyMain">Select a submission from the list to view its full details.</div>
          )}
        </main>
      </div>
    </div>
  )
}
