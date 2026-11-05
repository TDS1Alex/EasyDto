export type ThemeMode = 'light' | 'dark' | 'system';
export type Accent = 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose';
export type Density = 'comfortable' | 'compact';

export interface UiSettings {
    theme: ThemeMode;
    accent: Accent;
    density: Density;
    fontSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
}

export const defaultSettings: UiSettings = {
    theme: 'dark',
    accent: 'indigo',
    density: 'comfortable',
    fontSize: 13,
    wordWrap: true,
    lineNumbers: true,
};

export const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
    { value: 'system', label: 'Системная' },
];

export const accentOptions: { value: Accent; label: string; color: string; color2: string }[] = [
    { value: 'indigo', label: 'Индиго', color: '#6366f1', color2: '#8b5cf6' },
    { value: 'violet', label: 'Фиолетовый', color: '#a855f7', color2: '#d946ef' },
    { value: 'emerald', label: 'Изумруд', color: '#10b981', color2: '#14b8a6' },
    { value: 'amber', label: 'Янтарь', color: '#f59e0b', color2: '#f97316' },
    { value: 'rose', label: 'Роза', color: '#f43f5e', color2: '#ec4899' },
];
