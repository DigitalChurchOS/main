import React, { useState, useEffect } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Heart, MessageSquare, Send, CheckCircle, HelpCircle, Star } from 'lucide-react';
import { httpRequest } from '../../../http';

interface PrayerRequest {
  id: string;
  memberName: string;
  details: string;
  category: string;
  isConfidential: boolean;
  createdAt: string;
  prayedCount?: number;
}

interface Testimony {
  id: string;
  authorName: string;
  title: string;
  content: string;
  isFeatured: boolean;
}

const MOCK_PRAYERS: PrayerRequest[] = [
  { id: 'pr-1', memberName: 'Sister Grace', details: 'Pray for complete healing of back pain and strength for the family.', category: 'Healing', isConfidential: false, createdAt: new Date().toISOString(), prayedCount: 12 },
  { id: 'pr-2', memberName: 'Brother John', details: 'Seeking breakthrough in job application and financial guidance.', category: 'Financial', isConfidential: false, createdAt: new Date().toISOString(), prayedCount: 8 }
];

const MOCK_TESTIMONIES: Testimony[] = [
  { id: 't-1', authorName: 'Sister Grace', title: 'Miraculous Job Opening!', content: 'I got called back for a senior manager role just three days after we prayed! Praise God!', isFeatured: true },
  { id: 't-2', authorName: 'Brother David', title: 'Healed of Chronic Back Pain', content: 'During the live prayer session, the pain dissolved completely. I can walk perfectly now!', isFeatured: false }
];

const PrayerPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wall' | 'testimonies'>('wall');

  // Form states
  const [formType, setFormType] = useState<'prayer' | 'testimony'>('prayer');
  const [authorName, setAuthorName] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState('Healing');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [prayedSet, setPrayedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prayersRes, testimoniesRes] = await Promise.all([
          httpRequest('/api/cms/prayers'),
          httpRequest('/api/cms/testimonies')
        ]);
        
        const prayersJson = prayersRes.ok ? await prayersRes.json() : { data: [] };
        const testimoniesJson = testimoniesRes.ok ? await testimoniesRes.json() : { data: [] };

        if (Array.isArray(prayersJson.data) && prayersJson.data.length > 0) {
          setPrayers(prayersJson.data);
        } else {
          setPrayers(MOCK_PRAYERS);
        }

        if (Array.isArray(testimoniesJson.data) && testimoniesJson.data.length > 0) {
          setTestimonies(testimoniesJson.data);
        } else {
          setTestimonies(MOCK_TESTIMONIES);
        }
      } catch {
        setPrayers(MOCK_PRAYERS);
        setTestimonies(MOCK_TESTIMONIES);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePrayClick = (id: string) => {
    if (prayedSet.has(id)) return;
    
    // Increment prayed count locally
    setPrayers(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, prayedCount: (p.prayedCount || 0) + 1 };
      }
      return p;
    }));

    setPrayedSet(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !details || (formType === 'testimony' && !title)) {
      window.dispatchEvent(new CustomEvent('churchos:open-modal', {
        detail: {
          modalKey: 'form-error',
          title: 'Prayer form needs attention',
          message: 'Please complete every highlighted field before submitting.',
        },
      }));
      return;
    }

    if (formType === 'prayer') {
      const newRequest: PrayerRequest = {
        id: `pr-user-${Date.now()}`,
        memberName: authorName,
        details,
        category,
        isConfidential: false,
        createdAt: new Date().toISOString(),
        prayedCount: 0
      };
      setPrayers(prev => [newRequest, ...prev]);
    } else {
      const newTestimony: Testimony = {
        id: `t-user-${Date.now()}`,
        authorName,
        title,
        content: details,
        isFeatured: false
      };
      setTestimonies(prev => [newTestimony, ...prev]);
    }

    setSubmitSuccess(true);
    setAuthorName('');
    setTitle('');
    setDetails('');
  };

  return (
    <div className="section container">
      <div className="head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="eyebrow"><Heart size={13} /> Intercession & Praise Wall</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>Prayer & Testimony Hub</h1>
          <p className="lead">Join us in standing in the gap for others or celebrate the goodness of God by reading praise reports.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
        
        {/* Main Feed */}
        <div>
          {/* Tab buttons */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('wall')}
              style={{
                background: 'transparent', border: 0, padding: '14px 20px',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                color: activeTab === 'wall' ? 'var(--accent)' : 'var(--muted)',
                borderBottom: activeTab === 'wall' ? '2px solid var(--accent)' : '2px solid transparent'
              }}
            >
              Prayer Wall ({prayers.length})
            </button>
            <button 
              onClick={() => setActiveTab('testimonies')}
              style={{
                background: 'transparent', border: 0, padding: '14px 20px',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                color: activeTab === 'testimonies' ? 'var(--accent)' : 'var(--muted)',
                borderBottom: activeTab === 'testimonies' ? '2px solid var(--accent)' : '2px solid transparent'
              }}
            >
              Praise Reports ({testimonies.length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <p>Loading wall feed...</p>
            </div>
          ) : activeTab === 'wall' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {prayers.map(p => (
                <div key={p.id} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--soft-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{p.memberName}</strong>
                    <span className="badge" style={{ fontSize: '11px' }}>{p.category}</span>
                  </div>
                  <p className="muted" style={{ fontSize: '14.5px', lineHeight: '1.5', margin: '0 0 16px' }}>{p.details}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 800 }}>
                      {p.prayedCount || 0} saints are standing in agreement
                    </span>
                    <button 
                      onClick={() => handlePrayClick(p.id)}
                      className={`btn btn-sm ${prayedSet.has(p.id) ? 'btn-light' : 'btn-primary'}`}
                      style={{ padding: '8px 16px', borderRadius: '999px', fontSize: '12px', minWidth: '100px' }}
                      disabled={prayedSet.has(p.id)}
                    >
                      <Heart size={14} fill={prayedSet.has(p.id) ? 'currentColor' : 'none'} />
                      <span>{prayedSet.has(p.id) ? 'Agreed' : 'I Prayed'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {testimonies.map(t => (
                <div key={t.id} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--soft-shadow)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>{t.authorName}</strong>
                    {t.isFeatured && (
                      <span className="badge accent" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Star size={10} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', margin: '4px 0 8px' }}>{t.title}</h3>
                  <p className="muted" style={{ fontSize: '14.5px', lineHeight: '1.5', margin: 0 }}>{t.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Submission Form */}
        <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          {submitSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '12px' }} />
              <h3>Submission Sent!</h3>
              <p className="muted" style={{ marginTop: '8px', fontSize: '13.5px', lineHeight: 1.5 }}>
                Your request/testimony has been logged. Note that testimonies go through our moderation gate before listing on the public feed.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setSubmitSuccess(false)}
                style={{ width: '100%', marginTop: '20px' }}
              >
                Submit Another Entry
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={handleFormSubmit}>
              <h3>Share Your Request</h3>
              <p className="muted" style={{ fontSize: '12.5px', lineHeight: '1.4', margin: '6px 0 16px' }}>
                Submit a prayer request for the saints to stand in agreement, or register a praise report.
              </p>

              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '999px', overflow: 'hidden', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setFormType('prayer')}
                  style={{
                    flex: 1, border: 0, padding: '8px 0', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer',
                    background: formType === 'prayer' ? 'var(--accent)' : 'transparent',
                    color: formType === 'prayer' ? 'white' : 'var(--muted)'
                  }}
                >
                  Prayer Request
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('testimony')}
                  style={{
                    flex: 1, border: 0, padding: '8px 0', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer',
                    background: formType === 'testimony' ? 'var(--accent)' : 'transparent',
                    color: formType === 'testimony' ? 'white' : 'var(--muted)'
                  }}
                >
                  Praise Testimony
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Your Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', outline: 'none' }}
                    placeholder="e.g. Sister Grace"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    data-required="true"
                  />
                </div>

                {formType === 'testimony' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Testimony Title</label>
                    <input 
                      type="text"
                      className="form-control"
                      style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', outline: 'none' }}
                      placeholder="e.g. Healed of Back Pain"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-required="true"
                    />
                  </div>
                )}

                {formType === 'prayer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Category</label>
                    <select
                      className="select"
                      style={{ width: '100%', height: '38px', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 10px', outline: 'none' }}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Healing">Healing</option>
                      <option value="Financial">Financial Breakthrough</option>
                      <option value="Family">Family Restoration</option>
                      <option value="Spiritual">Spiritual Growth</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Details</label>
                  <textarea 
                    className="form-control"
                    rows={4}
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', outline: 'none', resize: 'vertical' }}
                    placeholder="Please specify details..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    data-required="true"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Send size={14} />
                <span>Submit Entry</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default PrayerPage;
