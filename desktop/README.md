# EasyDTO Desktop (WPF)

Настольная оболочка EasyDTO: WPF + WebView2 отображает production-сборку React-
интерфейса из `app/dist`, а Python-переводчик из `ai-translator` запускается
автоматически.

## Требования

- Windows 10/11;
- .NET 8 SDK (для сборки) или .NET 8 Desktop Runtime;
- Microsoft Edge WebView2 Runtime;
- Node.js 20+ и npm (для сборки React);
- Python 3.10–3.12 в `PATH` с установленными зависимостями (из корня репозитория):
  ```powershell
  cd D:\dev\easydto
  pip install -r ai-translator\requirements.txt
  ```

## Сборка

```powershell
# 1. React production-сборка
cd D:\dev\easydto\app
npm install
npm run build

# 2. WPF
cd D:\dev\easydto\desktop
dotnet build -c Debug
```

## Запуск

```powershell
D:\dev\easydto\desktop\bin\Debug\net8.0-windows\EasyDTO.Desktop.exe
```

Либо открыть `desktop\EasyDTO.Desktop.sln` в Visual Studio и нажать F5.

## Как это работает

1. Приложение ищет корень репозитория (`app` + `ai-translator`) вверх от своего
   каталога; путь можно задать через `EASYDTO_REPO_ROOT`.
2. `https://easydto.local/` сопоставляется с `app\dist` через
   `SetVirtualHostNameToFolderMapping`; WebView2 загружает `index.html` локально.
3. Перед запуском Python проверяется `GET http://127.0.0.1:5000/health`.
4. Если сервис не работает, запускается `python app.py` с рабочим каталогом
   `ai-translator` и `EASYDTO_ALLOWED_ORIGINS=https://easydto.local,...`.
5. Приложение ждёт `/health` до 180 секунд и показывает ошибку с хвостом вывода
   Python, если запуск не удался.
6. При закрытии завершается только тот процесс Python, который запустило само
   приложение. Уже работавший до запуска сервис не останавливается.
7. Второй экземпляр приложения не запускается — показывается сообщение
   «EasyDTO уже запущен», поэтому лишний Python-процесс не появляется.

## Переменные окружения

- `EASYDTO_REPO_ROOT` — явный путь к корню репозитория EasyDTO;
- `EASYDTO_PYTHON` — путь к `python.exe`, если Python не в `PATH`.

## Ограничения текущего этапа

- Установщик не создаётся, Python и модель не упаковываются в EXE.
- Модель при первом запуске скачивается Python-переводчиком в
  `ai-translator\models` (каталог исключён из Git).
- `app\dist` не хранится в Git — перед сборкой WPF нужно собрать React.
