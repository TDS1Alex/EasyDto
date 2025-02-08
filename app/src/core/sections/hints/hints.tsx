import styles from './hints.module.css';

interface HintSectionProps {
    title: string;
    description: string;
    example: string;
    jsonExample: { input: string, output:string }[];
}

function HintSection({ title, description, example, jsonExample }: HintSectionProps) {
    return (
        <div className={styles.hintSection}>
            <h3>{title}</h3>
            <label>{description}</label>
            <label>ПРИМЕР</label>
            <label>Вводимый текст:</label>
            <pre>
                <code>
                    {example}
                </code>
            </pre>
            <label>Результат, отправляемый ИИ:</label>
            <pre>
                <code>
                    {JSON.stringify(jsonExample, null, 2)}
                </code>
            </pre>
        </div>
    );
}

function Hints() {
    const HintRequestExample = [
        { "input": "ид организации", "output": "OrganizationId" },
        { "input": "наименование программы", "output": "programName" },
        { "input": "статус заявки", "output": "StatementState" }
    ];

    const hintsData = [
        {
            title: "Обучение ИИ",
            description: "Разделение происходит знаками: ';', ',' и переносом на новую строку",
            example: "ид организации = organizationId; наименование программы = programName,\nстатус заявки = StatementState",
            jsonExample: HintRequestExample
        },
    ];

    return (
        <div className={styles.hintsContainer}>
            <div className={styles.header}>
                <h2>Подсказки</h2>
            </div>
            <div className={styles.hintsContent}>
                {hintsData.map((hint, index) => (
                    <HintSection
                        key={index}
                        title={hint.title}
                        description={hint.description}
                        example={hint.example}
                        jsonExample={hint.jsonExample}
                    />
                ))}
            </div>
        </div>
    );
}

export default Hints;