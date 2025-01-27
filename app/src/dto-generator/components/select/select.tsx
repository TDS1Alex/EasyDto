import './select.css';
import React, { ChangeEvent } from 'react';

interface SelectProps {
    value: string;
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string; }[]
}

const Select: React.FC<SelectProps> = ({ value, onChange, options }) => {
    return (
        <select className="select" name="technology" value={value} onChange={onChange}>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default Select;