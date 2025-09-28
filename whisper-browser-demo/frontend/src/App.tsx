import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { ScrollArea } from "./components/ui/scroll-area";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Recorder } from "./components/recorder";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import type { ChatMessage } from "./types/chat";

const ASSISTANT_NAME = "Aurora";

const createMessage = (partial: Omit<ChatMessage, "id" | "timestamp">): ChatMessage => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  ...partial
});

function roleInitial(role: ChatMessage["role"]): string {
  switch (role) {
    case "assistant":
      return "A";
    case "user":
      return "U";
    default:
      return "S";
  }
}

const App: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "system",
      role: "system",
      content:
        "You are Aurora, a friendly guide that can translate voice notes in real-time and answer follow up questions.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  const appendMessage = React.useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const requestAssistantResponse = React.useCallback(async (prompt: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/chat/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: prompt })
      });

      if (!response.ok) {
        throw new Error(`Assistant request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      return (
        data.reply ??
        "I'm unable to reach the assistant backend right now, but I received your message."
      );
    } catch (error) {
      console.error(error);
      return "The assistant service is offline. Try again once the Laravel backend is running.";
    }
  }, []);

  const handleSend = React.useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setError(null);
      const userMessage = createMessage({ role: "user", content: content.trim() });
      appendMessage(userMessage);
      setIsSending(true);
      const reply = await requestAssistantResponse(content.trim());
      appendMessage(createMessage({ role: "assistant", content: reply }));
      setIsSending(false);
    },
    [appendMessage, requestAssistantResponse]
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = inputValue.trim();
      if (!value) return;
      setInputValue("");
      await handleSend(value);
    },
    [handleSend, inputValue]
  );

  const handleTranscription = React.useCallback(
    async (text: string) => {
      appendMessage(createMessage({ role: "user", content: text }));
      const reply = await requestAssistantResponse(text);
      appendMessage(createMessage({ role: "assistant", content: reply }));
    },
    [appendMessage, requestAssistantResponse]
  );

  return (
    <main className="flex min-h-screen flex-col bg-background p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Whisper Small Distil Playground</h1>
          <p className="text-muted-foreground">
            Capture speech in the browser, transcribe it locally with Transformers.js, and converse with a Laravel-powered
            assistant.
          </p>
        </header>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-left">
              <CardTitle>Chat with {ASSISTANT_NAME}</CardTitle>
              <CardDescription>
                Use the record button to capture your voice or type directly below. Messages are mirrored into the Laravel backend.
              </CardDescription>
            </div>
            <Recorder
              onTranscription={handleTranscription}
              onStatusChange={(value) => {
                setStatus(value);
                if (value) {
                  setError(null);
                }
              }}
              onError={(message) => setError(message)}
            />
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="rounded-lg border border-border">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{roleInitial(message.role)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {message.role === "assistant"
                              ? ASSISTANT_NAME
                              : message.role === "user"
                              ? "You"
                              : "System"}
                          </span>
                          <span>·</span>
                          <time dateTime={new Date(message.timestamp).toISOString()}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </time>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>

          <CardFooter>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
              <Textarea
                placeholder="Type your message or record using the button above…"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={isSending}
              />
              <div className="flex items-center justify-between gap-3">
                <Input
                  placeholder="Optional translation target language (e.g. 'French')"
                  onChange={() => {}}
                  className="max-w-sm"
                />
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Sending…" : "Send"}
                </Button>
              </div>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default App;
