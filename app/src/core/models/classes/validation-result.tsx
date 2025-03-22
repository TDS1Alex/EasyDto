export class ValidationResult {
    isNameValid: boolean;
    isTypeValid: boolean;
    isMultiplicityValid: boolean;

    constructor(isNameValid: boolean = false, isTypeValid: boolean = false, isMultiplicityValid: boolean = false) {
        this.isNameValid = isNameValid;
        this.isTypeValid = isTypeValid;
        this.isMultiplicityValid = isMultiplicityValid;
    }

    get isLineValid(): boolean {
        return this.isNameValid && this.isTypeValid && this.isMultiplicityValid;
    }
}