import prisma from '../lib/prisma';

export interface ScheduleRule {
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  startTime?: string; // "HH:MM" e.g., "18:00"
  endTime?: string;   // "HH:MM" e.g., "22:00"
}

/**
 * Checks if a playlist is active based on schedule rules JSON and screen branch timezone.
 */
export function isPlaylistActive(rulesJson: string | null, timezone?: string): boolean {
  if (!rulesJson) return true;
  try {
    const rules: ScheduleRule[] = JSON.parse(rulesJson);
    if (!Array.isArray(rules) || rules.length === 0) return true;

    // Shift current date/time to the target timezone
    const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: timezone || 'UTC' }));
    const currentDay = nowLocal.getDay(); // 0-6
    const currentHour = nowLocal.getHours();
    const currentMin = nowLocal.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    for (const rule of rules) {
      if (rule.dayOfWeek !== undefined && rule.dayOfWeek !== currentDay) {
        continue;
      }
      if (rule.startTime && currentTimeStr < rule.startTime) {
        continue;
      }
      if (rule.endTime && currentTimeStr > rule.endTime) {
        continue;
      }
      return true; // Matches active window
    }
    return false;
  } catch (e) {
    console.error('Failed to parse signage schedule rules', e);
    return true; // Fallback to active
  }
}

// ─────────────────────────────────────────────────────────────
// DISPLAY SCREEN CRUD
// ─────────────────────────────────────────────────────────────

export async function createScreen(
  tenantId: string,
  data: {
    name: string;
    locationCode: string;
    branchId?: string;
    activePlaylistId?: string;
  }
): Promise<any> {
  return await prisma.displayScreen.create({
    data: {
      tenantId,
      name: data.name,
      locationCode: data.locationCode,
      branchId: data.branchId || null,
      activePlaylistId: data.activePlaylistId || null,
      status: 'offline',
    },
    include: {
      branch: true,
      activePlaylist: true,
    },
  });
}

export async function getScreen(id: string, tenantId?: string): Promise<any> {
  const whereClause: any = { id };
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }
  const screen = await prisma.displayScreen.findFirst({
    where: whereClause,
    include: {
      branch: true,
      activePlaylist: true,
    },
  });
  if (!screen) {
    throw new Error('Display screen not found');
  }
  return screen;
}

