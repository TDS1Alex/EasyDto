export class TrainAiRequest {
    input: string;
    output: string;

    constructor (input: string, output: string) {
        this.input = input;
        this.output = output;
    }
}