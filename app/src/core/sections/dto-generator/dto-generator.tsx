import { useMemo, useState } from 'react';

import { CodeEditor, CodeView, getCodeStats, getLanguageMeta } from '../../../ui/code';
import { Badge, Button, CopyButton, IconButton, Kbd, Segmented, Switch } from '../../../ui/components';
import { Icon, type IconName } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import { type HealthStatus } from '../../../ui/hooks';
import { countLines, downloadText, pluralize } from '../../../ui/utils';
import { type UiSettings } from '../../../ui/preferences';
import { CreateClassOrParameterService, GenerateDtoService, StringSearchService } from '../../services';
import { Class, TechnologyDict } from '../../models';
import { buildRuleMap, type RuleSet } from '../../rules/rule-set';

interface DtoGeneratorProps {
    nameDtoValue: string;
    setNameDtoValue: (value: string) => void;

    selectedTechnology: string;
    setSelectedTechnology: (value: string) => void;

    commentsEnabled: boolean;
    setCommentsEnabled: (value: boolean) => void;

    textAreaValue: string;
    setTextAreaValue: (value: string) => void;

    outputValue: string;
    setOutputValue: (value: string) => void;

    isNameExist: boolean;
    setIsNameExist: (value: boolean) => void;

    settings: UiSettings;
    onUpdateSettings: (patch: Partial<UiSettings>) => void;
    apiStatus: HealthStatus;
    onOpenHints: () => void;

    ruleSet: RuleSet | null;
    ruleSets: RuleSet[];
    selectedRuleSetId: string;
    defaultRuleSetId: string;
    onSelectRuleSet: (id: string) => void;
    onSetDefaultRuleSet: (id: string | null) => void;
    onOpenRuleSets: () => void;
}

const EXAMPLE = `заявка объект 1 Application
- ид заявки строка 1..* applicationId
- дата создания дата и время 1 createdAt
- сумма число 0..1 amount
- организация объект 0..1 Organization
- - наименование строка 1 name`;

const technologyOptions: { value: string; label: string; icon: IconName }[] = [
    { value: 'CSharp', label: 'C#', icon: 'hash' },
    { value: 'JavaScript', label: 'TypeScript', icon: 'braces' },
    { value: 'Grpc', label: 'gRPC', icon: 'layers' },
];

