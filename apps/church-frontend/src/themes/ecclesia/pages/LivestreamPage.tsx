import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Church,
  Clock3,
  Copy,
  Flame,
  HandCoins,
  HandHeart,
  Heart,
  Mail,
  MessageCircle,
  NotebookPen,
  Play,
  PlayCircle,
  Radio,
  Search,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { useEcclesia } from '../EcclesiaContext';
import { httpRequest } from '../../../http';
import { withLocalChurchBase } from '../../../routing';
import './LivestreamPage.css';

interface PublicMediaAsset {
  id: string;
  title: string;
  sourceUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
}

interface PublicService {
  id: string;
  title: string;
  description?: string | null;
  serviceDate?: string | null;
  serviceTypeLabel?: string;
  detailUrl?: string;
  scriptures?: Array<{ reference: string }>;
  speaker?: { id?: string; name: string; title?: string | null } | null;
}

interface PublicStream {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  status: 'scheduled' | 'live' | 'ended' | string;
  thumbnailUrl?: string | null;
  chatEnabled?: boolean;
  countdownEnabled?: boolean;
  multiPlatformLinks?: Array<{ platform: string; url: string }>;
  playbackUrl?: string | null;
  replayAsset?: PublicMediaAsset | null;
  watchUrl?: string;
  relatedService?: PublicService | null;
}

interface ServiceMomentCta {
  id: string;
  title: string;
  summary: string;
  details?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  theme?: string;
  enabled?: boolean;
}

interface LivestreamSettings {
  chatEnabled?: boolean;
  givingButtonEnabled?: boolean;
  prayerRequestEnabled?: boolean;
  salvationResponseEnabled?: boolean;
  biblePanelEnabled?: boolean;
  notesPanelEnabled?: boolean;
  replayAutoArchive?: boolean;
  publicPublishingEnabled?: boolean;
  serviceMomentCtas?: ServiceMomentCta[];
  [key: string]: any;
}

interface LivestreamContext {
  stream: PublicStream | null;
  streams: PublicStream[];
  liveStreams: PublicStream[];
  upcomingStreams: PublicStream[];
  replayStreams: PublicStream[];
  relatedService?: PublicService | null;
  settings?: LivestreamSettings;
}

interface ChatMessage {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
}

interface BibleVerse {
  id: string;
  book: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

interface SavedNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

const BOOKS = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34],
  ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10],
  ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31],
  ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66], ['Jeremiah', 52], ['Lamentations', 5],
  ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9], ['Obadiah', 1],
  ['Jonah', 4], ['Micah', 7], ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2],
  ['Zechariah', 14], ['Malachi', 4], ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21],
  ['Acts', 28], ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6],
  ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5],
  ['2 Thessalonians', 3], ['1 Timothy', 6], ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1],
  ['Hebrews', 13], ['James', 5], ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1],
  ['3 John', 1], ['Jude', 1], ['Revelation', 22],
] as const;

const DEFAULT_SERVICE_MOMENTS: ServiceMomentCta[] = [
  {
    id: 'welcome',
    title: 'First Time Here?',
    summary: 'Tell us you are worshipping with us and a host can help you take the next step.',
    details: 'Use this card to route first-time guests toward a welcome form, connection card, or membership path during the livestream.',
    buttonLabel: 'Connect With Us',
    buttonUrl: '/account',
    theme: 'sunrise',
  },
  {
    id: 'prayer',
    title: 'Need Prayer?',
    summary: 'Share a prayer request with the ministry team while service is in progress.',
    details: 'Prayer requests submitted from the livestream are captured as broadcast interactions for follow-up.',
    buttonLabel: 'Open Prayer',
    buttonUrl: '#prayer',
    theme: 'ocean',
  },
  {
    id: 'giving',
    title: 'Give During Service',
    summary: 'Honor God with your giving through the secure church giving page.',
    details: 'Giving clicks are tracked as livestream interactions so admins can understand service engagement.',
    buttonLabel: 'Give Now',
    buttonUrl: '/giving',
    theme: 'rose',
  },
  {
    id: 'notes',
    title: 'Capture The Word',
    summary: 'Open the Bible and notes panel to keep scriptures and sermon points together.',
    details: 'Viewers can search the KJV Bible, copy selected verses, and save personal notes locally.',
    buttonLabel: 'Open Notes',
    buttonUrl: '#notes',
    theme: 'forest',
  },
];

