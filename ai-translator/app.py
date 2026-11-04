import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS

from download_model import download_model
from clear_cache import clear_cache
from train_model import fine_tune_model

# ---------------------------------------------------------------------------
# Конфигурация из переменных окружения (инфраструктура, не бизнес-логика)
# ---------------------------------------------------------------------------
def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')

def _default_model_dir() -> str:
    """Каталог модели по умолчанию: рядом со скриптом/exe, не зависит от CWD."""
    if getattr(sys, 'frozen', False):
        # PyInstaller: рядом с исполняемым файлом
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, 'models')

port = int(os.environ.get('EASYDTO_PORT', '5000'))
debug = _env_bool('EASYDTO_DEBUG', True)
cache_dir = os.environ.get('EASYDTO_MODEL_DIR', _default_model_dir())
api_token = os.environ.get('EASYDTO_API_TOKEN', '') or None

# Разрешённые источники CORS: app://bundle (Electron) + dev-источники Vite
default_origins = 'app://bundle,http://localhost:5173,http://127.0.0.1:5173'
allowed_origins = [
    o.strip()
    for o in os.environ.get('EASYDTO_ALLOWED_ORIGINS', default_origins).split(',')
    if o.strip()
]

app = Flask(__name__)
CORS(app, origins=allowed_origins)

device = 'cpu'
model_name = 'utrobinmv/t5_translate_en_ru_zh_small_1024'


@app.before_request
def check_host():
    """Принимаем запросы только с локальным Host-заголовком."""
    host = request.host.split(':')[0].lower()
    if host not in ('127.0.0.1', 'localhost'):
        return jsonify({'error': 'Forbidden'}), 403


@app.before_request
def check_token():
    """Проверка токена сессии для защищённых маршрутов.

    Токен задаётся через EASYDTO_API_TOKEN (генерируется Electron main process
    на время работы приложения). Если токен не задан (dev-режим) — пропускаем.
    /health не защищён, чтобы main process мог проверять готовность сервиса.
    """
    if api_token is None:
        return None
    if request.path in ('/health',):
        return None
    provided = request.headers.get('X-EasyDTO-Token', '')
    if provided != api_token:
        return jsonify({'error': 'Unauthorized'}), 401
    return None


# ---------------------------------------------------------------------------
# Загрузка модели (существующая логика, пути приведены к абсолютным)
# ---------------------------------------------------------------------------
os.makedirs(cache_dir, exist_ok=True)

# Очистка кэша
# clear_cache(cache_dir)

# Проверка, существует ли уже скачанная модель
if not os.path.exists(os.path.join(cache_dir, model_name)):
    # Скачивание модели и токенизатора
    model, tokenizer = download_model(model_name, cache_dir)
else:
    # Загрузка модели и токенизатора из локального кеша
    from transformers import T5ForConditionalGeneration, T5Tokenizer
    model = T5ForConditionalGeneration.from_pretrained(cache_dir)
    tokenizer = T5Tokenizer.from_pretrained(cache_dir)

# Перемещение модели на устройство
model.to(device)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text', '')

    prefix = 'translate to en: '
    src_text = prefix + text

    input_ids = tokenizer(src_text, return_tensors="pt")
    generated_tokens = model.generate(**input_ids.to(device))

    result = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)

    return result[0]


@app.route('/train', methods=['POST'])
def train():
    data = request.json
    examples = data.get('examples', [])

    # Дообучение модели
    global model
    model = fine_tune_model(model, tokenizer, examples, cache_dir)

    return jsonify({'message': 'Model fine-tuned successfully'})


if __name__ == '__main__':
    # Production-режим: без debug-релоадера, только 127.0.0.1
    app.run(host='127.0.0.1', port=port, debug=debug, use_reloader=False)