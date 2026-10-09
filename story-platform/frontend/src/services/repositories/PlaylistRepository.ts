import { UserPlaylist, PlaylistItem, PlaylistLimits } from '../../types';
import { adminRepository } from './AdminRepository';

import { STORAGE_KEYS } from '../storage';

const PLAYLISTS_KEY = STORAGE_KEYS.PLAYLISTS;
const PLAYLIST_ITEMS_KEY = STORAGE_KEYS.PLAYLIST_ITEMS;

export class LocalPlaylistRepository {
  private getPlaylists(): UserPlaylist[] {
    try {
      const data = localStorage.getItem(PLAYLISTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private savePlaylists(playlists: UserPlaylist[]) {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }

  private getItems(): PlaylistItem[] {
    try {
      const data = localStorage.getItem(PLAYLIST_ITEMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveItems(items: PlaylistItem[]) {
    localStorage.setItem(PLAYLIST_ITEMS_KEY, JSON.stringify(items));
  }

  public getPlaylistLimits(isPremium: boolean): PlaylistLimits {
    return isPremium
      ? { maximumPlaylists: null, maximumItemsPerPlaylist: null }
      : { maximumPlaylists: 3, maximumItemsPerPlaylist: 50 };
  }

  public async getPlaylistsByUser(userId: string): Promise<UserPlaylist[]> {
    return this.getPlaylists().filter((p) => p.ownerId === userId).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getPlaylistById(playlistId: string): Promise<UserPlaylist | null> {
    return this.getPlaylists().find((p) => p.id === playlistId) || null;
  }

  public async createPlaylist(input: { ownerId: string; name: string; description?: string }, isPremium: boolean): Promise<UserPlaylist> {
    const limits = this.getPlaylistLimits(isPremium);
    const playlists = this.getPlaylists();
    const userPlaylists = playlists.filter(p => p.ownerId === input.ownerId);

    if (limits.maximumPlaylists !== null && userPlaylists.length >= limits.maximumPlaylists) {
      throw new Error(`Bạn đã sử dụng ${limits.maximumPlaylists}/${limits.maximumPlaylists} danh sách phát miễn phí.`);
    }

    const newPlaylist: UserPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
      itemCount: 0,
      totalDurationSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    return newPlaylist;
  }

  public async updatePlaylist(playlistId: string, input: { name?: string; description?: string; coverUrl?: string }): Promise<UserPlaylist | null> {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === playlistId);
    if (index === -1) return null;

    const playlist = playlists[index];
    if (input.name !== undefined) playlist.name = input.name;
    if (input.description !== undefined) playlist.description = input.description;
    if (input.coverUrl !== undefined) playlist.coverUrl = input.coverUrl;
    playlist.updatedAt = new Date().toISOString();

    this.savePlaylists(playlists);
    return playlist;
  }

  public async deletePlaylist(playlistId: string): Promise<boolean> {
    const playlists = this.getPlaylists();
    const newPlaylists = playlists.filter((p) => p.id !== playlistId);
    if (playlists.length === newPlaylists.length) return false;
    
    this.savePlaylists(newPlaylists);

    const items = this.getItems();
    this.saveItems(items.filter((i) => i.playlistId !== playlistId));

    return true;
  }

  public async getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
    return this.getItems()
      .filter((i) => i.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
  }

  public async isChapterInPlaylist(playlistId: string, chapterId: string): Promise<boolean> {
    return this.getItems().some((i) => i.playlistId === playlistId && i.chapterId === chapterId);
  }

  public async addChapter(playlistId: string, storyId: string, chapterId: string, isPremium: boolean): Promise<PlaylistItem> {
    const limits = this.getPlaylistLimits(isPremium);
    const items = this.getItems();
    const playlistItems = items.filter(i => i.playlistId === playlistId);

    if (limits.maximumItemsPerPlaylist !== null && playlistItems.length >= limits.maximumItemsPerPlaylist) {
      throw new Error(`Danh sách phát đã đạt giới hạn ${limits.maximumItemsPerPlaylist} tập.`);
    }

    if (playlistItems.some(i => i.chapterId === chapterId)) {
      throw new Error('Tập này đã có trong danh sách phát.');
    }

    const newItem: PlaylistItem = {
      id: `pli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playlistId,
      storyId,
      chapterId,
      position: playlistItems.length,
      addedAt: new Date().toISOString(),
    };

    items.push(newItem);
    this.saveItems(items);
    await this.recalculatePlaylistStats(playlistId);

    return newItem;
  }

  public async removeItem(playlistId: string, itemId: string): Promise<boolean> {
    const items = this.getItems();
    const newItems = items.filter((i) => i.id !== itemId);
    if (items.length === newItems.length) return false;

    // Fix positions
    const remainingPlaylistItems = newItems
      .filter(i => i.playlistId === playlistId)
      .sort((a, b) => a.position - b.position)
      .map((i, index) => ({ ...i, position: index }));

    const otherItems = newItems.filter(i => i.playlistId !== playlistId);
    this.saveItems([...otherItems, ...remainingPlaylistItems]);

    await this.recalculatePlaylistStats(playlistId);
    return true;
  }

  public async reorderItems(playlistId: string, orderedItemIds: string[]): Promise<void> {
    const items = this.getItems();
    let playlistItems = items.filter(i => i.playlistId === playlistId);
    const otherItems = items.filter(i => i.playlistId !== playlistId);

    playlistItems = orderedItemIds.map((id, index) => {
      const item = playlistItems.find(i => i.id === id);
      return item ? { ...item, position: index } : null;
    }).filter(Boolean) as PlaylistItem[];

    this.saveItems([...otherItems, ...playlistItems]);
  }

  private async recalculatePlaylistStats(playlistId: string) {
    const items = this.getItems().filter(i => i.playlistId === playlistId);
    const playlists = this.getPlaylists();
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index === -1) return;

    let totalDurationSeconds = 0;
    let coverUrl = playlists[index].coverUrl;

    const publicStories = adminRepository.getPublicStories();
    const allStories = publicStories;

    if (items.length > 0 && !coverUrl) {
      const firstStory = allStories.find(s => s.id === items[0].storyId);
      if (firstStory) coverUrl = firstStory.coverUrl;
    }

    for (const item of items) {
      const story = allStories.find(s => s.id === item.storyId);
      const chapter = story?.chapters.find(c => c.id === item.chapterId);
      if (chapter) totalDurationSeconds += chapter.durationSeconds;
    }

    playlists[index].itemCount = items.length;
    playlists[index].totalDurationSeconds = totalDurationSeconds;
    if (coverUrl) playlists[index].coverUrl = coverUrl;
    playlists[index].updatedAt = new Date().toISOString();

    this.savePlaylists(playlists);
  }
}

export const localPlaylistRepository = new LocalPlaylistRepository();
