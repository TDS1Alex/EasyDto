import { useCallback, useEffect, useMemo, useState } from 'react';

import { DtoGenerator, Hints, Settings, TrainAi } from '../core/sections';
import { Icon, type IconName } from '../ui/icons';
import { ToastProvider } from '../ui/toast';
import { useApiHealth, usePersistentState } from '../ui/hooks';
import { defaultSettings, type UiSettings } from '../ui/preferences';
import { cx } from '../ui/utils';
import './app.css';

type SectionId = 'dto-generator' | 'train-ai' | 'hints' | 'settings';

interface SectionMeta {
    id: SectionId;
    label: string;
    title: string;
    subtitle: string;
    eyebrow: string;
    icon: IconName;
    shortcut: string;
}

const sections: SectionMeta[] = [
    {
        id: 'dto-generator',
        label: 'Генератор DTO',
        title: 'Генератор DTO',
        subtitle: 'Опишите структуру — получите готовый класс на C#, TypeScript или gRPC.',
        eyebrow: 'Рабочее пространство',
        icon: 'sparkles',
        shortcut: '1',
    },
    {
        id: 'train-ai',
        label: 'Обучение ИИ',
        title: 'Обучение ИИ',
        subtitle: 'Добавьте примеры переводов, чтобы переводчик лучше понимал предметную область.',
        eyebrow: 'ИИ-переводчик',
        icon: 'brain',
        shortcut: '2',
    },
    {
        id: 'hints',
        label: 'Подсказки',
        title: 'Подсказки и синтаксис',
        subtitle: 'Короткий справочник по описанию структуры и работе с переводчиком.',
        eyebrow: 'База знаний',
        icon: 'book',
        shortcut: '3',
    },
    {
        id: 'settings',
        label: 'Настройки',
        title: 'Настройки',
        subtitle: 'Оформление, редактор кода и состояние подключения к переводчику.',
        eyebrow: 'Персонализация',
        icon: 'sliders',
        shortcut: '4',
    },
];

function useSystemDark(): boolean {
    const [isDark, setIsDark] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches,
    );

    useEffect(() => {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (event: MediaQueryListEvent) => setIsDark(event.matches);
        query.addEventListener('change', listener);
        return () => query.removeEventListener('change', listener);
    }, []);

    return isDark;
}

