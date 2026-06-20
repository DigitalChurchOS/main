import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  Mic,
  MonitorPlay,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  UsersRound,
  WifiOff,
} from 'lucide-react';
import { httpRequest } from '../../../http';
import { useEcclesia } from '../EcclesiaContext';
import type { BlueprintField, BlueprintSurface } from './surfaceCatalog';
import {
  clearSurfaceDraft,
  loadSurfaceDraft,
  saveSurfaceDraft,
  submitSurfacePayload,
  type SurfacePayload,
} from './surfaceApi';
import './BlueprintSurfaces.css';

interface Props {
  surface: BlueprintSurface;
}

type FieldErrors = Record<string, string>;

function emitOverlay(type: string, detail: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

function modalKeyForSurface(surface: BlueprintSurface): string {
  return surface.slug.replace(/-modal$/, '').replace(/-toast$/, '');
}

function defaultFieldsFor(surface: BlueprintSurface): BlueprintField[] {
  if (surface.fields?.length) return surface.fields;
  return [
    { name: 'name', label: 'Full name', type: 'text', required: true },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'message', label: 'How can we help?', type: 'textarea', required: true },
  ];
}

function validateField(field: BlueprintField, value: unknown): string {
  const textValue = typeof value === 'string' ? value.trim() : '';
  if (field.required) {
    if (field.type === 'checkbox' && value !== true) return `${field.label} must be accepted.`;
    if (field.type !== 'checkbox' && !textValue) return `${field.label} is required.`;
  }
  if (field.type === 'email' && textValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(textValue)) {
    return 'Enter a valid email address.';
  }
  if (field.type === 'file' && value instanceof File) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4', 'audio/mpeg'];
    if (!allowed.includes(value.type)) return 'Upload a PDF, PNG, JPEG, MP4, or MP3 file.';
    if (value.size > 50 * 1024 * 1024) return 'File size must be 50MB or less.';
  }
  return '';
}

