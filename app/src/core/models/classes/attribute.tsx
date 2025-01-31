export class Attribute {
    required: string | null;
    maxLenght: string | null;
    minLength: string | null;
    isIgnore: boolean;

    constructor(required: boolean, isCollection: boolean, isObject: boolean, isIgnore: boolean, maxLenght: number | null = null)
    {
        this.required = required && !isCollection && !isObject ? '[Required]' : null;
        this.minLength = required && isCollection ? '[MinLength(1)]' : null;
        this.maxLenght = maxLenght ? `[MaxLength(${maxLenght})]` : null;
        this.isIgnore =  isIgnore;
    }

    public getAttribute(): string {
        if (this.isIgnore) {
            return '';
        }

        const indent = '    ';
        const attributes = [this.required, this.minLength, this.maxLenght]
            .filter(Boolean)
            .map(attr => `${indent}${attr}`);

        return attributes.length ? `${attributes.join('\n')}\n` : '';
    }
}