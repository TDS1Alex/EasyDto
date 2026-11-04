import shutil
import os

def clear_cache(cache_dir):
    # Удаление директории с кешем
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)

    # Создание директории заново
    os.makedirs(cache_dir, exist_ok=True)