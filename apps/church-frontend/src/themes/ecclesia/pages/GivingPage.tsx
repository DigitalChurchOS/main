import React, { useState } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { CreditCard, Heart, CheckCircle, ArrowRight } from 'lucide-react';

const PRESETS = [25, 50, 100, 250, 500];

const GivingPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [amount, setAmount] = useState<number | string>(100);
  const [fund, setFund] = useState('Tithe');
  const [recurring, setRecurring] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Checkout Details
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [ccNumber, setCcNumber] = useState('');
  
  const handlePresetClick = (val: number) => {
    setAmount(val);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      window.dispatchEvent(new CustomEvent('churchos:open-modal', {
        detail: { modalKey: 'form-error', title: 'Giving amount needed', message: 'Please enter a valid contribution amount.' },
      }));
      return;
    }
    if (!donorName || !email) {
      window.dispatchEvent(new CustomEvent('churchos:open-modal', {
        detail: { modalKey: 'form-error', title: 'Donor details needed', message: 'Please fill out your name and email.' },
      }));
      return;
    }
    setSuccess(true);
  };

  const resetForm = () => {
    setSuccess(false);
    setAmount(100);
    setDonorName('');
    setEmail('');
    setCcNumber('');
    setRecurring(false);
  };

  return (
    <div className="section container" style={{ maxWidth: '640px', margin: '0 auto' }}>
      
      <div className="head" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ margin: '0 auto' }}>
          <span className="eyebrow" style={{ margin: '0 auto' }}><Heart size={13} /> Generosity & Covenant Partnership</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px', fontSize: '36px' }}>Covenant Giving</h1>
          <p className="lead" style={{ fontSize: '15px', margin: '0 auto', maxWidth: '480px' }}>
            Honor the Lord with your substance. Seed into tithes, missions, and building expansion for {tenant?.name || 'our church'}.
          </p>
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow)' }}>
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ 
              width: '72px', height: '72px', borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--accent)'
            }}>
              <CheckCircle size={36} />
            </div>
            
            <h2 style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>Thank You for Your Generosity!</h2>
            <p className="muted" style={{ marginTop: '12px', fontSize: '15px', lineHeight: '1.6' }}>
              Your seed of <strong>${Number(amount).toFixed(2)}</strong> has been simulated successfully for the <strong>{fund}</strong>.
            </p>
            
            <div style={{ 
              background: 'var(--surface-soft)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '16px', margin: '24px 0', fontSize: '13px', textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Donor Name:</span>
                <strong>{donorName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Email Address:</span>
                <strong>{email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Frequency:</span>
                <strong>{recurring ? 'Monthly Recurring' : 'One-Time Seed'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '6px', marginTop: '6px' }}>
                <span>Receipt Number:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>TXN-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={resetForm}
              style={{ width: '100%' }}
            >
              Submit Another Seed
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleCheckoutSubmit}>
            
            {/* Amount Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Select Contribution Amount
              </label>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {PRESETS.map(preset => (
                  <button 
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    style={{
                      flex: '1 0 70px', border: '1px solid var(--border)',
                      background: Number(amount) === preset ? 'var(--accent)' : 'white',
                      color: Number(amount) === preset ? 'white' : 'var(--text)',
                      borderRadius: '10px', padding: '10px 0', fontWeight: 'bold', fontSize: '14px',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--muted)' }}>
                  $
                </span>
                <input 
                  type="number"
                  className="form-control"
                  style={{ 
                    width: '100%', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '12px 12px 12px 32px', fontSize: '16px', fontWeight: 'bold', outline: 'none'
                  }}
                  placeholder="Enter custom amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-required="true"
                />
              </div>
            </div>

            {/* Fund Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Designate to a Specific Fund
              </label>
              <select 
                className="select"
                style={{ width: '100%', height: '48px', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 14px', outline: 'none' }}
                value={fund}
                onChange={(e) => setFund(e.target.value)}
              >
                <option value="Tithe">Tithe (Covenant Tenth)</option>
                <option value="General Offering">General Free-will Offering</option>
                <option value="Missions Fund">Global Missions Partnership</option>
                <option value="Building Expansion">Building Expansion & Land</option>
              </select>
            </div>

            {/* Recurring Option */}
            <div style={{ marginBottom: '28px' }}>
              <label className="check" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                <input 
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                  Make this contribution monthly recurring
                </span>
              </label>
            </div>

            {/* Donor info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h3>Billing & Donor Profile</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>First & Last Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', outline: 'none' }}
                    placeholder="Sister Grace"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    data-required="true"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Email Address</label>
                  <input 
                    type="email"
                    className="form-control"
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', outline: 'none' }}
                    placeholder="grace@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-required="true"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--muted)' }}>Credit Card Details (Simulated Sandbox)</label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text"
                    className="form-control"
                    style={{ width: '100%', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px 8px 36px', outline: 'none' }}
                    placeholder="4111 2222 3333 4444"
                    value={ccNumber}
                    onChange={(e) => setCcNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px 0', fontSize: '16px' }}
            >
              <span>Authorize Contribution of ${Number(amount || 0).toFixed(2)}</span>
              <ArrowRight size={16} />
            </button>

          </form>
        )}

      </div>
    </div>
  );
};

export default GivingPage;
