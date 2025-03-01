import './text-area.css';
import React, { ChangeEvent } from 'react';

interface TextAreaProps {
    value: string;
    loading: boolean;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea : React.FC<TextAreaProps> = ({value, loading, onChange}) => {
    return (
        <textarea name="text-area" className={`${loading ? 'disabled-text-area' : 'text-area'}`} value={value} onChange={onChange} />
    )
}

export default TextArea;