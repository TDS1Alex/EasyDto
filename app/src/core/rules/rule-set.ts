export interface NameRule {
    id: string;
    source: string;
    target: string;
}

export interface RuleSet {
    id: string;
    name: string;
    rules: NameRule[];
    createdAt: string;
    updatedAt: string;
}

export type RuleMap = ReadonlyMap<string, string>;

export const RULE_SET_FILE_FORMAT = 'easydto.rule-set';
export const RULE_SET_FILE_VERSION = 1;

export function createRuleId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createRule(source = '', target = ''): NameRule {
    return { id: createRuleId(), source, target };
}

export function createRuleSet(name: string, rules: NameRule[] = []): RuleSet {
    const now = new Date().toISOString();
    return {
        id: createRuleId(),
        name: name.trim(),
        rules,
        createdAt: now,
        updatedAt: now,
    };
}

export function cloneRuleSet(ruleSet: RuleSet): RuleSet {
    return {
        ...ruleSet,
        rules: ruleSet.rules.map(rule => ({ ...rule })),
    };
}

export function normalizeRuleSource(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/\s+/g, ' ');
}

export function isValidRuleTarget(value: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}

export function buildRuleMap(ruleSet: RuleSet | null | undefined): RuleMap | undefined {
    if (!ruleSet || ruleSet.rules.length === 0) {
        return undefined;
    }

    const map = new Map<string, string>();
    for (const rule of ruleSet.rules) {
        const source = normalizeRuleSource(rule.source);
        const target = rule.target.trim();
        if (source !== '' && target !== '') {
            map.set(source, target);
        }
    }

    return map.size > 0 ? map : undefined;
}

export function uniqueRuleSetName(name: string, existing: RuleSet[]): string {
    const base = name.trim() || 'Новый набор';
    if (!existing.some(ruleSet => ruleSet.name.trim().toLowerCase() === base.toLowerCase())) {
        return base;
    }

    for (let index = 2; index < 1000; index++) {
        const candidate = `${base} (${index})`;
        if (!existing.some(ruleSet => ruleSet.name.trim().toLowerCase() === candidate.toLowerCase())) {
            return candidate;
        }
    }

    return `${base} (${Date.now()})`;
}

export function serializeRuleSet(ruleSet: RuleSet): string {
    return JSON.stringify({
        format: RULE_SET_FILE_FORMAT,
        version: RULE_SET_FILE_VERSION,
        name: ruleSet.name,
        rules: ruleSet.rules.map(rule => ({
            source: rule.source,
            target: rule.target,
        })),
    }, null, 2);
}

export function ruleSetFileName(name: string): string {
    const base = name
        .trim()
        .replace(/[^\p{L}\p{N}_-]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || 'rule-set';
    return `${base}.easydto-rules.json`;
}

function parseRules(rawRules: unknown): NameRule[] {
    if (!Array.isArray(rawRules) || rawRules.length === 0) {
        throw new Error('В файле нет правил.');
    }

    if (rawRules.length > 500) {
        throw new Error('В наборе больше 500 правил — это слишком много для одного файла.');
    }

    const rules: NameRule[] = [];
    const sources = new Set<string>();

    rawRules.forEach((rawRule, index) => {
        if (!rawRule || typeof rawRule !== 'object') {
            throw new Error(`Правило №${index + 1} имеет неверный формат.`);
        }

        const item = rawRule as { source?: unknown; target?: unknown };
        const source = typeof item.source === 'string' ? item.source.trim() : '';
        const target = typeof item.target === 'string' ? item.target.trim() : '';

        if (source === '') {
            throw new Error(`У правила №${index + 1} не заполнено описание.`);
        }

        if (target === '') {
            throw new Error(`У правила №${index + 1} не заполнено имя.`);
        }

        if (!isValidRuleTarget(target)) {
            throw new Error(`Имя «${target}» в правиле №${index + 1} не является корректным идентификатором.`);
        }

        const normalized = normalizeRuleSource(source);
        if (sources.has(normalized)) {
            throw new Error(`Описание «${source}» встречается в файле несколько раз.`);
        }

        sources.add(normalized);
        rules.push(createRule(source, target));
    });

    return rules;
}

export function parseRuleSetFile(text: string, fallbackName = 'Импортированный набор'): RuleSet {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Файл не является корректным JSON.');
    }

    if (Array.isArray(data)) {
        return createRuleSet(fallbackName, parseRules(data));
    }

    if (!data || typeof data !== 'object') {
        throw new Error('Файл не похож на набор правил EasyDTO.');
    }

    const payload = data as {
        format?: unknown;
        version?: unknown;
        name?: unknown;
        rules?: unknown;
        sets?: unknown;
    };

    if (typeof payload.format === 'string' && payload.format !== RULE_SET_FILE_FORMAT) {
        throw new Error('Неизвестный формат файла набора правил.');
    }

    if (Array.isArray(payload.sets)) {
        throw new Error('Файл содержит несколько наборов. Импортируйте наборы по одному.');
    }

    const name = typeof payload.name === 'string' && payload.name.trim() !== ''
        ? payload.name.trim()
        : fallbackName;

    return createRuleSet(name, parseRules(payload.rules));
}
