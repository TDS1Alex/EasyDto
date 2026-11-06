import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';

import { Badge, Button, IconButton } from '../../../ui/components';
import { Icon } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import { downloadJson, pluralize } from '../../../ui/utils';
import {
    cloneRuleSet,
    createRule,
    createRuleSet,
    isValidRuleTarget,
    normalizeRuleSource,
    parseRuleSetFile,
    ruleSetFileName,
    serializeRuleSet,
    uniqueRuleSetName,
    type RuleSet,
} from '../../rules/rule-set';

interface RuleSetsProps {
    ruleSets: RuleSet[];
    defaultRuleSetId: string;
    onCreate: (ruleSet: RuleSet) => void;
    onUpdate: (ruleSet: RuleSet) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string | null) => void;
    onImport: (ruleSet: RuleSet) => void;
}

interface RuleSetEditorProps {
    initial: RuleSet | null;
    onSave: (ruleSet: RuleSet) => void;
    onClose: () => void;
}

interface RuleError {
    source?: string;
    target?: string;
}

function RuleSetEditor({ initial, onSave, onClose }: RuleSetEditorProps) {
    const [draft, setDraft] = useState<RuleSet>(() =>
        initial ? cloneRuleSet(initial) : createRuleSet('', [createRule()]));
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const validation = useMemo(() => {
        const nameError = draft.name.trim() === ''
            ? 'Введите название набора.'
            : draft.name.trim().length > 80
                ? 'Название не должно быть длиннее 80 символов.'
                : '';

        const sourceCounts = new Map<string, number>();
        draft.rules.forEach(rule => {
            const normalized = normalizeRuleSource(rule.source);
            if (normalized !== '') {
                sourceCounts.set(normalized, (sourceCounts.get(normalized) ?? 0) + 1);
            }
        });

        const ruleErrors = new Map<string, RuleError>();
        draft.rules.forEach(rule => {
            const error: RuleError = {};

            if (rule.source.trim() === '') {
                error.source = 'Укажите описание.';
            } else if ((sourceCounts.get(normalizeRuleSource(rule.source)) ?? 0) > 1) {
                error.source = 'Такое описание уже есть.';
            }

            if (rule.target.trim() === '') {
                error.target = 'Укажите имя.';
            } else if (!isValidRuleTarget(rule.target)) {
                error.target = 'Латиница, цифры и _, начиная с буквы.';
            }

            if (error.source || error.target) {
                ruleErrors.set(rule.id, error);
            }
        });

        const rulesError = draft.rules.length === 0
            ? 'Добавьте хотя бы одно правило.'
            : '';

        return {
            nameError,
            rulesError,
            ruleErrors,
            valid: nameError === '' && rulesError === '' && ruleErrors.size === 0,
        };
    }, [draft]);

    const updateRule = (id: string, patch: Partial<{ source: string; target: string }>) => {
        setDraft(current => ({
            ...current,
            rules: current.rules.map(rule => rule.id === id ? { ...rule, ...patch } : rule),
        }));
    };

    const addRule = () => {
        setDraft(current => ({ ...current, rules: [...current.rules, createRule()] }));
    };

    const removeRule = (id: string) => {
        setDraft(current => ({
            ...current,
            rules: current.rules.filter(rule => rule.id !== id),
        }));
    };

    const handleSave = () => {
        if (!validation.valid) {
            setShowErrors(true);
            return;
        }

        onSave({
            ...draft,
            name: draft.name.trim(),
            rules: draft.rules.map(rule => ({
                ...rule,
                source: rule.source.trim(),
                target: rule.target.trim(),
            })),
            updatedAt: new Date().toISOString(),
        });
    };

    return (
        <div className="ed-modal-backdrop" role="presentation">
            <div
                className="ed-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rule-set-editor-title"
            >
                <header className="ed-modal-head">
                    <div>
                        <span className="ed-eyebrow">{initial ? 'Редактирование' : 'Новый набор'}</span>
                        <h2 className="ed-modal-title" id="rule-set-editor-title">
                            {initial ? 'Набор правил' : 'Создание набора'}
                        </h2>
                    </div>
                    <IconButton icon="x" label="Закрыть редактор" onClick={onClose} />
                </header>

                <div className="ed-modal-body">
                    <label className="ed-modal-field">
                        <span className="ed-label">Название набора</span>
                        <input
                            className="ed-input"
                            value={draft.name}
                            placeholder="Например, Даты и периоды"
                            autoFocus
                            maxLength={80}
                            onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
                        />
                        {showErrors && validation.nameError && <span className="ed-field-error">{validation.nameError}</span>}
                    </label>

                    <div className="ed-rule-editor-head">
                        <div>
                            <span className="ed-settings-title">Правила</span>
                            <p className="ed-settings-desc">
                                Описание в строке DTO → имя поля. Совпадение по полному описанию.
                            </p>
                        </div>
                        <Button size="sm" variant="ghost" icon="plus" onClick={addRule}>
                            Добавить правило
                        </Button>
                    </div>

                    <div className="ed-rule-editor">
                        <div className="ed-rule-editor-labels" aria-hidden="true">
                            <span />
                            <span>Описание</span>
                            <span />
                            <span>Имя</span>
                            <span />
                        </div>

                        {draft.rules.length === 0 && (
                            <div className="ed-rule-editor-empty">
                                Нет правил. Добавьте первую пару «описание → имя».
                            </div>
                        )}

                        {draft.rules.map((rule, index) => {
                            const error = validation.ruleErrors.get(rule.id);
                            return (
                                <div className="ed-rule-editor-row" key={rule.id}>
                                    <span className="ed-rule-editor-index">{index + 1}</span>
                                    <div className="ed-rule-editor-field">
                                        <input
                                            className={`ed-input${showErrors && error?.source ? ' is-invalid' : ''}`}
                                            value={rule.source}
                                            placeholder="дата начала"
                                            aria-label={`Описание правила ${index + 1}`}
                                            onChange={event => updateRule(rule.id, { source: event.target.value })}
                                        />
                                        {showErrors && error?.source && <span className="ed-field-error">{error.source}</span>}
                                    </div>
                                    <span className="ed-rule-editor-arrow">
                                        <Icon name="arrowRight" size={14} />
                                    </span>
                                    <div className="ed-rule-editor-field">
                                        <input
                                            className={`ed-input${showErrors && error?.target ? ' is-invalid' : ''}`}
                                            value={rule.target}
                                            placeholder="StartDate"
                                            aria-label={`Имя правила ${index + 1}`}
                                            onChange={event => updateRule(rule.id, { target: event.target.value })}
                                        />
                                        {showErrors && error?.target && <span className="ed-field-error">{error.target}</span>}
                                    </div>
                                    <IconButton
                                        icon="trash"
                                        label={`Удалить правило ${index + 1}`}
                                        tone="danger"
                                        onClick={() => removeRule(rule.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {showErrors && validation.rulesError && (
                        <div className="ed-notice ed-notice--warning">
                            <Icon name="alert" size={15} />
                            <span>{validation.rulesError}</span>
                        </div>
                    )}
                </div>

                <footer className="ed-modal-foot">
                    <span className="ed-modal-hint">
                        {draft.rules.length} {pluralize(draft.rules.length, 'правило', 'правила', 'правил')}
                    </span>
                    <div className="ed-modal-actions">
                        <Button variant="ghost" onClick={onClose}>Отмена</Button>
                        <Button
                            variant="primary"
                            icon="check"
                            onClick={handleSave}
                        >
                            Сохранить набор
                        </Button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

function RuleSets({
    ruleSets,
    defaultRuleSetId,
    onCreate,
    onUpdate,
    onDelete,
    onSetDefault,
    onImport,
}: RuleSetsProps) {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editor, setEditor] = useState<{ mode: 'create' } | { mode: 'edit'; ruleSet: RuleSet } | null>(null);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);

    const handleSave = (ruleSet: RuleSet) => {
        if (editor?.mode === 'edit') {
            onUpdate(ruleSet);
            toast.push({ kind: 'success', title: 'Набор обновлён', message: ruleSet.name });
        } else {
            const created = { ...ruleSet, name: uniqueRuleSetName(ruleSet.name, ruleSets) };
            onCreate(created);
            toast.push({ kind: 'success', title: 'Набор создан', message: created.name });
        }
        setEditor(null);
    };

    const handleExport = (ruleSet: RuleSet) => {
        downloadJson(ruleSetFileName(ruleSet.name), serializeRuleSet(ruleSet));
        toast.push({
            kind: 'success',
            title: 'Набор экспортирован',
            message: `${ruleSetFileName(ruleSet.name)} сохранён в «Загрузки».`,
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const fallbackName = file.name
                .replace(/\.easydto-rules\.json$/i, '')
                .replace(/\.json$/i, '')
                || 'Импортированный набор';
            const imported = parseRuleSetFile(text, fallbackName);
            const withUniqueName = {
                ...imported,
                name: uniqueRuleSetName(imported.name, ruleSets),
            };
            onImport(withUniqueName);
            toast.push({
                kind: 'success',
                title: 'Набор импортирован',
                message: `${withUniqueName.name}: ${withUniqueName.rules.length} ${pluralize(withUniqueName.rules.length, 'правило', 'правила', 'правил')}.`,
            });
        } catch (error) {
            toast.push({
                kind: 'error',
                title: 'Не удалось импортировать набор',
                message: error instanceof Error ? error.message : 'Проверьте формат файла.',
            });
        }
    };

    const confirmDelete = (ruleSet: RuleSet) => {
        onDelete(ruleSet.id);
        setPendingDelete(null);
        toast.push({ kind: 'info', title: 'Набор удалён', message: ruleSet.name });
    };

    return (
        <div className="ed-rules">
            <div className="ed-rules-toolbar">
                <div className="ed-rules-summary">
                    <span className="ed-rules-summary-icon">
                        <Icon name="layers" size={18} />
                    </span>
                    <div>
                        <strong>
                            {ruleSets.length} {pluralize(ruleSets.length, 'набор', 'набора', 'наборов')}
                        </strong>
                        <span>Приоритет: готовые названия → набор правил → перевод ИИ</span>
                    </div>
                </div>

                <div className="ed-rules-actions">
                    <label className="ed-default-picker">
                        <Icon name="star" size={14} />
                        <span>По умолчанию</span>
                        <select
                            className="ed-select ed-default-select"
                            value={defaultRuleSetId}
                            aria-label="Набор правил по умолчанию"
                            onChange={event => onSetDefault(event.target.value || null)}
                        >
                            <option value="">Не выбрано</option>
                            {ruleSets.map(ruleSet => (
                                <option key={ruleSet.id} value={ruleSet.id}>{ruleSet.name}</option>
                            ))}
                        </select>
                    </label>

                    <Button icon="upload" onClick={handleImportClick}>
                        Импортировать
                    </Button>
                    <Button
                        variant="primary"
                        icon="plus"
                        onClick={() => setEditor({ mode: 'create' })}
                    >
                        Создать набор
                    </Button>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={event => void handleFileChange(event)}
            />

            {ruleSets.length === 0 ? (
                <div className="ed-rules-empty">
                    <span className="ed-empty-icon">
                        <Icon name="layers" size={26} />
                    </span>
                    <h2>Пока нет наборов правил</h2>
                    <p>
                        Набор — это список соответствий «описание → имя». Создайте свой
                        или импортируйте JSON-файл, полученный от коллеги.
                    </p>
                    <div className="ed-rules-empty-actions">
                        <Button
                            variant="primary"
                            icon="plus"
                            onClick={() => setEditor({ mode: 'create' })}
                        >
                            Создать первый набор
                        </Button>
                        <Button icon="upload" onClick={handleImportClick}>
                            Импортировать файл
                        </Button>
                    </div>
                    <span className="ed-rules-storage-note">
                        Наборы хранятся локально и не попадают в Git.
                    </span>
                </div>
            ) : (
                <div className="ed-rules-grid">
                    {ruleSets.map(ruleSet => {
                        const isDefault = defaultRuleSetId === ruleSet.id;
                        return (
                            <article className="ed-rule-card" key={ruleSet.id}>
                                <header className="ed-rule-card-head">
                                    <div className="ed-rule-card-heading">
                                        <span className="ed-rule-card-icon">
                                            <Icon name="layers" size={16} />
                                        </span>
                                        <div>
                                            <h3>{ruleSet.name}</h3>
                                            <p>
                                                {ruleSet.rules.length}{' '}
                                                {pluralize(ruleSet.rules.length, 'правило', 'правила', 'правил')}
                                                {' · '}
                                                обновлён {new Date(ruleSet.updatedAt).toLocaleDateString('ru-RU')}
                                            </p>
                                        </div>
                                    </div>
                                    {isDefault && (
                                        <Badge tone="accent" icon="star">По умолчанию</Badge>
                                    )}
                                </header>

                                <div className="ed-rule-preview">
                                    {ruleSet.rules.slice(0, 5).map(rule => (
                                        <div className="ed-rule-preview-row" key={rule.id}>
                                            <span className="ed-rule-source" title={rule.source}>
                                                {rule.source}
                                            </span>
                                            <Icon name="arrowRight" size={12} />
                                            <span className="ed-rule-target" title={rule.target}>
                                                {rule.target}
                                            </span>
                                        </div>
                                    ))}
                                    {ruleSet.rules.length > 5 && (
                                        <span className="ed-rule-more">
                                            ещё {ruleSet.rules.length - 5}{' '}
                                            {pluralize(ruleSet.rules.length - 5, 'правило', 'правила', 'правил')}
                                        </span>
                                    )}
                                    {ruleSet.rules.length === 0 && (
                                        <span className="ed-rule-more">В наборе пока нет правил</span>
                                    )}
                                </div>

                                <footer className="ed-rule-card-actions">
                                    <IconButton
                                        icon="star"
                                        label={isDefault ? 'Набор по умолчанию' : 'Сделать набором по умолчанию'}
                                        active={isDefault}
                                        onClick={() => onSetDefault(isDefault ? null : ruleSet.id)}
                                    />
                                    <IconButton
                                        icon="pencil"
                                        label="Редактировать набор"
                                        onClick={() => setEditor({ mode: 'edit', ruleSet })}
                                    />
                                    <IconButton
                                        icon="download"
                                        label="Экспортировать набор"
                                        onClick={() => handleExport(ruleSet)}
                                    />
                                    <IconButton
                                        icon="trash"
                                        label="Удалить набор"
                                        tone="danger"
                                        onClick={() => setPendingDelete(ruleSet.id)}
                                    />
                                </footer>

                                {pendingDelete === ruleSet.id && (
                                    <div className="ed-rule-delete-confirm">
                                        <span>Удалить «{ruleSet.name}»?</span>
                                        <div>
                                            <Button size="sm" variant="ghost" onClick={() => setPendingDelete(null)}>
                                                Отмена
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => confirmDelete(ruleSet)}>
                                                Удалить
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {editor && createPortal(
                <RuleSetEditor
                    initial={editor.mode === 'edit' ? editor.ruleSet : null}
                    onSave={handleSave}
                    onClose={() => setEditor(null)}
                />,
                document.body,
            )}
        </div>
    );
}

export default RuleSets;
