import './switch.css';
import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: () => void;
    disabled: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled }) => {
    return (
        <div className='switch-container'>
            <span>Комментарии</span>
            <label className="switch">
                <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled}/>
                <span className="slider"></span>
            </label>
        </div>
    );
};

export default Switch;