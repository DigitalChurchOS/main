import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  MessageCircle,
  Mic,
  MonitorPlay,
  Pause,
  Play,
  Send,
  ShoppingCart,
  UserRoundCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { useEcclesia } from '../EcclesiaContext';
import './EcclesiaGlobalUI.css';

type ModalState = {
  modalKey: string;
  title?: string;
  message?: string;
};

type ToastState = {
  id: number;
  title: string;
  message?: string;
};

type InputRequest = {
  title: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  inputType?: string;
  resolve: (value: string | null) => void;
};

declare global {
  interface Window {
    churchosRequestInput?: (options: Omit<InputRequest, 'resolve'>) => Promise<string | null>;
    churchosShowToast?: (title: string, message?: string) => void;
  }
}

function modalCopy(modalKey: string, fallback?: Partial<ModalState>) {
  const copy: Record<string, ModalState> = {
    'form-error': {
      modalKey,
      title: 'Form Needs Attention',
      message: 'Please review the highlighted field before continuing.',
    },
    'file-warning': {
      modalKey,
      title: 'File Cannot Be Uploaded',
      message: 'Use PDF, PNG, JPEG, MP4, or MP3 files under 50MB.',
    },
    'invalid-coupon': {
      modalKey,
      title: 'Coupon Not Available',
      message: 'That coupon could not be applied. Your cart details are still saved.',
    },
    'logout-confirm': {
      modalKey,
      title: 'Sign Out Safely?',
      message: 'Your local member session will end on this device.',
    },
    'dirty-form': {
      modalKey,
      title: 'Unsaved Progress',
      message: 'This form has a saved draft. Finish it or save before leaving.',
    },
    'cancel-booking': {
      modalKey,
      title: 'Cancel Booking?',
      message: 'Cancellation can affect refunds, team schedules, and seat availability.',
    },
    'video-settings': {
      modalKey,
      title: 'Playback Settings',
      message: 'Choose translation audio, captions, and playback speed inside the player.',
    },
    'external-media-fallback': {
      modalKey,
      title: 'Alternate Media Link',
      message: 'The external embed is unavailable. Use a direct stream or reload the provider.',
    },
    'network-alert': {
      modalKey,
      title: 'Reconnecting Securely',
      message: 'The request paused. Drafts and in-progress data remain saved in this session.',
    },
    'recording-consent': {
      modalKey,
      title: 'Recording Consent',
      message: 'This meeting may be recorded for ministry follow-up and internal review.',
    },
    'quiz-score': {
      modalKey,
      title: 'Quiz Score Ready',
      message: 'Your score has been saved and the next module can be unlocked when eligible.',
    },
    'course-nudge': {
      modalKey,
      title: 'Course Step Incomplete',
      message: 'Finish the required lesson activity before moving forward.',
    },
    'verse-card': {
      modalKey,
      title: 'Verse Card Canvas',
      message: 'Preview a share-ready scripture card using your active Ecclesia theme colors.',
    },
    'tenant-session-sync': {
      modalKey,
      title: 'Tenant Session Sync',
      message: 'Your session tenant does not match the active workspace domain.',
    },
    'permission-setup': {
      modalKey,
      title: 'Camera and Microphone Setup',
      message: 'We will ask for camera and microphone access only after this ministry context is clear.',
    },
    'hardware-denied': {
      modalKey,
      title: 'Hardware Access Blocked',
      message: 'Open your browser site settings and re-enable camera or microphone permissions.',
    },
    'rbac-session-mismatch': {
      modalKey,
      title: 'Permission Mismatch',
      message: 'This link needs a different role scope for the current tenant session.',
    },
  };

  return {
    ...(copy[modalKey] || { modalKey, title: 'Action Required', message: 'Review this item before continuing.' }),
    ...fallback,
  };
}

