import './switch.css';
import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    switchName: string;
}

const Switch: React.FC<SwitchProps> = ({ switchName, checked, onChange, disabled = false }) => {
    return (
        <div className='switch-container'>
            <span>{switchName}</span>
            <label className="switch">
                <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled}/>
                <span className="slider"></span>
            </label>
        </div>
    );
};

export default Switch;