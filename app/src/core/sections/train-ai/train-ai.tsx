import { ChangeEvent } from "react";

import styles from './train-ai.module.css';
import { TextArea } from "../../components";
import { TrainAiRequest } from "../../contracts/train-ai-request";
import { AiService } from "../../services";

interface TrainAiProps {
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
}

function TrainAi({textAreaValue, setTextAreaValue}:TrainAiProps) {

    const handleTextAreaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setTextAreaValue(event.target.value);
    };

    const handleProcessClick = async () => {
      const lines = textAreaValue.split(/[,;\n]/).filter(v => v != '');

      let request = lines.map(keyValue => {
        const value = keyValue.split('=').map(v => v.trim());
        return {input: value[0], output: value[1]} as TrainAiRequest
      });

      //AiService.trainAi(request);
    };

    return (
      <div>
        <div>
          <h2>Обучение ИИ</h2>
        </div>
        
        <div className={styles.textAreaContainer}>
          <TextArea value={textAreaValue} onChange={handleTextAreaChange} />
        </div>
        <div className={styles.buttonsContainer}>
          <button className={styles.processButton} onClick={handleProcessClick}>Обучить</button>
        </div>
      </div>
    );
  }
  
  export default TrainAi;