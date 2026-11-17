import { useMemo, useState } from 'react';

import { CodeEditor, CodeView, getCodeStats, getLanguageMeta } from '../../../ui/code';
import { Badge, Button, CopyButton, IconButton, Kbd, Segmented, Switch } from '../../../ui/components';
import { Icon, type IconName } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import { type HealthStatus } from '../../../ui/hooks';
import { countLines, downloadText, pluralize } from '../../../ui/utils';
import { type UiSettings } from '../../../ui/preferences';
import { TechnologyDict } from '../../models';
import { buildRuleMap, normalizeRuleSource, type RuleSet } from '../../rules/rule-set';
import { EnumGeneratorService, EnumService } from '../../services';

interface EnumGeneratorProps {
    nameValue: string;
    setNameValue: (value: string) => void;

    selectedTechnology: string;
    setSelectedTechnology: (value: string) => void;

    commentsEnabled: boolean;
    setCommentsEnabled: (value: boolean) => void;

    textAreaValue: string;
    setTextAreaValue: (value: string) => void;

    outputValue: string;
    setOutputValue: (value: string) => void;

    settings: UiSettings;
    onUpdateSettings: (patch: Partial<UiSettings>) => void;
    apiStatus: HealthStatus;
    onOpenHints: () => void;
    ruleSet: RuleSet | null;
}

const EXAMPLE = `Статус заявки
0  Undefined  Не определен
1  Draft      Черновик
2  Sent       Отправлена

Тип оплаты
0  Undefined  Не определен
1  Card       Банковская карта
2  Cash       Наличные`;

const technologyOptions: { value: string; label: string; icon: IconName }[] = [
    { value: 'CSharp', label: 'C#', icon: 'hash' },
    { value: 'JavaScript', label: 'TypeScript', icon: 'braces' },
    { value: 'Grpc', label: 'gRPC', icon: 'layers' },
];

