export class AITranslatorService {
    public static async translateName(name: string): Promise<string> {
        const path = 'http://127.0.0.1:5000/translate';
        const requestBody = JSON.stringify(
            {
                "text": name
            }
        );

        return fetch(path, {
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
}