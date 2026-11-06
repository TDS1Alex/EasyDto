import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Button, IconButton } from '../../../ui/components';
import { Icon, type IconName } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import { copyText, cx, pluralize } from '../../../ui/utils';

interface HintsProps {
    onOpenGenerator: () => void;
}

function Snippet({ code, language }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    const handleCopy = async () => {
        const copied = await copyText(code);
        if (copied) {
            setCopied(true);
            toast.push({ kind: 'success', title: 'Пример скопирован' });
            window.setTimeout(() => setCopied(false), 2000);
        } else {
            toast.push({ kind: 'error', title: 'Не удалось скопировать пример' });
        }
    };

    return (
        <div className="ed-snippet-wrap">
            <pre className="ed-snippet">{code}</pre>
            <IconButton
                className="ed-copy-float"
                icon={copied ? 'check' : 'copy'}
                label={copied ? 'Скопировано' : `Скопировать пример${language ? ` (${language})` : ''}`}
                onClick={() => void handleCopy()}
            />
        </div>
    );
}

interface HintCardData {
    id: string;
    title: string;
    icon: IconName;
    wide?: boolean;
    keywords: string;
    body: ReactNode;
}

function Hints({ onOpenGenerator }: HintsProps) {
    const [query, setQuery] = useState('');

    const cards = useMemo<HintCardData[]>(() => [
        {
            id: 'quick-start',
            title: 'Быстрый старт',
            icon: 'zap',
            wide: true,
            keywords: 'начало старт шаги генерация dto',
            body: (
                <>
                    <p className="ed-hint-text">
                        Опишите структуру обычным текстом: одна строка — одно поле. Вложенность
                        задаётся дефисами, а перевод имени можно доверить ИИ или указать вручную.
                    </p>
                    <ol className="ed-hint-list">
                        <li>Введите имя DTO и выберите технологию: C#, TypeScript или gRPC.</li>
                        <li>Опишите поля, объекты и перечисления в левом редакторе.</li>
                        <li>Нажмите «Сгенерировать DTO» или <span className="ed-code-inline">Ctrl + Enter</span>.</li>
                        <li>Скопируйте результат или скачайте готовый файл.</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'line-format',
            title: 'Формат строки',
            icon: 'terminal',
            wide: true,
            keywords: 'синтаксис формат строка описание тип множественность имя',
            body: (
                <>
                    <p className="ed-hint-text">
                        Каждая строка состоит из описания, типа, множественности и имени.
                        Имя нужно, когда включён переключатель «Готовые названия».
                    </p>
                    <Snippet code={`описание  тип  множественность  [имя]

заявка объект 1 Application
- ид заявки строка 1..* applicationId
- дата создания дата и время 1 createdAt
- сумма число 0..1 amount`} />
                    <ul className="ed-hint-list">
                        <li><b>описание</b> — русское название поля; используется в комментариях и для перевода ИИ.</li>
                        <li><b>тип</b> — число, строка, логический, дата, дата и время, guid, объект, перечисление.</li>
                        <li><b>множественность</b> — 1, 0..1, 0..* или 1..*.</li>
                        <li><b>имя</b> — латинский идентификатор, необязателен при генерации имён через ИИ.</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'types',
            title: 'Типы данных',
            icon: 'fileCode',
            wide: true,
            keywords: 'типы число строка логический дата дата и время guid c# typescript grpc',
            body: (
                <>
                    <table className="ed-table">
                        <thead>
                            <tr>
                                <th>В описании</th>
                                <th>C#</th>
                                <th>TypeScript</th>
                                <th>gRPC</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>число</td><td>int</td><td>number</td><td>int32</td></tr>
                            <tr><td>строка</td><td>string</td><td>string</td><td>string</td></tr>
                            <tr><td>логический</td><td>bool</td><td>boolean</td><td>bool</td></tr>
                            <tr><td>дата</td><td>DateOnly</td><td>Date</td><td>google.protobuf.Timestamp</td></tr>
                            <tr><td>дата и время</td><td>DateTimeOffset</td><td>Date</td><td>google.protobuf.Timestamp</td></tr>
                            <tr><td>guid</td><td>Guid</td><td>string</td><td>string</td></tr>
                        </tbody>
                    </table>
                    <p className="ed-hint-text" style={{ marginTop: 10 }}>
                        Тип определяется словом перед множественностью, поэтому описание может
                        содержать слова «дата» и «время».
                    </p>
                </>
            ),
        },
        {
            id: 'multiplicity',
            title: 'Множественность',
            icon: 'layers',
            keywords: 'множественность 1 0..1 0..* 1..* коллекция обязательное',
            body: (
                <>
                    <ul className="ed-hint-list">
                        <li><span className="ed-code-inline">1</span> — одно значение, обязательное.</li>
                        <li><span className="ed-code-inline">0..1</span> — одно значение, необязательное.</li>
                        <li><span className="ed-code-inline">0..*</span> — коллекция, необязательная.</li>
                        <li><span className="ed-code-inline">1..*</span> — коллекция, минимум один элемент.</li>
                    </ul>
                    <p className="ed-hint-text" style={{ marginTop: 10 }}>
                        Для коллекций в gRPC добавляется <span className="ed-code-inline">repeated</span>,
                        а в C# — <span className="ed-code-inline">ICollection&lt;T&gt;</span>.
                    </p>
                </>
            ),
        },
        {
            id: 'nested',
            title: 'Вложенные объекты',
            icon: 'box',
            keywords: 'вложенность объект дефис уровень nested',
            body: (
                <>
                    <p className="ed-hint-text">
                        Каждый дефис в начале строки увеличивает уровень вложенности на один.
                        Дефисы должны быть отдельными словами: <span className="ed-code-inline">- -</span> для второго уровня.
                    </p>
                    <Snippet code={`заявка объект 1 Application
- организация объект 0..1 Organization
- - наименование строка 1..* name`} />
                </>
            ),
        },
        {
            id: 'enums',
            title: 'Перечисления',
            icon: 'braces',
            keywords: 'перечисление enum статус',
            body: (
                <>
                    <p className="ed-hint-text">
                        Ключевое слово <span className="ed-code-inline">перечисление</span> создаёт enum
                        внутри текущего объекта.
                    </p>
                    <Snippet code={`- статус перечисление 0..1 ApplicationStatus`} />
                </>
            ),
        },
        {
            id: 'names',
            title: 'Готовые названия и ИИ',
            icon: 'sparkles',
            keywords: 'имена готовые названия переводчик ии ai',
            body: (
                <>
                    <p className="ed-hint-text">
                        С включённым переключателем «Готовые названия» приложение берёт последнее
                        слово строки как имя. Если имя не задано, применяется правило из выбранного
                        набора, а затем перевод через Python-переводчик.
                    </p>
                    <ul className="ed-hint-list">
                        <li>Готовые названия — самый высокий приоритет.</li>
                        <li>Набор правил — точные соответствия без обращения к ИИ.</li>
                        <li>Перевод ИИ — используется, если имени и правила нет.</li>
                        <li>Для перевода ИИ переводчик должен быть онлайн.</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'rulesets',
            title: 'Наборы правил',
            icon: 'layers',
            keywords: 'наборы правила маппинг импорт экспорт json поделиться',
            body: (
                <>
                    <p className="ed-hint-text">
                        Набор — это пары «описание → имя». Выберите набор в рабочей зоне или
                        назначьте его по умолчанию во вкладке «Наборы правил».
                    </p>
                    <ul className="ed-hint-list">
                        <li>Совпадение ищется по полному описанию без учёта регистра.</li>
                        <li>Набор можно экспортировать в JSON и передать коллеге.</li>
                        <li>Импорт создаёт новый набор и не перезаписывает существующие.</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'training',
            title: 'Обучение ИИ',
            icon: 'brain',
            wide: true,
            keywords: 'обучение тренировка примеры json input output',
            body: (
                <>
                    <p className="ed-hint-text">
                        Примеры разделяются знаками <span className="ed-code-inline">;</span>,
                        <span className="ed-code-inline">,</span> или переносом строки. Внутри пары
                        используется <span className="ed-code-inline">=</span>.
                    </p>
                    <Snippet code={`ид организации = organizationId; наименование программы = programName,
статус заявки = StatementState`} />
                    <p className="ed-hint-text" style={{ marginTop: 10 }}>
                        На сервер отправляется такой JSON:
                    </p>
                    <Snippet code={`[
  { "input": "ид организации", "output": "OrganizationId" },
  { "input": "наименование программы", "output": "programName" },
  { "input": "статус заявки", "output": "StatementState" }
]`} language="JSON" />
                </>
            ),
        },
        {
            id: 'errors',
            title: 'Частые ошибки',
            icon: 'alert',
            wide: true,
            keywords: 'ошибки валидация строка пропуск сортировка навигация',
            body: (
                <ul className="ed-hint-list">
                    <li>Строка без типа или множественности не попадает в результат.</li>
                    <li>Строки со словами «сортировка» и «навигация» игнорируются автоматически.</li>
                    <li>Тип должен стоять непосредственно перед множественностью: <span className="ed-code-inline">дата и время 0..1</span>.</li>
                    <li>Имя после множественности обязательно, если включены «Готовые названия».</li>
                    <li>Проверьте, что Python-переводчик запущен, если генерируете имена через ИИ.</li>
                </ul>
            ),
        },
    ], []);

    const normalizedQuery = query.trim().toLowerCase();
    const filteredCards = normalizedQuery === ''
        ? cards
        : cards.filter(card =>
            `${card.title} ${card.keywords}`.toLowerCase().includes(normalizedQuery),
        );

    return (
        <div className="ed-hints">
            <div className="ed-hints-toolbar">
                <div className="ed-input-wrap">
                    <span className="ed-input-icon">
                        <Icon name="search" size={16} />
                    </span>
                    <input
                        className="ed-input ed-input--with-icon"
                        type="search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="Найти подсказку — например, «множественность»"
                        aria-label="Поиск по подсказкам"
                    />
                </div>
                <span className="ed-hints-count">
                    {filteredCards.length} из {cards.length}{' '}
                    {pluralize(cards.length, 'раздел', 'раздела', 'разделов')}
                </span>
            </div>

            {filteredCards.length === 0 && (
                <div className="ed-hints-empty">
                    <Icon name="search" size={22} />
                    <span>Ничего не найдено. Попробуйте другой запрос.</span>
                </div>
            )}

            <div className="ed-hints-grid">
                {filteredCards.map(card => (
                    <article
                        key={card.id}
                        className={cx('ed-hint-card', card.wide && 'ed-hint-card--wide')}
                    >
                        <div className="ed-hint-head">
                            <span className="ed-hint-icon">
                                <Icon name={card.icon} size={16} />
                            </span>
                            <h2 className="ed-hint-title">{card.title}</h2>
                        </div>
                        {card.body}
                    </article>
                ))}
            </div>

            <div className="ed-hints-cta">
                <div>
                    <strong>Готовы попробовать?</strong>
                    <span>Вернитесь в генератор — там уже открыт редактор структуры.</span>
                </div>
                <Button variant="primary" icon="sparkles" onClick={onOpenGenerator}>
                    К генератору
                </Button>
            </div>
        </div>
    );
}

export default Hints;
