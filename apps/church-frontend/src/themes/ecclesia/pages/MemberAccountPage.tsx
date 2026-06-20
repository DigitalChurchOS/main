import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCircle2, Gift, GraduationCap, LogOut, Save, UsersRound } from 'lucide-react';
import type { Tenant } from '../../../types';
import {
  clearMemberSession,
  fetchMemberAccount,
  loadMemberSession,
  updateMemberPreferences,
  updateMemberProfile,
  type MemberAccountResponse,
  type MemberSession,
} from '../../../memberAccount';
import { withLocalChurchBase } from '../../../routing';
import './MemberPortal.css';

interface Props {
  tenant: Tenant;
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatMoney(amount?: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function ListBlock({
  empty,
  children,
}: {
  empty: boolean;
  children: React.ReactNode;
}) {
  if (empty) return <div className="member-empty">No records yet.</div>;
  return <div className="member-list">{children}</div>;
}

const MemberAccountPage: React.FC<Props> = ({ tenant }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<MemberSession | null>(() => loadMemberSession());
  const [account, setAccount] = useState<MemberAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
  });
  const [preferences, setPreferences] = useState({
    preferEmail: true,
    preferSms: false,
    preferPush: true,
    preferWhatsapp: false,
  });

  useEffect(() => {
    const current = loadMemberSession();
    if (!current || current.tenantId !== tenant.id) {
      setSession(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    fetchMemberAccount(current.tenantId, current.token)
      .then((data) => {
        if (!active) return;
        setAccount(data);
        setProfileForm({
          firstName: data.member.firstName || '',
          lastName: data.member.lastName || '',
          email: data.member.email || data.member.user?.email || '',
          phone: data.member.phone || '',
          birthday: formatDateInput(data.member.birthday),
          address: data.member.address || '',
        });
        const pref = data.member.notificationPref || {};
        setPreferences({
          preferEmail: pref.preferEmail ?? true,
          preferSms: pref.preferSms ?? false,
          preferPush: pref.preferPush ?? true,
          preferWhatsapp: pref.preferWhatsapp ?? false,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load account');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tenant.id]);

  const totals = useMemo(() => {
    const giving = account?.giving;
    return {
      totalGiven: giving?.totalGiven || 0,
      gifts: (giving?.donations.length || 0) + (giving?.partnerships.length || 0),
      attendance: account?.member.checkIns?.length || 0,
    };
  }, [account]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateMemberProfile(session.tenantId, session.token, profileForm);
      setAccount((current) => current ? { ...current, member: { ...current.member, ...updated } } : current);
      setMessage('Profile saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!session) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateMemberPreferences(session.tenantId, session.token, preferences);
      setAccount((current) => current ? { ...current, member: { ...current.member, notificationPref: updated } } : current);
      setMessage('Preferences saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    clearMemberSession();
    setSession(null);
    navigate(withLocalChurchBase('/login'));
  };

  if (!session) {
    return (
      <div className="member-portal">
        <section className="member-portal__hero">
          <div>
            <p className="member-portal__eyebrow">{tenant.name}</p>
            <h1>Member Account</h1>
            <p className="member-portal__subtitle">Sign in to view your account.</p>
          </div>
          <div className="member-form__actions">
            <Link className="btn btn-primary" to={withLocalChurchBase('/login')}>Sign In</Link>
            <Link className="btn btn-soft" to={withLocalChurchBase('/')}>Home</Link>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="member-portal">
        <div className="member-empty">Loading account...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="member-portal">
        <div className="member-alert error">{error || 'Unable to load account.'}</div>
        <button className="btn btn-primary" type="button" onClick={signOut}>Sign In Again</button>
      </div>
    );
  }

  const member = account.member;
  const settings = account.settings || {};
  const donations = account.giving?.donations || [];
  const partnerships = account.giving?.partnerships || [];
  const gifts = [...donations, ...partnerships].slice(0, 6);
  const groups = member.groupMemberships || [];
  const courses = member.lmsEnrollments || [];
  const events = member.eventRegistrations || [];
  const checkIns = member.checkIns || [];

  return (
    <div className="member-portal">
      <section className="member-portal__hero">
        <div>
          <p className="member-portal__eyebrow">{member.membershipStatus || 'member'}</p>
          <h1>{member.firstName} {member.lastName}</h1>
          <p className="member-portal__subtitle">
            {member.email || session.user.email}
          </p>
        </div>
        <div className="member-portal__stat-grid">
          <div className="member-portal__stat">
            <span>Giving</span>
            <strong>{formatMoney(totals.totalGiven)}</strong>
          </div>
          <div className="member-portal__stat">
            <span>Records</span>
            <strong>{totals.gifts}</strong>
          </div>
          <div className="member-portal__stat">
            <span>Check-ins</span>
            <strong>{totals.attendance}</strong>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`member-alert ${error ? 'error' : ''}`}>{error || message}</div>
      )}

      <div className="member-portal__grid">
        <section className="member-portal__panel">
          <h2>Profile</h2>
          <p className="member-portal__panel-subtitle">Joined {formatDate(member.createdAt)}</p>
          <form className="member-form" onSubmit={saveProfile}>
            <label>
              First name
              <input value={profileForm.firstName} onChange={(event) => setProfileForm((f) => ({ ...f, firstName: event.target.value }))} data-required="true" />
            </label>
            <label>
              Last name
              <input value={profileForm.lastName} onChange={(event) => setProfileForm((f) => ({ ...f, lastName: event.target.value }))} data-required="true" />
            </label>
            <label>
              Email
              <input type="email" value={profileForm.email} onChange={(event) => setProfileForm((f) => ({ ...f, email: event.target.value }))} data-required="true" />
            </label>
            <label>
              Phone
              <input value={profileForm.phone} onChange={(event) => setProfileForm((f) => ({ ...f, phone: event.target.value }))} />
            </label>
            <label>
              Birthday
              <input type="date" value={profileForm.birthday} onChange={(event) => setProfileForm((f) => ({ ...f, birthday: event.target.value }))} />
            </label>
            <label className="full">
              Address
              <input value={profileForm.address} onChange={(event) => setProfileForm((f) => ({ ...f, address: event.target.value }))} />
            </label>
            <div className="member-form__actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving' : 'Save Profile'}
              </button>
              <button className="btn btn-soft" type="button" onClick={signOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </form>
        </section>

        <section className="member-portal__panel">
          <h2>Access</h2>
          <p className="member-portal__panel-subtitle">
            {settings.memberOnlyContent ? 'Member access is active.' : 'Member access is limited.'}
          </p>
          <div className="member-list">
            <Link className="member-list__item" to={withLocalChurchBase('/giving')}>
              <div className="member-list__row"><strong><Gift size={16} /> Giving</strong><span>Open</span></div>
            </Link>
            <Link className="member-list__item" to={withLocalChurchBase('/courses')}>
              <div className="member-list__row"><strong><GraduationCap size={16} /> Courses</strong><span>{courses.length}</span></div>
            </Link>
            <Link className="member-list__item" to={withLocalChurchBase('/events')}>
              <div className="member-list__row"><strong><CalendarDays size={16} /> Events</strong><span>{events.length}</span></div>
            </Link>
            <Link className="member-list__item" to={withLocalChurchBase('/library')}>
              <div className="member-list__row"><strong><BookOpen size={16} /> Library</strong><span>Browse</span></div>
            </Link>
          </div>
        </section>

        <section className="member-portal__panel">
          <h2>Giving Records</h2>
          <p className="member-portal__panel-subtitle">{formatMoney(totals.totalGiven)} recorded.</p>
          <ListBlock empty={!settings.showGivingHistory || gifts.length === 0}>
            {gifts.map((gift: any) => (
              <div className="member-list__item" key={gift.id}>
                <div className="member-list__row">
                  <strong>{gift.category?.name || 'Giving'}</strong>
                  <strong>{formatMoney(gift.amount, gift.currency || 'USD')}</strong>
                </div>
                <div className="member-list__meta">{formatDate(gift.createdAt)} · {gift.status}</div>
              </div>
            ))}
          </ListBlock>
        </section>

        <section className="member-portal__panel">
          <h2>Preferences</h2>
          <p className="member-portal__panel-subtitle">Communication channels</p>
          <div className="member-preferences">
            {[
              ['preferEmail', 'Email updates'],
              ['preferSms', 'SMS updates'],
              ['preferPush', 'App notifications'],
              ['preferWhatsapp', 'WhatsApp updates'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="checkbox"
                  checked={Boolean(preferences[key as keyof typeof preferences])}
                  onChange={(event) => setPreferences((p) => ({ ...p, [key]: event.target.checked }))}
                />
              </label>
            ))}
            <button className="btn btn-primary" type="button" onClick={savePreferences} disabled={saving}>
              <CheckCircle2 size={16} /> Save Preferences
            </button>
          </div>
        </section>

        <section className="member-portal__panel">
          <h2>Groups</h2>
          <p className="member-portal__panel-subtitle">{groups.length} active connection records</p>
          <ListBlock empty={!settings.showGroupMemberships || groups.length === 0}>
            {groups.map((membership: any) => (
              <div className="member-list__item" key={membership.id}>
                <div className="member-list__row">
                  <strong><UsersRound size={16} /> {membership.group?.name || 'Group'}</strong>
                  <span>{membership.role}</span>
                </div>
                <div className="member-list__meta">Joined {formatDate(membership.joinedAt)}</div>
              </div>
            ))}
          </ListBlock>
        </section>

        <section className="member-portal__panel">
          <h2>Courses</h2>
          <p className="member-portal__panel-subtitle">{courses.length} enrollments</p>
          <ListBlock empty={!settings.showCourseProgress || courses.length === 0}>
            {courses.map((enrollment: any) => (
              <div className="member-list__item" key={enrollment.id}>
                <div className="member-list__row">
                  <strong>{enrollment.course?.title || 'Course'}</strong>
                  <span>{Math.round(enrollment.progressPercent || 0)}%</span>
                </div>
                <div className="member-list__meta">{enrollment.status}</div>
              </div>
            ))}
          </ListBlock>
        </section>

        <section className="member-portal__panel">
          <h2>Attendance</h2>
          <p className="member-portal__panel-subtitle">{checkIns.length} recent check-ins</p>
          <ListBlock empty={!settings.showAttendanceHistory || checkIns.length === 0}>
            {checkIns.map((checkIn: any) => (
              <div className="member-list__item" key={checkIn.id}>
                <div className="member-list__row">
                  <strong>{checkIn.type}</strong>
                  <span>{formatDate(checkIn.checkedInAt)}</span>
                </div>
                <div className="member-list__meta">{checkIn.targetId}</div>
              </div>
            ))}
          </ListBlock>
        </section>

        <section className="member-portal__panel">
          <h2>Events</h2>
          <p className="member-portal__panel-subtitle">{events.length} registrations</p>
          <ListBlock empty={!settings.showEventRegistrations || events.length === 0}>
            {events.map((registration: any) => (
              <div className="member-list__item" key={registration.id}>
                <div className="member-list__row">
                  <strong>{registration.event?.title || 'Event'}</strong>
                  <span>{registration.paymentStatus}</span>
                </div>
                <div className="member-list__meta">{formatDate(registration.event?.startDate || registration.createdAt)}</div>
              </div>
            ))}
          </ListBlock>
        </section>
      </div>
    </div>
  );
};

export default MemberAccountPage;
