import { DtoGenerator, AITrain, Settings } from '../core/sections';
import './app.css';

import { useState } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('dto-generator');

  // Состояние для DtoGenerator
  const [nameDtoValue, setNameDtoValue] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('CSharp');
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  return (
    <>
      <div className="app-container">
        <div className="header">
            <h1>EasyDto</h1>
        </div>
        <div className="main-content">
          <div className="sidebar">
            <button onClick={() => setActiveSection('dto-generator')}>Генератор DTO</button>
            <button onClick={() => setActiveSection('ai-train')}>Обучение ИИ</button>
            <button onClick={() => setActiveSection('settings')}>Настройки</button>
          </div>
          <div className="content">
          {activeSection === 'dto-generator' && (
              <DtoGenerator
                nameDtoValue={nameDtoValue} setNameDtoValue={setNameDtoValue}
                selectedTechnology={selectedTechnology} setSelectedTechnology={setSelectedTechnology}
                commentsEnabled={commentsEnabled} setCommentsEnabled={setCommentsEnabled}
                textAreaValue={textAreaValue} setTextAreaValue={setTextAreaValue}
                outputValue={outputValue} setOutputValue={setOutputValue}
              />
            )}
            {activeSection === 'ai-train' && <Settings />}
            {activeSection === 'settings' && <AITrain />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App