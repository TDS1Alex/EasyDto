import { useEffect, useMemo, useState } from 'react';

import { CodeEditor } from '../../../ui/code';
import { Badge, Button, IconButton } from '../../../ui/components';
import { Icon } from '../../../ui/icons';
import { useToast } from '../../../ui/toast';
import { type HealthStatus } from '../../../ui/hooks';
import { pluralize } from '../../../ui/utils';
import { TrainAiRequest } from '../../contracts/train-ai-request';
import { AiService } from '../../services';

interface TrainAiProps {
    textAreaValue: string;
    setTextAreaValue: (value: string) => void;
    apiStatus: HealthStatus;
    onCheckApi: () => void;
}

const TRAIN_EXAMPLE = `ид организации = organizationId; наименование программы = programName, статус заявки = StatementState`;

interface ExamplePair {
    index: number;
    input: string;
    output: string;
    valid: boolean;
}

function TrainAi({ textAreaValue, setTextAreaValue, apiStatus, onCheckApi }: TrainAiProps) {
    const [loading, setLoading] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const toast = useToast();

    const pairs = useMemo<ExamplePair[]>(() => {
        return textAreaValue
            .split(/[,;\n]/)
            .filter(value => value.trim() !== '')
            .map((entry, index) => {
                const [input = '', output = ''] = entry.split('=').map(value => value.trim());
                return {
                    index: index + 1,
                    input,
                    output,
                    valid: input !== '' && output !== '',
                };
            });
    }, [textAreaValue]);

    const validCount = pairs.filter(pair => pair.valid).length;
    const invalidCount = pairs.length - validCount;

    useEffect(() => {
        if (!loading) {
            setElapsed(0);
            return;
        }

        const started = Date.now();
        const id = window.setInterval(() => {
            setElapsed(Math.floor((Date.now() - started) / 1000));
        }, 1000);

        return () => window.clearInterval(id);
    }, [loading]);

    const handleExample = () => {
        setTextAreaValue(TRAIN_EXAMPLE);
        setResult(null);
        toast.push({
            kind: 'info',
            title: 'Пример загружен',
            message: 'Проверьте пары справа и запустите обучение.',
        });
    };

    const handleClear = () => {
        setTextAreaValue('');
        setResult(null);
    };

    const handleTrain = async () => {
        if (loading || validCount === 0 || invalidCount > 0) return;

        setLoading(true);
        setResult(null);

        try {
            const request = new TrainAiRequest();
            pairs.forEach(pair => request.add(pair.input, pair.output));
            const response = await AiService.trainAi(request);
            setResult(response || 'Модель успешно дообучена.');
            toast.push({
                kind: 'success',
                title: 'Модель дообучена',
                message: `Передано примеров: ${validCount}.`,
            });
        } catch (error) {
            console.error('Ошибка при обучении ИИ:', error);
            toast.push({
                kind: 'error',
                title: 'Не удалось обучить модель',
                message: 'Проверьте, что Python-переводчик запущен и доступен.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ed-train">
            <div className="ed-train-column">
                <section className="ed-panel ed-train-editor" aria-label="Примеры для обучения">
                    <header className="ed-panel-head">
                        <div className="ed-panel-heading">
                            <span className="ed-panel-icon">
                                <Icon name="brain" size={15} />
                            </span>
                            <div className="ed-panel-title-wrap">
                                <span className="ed-panel-title">Примеры переводов</span>
                                <span className="ed-panel-subtitle">
                                    {pairs.length > 0
                                        ? `${pairs.length} ${pluralize(pairs.length, 'пара', 'пары', 'пар')} в наборе`
                                        : 'Формат: исходное название = перевод'}
                                </span>
                            </div>
                        </div>
                        <div className="ed-panel-actions">
                            <Badge tone={invalidCount > 0 ? 'warning' : validCount > 0 ? 'accent' : 'neutral'}>
                                {validCount} / {pairs.length}
                            </Badge>
                            <IconButton
                                icon="wand"
                                label="Загрузить пример"
                                onClick={handleExample}
                                disabled={loading}
                            />
                            <IconButton
                                icon="trash"
                                label="Очистить примеры"
                                onClick={handleClear}
                                disabled={!textAreaValue || loading}
                            />
                        </div>
                    </header>

                    <div className="ed-panel-body">
                        <CodeEditor
                            value={textAreaValue}
                            onChange={setTextAreaValue}
                            placeholder={'ид организации = organizationId\nнаименование программы = programName\nстатус заявки = StatementState'}
                            onRun={() => void handleTrain()}
                            showLineNumbers
                            ariaLabel="Примеры переводов для обучения"
                        />
                    </div>

                    <footer className="ed-panel-foot">
                        <span>Разделители:</span>
                        <code>=</code>
                        <code>;</code>
                        <code>,</code>
                        <span>или новая строка</span>
                        <span className="ed-foot-spacer" />
                        <span>Ctrl + Enter — обучить</span>
                    </footer>
                </section>

                <div className="ed-train-actions">
                    <div className="ed-train-timer">
                        {loading ? (
                            <>
                                <span className="ed-spinner" />
                                <span>Обучение идёт · {elapsed} с</span>
                            </>
                        ) : (
                            <>
                                <Icon name="clock" size={14} />
                                <span>Обычно занимает несколько минут</span>
                            </>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        icon="zap"
                        loading={loading}
                        disabled={validCount === 0 || invalidCount > 0}
                        onClick={() => void handleTrain()}
                    >
                        {loading ? 'Обучение…' : 'Обучить модель'}
                    </Button>
                </div>
            </div>

            <div className="ed-train-column">
                <section className="ed-train-card" aria-label="Пары для обучения">
                    <div className="ed-train-card-head">
                        <span className="ed-train-card-title">
                            <Icon name="layers" size={15} />
                            Пары для обучения
                        </span>
                        <Badge tone="neutral">{validCount} готово</Badge>
                    </div>

                    <div className="ed-pairs">
                        {pairs.length === 0 && (
                            <div className="ed-pairs-empty">
                                <Icon name="terminal" size={22} />
                                <span>Добавьте примеры слева — здесь появится разбор пар.</span>
                            </div>
                        )}

                        {pairs.map(pair => (
                            <div
                                key={pair.index}
                                className={`ed-example-row${pair.valid ? '' : ' is-invalid'}`}
                            >
                                <span className="ed-example-index">{pair.index}</span>
                                <span className="ed-example-value" title={pair.input}>
                                    {pair.input || '—'}
                                </span>
                                <span className="ed-example-arrow">
                                    <Icon name="arrowRight" size={13} />
                                </span>
                                <span className="ed-example-value is-output" title={pair.output}>
                                    {pair.output || 'нет перевода'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {invalidCount > 0 && (
                        <div className="ed-notice ed-notice--warning">
                            <Icon name="alert" size={15} />
                            <span>
                                {invalidCount} {pluralize(invalidCount, 'строка', 'строки', 'строк')} без пары
                                «название = перевод». Исправьте их, чтобы продолжить.
                            </span>
                        </div>
                    )}
                </section>

                <section className="ed-train-card" aria-label="Как проходит обучение">
                    <div className="ed-train-card-head">
                        <span className="ed-train-card-title">
                            <Icon name="info" size={15} />
                            Как это работает
                        </span>
                    </div>
                    <p className="ed-hint-text">
                        Дообучение помогает переводчику точнее подбирать имена для новой предметной
                        области. Модель обновляется в каталоге <code className="ed-code-inline">ai-translator/models</code>.
                    </p>
                    <div className="ed-notice ed-notice--warning">
                        <Icon name="alert" size={15} />
                        <span>
                            Во время обучения переводчик может отвечать медленнее.
                            Не закрывайте приложение до завершения процесса.
                        </span>
                    </div>
                </section>

                {apiStatus === 'offline' && (
                    <div className="ed-notice">
                        <Icon name="database" size={15} />
                        <span>
                            Python-переводчик недоступен. Проверьте подключение перед обучением.
                        </span>
                        <Button size="sm" variant="ghost" onClick={onCheckApi}>
                            Проверить
                        </Button>
                    </div>
                )}

                {result && (
                    <div className="ed-train-result">
                        <Icon name="circleCheck" size={16} />
                        <span>
                            Модель дообучена. Ответ сервера: <code className="ed-code-inline">{result}</code>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TrainAi;