const MOCK_CONTEXT: LivestreamContext = {
  stream: {
    id: 'sample-live',
    title: 'Sunday Worship Livestream',
    description: 'Live worship, teaching, prayer, and replay access from the church sanctuary.',
    scheduledAt: new Date().toISOString(),
    status: 'live',
    chatEnabled: true,
    countdownEnabled: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1600&q=80',
    relatedService: {
      id: 'sample-service',
      title: 'Sunday Morning Glory Worship',
      serviceTypeLabel: 'Sunday Service',
      detailUrl: '/services/sample-service',
      scriptures: [{ reference: 'John 3:16' }, { reference: 'Psalm 23:1' }],
    },
  },
  streams: [],
  liveStreams: [],
  upcomingStreams: [],
  replayStreams: [],
  settings: {
    chatEnabled: true,
    biblePanelEnabled: true,
    notesPanelEnabled: true,
    givingButtonEnabled: true,
    prayerRequestEnabled: true,
    salvationResponseEnabled: true,
    serviceMomentCtas: DEFAULT_SERVICE_MOMENTS,
  },
};

const REACTIONS = [
  { label: 'Amen', icon: ThumbsUp },
  { label: 'Praise', icon: Sparkles },
  { label: 'Heart', icon: Heart },
  { label: 'Fire', icon: Flame },
];

type ActivePanel = 'new' | 'prayer' | 'bible' | 'chat' | 'notes' | 'give' | null;

function streamIdFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/church/, '').replace(/\/+$/, '');
  const match = normalized.match(/^\/livestream\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function formatDate(value?: string | null) {
  if (!value) return 'Time pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time pending';
  return date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function dateParts(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return {
    day: safeDate.toLocaleDateString(undefined, { day: '2-digit' }),
    month: safeDate.toLocaleDateString(undefined, { month: 'short' }),
  };
}

function noteKey(tenantId?: string, streamId?: string) {
  return `ecclesia-live-notes:${tenantId || 'tenant'}:${streamId || 'default'}`;
}

function bookMaxChapters(book: string) {
  return BOOKS.find(([name]) => name === book)?.[1] || 1;
}

function publicStreamPath(stream: PublicStream) {
  return withLocalChurchBase(`/livestream/${encodeURIComponent(stream.id)}`);
}

function getEmbedUrl(stream: PublicStream | null) {
  const raw = stream?.playbackUrl || stream?.multiPlatformLinks?.[0]?.url || '';
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
      if (url.pathname.startsWith('/embed/')) return raw;
      if (url.pathname.startsWith('/live/')) return raw.replace('/live/', '/embed/');
    }
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

function isVideoAssetUrl(value: string | null | undefined) {
  return Boolean(value && /\.(mp4|webm|ogg)(\?.*)?$/i.test(value));
}

function serviceMomentHeading(stream: PublicStream | null) {
  if (!stream) return 'Today in Service';
  if (stream.status === 'live' || stream.status === 'scheduled') return 'Today in Service';
  if (stream.status !== 'ended') return 'In this Service';

  const anchor = stream.endedAt || stream.scheduledAt;
  if (!anchor) return 'In this Service';
  const hours = (Date.now() - new Date(anchor).getTime()) / 36e5;
  if (hours < 24) return 'Earlier on in Service';
  if (hours < 72) return 'Yesterday in Service';
  return 'In this Service';
}

function normalizeServiceMomentCtas(settings?: LivestreamSettings): ServiceMomentCta[] {
  const configured = Array.isArray(settings?.serviceMomentCtas) ? settings.serviceMomentCtas : [];
  const source = configured.length ? configured : DEFAULT_SERVICE_MOMENTS;
  return source
    .filter((item) => item && item.enabled !== false)
    .map((item, index) => ({
      id: item.id || `moment-${index}`,
      title: item.title || DEFAULT_SERVICE_MOMENTS[index % DEFAULT_SERVICE_MOMENTS.length].title,
      summary: item.summary || item.details || DEFAULT_SERVICE_MOMENTS[index % DEFAULT_SERVICE_MOMENTS.length].summary,
      details: item.details || item.summary || '',
      buttonLabel: item.buttonLabel || 'Open',
      buttonUrl: item.buttonUrl || '#',
      theme: item.theme || DEFAULT_SERVICE_MOMENTS[index % DEFAULT_SERVICE_MOMENTS.length].theme,
      enabled: item.enabled !== false,
    }));
}

const LivestreamPage: React.FC<{ streamId?: string | null }> = ({ streamId }) => {
  const location = useLocation();
  const { tenant } = useEcclesia();
  const resolvedStreamId = streamId || streamIdFromPath(location.pathname);
  const query = new URLSearchParams(location.search);
  const serviceId = query.get('serviceId');

  const [context, setContext] = useState<LivestreamContext>(MOCK_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [pastServicesOpen, setPastServicesOpen] = useState(false);
  const [playerStarted, setPlayerStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [momentIndex, setMomentIndex] = useState(0);
  const [selectedMoment, setSelectedMoment] = useState<ServiceMomentCta | null>(null);

  const [displayName, setDisplayName] = useState('Guest');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatNotice, setChatNotice] = useState('');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [reactionNotice, setReactionNotice] = useState('');
  const [prayerDraft, setPrayerDraft] = useState('');
  const [prayerNotice, setPrayerNotice] = useState('');
  const [newVisitorNotice, setNewVisitorNotice] = useState('');

  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [referenceInput, setReferenceInput] = useState('John 3:16');
  const [searchInput, setSearchInput] = useState('');
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [bibleLoading, setBibleLoading] = useState(false);
  const [bibleNotice, setBibleNotice] = useState('');

  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<SavedNote[]>([]);

  const stream = context.stream;
  const settings = context.settings || {};
  const storageKey = noteKey(tenant?.id, stream?.id);
  const serviceMomentCtas = useMemo(() => normalizeServiceMomentCtas(settings), [settings]);
  const countdownText = useMemo(() => {
    if (!stream?.scheduledAt) return null;
    const diff = new Date(stream.scheduledAt).getTime() - currentTime.getTime();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [stream?.scheduledAt, currentTime]);
  const activeMoment = serviceMomentCtas[momentIndex % Math.max(serviceMomentCtas.length, 1)] || DEFAULT_SERVICE_MOMENTS[0];
  const momentHeading = serviceMomentHeading(stream);
  const statusLabel = stream?.status === 'live' ? 'Live' : stream?.status === 'ended' ? 'Replay' : 'Scheduled';
  const playerPoster = stream?.thumbnailUrl || stream?.replayAsset?.thumbnailUrl || undefined;
  const videoUrl = isVideoAssetUrl(stream?.playbackUrl) ? stream?.playbackUrl || null : null;
  const embedUrl = getEmbedUrl(stream);
  const primaryExternal = stream?.multiPlatformLinks?.[0];
  const featureEnabled = {
    chat: settings.chatEnabled !== false && stream?.chatEnabled !== false,
    bible: settings.biblePanelEnabled !== false,
    notes: settings.notesPanelEnabled !== false,
    prayer: settings.prayerRequestEnabled !== false,
    give: settings.givingButtonEnabled !== false,
    new: settings.salvationResponseEnabled !== false,
  };
  const pastStreams = useMemo(() => {
    const currentId = stream?.id;
    return (context.streams || [])
      .filter((item) => item.id !== currentId && item.status === 'ended')
      .sort((a, b) => new Date(b.endedAt || b.scheduledAt || 0).getTime() - new Date(a.endedAt || a.scheduledAt || 0).getTime());
  }, [context.streams, stream?.id]);

  useEffect(() => {
    let active = true;
    const loadContext = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (serviceId) params.set('serviceId', serviceId);
      const queryString = params.toString();
      const path = resolvedStreamId
        ? `/api/cms/livestream/${encodeURIComponent(resolvedStreamId)}${queryString ? `?${queryString}` : ''}`
        : `/api/cms/livestream${queryString ? `?${queryString}` : ''}`;

      try {
        const res = await httpRequest(path);
        if (!res.ok) throw new Error('Unable to load livestream');
        const json = await res.json();
        if (!active) return;
        setContext(json.data || MOCK_CONTEXT);
      } catch (err: any) {
        if (!active) return;
        setContext(MOCK_CONTEXT);
        setError(err?.message || 'Livestream is not available yet.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContext();
    return () => {
      active = false;
    };
  }, [resolvedStreamId, serviceId]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (serviceMomentCtas.length <= 1) return undefined;
    const timer = window.setInterval(() => setMomentIndex((current) => (current + 1) % serviceMomentCtas.length), 5000);
    return () => window.clearInterval(timer);
  }, [serviceMomentCtas.length]);

  useEffect(() => {
    setPlayerStarted(false);
    setActivePanel(null);
  }, [stream?.id]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setNotes(stored ? JSON.parse(stored) : []);
    } catch {
      setNotes([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch {
      // Local notes are best effort.
    }
  }, [notes, storageKey]);

  useEffect(() => {
    if (!stream?.id || !featureEnabled.chat) return undefined;
    let active = true;
    let poll: number | undefined;

    const loadChat = async () => {
      try {
        const res = await httpRequest(`/api/cms/livestream/${encodeURIComponent(stream.id)}/chat?limit=80`);
        if (!res.ok) return;
        const json = await res.json();
        if (active) setChatMessages(Array.isArray(json.data) ? json.data : []);
      } catch {
        // Keep the existing chat list when polling fails.
      }
    };

    loadChat();
    if (stream.status === 'live') {
      poll = window.setInterval(loadChat, 4000);
    }

    return () => {
      active = false;
      if (poll) window.clearInterval(poll);
    };
  }, [stream?.id, stream?.status, featureEnabled.chat]);

  useEffect(() => {
    setViewerId(null);
  }, [stream?.id]);

  useEffect(() => {
    if (!stream?.id || stream.status !== 'live' || viewerId) return;
    const sessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    httpRequest(`/api/cms/livestream/${encodeURIComponent(stream.id)}/viewers/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data?.id) setViewerId(json.data.id);
      })
      .catch(() => undefined);
  }, [stream?.id, stream?.status, viewerId]);

  useEffect(() => {
    loadBibleChapter(selectedBook, selectedChapter);
  }, []);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((current) => current === panel ? null : panel);
  };

  const appendToNotes = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setNoteDraft((current) => current ? `${current}\n\n${clean}` : clean);
    setActivePanel('notes');
  };

  const addSelectionToNotes = () => {
    const text = window.getSelection()?.toString().trim() || '';
    appendToNotes(text);
    if (!text) setBibleNotice('Select verse text first, then add it to notes.');
  };

  const loadBibleChapter = async (book: string, chapter: number) => {
    setBibleLoading(true);
    setBibleNotice('');
    try {
      const res = await httpRequest(`/api/cms/bible/read/kjv/${encodeURIComponent(book)}/${chapter}`);
      if (!res.ok) throw new Error('Unable to load chapter');
      const json = await res.json();
      setBibleVerses(Array.isArray(json.data) ? json.data : []);
      if (!json.data?.length) setBibleNotice('KJV data is ready when the Bible database has this passage loaded.');
    } catch {
      setBibleNotice('Could not load this passage right now.');
    } finally {
      setBibleLoading(false);
    }
  };

  const resolveReference = async () => {
    const ref = referenceInput.trim();
    if (!ref) return;
    setBibleLoading(true);
    setBibleNotice('');
    try {
      const res = await httpRequest(`/api/cms/bible/resolve?translation=kjv&ref=${encodeURIComponent(ref)}`);
      if (!res.ok) throw new Error('Unable to resolve passage');
      const json = await res.json();
      setBibleVerses(Array.isArray(json.data) ? json.data : []);
      if (!json.data?.length) setBibleNotice('No matching KJV passage was found.');
    } catch {
      setBibleNotice('No matching KJV passage was found.');
    } finally {
      setBibleLoading(false);
    }
  };

  const searchBible = async () => {
    const q = searchInput.trim();
    if (!q) return;
    setBibleLoading(true);
    setBibleNotice('');
    try {
      const res = await httpRequest(`/api/cms/bible/search?translation=kjv&q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Unable to search Bible');
      const json = await res.json();
      setBibleVerses(Array.isArray(json.data) ? json.data : []);
      if (!json.data?.length) setBibleNotice('No matching KJV verses were found.');
    } catch {
      setBibleNotice('No matching KJV verses were found.');
    } finally {
      setBibleLoading(false);
    }
  };

  const sendChat = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stream?.id || !chatInput.trim()) return;
    setChatNotice('');
    try {
      const res = await httpRequest(`/api/cms/livestream/${encodeURIComponent(stream.id)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, message: chatInput }),
      });
      if (!res.ok) throw new Error(stream.status === 'live' ? 'Message not sent' : 'Chat opens when the stream is live.');
      const json = await res.json();
      setChatMessages((current) => [...current, json.data]);
      setChatInput('');
    } catch (err: any) {
      setChatNotice(err?.message || 'Chat opens when the stream is live.');
    }
  };

  const submitInteraction = async (type: string, content: string) => {
    if (!stream?.id) return false;
    const res = await httpRequest(`/api/cms/livestream/${encodeURIComponent(stream.id)}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
    });
    return res.ok;
  };

  const submitReaction = async (label: string) => {
    setReactionNotice('');
    const ok = await submitInteraction('reaction', label).catch(() => false);
    setReactionNotice(ok ? `${label} sent` : 'Reaction could not be sent.');
  };

  const submitPrayer = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = prayerDraft.trim();
    if (!body) return;
    const ok = await submitInteraction('prayer_request', body).catch(() => false);
    setPrayerNotice(ok ? 'Prayer request sent.' : 'Prayer request could not be sent.');
    if (ok) setPrayerDraft('');
  };

  const submitNewVisitor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim().toLowerCase();
    if (!name && !email) return;
    if (!email) {
      setNewVisitorNotice('Share an email so the care team can follow up.');
      return;
    }
    if (!tenant?.id) {
      setNewVisitorNotice('Church profile is still loading. Please try again.');
      return;
    }

    const nameParts = name.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || email.split('@')[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Friend';

    try {
      const res = await httpRequest('/api/salvation-new-believer-journey/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenant.id },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          source: 'livestream',
          serviceId: stream?.relatedService?.id || context.relatedService?.id,
          preferredLanguage: 'en',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Connection card could not be sent.');
      }

      await submitInteraction('salvation_response', `First timer: ${name || firstName} (${email})`).catch(() => false);
      setNewVisitorNotice('Thanks for connecting. The care team will follow up with your next steps.');
      form.reset();
    } catch (err: any) {
      setNewVisitorNotice(err?.message || 'Connection card could not be sent.');
    }
  };

  const saveNote = async () => {
    const body = noteDraft.trim();
    if (!body) return;
    const note = {
      id: `note-${Date.now()}`,
      title: stream?.title || 'Livestream Note',
      body,
      createdAt: new Date().toISOString(),
    };
    setNotes((current) => [note, ...current].slice(0, 25));
    setNoteDraft('');
    await submitInteraction('note', body).catch(() => undefined);
  };

  const selectBook = (book: string) => {
    setSelectedBook(book);
    const maxChapter = bookMaxChapters(book);
    const nextChapter = Math.min(selectedChapter, maxChapter);
    setSelectedChapter(nextChapter);
    loadBibleChapter(book, nextChapter);
  };

  const selectChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    loadBibleChapter(selectedBook, chapter);
  };

  const handleMomentAction = (moment: ServiceMomentCta) => {
    const url = moment.buttonUrl || '#';
    if (url === '#prayer') {
      setActivePanel('prayer');
      setSelectedMoment(null);
      return;
    }
    if (url === '#notes') {
      setActivePanel('notes');
      setSelectedMoment(null);
      return;
    }
    if (url === '#bible') {
      setActivePanel('bible');
      setSelectedMoment(null);
      return;
    }
    if (url === '#chat') {
      setActivePanel('chat');
      setSelectedMoment(null);
      return;
    }
    if (/^(https?:\/\/|mailto:)/i.test(url)) {
      window.location.href = url;
      return;
    }
    window.location.href = withLocalChurchBase(url);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(`Join ${tenant?.name || 'our church'} for service online`);
  const encodedUrl = encodeURIComponent(shareUrl);
  const actionButtons = [
    { panel: 'new' as const, label: "I'm New", icon: UserPlus, enabled: featureEnabled.new },
    { panel: 'prayer' as const, label: 'Prayer', icon: HandHeart, enabled: featureEnabled.prayer },
    { panel: 'bible' as const, label: 'Bible', icon: BookOpen, enabled: featureEnabled.bible },
    { panel: 'notes' as const, label: 'Notes', icon: NotebookPen, enabled: featureEnabled.notes },
    { panel: 'give' as const, label: 'Give', icon: HandCoins, enabled: featureEnabled.give },
  ].filter((item) => item.enabled);

  return (
    <div className={`livestream-page ${pastServicesOpen ? 'past-open' : ''}`}>
      <aside className="live-past-drawer" aria-hidden={!pastServicesOpen}>
        <div className="live-past-drawer__head">
          <h2>Past Services</h2>
          <button type="button" onClick={() => setPastServicesOpen(false)} aria-label="Close past services"><X size={30} /></button>
        </div>
        <div className="past-service-list">
          {pastStreams.length ? pastStreams.map((item) => {
            const parts = dateParts(item.endedAt || item.scheduledAt);
            return (
              <Link key={item.id} to={publicStreamPath(item)} onClick={() => setPastServicesOpen(false)}>
                <span className={`past-date past-date--${item.id.charCodeAt(0) % 4}`}>
                  <strong>{parts.day}</strong>
                  <em>{parts.month}</em>
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.relatedService?.speaker?.name ? `With ${item.relatedService.speaker.name}` : formatDate(item.endedAt || item.scheduledAt)}</small>
                </span>
              </Link>
            );
          }) : (
            <div className="live-empty">No past services have been published yet.</div>
          )}
        </div>
      </aside>

      <div className="live-main-panel">
        <section className="live-sliding-shell">
          <header className="live-app-header">
            <div className="live-app-header__brand">
              <Church size={22} className="live-app-header__logo-icon" />
              <span className="live-app-header__church-name">{tenant?.name || 'Church'}</span>
            </div>
            <Link to={withLocalChurchBase('/')} className="live-app-header__back-btn">
              <ArrowLeft size={16} />
              <span>Back to Website</span>
            </Link>
          </header>

          <section className={`live-stage ${activePanel ? 'side-visible' : ''}`}>
            <div className="live-video-column">
              <div className="live-video-wrapper">
                <div className="live-video-frame">
                  {stream?.status === 'live' ? (
                    <div className="live-overlay-badge"><span /> Live</div>
                  ) : (
                    <button type="button" className="live-overlay-badge-btn" onClick={() => setPastServicesOpen(true)}>
                      Watch Past Services
                    </button>
                  )}
                  {videoUrl ? (
                    <video controls poster={playerPoster} className="live-player__video" src={videoUrl}>
                      <track kind="captions" />
                    </video>
                  ) : playerStarted && embedUrl ? (
                    <iframe
                      title={stream?.title || 'Livestream'}
                      src={embedUrl}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="live-player__placeholder" style={playerPoster ? { backgroundImage: `linear-gradient(rgba(16, 4, 28, 0.32), rgba(13, 0, 22, 0.82)), url(${playerPoster})` } : undefined}>
                      {stream?.status === 'live' ? (
                        <button type="button" className="live-play-button" onClick={() => setPlayerStarted(true)} aria-label="Play livestream">
                          <Play size={34} fill="currentColor" />
                        </button>
                      ) : stream?.status === 'scheduled' ? (
                        <div className="live-countdown-timer">
                          <div className="countdown-label">Next Live Service Starts In</div>
                          <div className="countdown-value">{countdownText || '00:00:00'}</div>
                        </div>
                      ) : (
                        <div className="no-active-livestream">
                          No active livestream
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <nav className="live-action-bar" aria-label="Livestream actions">
                  {actionButtons.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.panel}
                        type="button"
                        className={activePanel === item.panel ? 'active' : ''}
                        onClick={() => togglePanel(item.panel)}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="live-below-player">
                <div className="live-stream-info">
                  <h1>{stream?.title || `${tenant?.name || 'Church'} Livestream`}</h1>
                  <p>{stream?.relatedService?.title || stream?.description || 'Worship with us online.'}</p>
                </div>
                <div className="live-widgets-row">
                  <div className="today-service">
                    <h2>{momentHeading}</h2>
                    <button className="today-card" type="button" onClick={() => setSelectedMoment(activeMoment)}>
                      <span className={`today-card__thumb today-card__thumb--${activeMoment.theme || 'sunrise'}`} />
                      <span>
                        <strong>{activeMoment.title}</strong>
                        <small>{activeMoment.summary}</small>
                      </span>
                    </button>
                    <div className="today-dots" aria-label="Service moment slides">
                      {serviceMomentCtas.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className={index === momentIndex % serviceMomentCtas.length ? 'active' : ''}
                          onClick={() => setMomentIndex(index)}
                          aria-label={`Show ${item.title}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="invite-service">
                    <h2>Invite Someone</h2>
                    <div className="share-row">
                      <a href={`https://wa.me/?text=${shareText}%20${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp"><Share2 size={24} /></a>
                      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook"><Share2 size={24} /></a>
                      <a href={`https://t.me/share/url?url=${encodedUrl}&text=${shareText}`} target="_blank" rel="noreferrer" aria-label="Share on Telegram"><Share2 size={24} /></a>
                      <a href={`mailto:?subject=${shareText}&body=${encodedUrl}`} aria-label="Share by email"><Mail size={24} /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="live-right-container">
              <aside className="live-right-sidebar" aria-hidden={!!activePanel}>
                <div className="live-chat-sidebar-wrapper">
                  <div className="live-chat-header">
                    <h2>Live Chat</h2>
                    {stream?.status === 'live' && (
                      <span className="live-chat-status"><Radio size={12} /> Live</span>
                    )}
                  </div>
                  <div className="live-chat-content">
                    <p className="live-chat-desc">{featureEnabled.chat ? 'Comments and reactions are connected to this broadcast.' : 'Chat is disabled for this stream.'}</p>
                    <div className="reaction-row">
                      {REACTIONS.map((reaction) => {
                        const Icon = reaction.icon;
                        return <button key={reaction.label} type="button" onClick={() => submitReaction(reaction.label)}><Icon size={14} /> {reaction.label}</button>;
                      })}
                    </div>
                    {reactionNotice && <div className="live-inline-note">{reactionNotice}</div>}
                    <div className="chat-list">
                      {chatMessages.length ? chatMessages.map((message) => (
                        <article key={message.id}>
                          <strong>{message.displayName}</strong>
                          <p>{message.message}</p>
                          <time>{formatDate(message.createdAt)}</time>
                        </article>
                      )) : <div className="live-empty">No chat messages yet.</div>}
                    </div>
                    <form className="chat-form" onSubmit={sendChat}>
                      <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} aria-label="Display name" />
                      <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={stream?.status === 'live' ? 'Say something...' : 'Chat opens when live'} />
                      <button type="submit" disabled={stream?.status !== 'live' || !featureEnabled.chat}><Send size={16} /></button>
                    </form>
                    {chatNotice && <div className="live-inline-note">{chatNotice}</div>}
                  </div>
                </div>
              </aside>

              <aside className="live-side-panel" aria-hidden={!activePanel}>
                {activePanel && (
                  <div className="live-tool">
                    <div className="live-tool__head">
                      <h2>
                        {activePanel === 'new' && 'First Timers'}
                        {activePanel === 'prayer' && 'Need Prayer?'}
                        {activePanel === 'bible' && 'Bible Reader'}
                        {activePanel === 'notes' && 'Personal Notes'}
                        {activePanel === 'give' && 'Giving'}
                      </h2>
                      <button type="button" onClick={() => setActivePanel(null)} aria-label="Close panel"><X size={26} /></button>
                    </div>

                    {activePanel === 'new' && (
                      <form className="stack-form" onSubmit={submitNewVisitor}>
                        <p>We are glad you joined us. Share your details so the church can welcome you.</p>
                        <input name="name" placeholder="Full name" />
                        <input name="email" type="email" placeholder="Email address" data-required="true" />
                        <button type="submit">Submit</button>
                        {newVisitorNotice && <div className="live-inline-note">{newVisitorNotice}</div>}
                      </form>
                    )}

                    {activePanel === 'prayer' && (
                      <form className="stack-form" onSubmit={submitPrayer}>
                        <p>Our prayer team is ready to stand with you.</p>
                        <textarea value={prayerDraft} onChange={(event) => setPrayerDraft(event.target.value)} placeholder="Write your prayer request" />
                        <button type="submit">Submit Prayer Request</button>
                        {prayerNotice && <div className="live-inline-note">{prayerNotice}</div>}
                      </form>
                    )}

                    {activePanel === 'bible' && (
                      <>
                        <p>Search, locate passages, select verse text, and send it into your notes.</p>
                        <button className="live-mini-btn" type="button" onClick={addSelectionToNotes}><Copy size={15} /> Add Selected</button>
                        <div className="bible-controls">
                          <select value={selectedBook} onChange={(event) => selectBook(event.target.value)}>
                            {BOOKS.map(([book]) => <option key={book} value={book}>{book}</option>)}
                          </select>
                          <select value={selectedChapter} onChange={(event) => selectChapter(Number(event.target.value))}>
                            {Array.from({ length: bookMaxChapters(selectedBook) }, (_, index) => index + 1).map((chapter) => (
                              <option key={chapter} value={chapter}>Chapter {chapter}</option>
                            ))}
                          </select>
                          <input value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} placeholder="John 3:16" />
                          <button type="button" onClick={resolveReference}>Go</button>
                        </div>
                        <div className="bible-search">
                          <Search size={16} />
                          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') searchBible(); }} placeholder="Search KJV text or reference" />
                          <button type="button" onClick={searchBible}>Search</button>
                        </div>
                        {bibleNotice && <div className="live-inline-note">{bibleNotice}</div>}
                        <div className="bible-results" aria-busy={bibleLoading}>
                          {bibleLoading ? <div className="live-empty">Loading KJV passage...</div> : bibleVerses.length ? bibleVerses.map((verse) => (
                            <article key={verse.id}>
                              <button type="button" onClick={() => appendToNotes(`${verse.reference} ${verse.text}`)}><NotebookPen size={14} /></button>
                              <p><sup>{verse.verse}</sup>{verse.text}</p>
                              <span>{verse.reference}</span>
                            </article>
                          )) : <div className="live-empty">Choose a chapter or search for a passage.</div>}
                        </div>
                      </>
                    )}

                    {activePanel === 'notes' && (
                      <>
                        <p>Notes are kept locally in this browser and can also be captured as livestream interactions.</p>
                        <button className="live-mini-btn" type="button" onClick={saveNote}><NotebookPen size={15} /> Save Note</button>
                        <textarea className="notes-editor" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Write sermon notes, prayer points, and copied verses here." />
                        <div className="notes-list">
                          {notes.length ? notes.map((note) => (
                            <article key={note.id}>
                              <strong>{note.title}</strong>
                              <time>{formatDate(note.createdAt)}</time>
                              <p>{note.body}</p>
                            </article>
                          )) : <div className="live-empty">No saved notes yet.</div>}
                        </div>
                      </>
                    )}

                    {activePanel === 'give' && (
                      <div className="give-panel">
                        <HandCoins size={44} />
                        <p>Your faithful giving helps the church serve people and spread the Gospel.</p>
                        <Link to={withLocalChurchBase('/giving')} onClick={() => submitInteraction('giving_click', 'Clicked livestream giving link').catch(() => undefined)}>
                          Give Now
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </section>

          {error && !loading && <div className="live-alert">{error}</div>}
        </section>
      </div>

      {selectedMoment && (
        <div className="service-moment-modal" role="dialog" aria-modal="true" aria-labelledby="service-moment-title">
          <div className="service-moment-modal__card">
            <button type="button" onClick={() => setSelectedMoment(null)} aria-label="Close service moment"><X size={26} /></button>
            <span className={`service-moment-modal__thumb today-card__thumb--${selectedMoment.theme || 'sunrise'}`} />
            <h2 id="service-moment-title">{selectedMoment.title}</h2>
            <div className="service-moment-modal__details">
              <p>{selectedMoment.details || selectedMoment.summary}</p>
            </div>
            <button type="button" onClick={() => handleMomentAction(selectedMoment)}>
              {selectedMoment.buttonLabel || 'Open'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivestreamPage;
