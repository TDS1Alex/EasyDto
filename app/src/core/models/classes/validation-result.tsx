export class ValidationResult {
    isLineValid: boolean;
    isNameValid: boolean;
    isTypeValid: boolean;
    isMultiplicityValid: boolean;

    constructor(isLineValid: boolean = false, isNameValid: boolean = false, isTypeValid: boolean = false, isMultiplicityValid: boolean = false) {
        this.isLineValid = isLineValid;
        this.isNameValid = isNameValid;
        this.isTypeValid = isTypeValid;
        this.isMultiplicityValid = isMultiplicityValid;
    }
}