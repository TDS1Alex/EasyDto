import { ChangeEvent, useState } from "react";

import styles from './train-ai.module.css';
import { TextArea, Spinner } from "../../components";
import { TrainAiRequest } from "../../contracts/train-ai-request";
import { AiService } from "../../services";

interface TrainAiProps {
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
}

function TrainAi({textAreaValue, setTextAreaValue}:TrainAiProps) {
    const [loading, setLoading] = useState(false);
    const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
    };

    const handleProcessClick = async () => {
      setLoading(true);
      try {
        const lines = textAreaValue.split(/[,;\n]/).filter(v => v.trim() !== '');
  
        const request = new TrainAiRequest();
        lines.forEach(keyValue => {
          const [input, output] = keyValue.split('=').map(v => v.trim());
          request.add(input, output);
        });
  
        await AiService.trainAi(request);
      } catch (error) {
        console.error("Ошибка при обучении ИИ:", error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <div>
          <h2>Обучение ИИ</h2>
        </div>
        <div className={styles.workspaceContainer}>
          <div className={styles.textAreaContainer}>
            <TextArea value={textAreaValue} loading={loading} onChange={handleTextAreaChange} />
            {loading && <Spinner size={35} color="#000" />} {}
          </div>
          <div className={styles.buttonsContainer}>
            <button className={styles.processButton} onClick={handleProcessClick} disabled={loading}>
              {loading ? 'Обучение...' : 'Обучить'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default TrainAi;