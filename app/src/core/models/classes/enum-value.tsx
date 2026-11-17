export class EnumValue {
    name: string;
    value: number;
    comment: string | null;

    constructor(name: string, comment: string | null = null, value: number = 0) {
        this.name = name;
        this.value = value;
        this.comment = comment;
    }

    /*
        Undefined всегда присутствует и имеет значение 0.
        Остальные значения нумеруются подряд, начиная с 1,
        независимо от нумерации строк в исходной таблице СА.
    */
    public static normalize(values: EnumValue[]): EnumValue[] {
        if (!values || values.length === 0) {
            return EnumValue.getDefault();
        }

        const undefinedValue = values.find(value => value.name.toLowerCase() === 'undefined');
        const normalized: EnumValue[] = [
            new EnumValue(
                undefinedValue?.name ?? 'Undefined',
                undefinedValue?.comment ?? 'Не определен',
                0,
            ),
        ];

        let nextValue = 1;
        values.forEach(value => {
            if (value === undefinedValue) {
                return;
            }

            normalized.push(new EnumValue(value.name, value.comment, nextValue));
            nextValue++;
        });

        return normalized;
    }

    public static getDefault(): EnumValue[] {
        return [new EnumValue('Undefined', 'Не определен', 0)];
    }
}
