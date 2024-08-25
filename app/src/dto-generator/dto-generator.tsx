import './dto-generator.css';
import { ChangeEvent, useState } from "react";

import { CreateClassOrParameterService } from "./services/create-class-or-parameter-service";
import { GenerateDtoService } from "./services/generate-dto-service";
import { Class } from "./class/class";

function DtoGenerator() {
    const [inputValue, setInputValue] = useState('');
    const [outputValue, setOutputValue] = useState('');

    const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.target.value);
    };

    const handleProcessClick = () => {
        const lines = inputValue.split('\n').filter(e => !RegExp("сортировка|навигация", "i").test(e));
        let parentClass: Class | null = null;
        let currentClass: Class | null = null;
        let stack: Class[] = [];
        let rootClassCreated = false;

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const isObject = RegExp("объект").test(line);
            const level = parts.filter(part => part === '-').length;
            currentClass = getCurrentClass(stack, level);

            if (isObject && currentClass && currentClass.level < level) {
                parentClass = currentClass;
            }

            if (!isObject && !rootClassCreated) {
                currentClass = CreateClassOrParameterService.createDefaultClass();
                stack.push(currentClass);
                rootClassCreated = true;
            }

            if (isObject) {
                currentClass = CreateClassOrParameterService.createClass(parts, level);
                stack.push(currentClass);
                if (parentClass) {
                    parentClass.addObject(currentClass);
                }
                rootClassCreated = true;
            } else {
                currentClass.addParameter(parts);
            }

            parentClass = null;
        });

        setOutputValue(GenerateDtoService.generateAllDto(stack!, ''));
    };

    function getCurrentClass(stack: Class[], level: number): Class {
        const i  = level !== 0 ? stack.findLastIndex (c => c.level === level - 1) 
                               : 0;
        return stack[i] || null;
    }

    return (
        <div className="dto-generator-container">
            <div className="header">
                <h1>EasyDto</h1>
            </div>
            <div className="text-area-container">
                <textarea className="text-area" value={inputValue} onChange={handleInputChange} />
                <textarea className="text-area" value={outputValue} readOnly />
            </div>
            <button className="process-button" onClick={handleProcessClick}>Обработать</button>
        </div>
    );
}

export default DtoGenerator;