# Хранение данных и поиск (ru/tt корпус)

Документ: что храним от аудио, в каком виде JSON, какие метрики в Postgres и как
устроен фильтрованный поиск (включая «RAG-lite»).

## 1. Где что лежит (гибрид: диск + Postgres)

Хранить полные транскрипты в Postgres — расточительно. Поэтому раздельно:

| Данные | Где | Зачем |
|---|---|---|
| Оригинал аудио `original_16k.wav` | диск `storage/<audio_id>/` | воспроизведение, повторная обработка |
| Обрезанное `processed.wav` (без пауз) | диск `storage/<audio_id>/` | быстрый плеер |
| Полный транскрипт `transcription.json` | диск `storage/<audio_id>/` | слова с таймкодами/тегами — источник правды |
| Плоский текст `transcription.txt` | диск `storage/<audio_id>/` | человекочитаемо, полнотекст |
| **Метаданные + индекс для поиска** | **Postgres** | фильтры, агрегаты, быстрый поиск |

Принцип: **Postgres = индекс и метрики, диск = тяжёлые артефакты.** В БД не кладём
сырой текст блобами — только то, по чему ищем/фильтруем/агрегируем.

## 2. Формат transcription.json

```jsonc
{
  "audio_id": "3f2b...e91",
  "filename": "razgovor_na_kuhne.mp3",
  "recorded_at": "2026-06-20T18:30:00",     // дата записи (если известна)
  "timeline": "original",                    // таймкоды в координатах оригинала
  "engine": "VAD + MMS-LID + Whisper-large-v3(ru) / Whisper-TT(tt)",
  "stats": {
    "total_sec": 41.05, "speech_sec": 33.2, "silence_removed_sec": 7.85,
    "trim_ratio": 0.809, "n_segments": 8
  },
  "segment_map": [                            // карта VAD orig<->trim (для плеера)
    {"orig_start": 0.0, "orig_end": 1.7, "trim_start": 0.0, "trim_end": 1.7}
  ],
  "words": [
    {
      "text": "станция",                      // нормализованное слово (для поиска)
      "raw": "станция,",                      // как выдала ASR (с пунктуацией)
      "start": 4.12, "end": 4.63,             // таймкоды в секундах (оригинал)
      "conf": 0.91,                           // уверенность (tt из Whisper-TT может быть null)
      "lang": "ru",                           // 'ru' | 'tt' | 'unknown'
      "seg_lang": "ru",                        // решение аудио-LID для сегмента
      "speaker": "мама"                       // ⟵ добавится после диаризации (пока null)
    }
  ]
}
```

Ключевые поля слова для поиска: `text` (нормализованное), `lang`, `start/end`
(прыжок к месту), `speaker`, `conf` (отсев мусора). `raw` — для отображения.

## 3. Postgres: что храним (метрики + индекс)

Уже есть (origin/main): `audio_files`, `speech_segments`, `words`, `word_counts`.

### audio_files — карточка записи + метрики
`id, filename, content_type, uploaded_at, recorded_at, folder_path,
primary_language, status, duration_sec, speech_sec, silence_removed_sec,
total_words, unique_words, words_per_minute, ru_words, tt_words, unknown_words,
avg_confidence`.

### words — «мешок слов» (bag-of-words), каждое слово = строка
`id, audio_id, text, start_sec, end_sec, language, confidence, position`
+ **(добавить)** `speaker_id`.
Это и есть индекс для поиска по слову: фильтр по `text` + `language` + джойн к
`audio_files` за датой.

### word_counts — частоты слова в пределах одного аудио
`id, audio_id, text, language, count` — для статистики и «топ слов».

### ⟵ Добавляем для требований

**speakers** — говорящие (мама/папа), глобально по корпусу:
```
speakers: id, label ('мама'/'папа'/'ребёнок'), voice_embedding (vector, для диаризации),
          created_at
words.speaker_id -> speakers.id        // у каждого слова — кто сказал
```
Диаризация (кто говорит) — отдельный шаг пайплайна (напр. pyannote / ECAPA-эмбеддинги
+ кластеризация); пока поле `speaker_id` = null, схема к нему готова.

**Полнотекстовый / нечёткий поиск по словам:**
- `pg_trgm` + GIN-индекс на `words.text` — **нечёткий** поиск (важно: татарская ASR
  ошибается в орфографии, точное совпадение слишком строгое; триграммы ловят «милодрама»≈«мелодрама»).
- либо `tsvector` + GIN на агрегированном тексте аудио — классический full-text.

## 4. Фильтрованный поиск + «RAG-lite»

### Базовые фильтры (то, что просили) — `date · word · speaker`
SQL поверх `words ⋈ audio_files ⋈ speakers`:
```sql
SELECT a.id, a.filename, w.text, w.start_sec, s.label
FROM words w
JOIN audio_files a ON a.id = w.audio_id
LEFT JOIN speakers s ON s.id = w.speaker_id
WHERE w.text % :query                       -- нечёткое совпадение (pg_trgm)
  AND a.recorded_at BETWEEN :from AND :to    -- фильтр по дате
  AND (:speaker IS NULL OR s.label = :speaker)
ORDER BY a.recorded_at DESC;
```
Результат сразу даёт таймкод `start_sec` — можно прыгнуть в плеере на это слово.

### Что ещё стоит добавить в фильтры (ты не упомянул)
- **language (ru/tt)** — «покажи только татарские слова/записи». Уже есть `words.language`.
- **confidence ≥ порог** — отсечь ненадёжные распознавания из выдачи (особенно tt).
- **диапазон по времени внутри аудио** — `start_sec` уже позволяет.
- **фраза / несколько слов подряд** — через `position` (n-граммы), а не одно слово.
- **тема/тег** — таблица `tags(id, audio_id, label)` (ручные или авто-темы) для группировки.
- **длительность / wpm / язык-доминанта записи** — фильтры по `audio_files` (есть).
- **комбо speaker+language** — «что мама говорила по-татарски».

### «Упрощённый RAG» (семантический поиск) — фаза 2
Кейворд-поиск находит точное слово; RAG-lite находит **по смыслу** («когда говорили
про садик»), даже если слова другие:
- завести `utterances(id, audio_id, speaker_id, start_sec, end_sec, text, embedding vector)`
  — реплики/фразы (между паузами), не отдельные слова;
- расширение **pgvector**, GIN/IVFFlat-индекс по `embedding`;
- эмбеддинги — мультиязычной моделью (ru+tt), напр. `intfloat/multilingual-e5` или
  `sentence-transformers/paraphrase-multilingual-MiniLM`;
- запрос: эмбеддим вопрос → `ORDER BY embedding <=> :q LIMIT k`, **с теми же фильтрами**
  (дата/спикер/язык) в `WHERE` → гибрид «фильтры + семантика».

Это и есть «RAG-lite»: retrieval релевантных реплик по вектору + структурные фильтры;
без генерации (или с опциональной выжимкой ответа поверх найденных реплик).

## 5. Что нужно от пайплайна для всего этого
- слова с таймкодами/языком/conf — **есть**;
- `recorded_at` — прокинуть из загрузки (есть поле);
- `speaker_id` — **нужен шаг диаризации** (новый этап);
- `utterances` + эмбеддинги — **новый шаг** (фаза 2, для RAG-lite).
