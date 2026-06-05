import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// WORSHIP SONG CRUD
// ─────────────────────────────────────────────────────────────

export async function createSong(
  tenantId: string,
  data: {
    title: string;
    artist?: string;
    key?: string;
    tempoBpm?: number;
    audioUrl?: string;
    backgroundUrl?: string;
    lyrics: string;
    lyricsTiming?: string;
  }
): Promise<any> {
  return await prisma.worshipSong.create({
    data: {
      tenantId,
      title: data.title,
      artist: data.artist || null,
      key: data.key || null,
      tempoBpm: data.tempoBpm || null,
      audioUrl: data.audioUrl || null,
      backgroundUrl: data.backgroundUrl || null,
      lyrics: data.lyrics,
      lyricsTiming: data.lyricsTiming || null,
    },
  });
}

export async function getSong(id: string, tenantId: string): Promise<any> {
  const song = await prisma.worshipSong.findFirst({
    where: { id, tenantId },
  });
  if (!song) {
    throw new Error('Worship song not found');
  }
  return song;
}

export async function listSongs(tenantId: string): Promise<any[]> {
  return await prisma.worshipSong.findMany({
    where: { tenantId },
    orderBy: { title: 'asc' },
  });
}

export async function updateSong(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    artist?: string;
    key?: string;
    tempoBpm?: number;
    audioUrl?: string;
    backgroundUrl?: string;
    lyrics?: string;
    lyricsTiming?: string | null;
  }
): Promise<any> {
  await getSong(id, tenantId);

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.artist !== undefined) updateData.artist = data.artist;
  if (data.key !== undefined) updateData.key = data.key;
  if (data.tempoBpm !== undefined) updateData.tempoBpm = data.tempoBpm;
  if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl;
  if (data.backgroundUrl !== undefined) updateData.backgroundUrl = data.backgroundUrl;
  if (data.lyrics !== undefined) updateData.lyrics = data.lyrics;
  if (data.lyricsTiming !== undefined) updateData.lyricsTiming = data.lyricsTiming;

  return await prisma.worshipSong.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteSong(id: string, tenantId: string): Promise<any> {
  await getSong(id, tenantId);
  return await prisma.worshipSong.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────
// WORSHIP PLAYLIST CRUD
// ─────────────────────────────────────────────────────────────

export async function createWorshipPlaylist(
  tenantId: string,
  data: {
    name: string;
    description?: string;
  }
): Promise<any> {
  return await prisma.worshipPlaylist.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
    },
  });
}

