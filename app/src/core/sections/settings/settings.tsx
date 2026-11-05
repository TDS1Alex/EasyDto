import { Button, Segmented, Switch } from '../../../ui/components';
import { Icon, type IconName } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import type { ApiHealth } from '../../../ui/hooks';
import {
    accentOptions,
    themeOptions,
    type Density,
    type ThemeMode,
    type UiSettings,
} from '../../../ui/preferences';
import { AiService } from '../../services';

interface SettingsProps {
    settings: UiSettings;
    onUpdate: (patch: Partial<UiSettings>) => void;
    onReset: () => void;
    apiHealth: ApiHealth;
}

const themeIcons: Record<ThemeMode, IconName> = {
    light: 'sun',
    dark: 'moon',
    system: 'monitor',
};

function Settings({ settings, onUpdate, onReset, apiHealth }: SettingsProps) {
    const toast = useToast();

    const handleReset = () => {
        onReset();
        toast.push({
            kind: 'info',
            title: 'Настройки сброшены',
            message: 'Тема, акцент и параметры редактора вернулись к значениям по умолчанию.',
        });
    };

    const statusLabel = apiHealth.status === 'online'
        ? 'Подключён'
        : apiHealth.status === 'offline'
            ? 'Недоступен'
            : 'Проверка…';

    return (
        <div className="ed-settings">
            <div className="ed-settings-grid">
                <section className="ed-settings-card ed-settings-card--wide">
                    <div className="ed-settings-head">
                        <span className="ed-settings-icon">
                            <Icon name="palette" size={16} />
                        </span>
                        <div>
                            <h2 className="ed-settings-title">Внешний вид</h2>
                            <p className="ed-settings-desc">Тема, акцент и плотность интерфейса</p>
                        </div>
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Тема</div>
                            <div className="ed-setting-hint">Светлая, тёмная или как в системе</div>
                        </div>
                        <div className="ed-theme-options">
                            {themeOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`ed-theme-option${settings.theme === option.value ? ' is-active' : ''}`}
                                    aria-pressed={settings.theme === option.value}
                                    onClick={() => onUpdate({ theme: option.value })}
                                >
                                    <span className={`ed-theme-preview is-${option.value}`} />
                                    <span>
                                        <Icon name={themeIcons[option.value]} size={12} /> {option.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Акцент</div>
                            <div className="ed-setting-hint">Цвет кнопок, ссылок и активных элементов</div>
                        </div>
                        <div className="ed-swatches" role="group" aria-label="Акцентный цвет">
                            {accentOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`ed-swatch${settings.accent === option.value ? ' is-active' : ''}`}
                                    aria-label={option.label}
                                    aria-pressed={settings.accent === option.value}
                                    title={option.label}
                                    style={{ background: `linear-gradient(135deg, ${option.color}, ${option.color2})` }}
                                    onClick={() => onUpdate({ accent: option.value })}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Плотность</div>
                            <div className="ed-setting-hint">Больше воздуха или больше контента на экране</div>
                        </div>
                        <Segmented<Density>
                            value={settings.density}
                            onChange={value => onUpdate({ density: value })}
                            options={[
                                { value: 'comfortable', label: 'Комфортная', icon: 'panelLeft' },
                                { value: 'compact', label: 'Компактная', icon: 'sliders' },
                            ]}
                            label="Плотность интерфейса"
                        />
                    </div>
                </section>

                <section className="ed-settings-card">
                    <div className="ed-settings-head">
                        <span className="ed-settings-icon">
                            <Icon name="code" size={16} />
                        </span>
                        <div>
                            <h2 className="ed-settings-title">Редактор кода</h2>
                            <p className="ed-settings-desc">Отображение структуры и результата</p>
                        </div>
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Размер шрифта</div>
                            <div className="ed-setting-hint">Для редактора и просмотра кода</div>
                        </div>
                        <div className="ed-setting-control">
                            <input
                                className="ed-range"
                                type="range"
                                min={11}
                                max={18}
                                step={1}
                                value={settings.fontSize}
                                aria-label="Размер шрифта кода"
                                onChange={event => onUpdate({ fontSize: Number(event.target.value) })}
                            />
                            <span className="ed-range-value">{settings.fontSize} px</span>
                        </div>
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Номера строк</div>
                            <div className="ed-setting-hint">Показывать нумерацию в редакторах</div>
                        </div>
                        <Switch
                            checked={settings.lineNumbers}
                            onChange={value => onUpdate({ lineNumbers: value })}
                            label=""
                            ariaLabel="Показывать номера строк"
                        />
                    </div>

                    <div className="ed-setting-row">
                        <div className="ed-setting-info">
                            <div className="ed-setting-name">Перенос строк</div>
                            <div className="ed-setting-hint">Переносить длинные строки результата</div>
                        </div>
                        <Switch
                            checked={settings.wordWrap}
                            onChange={value => onUpdate({ wordWrap: value })}
                            label=""
                            ariaLabel="Переносить длинные строки"
                        />
                    </div>
                </section>

                <section className="ed-settings-card">
                    <div className="ed-settings-head">
                        <span className="ed-settings-icon">
                            <Icon name="database" size={16} />
                        </span>
                        <div>
                            <h2 className="ed-settings-title">Подключение</h2>
                            <p className="ed-settings-desc">Локальный Python-переводчик</p>
                        </div>
                    </div>

                    <div className="ed-api-box">
                        <div className="ed-api-row">
                            <span className="ed-api-label">
                                <Icon name="terminal" size={14} />
                                Endpoint
                            </span>
                            <code className="ed-api-value">{AiService.path}</code>
                        </div>
                        <div className="ed-api-row">
                            <span className="ed-api-label">
                                <Icon name="database" size={14} />
                                Статус
                            </span>
                            <span className={`ed-api-status is-${apiHealth.status}`}>
                                <span className="ed-service-dot" />
                                {statusLabel}
                            </span>
                        </div>
                        <div className="ed-api-row">
                            <span className="ed-api-label">
                                <Icon name="clock" size={14} />
                                Проверка
                            </span>
                            <span className="ed-api-value">
                                {apiHealth.lastChecked
                                    ? apiHealth.lastChecked.toLocaleTimeString('ru-RU')
                                    : 'ещё не проверялась'}
                            </span>
                        </div>
                    </div>

                    <div className="ed-setting-row" style={{ marginTop: 4 }}>
                        <div className="ed-setting-info">
                            <div className="ed-setting-hint">
                                Переводчиком управляет WPF-приложение. Если сервис не отвечает,
                                проверьте окно приложения и зависимости Python.
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            icon="refresh"
                            loading={apiHealth.status === 'checking'}
                            onClick={() => void apiHealth.check(true)}
                        >
                            Проверить
                        </Button>
                    </div>
                </section>
            </div>

            <div className="ed-settings-footer">
                <span>
                    <Icon name="info" size={12} /> Настройки сохраняются локально в этом приложении.
                </span>
                <Button variant="danger" icon="refresh" onClick={handleReset}>
                    Сбросить настройки
                </Button>
            </div>
        </div>
    );
}

export default Settings;
