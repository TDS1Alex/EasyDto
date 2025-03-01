export class TrainAiRequest {
    examples: { input: string; output: string }[] = [];

    public add(input: string, output: string) {
        this.examples.push({input, output})
    }
}