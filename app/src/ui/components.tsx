import { useId, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Icon, type IconName } from './icons';
import { useToast } from './toast';
import { copyText, cx } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
    iconRight?: IconName;
    loading?: boolean;
    block?: boolean;
}

export function Button({
    variant = 'secondary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    block = false,
    disabled,
    className,
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type="button"
            className={cx(
                'ed-btn',
                `ed-btn--${variant}`,
                `ed-btn--${size}`,
                block && 'ed-btn--block',
                className,
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <Icon name="loader" size={16} className="ed-spin" />
            ) : (
                icon && <Icon name={icon} size={16} />
            )}
            {children && <span>{children}</span>}
            {iconRight && !loading && <Icon name={iconRight} size={15} />}
        </button>
    );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconName;
    label: string;
    active?: boolean;
    tone?: 'default' | 'accent' | 'danger';
}

export function IconButton({
    icon,
    label,
    active = false,
    tone = 'default',
    className,
    ...rest
}: IconButtonProps) {
    return (
        <button
            type="button"
            className={cx(
                'ed-icon-btn',
                active && 'is-active',
                tone !== 'default' && `ed-icon-btn--${tone}`,
                className,
            )}
            aria-label={label}
            title={label}
            {...rest}
        >
            <Icon name={icon} size={17} />
        </button>
    );
}

interface BadgeProps {
    children: ReactNode;
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
    icon?: IconName;
}

export function Badge({ children, tone = 'neutral', icon }: BadgeProps) {
    return (
        <span className={cx('ed-badge', `ed-badge--${tone}`)}>
            {icon && <Icon name={icon} size={12} />}
            {children}
        </span>
    );
}

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
    ariaLabel?: string;
}

export function Switch({ checked, onChange, label, description, disabled = false, ariaLabel }: SwitchProps) {
    const id = useId();

    return (
        <label className={cx('ed-switch', disabled && 'is-disabled')} htmlFor={id}>
            <span className="ed-switch-copy">
                {label !== '' && <span className="ed-switch-label">{label}</span>}
                {description && <span className="ed-switch-description">{description}</span>}
            </span>
            <span className="ed-switch-control">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    onChange={event => onChange(event.target.checked)}
                />
                <span className="ed-switch-track" />
            </span>
        </label>
    );
}

interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    icon?: IconName;
}

interface SegmentedProps<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: SegmentedOption<T>[];
    label?: string;
}

export function Segmented<T extends string>({ value, onChange, options, label }: SegmentedProps<T>) {
    return (
        <div className="ed-segmented" role="group" aria-label={label}>
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    className={cx('ed-segmented-btn', value === option.value && 'is-active')}
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                >
                    {option.icon && <Icon name={option.icon} size={15} />}
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
}

export function Kbd({ children }: { children: ReactNode }) {
    return <kbd className="ed-kbd">{children}</kbd>;
}

interface CopyButtonProps {
    value: string;
    label?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;
}

export function CopyButton({ value, label = 'Копировать', size = 'sm', variant = 'ghost' }: CopyButtonProps) {
    const toast = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const copied = await copyText(value);
        if (copied) {
            setCopied(true);
            toast.push({ kind: 'success', title: 'Скопировано в буфер обмена' });
            window.setTimeout(() => setCopied(false), 2000);
        } else {
            toast.push({
                kind: 'error',
                title: 'Не удалось скопировать',
                message: 'Буфер обмена недоступен в этом окне.',
            });
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            icon={copied ? 'check' : 'copy'}
            onClick={handleCopy}
            disabled={!value}
        >
            {copied ? 'Готово' : label}
        </Button>
    );
}
