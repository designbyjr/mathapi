import React from "react";
import { Recorder } from "./components/recorder";
import { Mic, Video, MoreHorizontal, X } from "lucide-react";

const gradientStyle = {
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(180,224,255,0.85) 40%, rgba(0,122,255,0.65) 100%)"
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const App: React.FC = () => {
  const [status, setStatus] = React.useState<string | null>("Loading Whisper Small Distil…");
  const [error, setError] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);

  const handleTranscription = React.useCallback((text: string) => {
    setTranscript(text);
    setHistory((prev) => [text, ...prev].slice(0, 5));
    setError(null);
  }, []);

  return (
    <Recorder
      onTranscription={handleTranscription}
      onStatusChange={(value) => setStatus(value)}
      onError={(message) => setError(message)}
    >
      {({ startRecording, stopRecording, isRecording, isProcessing, isLoadingModel, volume }) => {
        const normalizedVolume = clamp(volume / 0.25, 0, 1);
        const scale = 1 + normalizedVolume * 0.45;
        const shadowOpacity = 0.25 + normalizedVolume * 0.35;

        const handleMicClick = () => {
          if (isRecording) {
            stopRecording();
          } else {
            void startRecording();
          }
        };

        return (
          <main className="relative flex min-h-screen flex-col items-center justify-between bg-white px-6 pb-12 pt-24 text-slate-900">
            <header className="flex w-full max-w-md flex-col items-center gap-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Aurora Voice</p>
              <h1 className="text-4xl font-semibold">Speak and see the translation appear.</h1>
              <p className="text-base text-slate-500">
                Whisper Small Distil runs entirely in your browser with Transformers.js. Tap the microphone to begin and watch the
                orb react to your voice.
              </p>
            </header>

            <div className="flex flex-1 items-center">
              <div
                className="relative flex h-72 w-72 items-center justify-center rounded-full transition-transform duration-150 ease-out"
                style={{
                  ...gradientStyle,
                  transform: `scale(${scale})`,
                  boxShadow: `0 24px 60px rgba(59, 130, 246, ${shadowOpacity.toFixed(2)})`
                }}
              >
                <div className="h-20 w-20 rounded-full bg-white/70 backdrop-blur" />
              </div>
            </div>

            <section className="flex w-full max-w-xl flex-col items-center gap-6">
              <div className="min-h-[72px] w-full rounded-3xl border border-slate-200/70 bg-white/70 px-6 py-5 text-center text-lg font-medium text-slate-700 shadow-sm backdrop-blur">
                {isProcessing ? "Transcribing…" : transcript || "Your words will appear here after recording."}
              </div>

              <div className="flex w-full items-center justify-between gap-4">
                <button
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
                  aria-label="Video"
                >
                  <Video className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoadingModel || isProcessing}
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-0 text-white shadow-lg transition focus:outline-none ${
                    isRecording
                      ? "bg-red-500 shadow-red-300/60"
                      : "bg-blue-500 shadow-blue-300/60 hover:bg-blue-600"
                  } ${isLoadingModel || isProcessing ? "opacity-60" : ""}`}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  <Mic className="h-9 w-9" />
                </button>
                <button
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
                  aria-label="Close"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="flex w-full flex-col items-center gap-2 text-sm text-slate-500">
                {status && <p>{status}</p>}
                {error && <p className="text-red-500">{error}</p>}
                {history.length > 1 && (
                  <div className="mt-2 flex w-full flex-col gap-1 text-left text-xs text-slate-400">
                    {history.slice(1, 4).map((item, index) => (
                      <p key={index} className="truncate">
                        {item}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        );
      }}
    </Recorder>
  );
};

export default App;
