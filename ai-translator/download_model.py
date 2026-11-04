from transformers import T5ForConditionalGeneration, T5Tokenizer
import os

def download_model(model_name, cache_dir):
    # Создание директории для кеша, если она не существует
    os.makedirs(cache_dir, exist_ok=True)

    # Скачивание модели и токенизатора в указанную директорию
    model = T5ForConditionalGeneration.from_pretrained(model_name, cache_dir=cache_dir)
    tokenizer = T5Tokenizer.from_pretrained(model_name, cache_dir=cache_dir)

    return model, tokenizer