function AppShell() {
    const [activeSection, setActiveSection] = usePersistentState<SectionId>(
        'easydto.section',
        'dto-generator',
    );
    const [settings, setSettings] = usePersistentState<UiSettings>(
        'easydto.ui.settings',
        defaultSettings,
    );

    // Черновики рабочего пространства
    const [nameDtoValue, setNameDtoValue] = usePersistentState('easydto.dto.name', '');
    const [selectedTechnology, setSelectedTechnology] = usePersistentState('easydto.dto.technology', 'CSharp');
    const [commentsEnabled, setCommentsEnabled] = usePersistentState('easydto.dto.comments', false);
    const [isNameExist, setIsNameExist] = usePersistentState('easydto.dto.readyNames', true);
    const [textAreaDtoGeneratorValue, setTextAreaDtoGeneratorValue] = usePersistentState('easydto.dto.input', '');
    const [outputValue, setOutputValue] = usePersistentState('easydto.dto.output', '');
    const [textAreaTrainAiValue, setTextAreaTrainAiValue] = usePersistentState('easydto.train.input', '');

    const systemDark = useSystemDark();
    const resolvedTheme = settings.theme === 'system'
        ? (systemDark ? 'dark' : 'light')
        : settings.theme;

    const apiHealth = useApiHealth();
    const activeMeta = useMemo(
        () => sections.find(section => section.id === activeSection) ?? sections[0],
        [activeSection],
    );

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = resolvedTheme;
        root.style.colorScheme = resolvedTheme;
    }, [resolvedTheme]);

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.accent = settings.accent;
        root.dataset.density = settings.density;
        root.style.setProperty('--code-font-size', `${settings.fontSize}px`);
    }, [settings.accent, settings.density, settings.fontSize]);

    useEffect(() => {
        document.title = `${activeMeta.title} — EasyDTO`;
    }, [activeMeta.title]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
            const section = sections.find(item => item.shortcut === event.key);
            if (section) {
                event.preventDefault();
                setActiveSection(section.id);
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [setActiveSection]);

    const updateSettings = useCallback((patch: Partial<UiSettings>) => {
        setSettings(current => ({ ...current, ...patch }));
    }, [setSettings]);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, [setSettings]);

    const toggleTheme = () => {
        updateSettings({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' });
    };

    const themeLabel = resolvedTheme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';

    return (
        <div className="ed-app">
            <aside className="ed-sidebar">
                <div className="ed-brand">
                    <span className="ed-logo" aria-hidden="true">
                        <Icon name="braces" size={21} />
                    </span>
                    <span className="ed-brand-copy">
                        <span className="ed-brand-name">
                            EasyDTO
                            <span className="ed-brand-tag">Studio</span>
                        </span>
                        <span className="ed-brand-subtitle">DTO toolkit for developers</span>
                    </span>
                </div>

                <nav className="ed-nav" aria-label="Разделы приложения">
                    <span className="ed-nav-title">Инструменты</span>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            type="button"
                            className={cx('ed-nav-item', activeSection === section.id && 'is-active')}
                            aria-current={activeSection === section.id ? 'page' : undefined}
                            onClick={() => setActiveSection(section.id)}
                            title={`${section.label} (Ctrl+${section.shortcut})`}
                        >
                            <span className="ed-nav-icon">
                                <Icon name={section.icon} size={18} />
                            </span>
                            <span className="ed-nav-label">{section.label}</span>
                            <span className="ed-nav-shortcut">Ctrl {section.shortcut}</span>
                        </button>
                    ))}
                </nav>

                <div className="ed-sidebar-bottom">
                    <button
                        type="button"
                        className={cx('ed-service', `is-${apiHealth.status}`)}
                        onClick={() => void apiHealth.check(true)}
                        title="Проверить подключение к Python API"
                    >
                        <span className="ed-service-dot" />
                        <span className="ed-service-copy">
                            <strong>Python API</strong>
                            <span>
                                {apiHealth.status === 'online' && 'Подключён'}
                                {apiHealth.status === 'offline' && 'Недоступен'}
                                {apiHealth.status === 'checking' && 'Проверка…'}
                            </span>
                        </span>
                        <Icon
                            name="refresh"
                            size={14}
                            className={apiHealth.status === 'checking' ? 'ed-spin' : undefined}
                        />
                    </button>
                    <span className="ed-sidebar-version">EasyDTO Desktop · v1.0</span>
                </div>
            </aside>

            <main className="ed-main">
                <header className="ed-topbar">
                    <div className="ed-heading">
                        <span className="ed-eyebrow">{activeMeta.eyebrow}</span>
                        <h1 className="ed-title">{activeMeta.title}</h1>
                        <p className="ed-subtitle">{activeMeta.subtitle}</p>
                    </div>

                    <div className="ed-topbar-actions">
                        <button
                            type="button"
                            className={cx('ed-status-pill', `is-${apiHealth.status}`)}
                            onClick={() => void apiHealth.check(true)}
                            title={
                                apiHealth.lastChecked
                                    ? `Последняя проверка: ${apiHealth.lastChecked.toLocaleTimeString('ru-RU')}`
                                    : 'Проверить подключение'
                            }
                        >
                            <span className="ed-status-dot" />
                            <span className="ed-status-text">
                                {apiHealth.status === 'online' && 'Переводчик онлайн'}
                                {apiHealth.status === 'offline' && 'Переводчик офлайн'}
                                {apiHealth.status === 'checking' && 'Проверка связи'}
                            </span>
                        </button>
                        <button
                            type="button"
                            className="ed-theme-toggle"
                            onClick={toggleTheme}
                            aria-label={themeLabel}
                            title={themeLabel}
                        >
                            <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={18} />
                        </button>
                    </div>
                </header>

                <div className="ed-content">
                    <div className="ed-page" key={activeSection}>
                        {activeSection === 'dto-generator' && (
                            <DtoGenerator
                                nameDtoValue={nameDtoValue}
                                setNameDtoValue={setNameDtoValue}
                                selectedTechnology={selectedTechnology}
                                setSelectedTechnology={setSelectedTechnology}
                                commentsEnabled={commentsEnabled}
                                setCommentsEnabled={setCommentsEnabled}
                                isNameExist={isNameExist}
                                setIsNameExist={setIsNameExist}
                                textAreaValue={textAreaDtoGeneratorValue}
                                setTextAreaValue={setTextAreaDtoGeneratorValue}
                                outputValue={outputValue}
                                setOutputValue={setOutputValue}
                                settings={settings}
                                onUpdateSettings={updateSettings}
                                apiStatus={apiHealth.status}
                                onOpenHints={() => setActiveSection('hints')}
                            />
                        )}
                        {activeSection === 'train-ai' && (
                            <TrainAi
                                textAreaValue={textAreaTrainAiValue}
                                setTextAreaValue={setTextAreaTrainAiValue}
                                apiStatus={apiHealth.status}
                                onCheckApi={() => apiHealth.check(true)}
                            />
                        )}
                        {activeSection === 'hints' && (
                            <Hints onOpenGenerator={() => setActiveSection('dto-generator')} />
                        )}
                        {activeSection === 'settings' && (
                            <Settings
                                settings={settings}
                                onUpdate={updateSettings}
                                onReset={resetSettings}
                                apiHealth={apiHealth}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <AppShell />
        </ToastProvider>
    );
}

export default App;
