import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import styles from './spinner.module.css';

interface SpinnerProps {
    size?: number;
    color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 24, color = '#000' }) => {
    return (
        <div className={styles.spinnerOverlay}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: size, color }} />
        </div>
    );
};

export default Spinner;