# Laravel 12 API for Whisper Browser Demo

This Laravel 12 application powers the server-side portion of the Whisper browser demo. It accepts transcripts generated in the browser and returns concise assistant responses that can be displayed in the chat UI.

## Quick start

1. Install dependencies:

   ```bash
   composer install
   ```

2. Copy the example environment file and generate an application key:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Run database migrations (SQLite is pre-configured by default):

   ```bash
   php artisan migrate
   ```

4. Start the development server:

   ```bash
   php artisan serve
   ```

   The API will be available on [http://localhost:8000](http://localhost:8000).

## API endpoints

### `POST /api/chat/respond`

Accepts the latest transcript (and optionally a preferred language) and returns a friendly assistant-style summary.

#### Request body

```json
{
  "message": "string (required)",
  "language": "string | null"
}
```

#### Sample response

```json
{
  "reply": "Here is what I understood from your recording: …",
  "echo": "…",
  "language": null
}
```

The response currently uses a simple summariser stub so the project can run entirely offline. You can replace the logic in `App\\Http\\Controllers\\Api\\ChatResponseController` with calls to OpenAI, Azure OpenAI, or any other provider.

## Testing

```bash
php artisan test
```

## Next steps

- Persist conversation history in a database.
- Integrate a real LLM provider for contextual replies.
- Add authentication to protect the API when deploying.
