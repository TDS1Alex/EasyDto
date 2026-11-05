import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { AiService } from '../core/services';

export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Приватный режим или переполненное хранилище — не мешаем работе интерфейса.
        }
    }, [key, value]);

    return [value, setValue];
}

export type HealthStatus = 'checking' | 'online' | 'offline';

export interface ApiHealth {
    status: HealthStatus;
    lastChecked: Date | null;
    check: (showChecking?: boolean) => Promise<void>;
}

export function useApiHealth(intervalMs = 2000): ApiHealth {
    const [status, setStatus] = useState<HealthStatus>('checking');
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const check = useCallback(async (showChecking = false) => {
        if (showChecking) setStatus('checking');
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 4000);

        try {
            const response = await fetch(`${AiService.path}/health`, {
                signal: controller.signal,
                cache: 'no-store',
            });
            const data = response.ok ? await response.json() : null;
            if (mounted.current) {
                setStatus(data?.status === 'ok' ? 'online' : 'offline');
            }
        } catch {
            if (mounted.current) setStatus('offline');
        } finally {
            window.clearTimeout(timer);
            if (mounted.current) setLastChecked(new Date());
        }
    }, []);

    useEffect(() => {
        void check();
        const id = window.setInterval(() => void check(), intervalMs);
        return () => window.clearInterval(id);
    }, [check, intervalMs]);

    useEffect(() => {
        const handleServiceReady = () => void check(true);
        window.addEventListener('easydto:service-ready', handleServiceReady);
        return () => window.removeEventListener('easydto:service-ready', handleServiceReady);
    }, [check]);

    return { status, lastChecked, check };
}
