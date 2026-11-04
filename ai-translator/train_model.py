from transformers import T5ForConditionalGeneration, T5Tokenizer, Trainer, TrainingArguments
import torch

def fine_tune_model(model, tokenizer, examples, cache_dir):
    # Подготовка данных для обучения
    train_texts = [example["input"] for example in examples]
    train_labels = [example["output"] for example in examples]

    # Токенизация данных
    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=512, return_tensors="pt")
    train_labels_encodings = tokenizer(train_labels, truncation=True, padding=True, max_length=512, return_tensors="pt")

    # Подготовка датасета
    class TranslationDataset(torch.utils.data.Dataset):
        def __init__(self, encodings, labels):
            self.encodings = encodings
            self.labels = labels

        def __getitem__(self, idx):
            item = {key: val[idx] for key, val in self.encodings.items()}
            item['labels'] = self.labels['input_ids'][idx]
            return item

        def __len__(self):
            return len(self.encodings['input_ids'])

    train_dataset = TranslationDataset(train_encodings, train_labels_encodings)

    # Настройка аргументов обучения
    training_args = TrainingArguments(
        output_dir=cache_dir,
        num_train_epochs=3,
        per_device_train_batch_size=1,
        save_steps=10_000,
        save_total_limit=2,
    )

    # Создание тренера
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
    )

    # Обучение модели
    trainer.train()

    return model