function SurfaceForm({ surface }: { surface: BlueprintSurface }) {
  const { tenant } = useEcclesia();
  const fields = useMemo(() => defaultFieldsFor(surface), [surface]);
  const [values, setValues] = useState<SurfacePayload>(() => loadSurfaceDraft(tenant.id, surface.key));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveSurfaceDraft(tenant.id, surface.key, values);
  }, [surface.key, tenant.id, values]);

  function setFieldValue(field: BlueprintField, value: unknown) {
    setValues((current) => ({ ...current, [field.name]: value }));
    const error = validateField(field, value);
    setErrors((current) => ({ ...current, [field.name]: error }));
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};
    for (const field of fields) {
      const error = validateField(field, values[field.name]);
      if (error) nextErrors[field.name] = error;
    }
    setErrors(nextErrors);
    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emitOverlay('churchos:open-modal', {
        modalKey: 'form-error',
        title: 'Please review the highlighted fields',
        message: Object.values(nextErrors)[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitSurfacePayload(surface, values);
      clearSurfaceDraft(tenant.id, surface.key);
      setSubmitted(true);
      emitOverlay('churchos:toast', {
        title: 'Submission received',
        message: `${surface.title} was sent for ${tenant.name}.`,
      });
    } catch (error: any) {
      saveSurfaceDraft(tenant.id, surface.key, values);
      emitOverlay('churchos:open-modal', {
        modalKey: 'network-alert',
        title: 'Submission was safely held',
        message: error?.message || 'We could not complete the request. Your draft has been saved in this session.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bp-result-panel" role="status">
        <CheckCircle2 size={46} />
        <h2>Submission secured</h2>
        <p>{surface.title} has been accepted into the tenant-isolated workflow for {tenant.name}.</p>
        <button className="btn btn-primary" type="button" onClick={() => {
          setSubmitted(false);
          setValues({});
          setErrors({});
        }}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form className="bp-form" noValidate onSubmit={handleSubmit}>
      <div className="bp-form-grid">
        {fields.map((field, index) => {
          const value = values[field.name];
          const error = errors[field.name];
          const commonProps = {
            id: `${surface.key}-${field.name}`,
            name: field.name,
            'aria-invalid': Boolean(error),
            'aria-describedby': error ? `${surface.key}-${field.name}-error` : undefined,
            onKeyUp: () => setErrors((current) => ({ ...current, [field.name]: validateField(field, values[field.name]) })),
          };

          return (
            <div
              key={field.name}
              className={`bp-field bp-field--${field.type} ${field.type === 'textarea' ? 'bp-field--wide' : ''}`}
              ref={index === 0 ? firstErrorRef : undefined}
            >
              <label htmlFor={`${surface.key}-${field.name}`}>
                {field.label}
                {field.required && <span aria-hidden="true"> *</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  {...commonProps}
                  rows={5}
                  value={String(value || '')}
                  onChange={(event) => setFieldValue(field, event.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  {...commonProps}
                  value={String(value || '')}
                  onChange={(event) => setFieldValue(field, event.target.value)}
                >
                  <option value="">Choose one</option>
                  {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="bp-checkbox">
                  <input
                    {...commonProps}
                    type="checkbox"
                    checked={value === true}
                    onChange={(event) => setFieldValue(field, event.target.checked)}
                  />
                  <span>{field.helper || 'Confirmed'}</span>
                </label>
              ) : field.type === 'file' ? (
                <input
                  {...commonProps}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    const errorMessage = file ? validateField(field, file) : validateField(field, '');
                    if (errorMessage) {
                      emitOverlay('churchos:open-modal', {
                        modalKey: 'file-warning',
                        title: 'File cannot be attached',
                        message: errorMessage,
                      });
                    }
                    setFieldValue(field, file || '');
                  }}
                />
              ) : (
                <input
                  {...commonProps}
                  type={field.type}
                  value={String(value || '')}
                  onChange={(event) => setFieldValue(field, event.target.value)}
                />
              )}

              {field.helper && field.type !== 'checkbox' && <p className="bp-helper">{field.helper}</p>}
              {error && <div className="bp-error" id={`${surface.key}-${field.name}-error`}>{error}</div>}
            </div>
          );
        })}
      </div>

      <div className="bp-form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          <Send size={16} />
          <span>{submitting ? 'Sending...' : surface.primaryAction}</span>
        </button>
        <span>Drafts restore automatically if the network drops.</span>
      </div>
    </form>
  );
}

function SurfaceHero({ surface }: { surface: BlueprintSurface }) {
  const { tenant } = useEcclesia();
  const Icon = surface.kind === 'permission' ? Camera
    : surface.kind === 'access' ? LockKeyhole
      : surface.kind === 'archive' ? Search
        : surface.kind === 'portal' ? GraduationCap
          : surface.kind === 'immersive' ? MonitorPlay
            : surface.kind === 'state' ? FileText
              : surface.kind === 'modal' ? AlertTriangle
                : ShieldCheck;

  return (
    <section className="bp-hero">
      <div>
        <span className="bp-phase">{surface.phaseItem || surface.phase} {surface.phaseTitle}</span>
        <h1>{surface.title}</h1>
        <p>{surface.summary}</p>
        <div className="bp-tenant-line">
          <BadgeCheck size={16} />
          <span>{tenant.name} workspace</span>
          <span>{tenant.id}</span>
        </div>
      </div>
      <div className="bp-hero-device" aria-hidden="true">
        <Icon size={42} />
        <strong>{surface.moduleKey}</strong>
        <span>{surface.endpoint}</span>
      </div>
    </section>
  );
}

function ActionStrip({ surface }: { surface: BlueprintSurface }) {
  const [loading, setLoading] = useState(false);

  async function runAction() {
    if (surface.kind === 'modal' || surface.kind === 'permission') {
      emitOverlay('churchos:open-modal', {
        modalKey: modalKeyForSurface(surface),
        title: surface.title,
        message: surface.summary,
      });
      return;
    }
    if (surface.kind === 'global') {
      emitOverlay('churchos:toggle-global', { component: surface.slug });
      return;
    }

    setLoading(true);
    try {
      const method = surface.endpoint.includes('/action') ? 'POST' : 'GET';
      const response = await httpRequest(surface.endpoint, method === 'POST' ? {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaceKey: surface.key, action: surface.primaryAction }),
      } : {});
      if (!response.ok) throw new Error(`Request returned ${response.status}`);
      emitOverlay('churchos:toast', {
        title: 'Connection checked',
        message: `${surface.endpoint} responded for ${surface.title}.`,
      });
    } catch (error: any) {
      emitOverlay('churchos:open-modal', {
        modalKey: 'network-alert',
        title: 'Connection needs attention',
        message: error?.message || 'The endpoint could not be reached right now.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bp-actions">
      <button className="btn btn-primary" type="button" onClick={runAction}>
        <span>{loading ? 'Checking...' : surface.primaryAction}</span>
        <ArrowRight size={16} />
      </button>
      {surface.secondaryAction && <button className="btn btn-soft" type="button">{surface.secondaryAction}</button>}
    </div>
  );
}

function ArchivePreview({ surface }: { surface: BlueprintSurface }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const rows = [
    ['Foundations', 'Pastor Daniel Grace', 'Available now'],
    ['Family Life', 'Care Team', 'Member guided'],
    ['Kingdom Service', 'Ministry Team', 'Open registration'],
  ].filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="bp-section">
      <div className="bp-toolbar">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${surface.title}`} />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>All</option>
          <option>Featured</option>
          <option>Member only</option>
          <option>Newest</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="bp-empty">
          <Search size={34} />
          <h3>No results found</h3>
          <p>Adjust the search or switch the category filter. This is rendered by the custom empty-state system.</p>
        </div>
      ) : (
        <div className="bp-list">
          {rows.map((row) => (
            <article key={row.join('-')} className="bp-list-row">
              <div>
                <strong>{row[0]}</strong>
                <span>{row[1]} - {category}</span>
              </div>
              <span>{row[2]}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailPreview({ surface }: { surface: BlueprintSurface }) {
  return (
    <section className="bp-detail-grid">
      <div className="bp-media-frame">
        <PlayCircle size={54} />
        <span>{surface.title}</span>
      </div>
      <div className="bp-detail-copy">
        <h2>Connected detail workflow</h2>
        <p>{surface.summary}</p>
        <div className="bp-mini-metrics">
          <span><Clock size={15} /> 42 min</span>
          <span><Download size={15} /> Attachments</span>
          <span><ShieldCheck size={15} /> Tenant scoped</span>
        </div>
        <ActionStrip surface={surface} />
      </div>
    </section>
  );
}

function PortalPreview({ surface }: { surface: BlueprintSurface }) {
  return (
    <section className="bp-dashboard">
      {['Progress', 'Assignments', 'Care Follow-up', 'Next Step'].map((label, index) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{index === 0 ? '72%' : index === 1 ? '4' : index === 2 ? 'Today' : 'Ready'}</strong>
          <div className="bp-progress"><span style={{ width: `${72 - index * 12}%` }} /></div>
        </article>
      ))}
    </section>
  );
}

function ImmersivePreview({ surface }: { surface: BlueprintSurface }) {
  return (
    <section className="bp-room">
      <div className="bp-stage">
        <MonitorPlay size={44} />
        <h2>{surface.title}</h2>
        <p>{surface.summary}</p>
      </div>
      <aside>
        <button type="button" onClick={() => emitOverlay('churchos:open-modal', { modalKey: 'permission-setup' })}>
          <Camera size={16} /> Camera setup
        </button>
        <button type="button" onClick={() => emitOverlay('churchos:open-modal', { modalKey: 'recording-consent' })}>
          <Mic size={16} /> Recording consent
        </button>
        <button type="button" onClick={() => emitOverlay('churchos:open-modal', { modalKey: 'video-settings' })}>
          <MonitorPlay size={16} /> Playback settings
        </button>
      </aside>
    </section>
  );
}

function StatePreview({ surface }: { surface: BlueprintSurface }) {
  const Icon = surface.slug.includes('ticket') ? Ticket
    : surface.slug.includes('order') ? ShoppingBag
      : surface.slug.includes('domain') ? MapPin
        : surface.slug.includes('search') ? Search
          : surface.slug.includes('disabled') ? WifiOff
            : FileText;

  return (
    <section className="bp-state">
      <Icon size={46} />
      <h2>{surface.title}</h2>
      <p>{surface.summary}</p>
      <div className="bp-state-steps">
        <span>Resolve tenant context</span>
        <span>Render custom state</span>
        <span>Offer next action</span>
      </div>
      <ActionStrip surface={surface} />
    </section>
  );
}

function Signals({ surface }: { surface: BlueprintSurface }) {
  return (
    <section className="bp-section bp-signals">
      {surface.signals?.map((signal) => (
        <div key={signal}>
          <ShieldCheck size={18} />
          <span>{signal}</span>
        </div>
      ))}
    </section>
  );
}

const BlueprintSurfacePage: React.FC<Props> = ({ surface }) => {
  return (
    <div className="ecclesia-blueprint-page">
      <SurfaceHero surface={surface} />

      {surface.kind === 'form' || surface.kind === 'gateway' || surface.kind === 'access' && surface.fields ? (
        <section className="bp-section">
          <SurfaceForm surface={surface} />
        </section>
      ) : surface.kind === 'archive' ? (
        <>
          <ArchivePreview surface={surface} />
          <ActionStrip surface={surface} />
        </>
      ) : surface.kind === 'detail' ? (
        <DetailPreview surface={surface} />
      ) : surface.kind === 'portal' ? (
        <>
          <PortalPreview surface={surface} />
          <ActionStrip surface={surface} />
        </>
      ) : surface.kind === 'immersive' ? (
        <ImmersivePreview surface={surface} />
      ) : surface.kind === 'state' ? (
        <StatePreview surface={surface} />
      ) : surface.kind === 'modal' || surface.kind === 'permission' || surface.kind === 'global' ? (
        <section className="bp-section">
          <p className="bp-copy">{surface.summary}</p>
          <ActionStrip surface={surface} />
        </section>
      ) : (
        <section className="bp-section">
          <ActionStrip surface={surface} />
        </section>
      )}

      <Signals surface={surface} />
    </div>
  );
};

export default BlueprintSurfacePage;
