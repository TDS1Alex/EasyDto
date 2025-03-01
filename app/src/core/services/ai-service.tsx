import { TrainAiRequest } from "../contracts/train-ai-request";

export class AiService {
    public static path = 'http://127.0.0.1:5000';

    public static async translateName(name: string): Promise<string> {
        const requestBody = JSON.stringify(
            {
                "text": name
            }
        );

        return fetch(`${this.path}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        })
        .then(response => {
            return response.text()
        });
    };

    public static async trainAi(request: TrainAiRequest): Promise<string> {
        return fetch(`${this.path}/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        })
        .then(response => {
            return response.text()
        });
    };
}