function EnumGenerator({
    nameValue,
    setNameValue,
    selectedTechnology,
    setSelectedTechnology,
    commentsEnabled,
    setCommentsEnabled,
    textAreaValue,
    setTextAreaValue,
    outputValue,
    setOutputValue,
    settings,
    onUpdateSettings,
    apiStatus,
    onOpenHints,
    ruleSet,
}: EnumGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const toast = useToast();

    const ruleMap = useMemo(() => buildRuleMap(ruleSet), [ruleSet]);
    const language = getLanguageMeta(selectedTechnology);
    const stats = getCodeStats(outputValue);
    const tables = useMemo(
        () => EnumGeneratorService.parseTables(textAreaValue),
        [textAreaValue],
    );
    const valueCount = useMemo(
        () => tables.reduce((total, table) => total + table.values.length, 0),
        [tables],
    );
    const enumCount = useMemo(
        () => outputValue.match(/^\s*(?:public\s+enum|export\s+enum|enum)\s+/gm)?.length ?? 0,
        [outputValue],
    );
    const inputLineCount = countLines(textAreaValue);
    const singleTable = tables.length === 1;
    const canGenerate = textAreaValue.trim() !== '' && tables.length > 0 && !loading;

    const needsAi = useMemo(() => {
        if (tables.length === 0) {
            return false;
        }

        const explicitName = nameValue.trim();
        return tables.some(table => {
            if (tables.length === 1 && explicitName !== '') {
                return false;
            }

            const comment = EnumService.getEnumComment(table.title);
            if (comment === '') {
                return false;
            }

            return !ruleMap?.get(normalizeRuleSource(comment));
        });
    }, [tables, nameValue, ruleMap]);

    const aiUnavailable = needsAi && apiStatus !== 'online';

    const handleSelectChange = (value: string) => {
        setSelectedTechnology(value);
        if (value !== 'CSharp') {
            setCommentsEnabled(false);
        }
    };

    const handleLoadExample = () => {
        setTextAreaValue(EXAMPLE);
        setOutputValue('');
        setWarnings([]);
        toast.push({
            kind: 'info',
            title: 'Пример загружен',
            message: 'Нажмите «Сгенерировать», чтобы получить перечисления.',
        });
    };

    const handleClear = () => {
        setTextAreaValue('');
        setOutputValue('');
        setWarnings([]);
    };

    const handleDownload = () => {
        if (!outputValue) return;

        const baseName = (nameValue.trim() || 'enums')
            .replace(/[^\p{L}\p{N}_.-]+/gu, '')
            .replace(/^[.-]+/, '');
        const fileName = `${baseName || 'enums'}.${language.extension}`;

        downloadText(fileName, outputValue);
        toast.push({
            kind: 'success',
            title: 'Файл сохранён',
            message: fileName,
        });
    };

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setLoading(true);

        try {
            const result = await EnumGeneratorService.generate(textAreaValue, {
                technology: TechnologyDict[selectedTechnology],
                needComments: commentsEnabled,
                explicitName: nameValue,
                rules: ruleMap,
            });

            setOutputValue(result.code);
            setWarnings(result.warnings);

            if (!result.code.trim()) {
                toast.push({
                    kind: 'info',
                    title: 'Код не сформирован',
                    message: 'Проверьте таблицы перечислений.',
                });
                return;
            }

            toast.push({
                kind: 'success',
                title: 'Перечисления сгенерированы',
                message: `${result.enums.length} ${pluralize(
                    result.enums.length,
                    'перечисление',
                    'перечисления',
                    'перечислений',
                )}`,
            });
        } catch (error) {
            console.error('Ошибка при генерации перечислений:', error);
            toast.push({
                kind: 'error',
                title: 'Не удалось сгенерировать перечисления',
                message: error instanceof Error
                    ? error.message
                    : 'Проверьте подключение к переводчику и корректность таблиц.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ed-generator">
            <section className="ed-config" aria-label="Параметры генерации перечислений">
                <div className="ed-config-group">
                    <div className="ed-field-head">
                        <span className="ed-label">Имя перечисления</span>
                        <span className="ed-field-hint">
                            {singleTable ? 'для одной таблицы' : 'только для одной таблицы'}
                        </span>
                    </div>
                    <div className="ed-input-wrap">
                        <span className="ed-input-icon">
                            <Icon name="braces" size={16} />
                        </span>
                        <input
                            className="ed-input ed-input--with-icon"
                            type="text"
                            value={nameValue}
                            onChange={event => setNameValue(event.target.value)}
                            placeholder="Например, ApplicationStatus"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={tables.length > 1}
                        />
                    </div>
                </div>

                <div className="ed-config-group ed-config-tech">
                    <div className="ed-field-head">
                        <span className="ed-label">Технология</span>
                    </div>
                    <Segmented
                        value={selectedTechnology}
                        onChange={handleSelectChange}
                        options={technologyOptions}
                        label="Технология генерации перечислений"
                    />
                </div>

                <div className="ed-config-switches">
                    <Switch
                        checked={commentsEnabled}
                        onChange={setCommentsEnabled}
                        label="Комментарии"
                        description="Описания значений в C#"
                        disabled={selectedTechnology !== 'CSharp'}
                    />
                </div>
            </section>

            {warnings.length > 0 && (
                <div className="ed-notice ed-notice--warning" role="status">
                    <Icon name="alert" size={16} />
                    <span>{warnings.join(' ')}</span>
                </div>
            )}

            <div className="ed-workbench">
                <section className="ed-panel" aria-label="Таблицы перечислений">
                    <header className="ed-panel-head">
                        <div className="ed-panel-heading">
                            <span className="ed-panel-icon">
                                <Icon name="braces" size={15} />
                            </span>
                            <div className="ed-panel-title-wrap">
                                <span className="ed-panel-title">Таблицы перечислений</span>
                                <span className="ed-panel-subtitle">
                                    {tables.length > 0
                                        ? `${tables.length} ${pluralize(tables.length, 'таблица', 'таблицы', 'таблиц')} · ${valueCount} ${pluralize(valueCount, 'значение', 'значения', 'значений')}`
                                        : 'Заголовок и строки «номер  Имя  Описание»'}
                                </span>
                            </div>
                        </div>
                        <div className="ed-panel-actions">
                            <IconButton
                                icon="wand"
                                label="Загрузить пример"
                                onClick={handleLoadExample}
                                disabled={loading}
                            />
                            <IconButton
                                icon="trash"
                                label="Очистить таблицы"
                                onClick={handleClear}
                                disabled={!textAreaValue || loading}
                            />
                        </div>
                    </header>

                    <div className="ed-panel-body" aria-busy={loading}>
                        <CodeEditor
                            value={textAreaValue}
                            onChange={setTextAreaValue}
                            placeholder={`Например:\nСтатус заявки\n0  Undefined  Не определен\n1  Draft      Черновик\n2  Sent       Отправлена`}
                            onRun={() => void handleGenerate()}
                            showLineNumbers={settings.lineNumbers}
                            ariaLabel="Таблицы перечислений"
                        />
                        {loading && (
                            <div className="ed-panel-overlay">
                                <span className="ed-spinner" />
                                <span>Генерируем перечисления…</span>
                            </div>
                        )}
                    </div>

                    <footer className="ed-panel-foot">
                        <span>Формат:</span>
                        <code>номер  Имя  Описание</code>
                        <span className="ed-foot-spacer" />
                        <span>
                            {inputLineCount > 0
                                ? `${inputLineCount} ${pluralize(inputLineCount, 'строка', 'строки', 'строк')}`
                                : 'Пусто'}
                        </span>
                        <button type="button" className="ed-link-btn" onClick={onOpenHints}>
                            Подсказки
                        </button>
                    </footer>
                </section>

                <section className="ed-panel" aria-label="Результат генерации перечислений">
                    <header className="ed-panel-head">
                        <div className="ed-panel-heading">
                            <span className="ed-panel-icon">
                                <Icon name="fileCode" size={15} />
                            </span>
                            <div className="ed-panel-title-wrap">
                                <span className="ed-panel-title">Результат</span>
                                <span className="ed-panel-subtitle">
                                    {outputValue
                                        ? `${language.label} · ${stats.sizeLabel}`
                                        : 'Готовый код появится здесь'}
                                </span>
                            </div>
                        </div>
                        <div className="ed-panel-actions">
                            <Badge tone={outputValue ? 'accent' : 'neutral'}>{language.label}</Badge>
                            <CopyButton
                                value={outputValue}
                                label="Копировать"
                                size="sm"
                                variant="ghost"
                            />
                            <IconButton
                                icon="download"
                                label="Скачать файл"
                                onClick={handleDownload}
                                disabled={!outputValue}
                            />
                            <IconButton
                                icon="wrapText"
                                label={settings.wordWrap ? 'Отключить перенос строк' : 'Включить перенос строк'}
                                active={settings.wordWrap}
                                onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })}
                            />
                        </div>
                    </header>

                    <div className="ed-panel-body" aria-busy={loading}>
                        <CodeView
                            code={outputValue}
                            showLineNumbers={settings.lineNumbers}
                            wrap={settings.wordWrap}
                            emptyState={(
                                <div className="ed-empty">
                                    <span className="ed-empty-icon">
                                        <Icon name="braces" size={24} />
                                    </span>
                                    <h3>Здесь появятся перечисления</h3>
                                    <p>
                                        Вставьте таблицы значений слева, выберите технологию
                                        и нажмите «Сгенерировать».
                                    </p>
                                    <Kbd>Ctrl + Enter</Kbd>
                                </div>
                            )}
                        />
                        {loading && (
                            <div className="ed-panel-overlay">
                                <span className="ed-spinner" />
                                <span>Генерируем перечисления…</span>
                            </div>
                        )}
                    </div>

                    <footer className="ed-panel-foot">
                        <span>UTF-8</span>
                        <span className="ed-stat-dot" />
                        <span>LF</span>
                        {enumCount > 0 && (
                            <>
                                <span className="ed-stat-dot" />
                                <span>
                                    {enumCount} {pluralize(enumCount, 'перечисление', 'перечисления', 'перечислений')}
                                </span>
                            </>
                        )}
                        <span className="ed-foot-spacer" />
                        <span>
                            {stats.lines > 0
                                ? `${stats.lines} ${pluralize(stats.lines, 'строка', 'строки', 'строк')}`
                                : 'Пусто'}
                        </span>
                    </footer>
                </section>
            </div>

            <div className="ed-actionbar">
                <div className="ed-action-stats">
                    <span>
                        <strong>{tables.length}</strong>{' '}
                        {pluralize(tables.length, 'таблица', 'таблицы', 'таблиц')}
                    </span>
                    <span className="ed-stat-dot" />
                    <span>
                        <strong>{valueCount}</strong>{' '}
                        {pluralize(valueCount, 'значение', 'значения', 'значений')}
                    </span>
                    <span className="ed-stat-dot" />
                    <span>
                        {selectedTechnology === 'CSharp'
                            ? 'C# · .NET'
                            : selectedTechnology === 'JavaScript'
                                ? 'TypeScript'
                                : 'Protocol Buffers'}
                    </span>
                    {ruleSet && (
                        <Badge tone="accent" icon="layers">{ruleSet.name}</Badge>
                    )}
                    {aiUnavailable && (
                        <Badge tone="warning" icon="alert">
                            ИИ офлайн — имена из заголовков не перевести
                        </Badge>
                    )}
                </div>

                <div className="ed-action-right">
                    {outputValue && (
                        <Button variant="ghost" icon="download" onClick={handleDownload}>
                            Скачать
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        size="lg"
                        icon="sparkles"
                        loading={loading}
                        disabled={!canGenerate}
                        onClick={() => void handleGenerate()}
                        className="ed-generate"
                    >
                        {loading ? 'Генерация…' : (
                            <>
                                Сгенерировать
                                <Kbd>Ctrl ↵</Kbd>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default EnumGenerator;
