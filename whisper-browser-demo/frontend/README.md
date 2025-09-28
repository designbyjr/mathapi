# Whisper Small Distil Browser Demo (Frontend)

This Vite + React single page application demonstrates how to:

- Capture microphone audio in the browser with the MediaRecorder API.
- Run speech-to-text locally using [`@xenova/transformers`](https://github.com/xenova/transformers.js) and the `Xenova/whisper-small-distil` model.
- Present the transcript in a chat-style UI built with shadcn-inspired components.
- Send the final transcript to a Laravel backend for additional processing or generating responses.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   The app will be available on [http://localhost:5173](http://localhost:5173).

3. Ensure the Laravel API from `../backend` is running on http://localhost:8000. The React app posts transcripts to `/api/chat/respond`.

## Environment variables

Transformers.js stores model artifacts in IndexedDB by default. To customise storage or inference behaviour you can create a `.env` file and pass options via `import.meta.env`.

## Production build

```bash
npm run build
npm run preview
```

## Notes

- The Whisper model is loaded lazily on first render. You can prefetch it by calling the recorder's `warmup` method if needed.
- Audio is transcribed entirely in the browser; recordings never leave the client unless you extend the app.
