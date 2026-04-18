# ПВЗ Аналитика (React + Vite)

Проект готов к деплою на Vercel.

## Локальный запуск

```bash
cd "/Users/yroslav/pvz-analytics-site"
npm install
npm run dev
```

## Деплой на Vercel через GitHub

1. Создай новый репозиторий на GitHub (лучше новый, например `pvz-analytics-site`).
2. Загрузи в него файлы из этой папки.
3. В Vercel выбери **Add New -> Project** и импортируй репозиторий.
4. Настройки Vercel:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Нажми **Deploy**.