const EcclesiaGlobalUI: React.FC = () => {
  const { tenant } = useEcclesia();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [activePanel, setActivePanel] = useState<'chat' | 'cart' | 'notice' | null>(null);
  const [inputRequest, setInputRequest] = useState<InputRequest | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [coupon, setCoupon] = useState('');
  const [playerActive, setPlayerActive] = useState(false);

  const cartItems = useMemo(() => [
    { title: 'Foundation Study Guide', price: 18 },
    { title: 'Conference Replay Pass', price: 29 },
  ], []);

  function pushToast(title: string, message?: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current.slice(-2), { id, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }

  useEffect(() => {
    const openModal = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setModal(modalCopy(detail.modalKey || 'network-alert', detail));
    };
    const showToast = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      pushToast(detail.title || 'Updated', detail.message);
    };
    const toggleGlobal = (event: Event) => {
      const component = (event as CustomEvent).detail?.component || '';
      if (component.includes('cart')) setActivePanel('cart');
      else if (component.includes('notice')) setActivePanel('notice');
      else if (component.includes('mini-player')) setPlayerActive(true);
      else setActivePanel('chat');
    };
    const networkAlert = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setModal(modalCopy('network-alert', {
        message: detail.message || 'The connection paused. We are keeping your in-progress state intact.',
      }));
    };
    const apiError = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const status = Number(detail.status || 0);
      setModal(modalCopy(
        status === 401 || status === 403 ? 'rbac-session-mismatch' : 'network-alert',
        { message: `${detail.status || 'Request'} ${detail.statusText || 'could not be completed'}` },
      ));
    };
    const offline = () => setModal(modalCopy('network-alert', { message: 'Your device is offline. Draft state is being preserved locally.' }));
    const online = () => pushToast('Connection restored', 'You are back online.');
    const invalid = (event: Event) => {
      event.preventDefault();
      const target = event.target as HTMLElement | null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setModal(modalCopy('form-error'));
    };
    const submit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form?.matches?.('form')) return;
      const requiredFields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-required="true"]'));
      const firstMissing = requiredFields.find((field) => {
        if (field instanceof HTMLInputElement && field.type === 'checkbox') return !field.checked;
        return !field.value.trim();
      });
      if (!firstMissing) return;
      event.preventDefault();
      firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setModal(modalCopy('form-error', { message: 'Complete the highlighted field before submitting.' }));
    };

    window.churchosShowToast = pushToast;
    window.churchosRequestInput = (options) => new Promise((resolve) => {
      setInputValue(options.defaultValue || '');
      setInputRequest({ ...options, resolve });
    });

    window.addEventListener('churchos:open-modal', openModal);
    window.addEventListener('churchos:toast', showToast);
    window.addEventListener('churchos:toggle-global', toggleGlobal);
    window.addEventListener('churchos:network-interruption', networkAlert);
    window.addEventListener('churchos:api-error', apiError);
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('submit', submit, true);

    return () => {
      window.removeEventListener('churchos:open-modal', openModal);
      window.removeEventListener('churchos:toast', showToast);
      window.removeEventListener('churchos:toggle-global', toggleGlobal);
      window.removeEventListener('churchos:network-interruption', networkAlert);
      window.removeEventListener('churchos:api-error', apiError);
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
      document.removeEventListener('invalid', invalid, true);
      document.removeEventListener('submit', submit, true);
      delete window.churchosShowToast;
      delete window.churchosRequestInput;
    };
  }, []);

  function closeInput(value: string | null) {
    inputRequest?.resolve(value);
    setInputRequest(null);
    setInputValue('');
  }

  function applyCoupon() {
    if (coupon.trim().toUpperCase() !== 'GRACE10') {
      setModal(modalCopy('invalid-coupon'));
      return;
    }
    pushToast('Coupon applied', 'GRACE10 reduced this demo cart.');
  }

  return (
    <>
      <div className="ec-global-dock" aria-label="Global Ecclesia tools">
        <button type="button" onClick={() => setActivePanel('chat')} title="Open live chat"><MessageCircle size={19} /></button>
        <button type="button" onClick={() => setActivePanel('cart')} title="Open cart"><ShoppingCart size={19} /></button>
        <button type="button" onClick={() => setPlayerActive((value) => !value)} title="Toggle mini player"><MonitorPlay size={19} /></button>
        <button type="button" onClick={() => setActivePanel('notice')} title="Open notice board"><Bell size={19} /></button>
      </div>

      {playerActive && (
        <aside className="ec-mini-player" aria-label="Floating sermon mini-player">
          <button type="button" onClick={() => setPlayerActive(false)} aria-label="Close mini player"><X size={15} /></button>
          <div>
            <strong>Spirit and Truth</strong>
            <span>Pastor Daniel Grace</span>
          </div>
          <button type="button" onClick={() => pushToast(playerActive ? 'Playback paused' : 'Playback started')} aria-label="Toggle playback">
            {playerActive ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </aside>
      )}

      {activePanel && (
        <div className="ec-drawer-wrap" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActivePanel(null);
        }}>
          <aside className="ec-drawer" aria-label={`${activePanel} drawer`}>
            <header>
              <div>
                <span>{tenant.name}</span>
                <h2>{activePanel === 'chat' ? 'Live Chat' : activePanel === 'cart' ? 'Shopping Cart' : 'Notice Board'}</h2>
              </div>
              <button type="button" onClick={() => setActivePanel(null)} aria-label="Close drawer"><X size={18} /></button>
            </header>

            {activePanel === 'chat' && (
              <div className="ec-drawer-body">
                <div className="ec-thread">
                  <p><strong>Care Team</strong> Welcome. Send a message and we will route it to the active tenant care queue.</p>
                </div>
                <form noValidate onSubmit={(event) => {
                  event.preventDefault();
                  if (!chatDraft.trim()) {
                    setModal(modalCopy('form-error', { message: 'Enter a message before sending.' }));
                    return;
                  }
                  setChatDraft('');
                  pushToast('Message sent', 'The care team thread was updated.');
                }}>
                  <textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Type a care message" />
                  <button className="btn btn-primary" type="submit"><Send size={15} /> Send</button>
                </form>
              </div>
            )}

            {activePanel === 'cart' && (
              <div className="ec-drawer-body">
                {cartItems.map((item) => (
                  <div className="ec-cart-row" key={item.title}>
                    <span>{item.title}</span>
                    <strong>${item.price.toFixed(2)}</strong>
                  </div>
                ))}
                <label className="ec-coupon">
                  Coupon
                  <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Try GRACE10" />
                </label>
                <button className="btn btn-soft" type="button" onClick={applyCoupon}>Apply Coupon</button>
                <button className="btn btn-primary" type="button" onClick={() => pushToast('Checkout staged', 'Cart state is ready for the checkout API.')}>Continue Checkout</button>
              </div>
            )}

            {activePanel === 'notice' && (
              <div className="ec-drawer-body">
                {['Cell guide for Sunday', 'Prayer watch roster', 'Youth outreach transport'].map((item) => (
                  <div className="ec-notice" key={item}>
                    <UserRoundCheck size={17} />
                    <span>{item}</span>
                  </div>
                ))}
                <button className="btn btn-primary" type="button" onClick={() => pushToast('Invite copied', 'Personal invite link copied toast rendered.')}>Copy Invite Link</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {modal && (
        <div className="ec-modal-layer" role="presentation">
          <section className="ec-modal" role="dialog" aria-modal="true" aria-labelledby="ec-modal-title">
            <div className="ec-modal-icon">
              {modal.modalKey.includes('network') ? <WifiOff size={24} /> : modal.modalKey.includes('quiz') ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <h2 id="ec-modal-title">{modal.title}</h2>
              <p>{modal.message}</p>
            </div>
            {modal.modalKey === 'video-settings' && (
              <div className="ec-modal-controls">
                <button type="button">English</button>
                <button type="button">Spanish</button>
                <button type="button">1.25x</button>
              </div>
            )}
            {modal.modalKey === 'verse-card' && (
              <div className="ec-verse-card">Psalm 46:1 - God is our refuge and strength.</div>
            )}
            <div className="ec-modal-actions">
              <button className="btn btn-primary" type="button" onClick={() => setModal(null)}>Continue</button>
              {modal.modalKey.includes('confirm') || modal.modalKey.includes('cancel') ? (
                <button className="btn btn-soft" type="button" onClick={() => setModal(null)}>Stay Here</button>
              ) : null}
            </div>
          </section>
        </div>
      )}

      {inputRequest && (
        <div className="ec-modal-layer" role="presentation">
          <form className="ec-modal" noValidate onSubmit={(event) => {
            event.preventDefault();
            closeInput(inputValue.trim() || null);
          }}>
            <div className="ec-modal-icon"><Mic size={24} /></div>
            <div>
              <h2>{inputRequest.title}</h2>
              {inputRequest.message && <p>{inputRequest.message}</p>}
            </div>
            <label className="ec-input-modal-field">
              {inputRequest.label || 'Response'}
              <input
                type={inputRequest.inputType || 'text'}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                autoFocus
              />
            </label>
            <div className="ec-modal-actions">
              <button className="btn btn-primary" type="submit">Submit</button>
              <button className="btn btn-soft" type="button" onClick={() => closeInput(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="ec-toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div className="ec-toast" key={toast.id}>
            <CheckCircle2 size={18} />
            <div>
              <strong>{toast.title}</strong>
              {toast.message && <span>{toast.message}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default EcclesiaGlobalUI;
