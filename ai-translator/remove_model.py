import os
import shutil

model_path = "./mbart-large-50-many-to-many-mmt"

# Проверка наличия директории перед удалением
if os.path.exists(model_path):
    shutil.rmtree(model_path)
    print(f"Директория {model_path} удалена.")
else:
    print(f"Директория {model_path} не существует.")