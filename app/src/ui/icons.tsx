import type { ReactNode, SVGProps } from 'react';

export type IconName =
    | 'sparkles'
    | 'code'
    | 'braces'
    | 'brain'
    | 'book'
    | 'sliders'
    | 'sun'
    | 'moon'
    | 'monitor'
    | 'copy'
    | 'check'
    | 'download'
    | 'trash'
    | 'wand'
    | 'search'
    | 'x'
    | 'arrowRight'
    | 'arrowUpRight'
    | 'chevronRight'
    | 'chevronDown'
    | 'layers'
    | 'fileCode'
    | 'zap'
    | 'circleCheck'
    | 'alert'
    | 'info'
    | 'refresh'
    | 'keyboard'
    | 'clock'
    | 'database'
    | 'hash'
    | 'palette'
    | 'panelLeft'
    | 'terminal'
    | 'box'
    | 'plus'
    | 'wrapText'
    | 'loader'
    | 'star'
    | 'upload'
    | 'pencil';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
    name: IconName;
    size?: number;
}

function content(name: IconName): ReactNode {
    switch (name) {
        case 'sparkles':
            return (
                <>
                    <path d="M12 3l1.8 4.9 4.9 1.8-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8L12 3Z" />
                    <path d="M19 15l.9 2.4 2.4.9-2.4.9L19 21.6l-.9-2.4-2.4-.9 2.4-.9L19 15Z" />
                </>
            );
        case 'code':
            return (
                <>
                    <path d="m16 18 6-6-6-6" />
                    <path d="m8 6-6 6 6 6" />
                </>
            );
        case 'braces':
            return (
                <>
                    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
                    <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
                </>
            );
        case 'brain':
            return (
                <>
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A4.5 4.5 0 0 1 3 15.5v-1A3.5 3.5 0 0 1 4.5 8 4 4 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A4.5 4.5 0 0 0 21 15.5v-1A3.5 3.5 0 0 0 19.5 8 4 4 0 0 0 14.5 2Z" />
                    <path d="M8 8h1M8 13h1M15 8h1M15 13h1" />
                </>
            );
        case 'book':
            return (
                <>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </>
            );
        case 'sliders':
            return (
                <>
                    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
                    <path d="M1 14h6M9 8h6M17 16h6" />
                </>
            );
        case 'sun':
            return (
                <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </>
            );
        case 'moon':
            return <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />;
        case 'monitor':
            return (
                <>
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                </>
            );
        case 'copy':
            return (
                <>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
            );
        case 'check':
            return <path d="M20 6 9 17l-5-5" />;
        case 'download':
            return (
                <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5M12 15V3" />
                </>
            );
        case 'trash':
            return (
                <>
                    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
                </>
            );
        case 'wand':
            return (
                <>
                    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5" />
                    <path d="M3 21 12.5 11.5" />
                </>
            );
        case 'search':
            return (
                <>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.35-4.35" />
                </>
            );
        case 'x':
            return <path d="M18 6 6 18M6 6l12 12" />;
        case 'arrowRight':
            return <path d="M5 12h14M13 6l6 6-6 6" />;
        case 'arrowUpRight':
            return <path d="M7 17 17 7M7 7h10v10" />;
        case 'chevronRight':
            return <path d="m9 18 6-6-6-6" />;
        case 'chevronDown':
            return <path d="m6 9 6 6 6-6" />;
        case 'layers':
            return (
                <>
                    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
                    <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
                </>
            );
        case 'fileCode':
            return (
                <>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6M10 13l-2 2 2 2M14 17l2-2-2-2" />
                </>
            );
        case 'zap':
            return <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />;
        case 'circleCheck':
            return (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12 2.5 2.5 4.5-5" />
                </>
            );
        case 'alert':
            return (
                <>
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                    <path d="M12 9v4M12 17h.01" />
                </>
            );
        case 'info':
            return (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 8h.01" />
                </>
            );
        case 'refresh':
            return (
                <>
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <path d="M21 3v6h-6" />
                </>
            );
        case 'keyboard':
            return (
                <>
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4" />
                </>
            );
        case 'clock':
            return (
                <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </>
            );
        case 'database':
            return (
                <>
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
                </>
            );
        case 'hash':
            return <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />;
        case 'palette':
            return (
                <>
                    <path d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h7a2 2 0 0 0 2-2 7 7 0 0 0-7-7Z" />
                    <path d="M7.5 10h.01M9.5 6.5h.01M14 6.5h.01M17 9h.01" />
                </>
            );
        case 'panelLeft':
            return (
                <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                </>
            );
        case 'terminal':
            return <path d="m4 17 6-6-6-6M12 19h8" />;
        case 'box':
            return (
                <>
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
                </>
            );
        case 'plus':
            return <path d="M12 5v14M5 12h14" />;
        case 'wrapText':
            return (
                <>
                    <path d="M3 6h18M3 12h15a3 3 0 0 1 0 6h-4" />
                    <path d="m16 16-2 2 2 2M3 18h7" />
                </>
            );
        case 'loader':
            return <path d="M21 12a9 9 0 1 1-6.22-8.56" />;
        case 'star':
            return <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1L12 2Z" />;
        case 'upload':
            return (
                <>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m17 8-5-5-5 5M12 3v12" />
                </>
            );
        case 'pencil':
            return (
                <>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </>
            );
        default:
            return null;
    }
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...rest}
        >
            {content(name)}
        </svg>
    );
}
