# Whisper Small Distil Browser Demo

This folder contains a dual-stack project that showcases running the `whisper-small-distil` model entirely in the browser with Transformers.js, paired with a Laravel 12 backend that mimics a chat-style assistant.

## Project structure

```
whisper-browser-demo/
├── frontend/   # Vite + React + shadcn-inspired components for the chat UI
└── backend/    # Laravel 12 API that accepts transcripts and returns assistant replies
```

## Features

- 🎙️ Record and transcribe audio directly in the browser using the MediaRecorder API.
- 🤖 Load the `Xenova/whisper-small-distil` model via Transformers.js for low-latency on-device speech-to-text.
- 💬 Display transcripts in a ChatGPT-style interface built with shadcn UI primitives.
- 🔁 Forward transcripts to a Laravel API that returns contextual assistant replies (easy to swap with a real LLM).

## Local development

1. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Visit http://localhost:5173.

2. **Backend**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan serve
   ```
   The API listens on http://localhost:8000.

3. **Connect both**
   - Keep both development servers running.
   - Open the frontend in a browser, allow microphone permissions, and click **Record**. The transcript should appear in the chat along with the Laravel-generated reply.

## Production considerations

- Host the Vite build output (in `frontend/dist`) on a static hosting platform.
- Deploy the Laravel API behind HTTPS and configure CORS as needed.
- Replace the stubbed assistant response with calls to your preferred LLM provider.
- Consider persisting conversation history and adding authentication before shipping to users.
