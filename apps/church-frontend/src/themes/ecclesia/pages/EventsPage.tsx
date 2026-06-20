import React, { useState, useEffect } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Calendar, MapPin, Clock, Tag, Plus, CheckCircle, Info } from 'lucide-react';
import { httpRequest } from '../../../http';

interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  pricingType: string;
  price: number | null;
  capacity: number | null;
  status: string;
  categoryId: string | null;
  category?: { name: string } | null;
}

const MOCK_EVENTS: Event[] = [
  {
    id: 'mock-event-1',
    title: 'Global Prayer & Breakthrough Summit',
    description: 'A dedicated weekend of deep corporate intercession, spiritual warfare teachings, and covenant alignment. Guest ministers joining from global branch networks.',
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    endDate: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
    location: 'Main Sanctuary & Online Broadcast',
    pricingType: 'free',
    price: 0,
    capacity: 500,
    status: 'published',
    categoryId: 'cat-1',
    category: { name: 'Prayer' }
  },
  {
    id: 'mock-event-2',
    title: 'Youth Fire Night: Unashamed',
    description: 'An explosive evening of worship, fellowship, and prophetic declarations for the next generation. All youth and young adults welcome.',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    endDate: new Date(Date.now() + 86400000 * 7 + 10800000).toISOString(),
    location: 'Youth Hall (Wing B)',
    pricingType: 'free',
    price: 0,
    capacity: 200,
    status: 'published',
    categoryId: 'cat-2',
    category: { name: 'Youth' }
  },
  {
    id: 'mock-event-3',
    title: 'Covenant Finance Workshop',
    description: 'Practical classes on debt elimination, wealth generation, budget planning, and kingdom generosity models.',
    startDate: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
    endDate: new Date(Date.now() + 86400000 * 14 + 14400000).toISOString(),
    location: 'Conference Room Alpha',
    pricingType: 'paid',
    price: 15,
    capacity: 60,
    status: 'published',
    categoryId: 'cat-3',
    category: { name: 'Discipleship' }
  }
];

const EventsPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [registeringEvent, setRegisteringEvent] = useState<Event | null>(null);
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await httpRequest('/api/cms/events');
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
        } else {
          setEvents(MOCK_EVENTS);
        }
      } catch {
        setEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const categories = ['all', ...Array.from(new Set(events.map(e => e.category?.name || 'General')))];

  const filteredEvents = events.filter(e => {
    const categoryLabel = e.category?.name || 'General';
    return activeCategory === 'all' || categoryLabel === activeCategory;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) {
      window.dispatchEvent(new CustomEvent('churchos:open-modal', {
        detail: {
          modalKey: 'form-error',
          title: 'Registration details needed',
          message: 'Please fill out all RSVP fields before confirming.',
        },
      }));
      return;
    }
    setRegSuccess(true);
  };

  const closeRegModal = () => {
    setRegisteringEvent(null);
    setRegName('');
    setRegEmail('');
    setRegSuccess(false);
  };

  return (
    <div className="section container">
      <div className="head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="eyebrow"><Calendar size={13} /> Community Events Calendar</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>Upcoming Events</h1>
          <p className="lead">Join our assembly in fellowship, learning, and corporate prayer. View upcoming schedules and RSVP below.</p>
        </div>
      </div>

      {/* Categories filter */}
      <div className="channels" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`channel-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              border: '1px solid var(--border)',
              background: activeCategory === cat ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'white',
              color: activeCategory === cat ? 'var(--accent)' : 'var(--muted)',
              borderRadius: '999px',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <p>Loading events schedule...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-soft)' }}>
          <Info size={40} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h3>No Scheduled Events</h3>
          <p className="muted" style={{ marginTop: '8px' }}>There are no upcoming events in this category. Check back later!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredEvents.map(e => {
            const start = new Date(e.startDate);
            const dateStr = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            
            return (
              <div 
                key={e.id} 
                className="panel" 
                style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '24px',
                  boxShadow: 'var(--soft-shadow)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1', minWidth: '280px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge accent" style={{ fontSize: '11px' }}>{e.category?.name || 'General'}</span>
                    <span className="badge" style={{ fontSize: '11px' }}>
                      {e.pricingType === 'free' ? 'Free RSVP' : `$${e.price || '0.00'}`}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '24px', margin: '4px 0 12px', letterSpacing: '-0.03em' }}>{e.title}</h3>
                  <p className="muted" style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '18px' }}>{e.description}</p>
                  
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--muted)', fontWeight: 750 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} style={{ color: 'var(--accent)' }} />
                      <span>{dateStr}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} style={{ color: 'var(--accent)' }} />
                      <span>{timeStr}</span>
                    </div>
                    {e.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={15} style={{ color: 'var(--accent)' }} />
                        <span>{e.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', minWidth: '160px' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setRegisteringEvent(e)}
                    style={{ width: '100%', padding: '14px 24px', fontSize: '14px' }}
                  >
                    <Plus size={16} />
                    <span>RSVP & Register</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration / RSVP Modal */}
      {registeringEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(24, 24, 27, 0.82)', zIndex: 99999,
          display: 'grid', placeItems: 'center', padding: '24px',
          backdropFilter: 'blur(8px)'
        }} onClick={closeRegModal}>
          <div style={{
            width: '100%', maxWidth: '480px', background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)', overflow: 'hidden', padding: '28px',
            boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle size={56} style={{ color: '#22c55e', marginBottom: '16px' }} />
                <h2>Registration Confirmed!</h2>
                <p className="muted" style={{ marginTop: '12px', fontSize: '15px', lineHeight: '1.6' }}>
                  Thank you! You are now registered for <strong>{registeringEvent.title}</strong>. A confirmation pass code has been sent to your email.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={closeRegModal}
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  Great, Thank You
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div>
                    <span className="badge accent">Event Registration</span>
                    <h3 style={{ margin: '6px 0 0', fontSize: '20px' }}>{registeringEvent.title}</h3>
                  </div>
                </div>
                
                <p className="muted" style={{ fontSize: '13.5px', lineHeight: '1.5', marginBottom: '20px' }}>
                  Please profile your contact details below to secure your seat.
                  {registeringEvent.pricingType !== 'free' && (
                    <span style={{ display: 'block', marginTop: '6px', color: 'var(--text)', fontWeight: 'bold' }}>
                      Ticket Price: ${registeringEvent.price} (Simulated Sandbox Checkout)
                    </span>
                  )}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)' }}>Your Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ 
                        width: '100%', border: '1px solid var(--border)', borderRadius: '12px',
                        padding: '10px 14px', outline: 'none'
                      }}
                      placeholder="e.g. Sister Grace" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      data-required="true"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)' }}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      style={{ 
                        width: '100%', border: '1px solid var(--border)', borderRadius: '12px',
                        padding: '10px 14px', outline: 'none'
                      }}
                      placeholder="grace@domain.com" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      data-required="true"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-light" 
                    onClick={closeRegModal}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                  >
                    Confirm RSVP
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