export async function listScreens(tenantId: string, branchId?: string): Promise<any[]> {
  const whereClause: any = { tenantId };
  if (branchId) {
    whereClause.branchId = branchId;
  }
  return await prisma.displayScreen.findMany({
    where: whereClause,
    include: {
      branch: true,
      activePlaylist: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateScreen(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    locationCode?: string;
    branchId?: string | null;
    activePlaylistId?: string | null;
  }
): Promise<any> {
  // Verify screen exists
  await getScreen(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.locationCode !== undefined) updateData.locationCode = data.locationCode;
  if (data.branchId !== undefined) updateData.branchId = data.branchId;
  if (data.activePlaylistId !== undefined) updateData.activePlaylistId = data.activePlaylistId;

  return await prisma.displayScreen.update({
    where: { id },
    data: updateData,
    include: {
      branch: true,
      activePlaylist: true,
    },
  });
}

export async function deleteScreen(id: string, tenantId: string): Promise<any> {
  await getScreen(id, tenantId);
  return await prisma.displayScreen.delete({
    where: { id },
  });
}

export async function pingScreen(id: string): Promise<any> {
  const screen = await prisma.displayScreen.findUnique({
    where: { id },
  });
  if (!screen) {
    throw new Error('Display screen not found');
  }

  return await prisma.displayScreen.update({
    where: { id },
    data: {
      status: 'online',
      lastPingAt: new Date(),
    },
  });
}

export async function triggerEmergencyOverride(
  tenantId: string,
  screenId: string,
  text: string | null
): Promise<any> {
  if (screenId === 'all') {
    return await prisma.displayScreen.updateMany({
      where: { tenantId },
      data: {
        emergencyOverrideActive: text ? true : false,
        emergencyOverrideText: text,
      },
    });
  }

  // Verify screen exists
  await getScreen(screenId, tenantId);

  return await prisma.displayScreen.update({
    where: { id: screenId },
    data: {
      emergencyOverrideActive: text ? true : false,
      emergencyOverrideText: text,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// SIGNAGE PLAYLIST CRUD
// ─────────────────────────────────────────────────────────────

export async function createPlaylist(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    scheduleRules?: string;
  }
): Promise<any> {
  return await prisma.signagePlaylist.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      scheduleRules: data.scheduleRules || null,
    },
  });
}

export async function getPlaylist(id: string, tenantId: string): Promise<any> {
  const playlist = await prisma.signagePlaylist.findFirst({
    where: { id, tenantId },
    include: {
      items: {
        include: {
          slide: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
  if (!playlist) {
    throw new Error('Signage playlist not found');
  }
  return playlist;
}

export async function listPlaylists(tenantId: string): Promise<any[]> {
  return await prisma.signagePlaylist.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function updatePlaylist(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    description?: string;
    scheduleRules?: string | null;
  }
): Promise<any> {
  await getPlaylist(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.scheduleRules !== undefined) updateData.scheduleRules = data.scheduleRules;

  return await prisma.signagePlaylist.update({
    where: { id },
    data: updateData,
  });
}

export async function deletePlaylist(id: string, tenantId: string): Promise<any> {
  await getPlaylist(id, tenantId);
  return await prisma.signagePlaylist.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────
// SIGNAGE PLAYLIST ITEMS
// ─────────────────────────────────────────────────────────────

export async function addPlaylistItem(
  tenantId: string,
  playlistId: string,
  slideId: string,
  order: number
): Promise<any> {
  // Validate playlist exists
  await getPlaylist(playlistId, tenantId);

  // Validate slide exists
  const slide = await prisma.signageSlide.findFirst({
    where: { id: slideId, tenantId },
  });
  if (!slide) {
    throw new Error('Signage slide not found');
  }

  // Create item
  return await prisma.signagePlaylistItem.create({
    data: {
      playlistId,
      slideId,
      order,
    },
    include: {
      slide: true,
    },
  });
}

export async function removePlaylistItem(tenantId: string, itemId: string): Promise<any> {
  const item = await prisma.signagePlaylistItem.findFirst({
    where: { id: itemId },
    include: {
      playlist: true,
    },
  });

  if (!item || item.playlist.tenantId !== tenantId) {
    throw new Error('Playlist item not found');
  }

  return await prisma.signagePlaylistItem.delete({
    where: { id: itemId },
  });
}

export async function reorderPlaylist(
  tenantId: string,
  playlistId: string,
  itemOrders: { id: string; order: number }[]
): Promise<any> {
  await getPlaylist(playlistId, tenantId);

  const updates = itemOrders.map((item) =>
    prisma.signagePlaylistItem.update({
      where: { id: item.id },
      data: { order: item.order },
    })
  );

  return await prisma.$transaction(updates);
}

// ─────────────────────────────────────────────────────────────
// SIGNAGE SLIDE CRUD
// ─────────────────────────────────────────────────────────────

export async function createSlide(
  tenantId: string,
  data: {
    name: string;
    type: string; // announcement | countdown | schedule | media | lyrics
    durationSeconds?: number;
    content?: string;
  }
): Promise<any> {
  return await prisma.signageSlide.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      durationSeconds: data.durationSeconds ?? 10,
      content: data.content || '{}',
    },
  });
}

export async function getSlide(id: string, tenantId: string): Promise<any> {
  const slide = await prisma.signageSlide.findFirst({
    where: { id, tenantId },
  });
  if (!slide) {
    throw new Error('Signage slide not found');
  }
  return slide;
}

export async function listSlides(tenantId: string): Promise<any[]> {
  return await prisma.signageSlide.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateSlide(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    type?: string;
    durationSeconds?: number;
    content?: string;
  }
): Promise<any> {
  await getSlide(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.durationSeconds !== undefined) updateData.durationSeconds = data.durationSeconds;
  if (data.content !== undefined) updateData.content = data.content;

  return await prisma.signageSlide.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteSlide(id: string, tenantId: string): Promise<any> {
  await getSlide(id, tenantId);
  return await prisma.signageSlide.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────
// SCREEN RENDERING
// ─────────────────────────────────────────────────────────────

export async function renderScreen(id: string): Promise<any> {
  const screen = await prisma.displayScreen.findUnique({
    where: { id },
    include: {
      branch: true,
      activeWorshipSession: {
        include: {
          currentSong: true,
        },
      },
      activePlaylist: {
        include: {
          items: {
            include: {
              slide: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  });

  if (!screen) {
    throw new Error('Display screen not found');
  }

  // 1. If emergency override is active, immediately return it with empty slides
  if (screen.emergencyOverrideActive) {
    return {
      screenName: screen.name,
      locationCode: screen.locationCode,
      emergencyOverrideActive: true,
      emergencyOverrideText: screen.emergencyOverrideText || 'Emergency Override Active',
      playlistName: null,
      slides: [],
    };
  }

  // 2. Check active worship session override
  if (screen.activeWorshipSession && screen.activeWorshipSession.status === 'active') {
    const currentSong = screen.activeWorshipSession.currentSong;
    let activeLyricText = '';
    let songTitle = '';
    let artist = '';
    if (currentSong) {
      songTitle = currentSong.title;
      artist = currentSong.artist || '';
      const lyricSlides = currentSong.lyrics
        .split('\n\n')
        .map((s) => s.trim())
        .filter(Boolean);
      activeLyricText = lyricSlides[screen.activeWorshipSession.currentSlideIndex] || '';
    }
    return {
      screenName: screen.name,
      locationCode: screen.locationCode,
      emergencyOverrideActive: false,
      emergencyOverrideText: null,
      worshipSessionActive: true,
      songTitle,
      artist,
      lyricsText: activeLyricText,
      currentSlideIndex: screen.activeWorshipSession.currentSlideIndex,
      playlistName: null,
      slides: [],
    };
  }

  // 3. Check active playlist
  if (!screen.activePlaylist) {
    return {
      screenName: screen.name,
      locationCode: screen.locationCode,
      emergencyOverrideActive: false,
      emergencyOverrideText: null,
      playlistName: null,
      slides: [],
    };
  }

  // 4. Evaluate timezone-aware scheduling rules
  const timezone = screen.branch?.timezone || 'UTC';
  const active = isPlaylistActive(screen.activePlaylist.scheduleRules, timezone);

  if (!active) {
    return {
      screenName: screen.name,
      locationCode: screen.locationCode,
      emergencyOverrideActive: false,
      emergencyOverrideText: null,
      playlistName: screen.activePlaylist.name,
      active: false,
      slides: [],
    };
  }

  // 5. Return the ordered slides
  return {
    screenName: screen.name,
    locationCode: screen.locationCode,
    emergencyOverrideActive: false,
    emergencyOverrideText: null,
    playlistName: screen.activePlaylist.name,
    active: true,
    slides: screen.activePlaylist.items.map((item) => ({
      id: item.slide.id,
      name: item.slide.name,
      type: item.slide.type,
      durationSeconds: item.slide.durationSeconds,
      content: JSON.parse(item.slide.content),
    })),
  };
}
