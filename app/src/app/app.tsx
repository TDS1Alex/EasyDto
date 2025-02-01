import { DtoGenerator, TrainAi, Settings } from '../core/sections';
import './app.css';

import { useState } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('dto-generator');

  // Состояния для DtoGenerator
  const [nameDtoValue, setNameDtoValue] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('CSharp');
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [textAreaDtoGeneratorValue, setTextAreaDtoGeneratorValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  // Состояния для TrainAi
  const [textAreaTrainAiValue, setTextAreaTrainAiValue] = useState('');

  return (
    <>
      <div className="app-container">
        <div className="header">
            <h1>EasyDto</h1>
        </div>
        <div className="main-content">
          <div className="sidebar">
            <button onClick={() => setActiveSection('dto-generator')}>Генератор DTO</button>
            <button onClick={() => setActiveSection('train-ai')}>Обучение ИИ</button>
            <button onClick={() => setActiveSection('settings')}>Настройки</button>
          </div>
          <div className="content">
          {activeSection === 'dto-generator' && (
              <DtoGenerator
                nameDtoValue={nameDtoValue} setNameDtoValue={setNameDtoValue}
                selectedTechnology={selectedTechnology} setSelectedTechnology={setSelectedTechnology}
                commentsEnabled={commentsEnabled} setCommentsEnabled={setCommentsEnabled}
                textAreaValue={textAreaDtoGeneratorValue} setTextAreaValue={setTextAreaDtoGeneratorValue}
                outputValue={outputValue} setOutputValue={setOutputValue}
              />
            )}
            {activeSection === 'train-ai' && (
              <TrainAi 
                textAreaValue={textAreaTrainAiValue} setTextAreaValue={setTextAreaTrainAiValue}
              />)}
            {activeSection === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App