import { ChangeEvent, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

import styles from './dto-generator.module.css';
import { Input, Select, Switch, TextArea, Spinner } from '../../components';
import { CreateClassOrParameterService, GenerateDtoService, StringSearchService } from "../../services";
import { Class, TechnologyDict } from '../../models';

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
}

function DtoGenerator({ nameDtoValue, setNameDtoValue,
                        selectedTechnology, setSelectedTechnology,
                        commentsEnabled, setCommentsEnabled,
                        textAreaValue, setTextAreaValue,
                        outputValue, setOutputValue, 
    }: DtoGeneratorProps) {
    
    const [isCopied, setIsCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNameDtoValue(event.target.value);
    };

    const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
    };

    const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedTechnology(value);

        if (value !== 'CSharp') {
            setCommentsEnabled(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(outputValue)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch((error) => {
                console.error('Ошибка при копировании в буфер обмена:', error);
            });
    };

    const handleToggle = () => {
        setCommentsEnabled(!commentsEnabled);
    };

    const handleProcessClick = async () => {
        setLoading(true);

        let lines = textAreaValue
        .split('\n')
        .filter(line => {
            return (
                line !== "" &&
                !/сортировка|навигация/i.test(line)
            );
        });
        
        for(let i = 0; i < lines.length; i++) {
            let parts = lines[i].split(/\s+/).filter(part => part !== '');
            let validResult = StringSearchService.validParts(parts);
            if (!validResult.isLineValid) {

                if (validResult.isNameValid && !validResult.isTypeValid && !validResult.isMultiplicityValid) {
                    for(let searchIndex = i; searchIndex < lines.length; searchIndex++) {
                        const searchLine = lines[searchIndex];
                        const searchParts = searchLine.split(/\s+/).filter(part => part !== '');
                        const searchValidResult = StringSearchService.validParts(searchParts);
                        if (!searchValidResult.isNameValid && searchValidResult.isTypeValid && searchValidResult.isMultiplicityValid) {
                            lines[i] = lines[i].concat("", searchLine);
                            lines.splice(searchIndex, 1);
                            parts = lines[i].split(/\s+/).filter(part => part !== '');
                            validResult = StringSearchService.validParts(parts);
                        }
                    }
                } else if (validResult.isNameValid && validResult.isTypeValid && !validResult.isMultiplicityValid) {
                    for(let searchIndex = i+1; searchIndex < lines.length; searchIndex++) {
                        const searchLine = lines[searchIndex];
                        const searchParts = searchLine.split(/\s+/).filter(part => part !== '');
                        const searchValidResult = StringSearchService.validParts(searchParts);
                        if (!searchValidResult.isNameValid && !searchValidResult.isTypeValid && searchValidResult.isMultiplicityValid) {
                            lines[i] = lines[i].concat("", searchLine);
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
        let stack: Class[] = [];
        let rootClassCreated = false;

        for(const line of lines) {
            const parts = line.trim().split(/\s+/);
            const isObject = RegExp("объект").test(line);
            const isEnum = RegExp("перечисление").test(line);
            const level = parts.filter(part => part === '-').length;
            currentClass = getCurrentClass(stack, level);
    
            if (isObject && currentClass && currentClass.level < level) {
                parentClass = currentClass;
            }
    
            if (!isObject && !rootClassCreated) {
                currentClass = await CreateClassOrParameterService.createDefaultClass(nameDtoValue);
                stack.push(currentClass);
                rootClassCreated = true;
            }
    
            if (isObject) {
                currentClass = await CreateClassOrParameterService.createClass(parts, level);
                stack.push(currentClass);
                if (parentClass) {
                    parentClass.addObject(currentClass);
                }
                rootClassCreated = true;
            } else if (isEnum) {
                await currentClass.addEnum(parts);
            } else {
                await currentClass.addParameter(parts);
            }
    
            parentClass = null;
        }
    
        const result = await GenerateDtoService.generateAllDto(stack!, TechnologyDict[selectedTechnology], commentsEnabled);
        setOutputValue(result);
        setLoading(false);
    };

    function getCurrentClass(stack: Class[], level: number): Class {
        const i  = level !== 0 ? findLastIndex(stack, c => c.level === level - 1) 
                               : 0;
        return stack[i] || null;
    }

    function findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
        const reversedIndex = [...array].reverse().findIndex(predicate);
        if (reversedIndex === -1) {
          return -1;
        }
        return array.length - 1 - reversedIndex;
    }

    const options = [
        { value: 'CSharp', label: 'C#' },
        { value: 'JavaScript', label: 'JavaScript' },
        { value: 'Grpc', label: 'Grpc' },
    ];

    return (
        <div className={styles.dtoGeneratorContainer}>
            <div className={styles.inputContainer}>
                <Input value={nameDtoValue} onChange={handleInputChange} placeholder="Напишите название ДТО"/>
                <Select value={selectedTechnology} onChange={handleSelectChange} options={options}/>
                <Switch checked={commentsEnabled} onChange={handleToggle} disabled={selectedTechnology !== 'CSharp'}/>
            </div>
            <div className={styles.textAreaContainer}>
                <TextArea value={textAreaValue} loading={loading} onChange={handleTextAreaChange} />
                <div className={styles.outputContainer}>
                    <textarea className={`${styles.textArea} ${loading ? 'disabled-text-area' : 'text-area'}`} value={outputValue} readOnly />
                    {loading && <Spinner size={35} color="#000" />} {}
                    <button className={styles.copyButton} onClick={handleCopyToClipboard}>
                        <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} />
                    </button>
                </div>
            </div>
            <div className={styles.buttonsContainer}>
                <button className={styles.processButton} onClick={handleProcessClick} disabled={loading}>
                    {loading ? 'Обработка...' : 'Обработать'}
                </button>
            </div>
        </div>
    );
}

export default DtoGenerator;