export async function getWorshipPlaylist(id: string, tenantId: string): Promise<any> {
  const playlist = await prisma.worshipPlaylist.findFirst({
    where: { id, tenantId },
    include: {
      items: {
        include: {
          song: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
  if (!playlist) {
    throw new Error('Worship playlist not found');
  }
  return playlist;
}

export async function listWorshipPlaylists(tenantId: string): Promise<any[]> {
  return await prisma.worshipPlaylist.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function updateWorshipPlaylist(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<any> {
  await getWorshipPlaylist(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  return await prisma.worshipPlaylist.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWorshipPlaylist(id: string, tenantId: string): Promise<any> {
  await getWorshipPlaylist(id, tenantId);
  return await prisma.worshipPlaylist.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────
// PLAYLIST ITEM CRUD
// ─────────────────────────────────────────────────────────────

export async function addWorshipPlaylistItem(
  tenantId: string,
  playlistId: string,
  songId: string,
  order: number
): Promise<any> {
  // Validate playlist
  await getWorshipPlaylist(playlistId, tenantId);

  // Validate song
  const song = await prisma.worshipSong.findFirst({
    where: { id: songId, tenantId },
  });
  if (!song) {
    throw new Error('Worship song not found');
  }

  return await prisma.worshipPlaylistItem.create({
    data: {
      playlistId,
      songId,
      order,
    },
    include: {
      song: true,
    },
  });
}

export async function removeWorshipPlaylistItem(tenantId: string, itemId: string): Promise<any> {
  const item = await prisma.worshipPlaylistItem.findFirst({
    where: { id: itemId },
    include: {
      playlist: true,
    },
  });

  if (!item || item.playlist.tenantId !== tenantId) {
    throw new Error('Playlist item not found');
  }

  return await prisma.worshipPlaylistItem.delete({
    where: { id: itemId },
  });
}

// ─────────────────────────────────────────────────────────────
// WORSHIP SESSION CRUD & REAL-TIME CONTROLS
// ─────────────────────────────────────────────────────────────

export async function createWorshipSession(
  tenantId: string,
  data: {
    name: string;
    playlistId?: string;
    viewMode?: string;
  }
): Promise<any> {
  if (data.playlistId) {
    await getWorshipPlaylist(data.playlistId, tenantId);
  }

  return await prisma.worshipSession.create({
    data: {
      tenantId,
      name: data.name,
      playlistId: data.playlistId || null,
      viewMode: data.viewMode || 'fullscreen',
      status: 'idle',
    },
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}

export async function getWorshipSession(id: string, tenantId: string): Promise<any> {
  const session = await prisma.worshipSession.findFirst({
    where: { id, tenantId },
    include: {
      playlist: {
        include: {
          items: {
            include: {
              song: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
      currentSong: true,
    },
  });
  if (!session) {
    throw new Error('Worship session not found');
  }
  return session;
}

export async function updateWorshipSession(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    playlistId?: string | null;
    viewMode?: string;
  }
): Promise<any> {
  await getWorshipSession(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.playlistId !== undefined) updateData.playlistId = data.playlistId;
  if (data.viewMode !== undefined) updateData.viewMode = data.viewMode;

  return await prisma.worshipSession.update({
    where: { id },
    data: updateData,
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}

export async function startWorshipSession(tenantId: string, id: string): Promise<any> {
  const session = await getWorshipSession(id, tenantId);

  // Default currentSongId to first song in playlist if available and none selected
  let defaultSongId = session.currentSongId;
  if (!defaultSongId && session.playlist && session.playlist.items.length > 0) {
    defaultSongId = session.playlist.items[0].songId;
  }

  return await prisma.worshipSession.update({
    where: { id },
    data: {
      status: 'active',
      currentSongId: defaultSongId,
      currentSlideIndex: 0,
    },
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}

export async function endWorshipSession(tenantId: string, id: string): Promise<any> {
  await getWorshipSession(id, tenantId);

  return await prisma.worshipSession.update({
    where: { id },
    data: {
      status: 'ended',
    },
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}

export async function changeSessionActiveSong(
  tenantId: string,
  id: string,
  songId: string | null
): Promise<any> {
  await getWorshipSession(id, tenantId);

  if (songId) {
    // Verify song exists
    await getSong(songId, tenantId);
  }

  return await prisma.worshipSession.update({
    where: { id },
    data: {
      currentSongId: songId,
      currentSlideIndex: 0,
    },
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}

export async function navigateSessionLyrics(
  tenantId: string,
  id: string,
  direction: 'next' | 'prev' | number
): Promise<any> {
  const session = await getWorshipSession(id, tenantId);
  if (!session.currentSongId || !session.currentSong) {
    throw new Error('No active song in this worship session');
  }

  const slides = session.currentSong.lyrics
    .split('\n\n')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const totalSlides = slides.length;

  let newIndex = session.currentSlideIndex;
  if (direction === 'next') {
    newIndex = Math.min(totalSlides - 1, session.currentSlideIndex + 1);
  } else if (direction === 'prev') {
    newIndex = Math.max(0, session.currentSlideIndex - 1);
  } else if (typeof direction === 'number') {
    if (direction < 0 || direction >= totalSlides) {
      throw new Error(`Slide index ${direction} out of bounds (total slides: ${totalSlides})`);
    }
    newIndex = direction;
  }

  return await prisma.worshipSession.update({
    where: { id },
    data: {
      currentSlideIndex: newIndex,
    },
    include: {
      playlist: true,
      currentSong: true,
    },
  });
}
