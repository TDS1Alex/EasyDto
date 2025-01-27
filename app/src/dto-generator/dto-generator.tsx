import './dto-generator.css';
import { ChangeEvent, useState } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

import { Input, Select, Switch } from './components';
import { CreateClassOrParameterService } from "./services/create-class-or-parameter-service";
import { GenerateDtoService } from "./services/generate-dto-service";
import { TechnologyDict } from './dictionaries/technology-dict';
import { Class } from "./class/class";

function DtoGenerator() {
    const [textAreaValue, setTextAreaValue] = useState('');
    const [outputValue, setOutputValue] = useState('');
    const [selectedTechnology, setSelectedTechnology] = useState('CSharp');
    const [nameDtoValue, setNameDtoValue] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [commentsEnabled, setCommentsEnabled] = useState(false);

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
        const lines = textAreaValue.split('\n').filter(e => !RegExp("сортировка|навигация", "i").test(e));
        let parentClass: Class | null = null;
        let currentClass: Class | null = null;
        let stack: Class[] = [];
        let rootClassCreated = false;
    
        for (const line of lines.filter(item => item !== "")) {
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
        <div className="dto-generator-container">
            <div className="header">
                <h1>EasyDto</h1>
            </div>
            <div className="input-container">
                <Input value={nameDtoValue} onChange={handleInputChange} placeholder="Напишите название ДТО"/>
                <Select value={selectedTechnology} onChange={handleSelectChange} options={options}/>
                <Switch checked={commentsEnabled} onChange={handleToggle} disabled={selectedTechnology !== 'CSharp'}/>
            </div>
            <div className="text-area-container">
                <textarea name="text-area" className="text-area" value={textAreaValue} onChange={handleTextAreaChange} />
                <div className="output-container">
                    <textarea className="text-area" value={outputValue} readOnly />
                    <button className="copy-button" onClick={handleCopyToClipboard}>
                        <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} />
                    </button>
                </div>
            </div>
            <div className="buttons-container">
                <button className="process-button" onClick={handleProcessClick}>Обработать</button>
            </div>
        </div>
    );
}

export default DtoGenerator;