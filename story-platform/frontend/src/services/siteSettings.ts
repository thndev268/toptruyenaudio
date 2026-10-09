export interface ZaloSettings {
  isEnabled: boolean;
  link: string;
  displayName: string;
  position: 'left' | 'right';
}

export interface TelegramSettings {
  isEnabled: boolean;
  botToken: string;
  adminChatId: string;
  webhookSecret: string;
}

export interface SiteSettings {
  zalo: ZaloSettings;
  telegram: TelegramSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  zalo: {
    isEnabled: false,
    link: 'https://zalo.me/g/mockgroup',
    displayName: 'Cộng đồng Zalo',
    position: 'right',
  },
  telegram: {
    isEnabled: false,
    botToken: '',
    adminChatId: '',
    webhookSecret: '',
  },
};

const STORAGE_KEY = 'sp_site_settings_mock';

export const siteSettingsService = {
  getSettings(): SiteSettings {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse site settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: SiteSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Dispatch an event so other tabs/components can re-render if needed
    window.dispatchEvent(new Event('siteSettingsChanged'));
  },

  getZaloSettings(): ZaloSettings {
    return this.getSettings().zalo;
  },

  updateZaloSettings(zaloSettings: ZaloSettings): void {
    const settings = this.getSettings();
    settings.zalo = zaloSettings;
    this.saveSettings(settings);
  },

  getTelegramSettings(): TelegramSettings {
    return this.getSettings().telegram;
  },

  updateTelegramSettings(telegramSettings: TelegramSettings): void {
    const settings = this.getSettings();
    settings.telegram = telegramSettings;
    this.saveSettings(settings);
  },
};
