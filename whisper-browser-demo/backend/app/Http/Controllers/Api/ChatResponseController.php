<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatResponseController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:10000'],
            'language' => ['nullable', 'string', 'max:255'],
        ]);

        $message = $validated['message'];
        $language = $validated['language'] ?? null;

        $reply = $this->buildReply($message, $language);

        return response()->json([
            'reply' => $reply,
            'echo' => $message,
            'language' => $language,
        ]);
    }

    protected function buildReply(string $message, ?string $language): string
    {
        $summary = Str::limit(trim($message), 240);
        $intro = $language
            ? "Here is your {$language} ready summary:"
            : 'Here is what I understood from your recording:';

        $hints = [
            'Feel free to record another snippet if you need clarification.',
            'Let me know if you would like this rephrased in a different language.',
            'I can help you expand this transcript into a longer answer as well.',
        ];

        $hint = $hints[array_rand($hints)];

        return sprintf("%s %s\n\n%s", $intro, $summary, $hint);
    }
}
