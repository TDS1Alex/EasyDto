import './text-area.css';
import React, { ChangeEvent } from 'react';

interface TextAreaProps {
    value: string;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea : React.FC<TextAreaProps> = ({value, onChange}) => {
    return (
        <textarea name="text-area" className="text-area" value={value} onChange={onChange} />
    )
}

export default TextArea;