function DtoGenerator({
    nameDtoValue,
    setNameDtoValue,
    selectedTechnology,
    setSelectedTechnology,
    commentsEnabled,
    setCommentsEnabled,
    isNameExist,
    setIsNameExist,
    textAreaValue,
    setTextAreaValue,
    outputValue,
    setOutputValue,
    settings,
    onUpdateSettings,
    apiStatus,
    onOpenHints,
    ruleSet,
    ruleSets,
    selectedRuleSetId,
    defaultRuleSetId,
    onSelectRuleSet,
    onSetDefaultRuleSet,
    onOpenRuleSets,
}: DtoGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const ruleMap = useMemo(() => buildRuleMap(ruleSet), [ruleSet]);
    const language = getLanguageMeta(selectedTechnology);
    const stats = getCodeStats(outputValue);
    const inputLineCount = countLines(textAreaValue);
    const canGenerate = textAreaValue.trim() !== '' && !loading;
    const aiUnavailable = !isNameExist && apiStatus !== 'online';

    const handleSelectChange = (value: string) => {
        setSelectedTechnology(value);
        if (value !== 'CSharp') {
            setCommentsEnabled(false);
        }
    };

    const handleLoadExample = () => {
        setTextAreaValue(EXAMPLE);
        setOutputValue('');
        toast.push({
            kind: 'info',
            title: 'Пример загружен',
            message: 'Нажмите «Сгенерировать», чтобы получить DTO.',
        });
    };

    const handleClear = () => {
        setTextAreaValue('');
        setOutputValue('');
    };

    const handleDownload = () => {
        if (!outputValue) return;
        const baseName = (nameDtoValue.trim() || 'dto')
            .replace(/[^\p{L}\p{N}_.-]+/gu, '')
            .replace(/^[.-]+/, '');
        downloadText(`${baseName || 'dto'}.${language.extension}`, outputValue);
        toast.push({
            kind: 'success',
            title: 'Файл сохранён',
            message: `${baseName || 'dto'}.${language.extension}`,
        });
    };

    const handleProcessClick = async () => {
        if (!canGenerate) return;
        setLoading(true);

        try {
            let lines = textAreaValue
                .split('\n')
                .filter(line => {
                    return (
                        line !== '' &&
                        !/сортировка|навигация/i.test(line)
                    );
                });

            for (let i = 0; i < lines.length; i++) {
                let parts = lines[i].split(/\s+/).filter(part => part !== '');
                let validResult = StringSearchService.validParts(parts);
                if (!validResult.isLineValid) {
                    if (validResult.isNameValid && !validResult.isTypeValid && !validResult.isMultiplicityValid) {
                        for (let searchIndex = i + 1; searchIndex < lines.length; searchIndex++) {
                            const searchLine = lines[searchIndex];
                            const searchParts = searchLine.split(/\s+/).filter(part => part !== '');
                            const searchValidResult = StringSearchService.validParts(searchParts);
                            if (!searchValidResult.isNameValid && searchValidResult.isTypeValid && searchValidResult.isMultiplicityValid) {
                                lines[i] = lines[i].concat(' ', searchLine);
                                lines.splice(searchIndex, 1);
                                parts = lines[i].split(/\s+/).filter(part => part !== '');
                                validResult = StringSearchService.validParts(parts);
                            }
                        }
                    } else if (validResult.isNameValid && validResult.isTypeValid && !validResult.isMultiplicityValid) {
                        for (let searchIndex = i + 1; searchIndex < lines.length; searchIndex++) {
                            const searchLine = lines[searchIndex];
                            const searchParts = searchLine.split(/\s+/).filter(part => part !== '');
                            const searchValidResult = StringSearchService.validParts(searchParts);
                            if (!searchValidResult.isNameValid && !searchValidResult.isTypeValid && searchValidResult.isMultiplicityValid) {
                                lines[i] = lines[i].concat(' ', searchLine);
                                lines.splice(searchIndex, 1);
                                parts = lines[i].split(/\s+/).filter(part => part !== '');
                                validResult = StringSearchService.validParts(parts);
                            }
                        }
                    }

                    if (!validResult.isLineValid) {
                        lines.splice(i, 1);
                    }
                }
            }

            let parentClass: Class | null = null;
            let currentClass: Class | null = null;
            const stack: Class[] = [];
            let rootClassCreated = false;

            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const isObject = RegExp('объект').test(line);
                const isEnum = RegExp('перечисление').test(line);
                const level = parts.filter(part => part === '-').length;
                currentClass = getCurrentClass(stack, level);

                if (isObject && currentClass && currentClass.level < level) {
                    parentClass = currentClass;
                }

                if (!isObject && !rootClassCreated) {
                    currentClass = await CreateClassOrParameterService.createDefaultClass(nameDtoValue, ruleMap);
                    stack.push(currentClass);
                    rootClassCreated = true;
                }

                if (isObject) {
                    currentClass = await CreateClassOrParameterService.createClass(parts, level, isNameExist, ruleMap);
                    stack.push(currentClass);
                    if (parentClass) {
                        parentClass.addObject(currentClass);
                    }
                    rootClassCreated = true;
                } else if (isEnum) {
                    await currentClass.addEnum(parts, isNameExist, ruleMap);
                } else {
                    await currentClass.addParameter(parts, isNameExist, ruleMap);
                }

                parentClass = null;
            }

            const result = await GenerateDtoService.generateAllDto(
                stack,
                TechnologyDict[selectedTechnology],
                commentsEnabled,
            );
            setOutputValue(result);

            if (!result.trim()) {
                toast.push({
                    kind: 'info',
                    title: 'Код не сформирован',
                    message: 'Проверьте описание структуры — возможно, ни одна строка не распознана.',
                });
            }
        } catch (error) {
            console.error('Ошибка при генерации DTO:', error);
            toast.push({
                kind: 'error',
                title: 'Не удалось сгенерировать DTO',
                message: error instanceof Error
                    ? error.message
                    : 'Проверьте подключение к переводчику и корректность структуры.',
            });
        } finally {
            setLoading(false);
        }
    };

    function getCurrentClass(classStack: Class[], level: number): Class {
        const i = level !== 0
            ? findLastIndex(classStack, c => c.level === level - 1)
            : 0;
        return classStack[i] || null;
    }

    function findLastIndex<T>(
        array: T[],
        predicate: (value: T, index: number, obj: T[]) => boolean,
    ): number {
        const reversedIndex = [...array].reverse().findIndex(predicate);
        if (reversedIndex === -1) {
            return -1;
        }
        return array.length - 1 - reversedIndex;
    }

    return (
        <div className="ed-generator">
            <section className="ed-config" aria-label="Параметры генерации">
                <div className="ed-config-group">
                    <div className="ed-field-head">
                        <span className="ed-label">Имя DTO</span>
                        <span className="ed-field-hint">для корневого класса</span>
                    </div>
                    <div className="ed-input-wrap">
                        <span className="ed-input-icon">
                            <Icon name="box" size={16} />
                        </span>
                        <input
                            className="ed-input ed-input--with-icon"
                            type="text"
                            value={nameDtoValue}
                            onChange={event => setNameDtoValue(event.target.value)}
                            placeholder="Например, OrderDto"
                            autoComplete="off"
                            spellCheck={false}
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
                        label="Технология генерации"
                    />
                </div>

                <div className="ed-config-switches">
                    <Switch
                        checked={commentsEnabled}
                        onChange={setCommentsEnabled}
                        label="Комментарии"
                        description="XML-доки в C#"
                        disabled={selectedTechnology !== 'CSharp'}
                    />
                    <Switch
                        checked={isNameExist}
                        onChange={setIsNameExist}
                        label="Готовые названия"
                        description="Имя из строки ввода"
                    />
                </div>
            </section>

            <section className="ed-rules-bar" aria-label="Набор правил">
                <div className="ed-rules-bar-info">
                    <span className="ed-rules-bar-icon">
                        <Icon name="layers" size={16} />
                    </span>
                    <div className="ed-rules-bar-copy">
                        <span className="ed-rules-bar-title">Правила из набора</span>
                        <span className="ed-rules-bar-subtitle">
                            {ruleSet
                                ? `${ruleSet.name} · ${ruleSet.rules.length} ${pluralize(ruleSet.rules.length, 'правило', 'правила', 'правил')}`
                                : ruleSets.length > 0
                                    ? 'Не выбран — имена будут переводиться ИИ'
                                    : 'Наборов пока нет — можно создать во вкладке «Наборы правил»'}
                        </span>
                    </div>
                </div>
                <div className="ed-rules-bar-actions">
                    <div className="ed-select-wrap">
                        <select
                            className="ed-select"
                            value={selectedRuleSetId}
                            aria-label="Выбрать набор правил"
                            onChange={event => onSelectRuleSet(event.target.value)}
                        >
                            <option value="">Не выбрано</option>
                            {ruleSets.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                        <Icon name="chevronDown" size={14} className="ed-select-chevron" />
                    </div>
                    <IconButton
                        icon="star"
                        label={selectedRuleSetId !== '' && selectedRuleSetId === defaultRuleSetId
                            ? 'Набор по умолчанию'
                            : 'Сделать набором по умолчанию'}
                        active={selectedRuleSetId !== '' && selectedRuleSetId === defaultRuleSetId}
                        disabled={selectedRuleSetId === ''}
                        onClick={() => onSetDefaultRuleSet(selectedRuleSetId)}
                    />
                    {ruleSet && (
                        <Badge tone="accent">{ruleSet.rules.length}</Badge>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        icon={ruleSets.length > 0 ? 'arrowRight' : 'plus'}
                        onClick={onOpenRuleSets}
                    >
                        {ruleSets.length > 0 ? 'Управлять' : 'Создать набор'}
                    </Button>
                </div>
            </section>

            <div className="ed-workbench">
                <section className="ed-panel" aria-label="Описание структуры">
                    <header className="ed-panel-head">
                        <div className="ed-panel-heading">
                            <span className="ed-panel-icon">
                                <Icon name="terminal" size={15} />
                            </span>
                            <div className="ed-panel-title-wrap">
                                <span className="ed-panel-title">Структура</span>
                                <span className="ed-panel-subtitle">
                                    {inputLineCount > 0
                                        ? `${inputLineCount} ${pluralize(inputLineCount, 'строка', 'строки', 'строк')} описания`
                                        : 'Поля, объекты и перечисления'}
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
                                label="Очистить структуру"
                                onClick={handleClear}
                                disabled={!textAreaValue || loading}
                            />
                        </div>
                    </header>

                    <div className="ed-panel-body" aria-busy={loading}>
                        <CodeEditor
                            value={textAreaValue}
                            onChange={setTextAreaValue}
                            placeholder={`Например:\nзаявка объект 1 Application\n- ид заявки строка 1..* applicationId\n- дата создания дата и время 1 createdAt\n- сумма число 0..1 amount\n- организация объект 0..1 Organization\n- - наименование строка 1 name`}
                            onRun={() => void handleProcessClick()}
                            showLineNumbers={settings.lineNumbers}
                            ariaLabel="Описание структуры DTO"
                        />
                        {loading && (
                            <div className="ed-panel-overlay">
                                <span className="ed-spinner" />
                                <span>Генерируем код…</span>
                            </div>
                        )}
                    </div>

                    <footer className="ed-panel-foot">
                        <span>Формат:</span>
                        <code>описание тип 0..1 [имя]</code>
                        <button type="button" className="ed-link-btn ed-foot-spacer" onClick={onOpenHints}>
                            Синтаксис
                        </button>
                    </footer>
                </section>

                <section className="ed-panel" aria-label="Результат генерации">
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
                                        <Icon name="fileCode" size={24} />
                                    </span>
                                    <h3>Здесь появится код</h3>
                                    <p>
                                        Опишите структуру слева, выберите технологию
                                        и нажмите «Сгенерировать».
                                    </p>
                                    <Kbd>Ctrl + Enter</Kbd>
                                </div>
                            )}
                        />
                        {loading && (
                            <div className="ed-panel-overlay">
                                <span className="ed-spinner" />
                                <span>Генерируем код…</span>
                            </div>
                        )}
                    </div>

                    <footer className="ed-panel-foot">
                        <span>UTF-8</span>
                        <span className="ed-stat-dot" />
                        <span>LF</span>
                        {stats.classes > 0 && (
                            <>
                                <span className="ed-stat-dot" />
                                <span>
                                    {stats.classes} {pluralize(stats.classes, 'класс', 'класса', 'классов')}
                                </span>
                            </>
                        )}
                        <span className="ed-foot-spacer" />
                        <span>{stats.lines > 0 ? `${stats.lines} ${pluralize(stats.lines, 'строка', 'строки', 'строк')}` : 'Пусто'}</span>
                    </footer>
                </section>
            </div>

            <div className="ed-actionbar">
                <div className="ed-action-stats">
                    <span>
                        <strong>{inputLineCount}</strong>{' '}
                        {pluralize(inputLineCount, 'строка', 'строки', 'строк')} на входе
                    </span>
                    <span className="ed-stat-dot" />
                    <span>{selectedTechnology === 'CSharp' ? 'C# · .NET' : selectedTechnology === 'JavaScript' ? 'TypeScript' : 'Protocol Buffers'}</span>
                    {aiUnavailable && (
                        <Badge tone="warning" icon="alert">
                            ИИ офлайн — имена не перевести
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
                        onClick={() => void handleProcessClick()}
                        className="ed-generate"
                    >
                        {loading ? 'Генерация…' : (
                            <>
                                Сгенерировать DTO
                                <Kbd>Ctrl ↵</Kbd>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DtoGenerator;
