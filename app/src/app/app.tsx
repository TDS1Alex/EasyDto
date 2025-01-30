import { DtoGenerator, AITrain, Settings } from '../dto-generator/sections';
import './app.css';

import { useState } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('dto-generator');

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
            {activeSection === 'dto-generator' && <DtoGenerator />}
            {activeSection === 'ai-train' && <Settings />}
            {activeSection === 'settings' && <AITrain />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App