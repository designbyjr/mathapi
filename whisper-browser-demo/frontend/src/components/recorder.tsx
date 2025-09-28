import { Loader2, Mic, Square } from "lucide-react";
import React from "react";
import { pipeline, type Pipeline } from "@xenova/transformers";
import { Button } from "./ui/button";

interface RecorderProps {
  onTranscription: (text: string) => void;
  onStatusChange?: (status: string | null) => void;
  onError?: (error: string) => void;
}

export const Recorder: React.FC<RecorderProps> = ({
  onTranscription,
  onStatusChange,
  onError
}) => {
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isLoadingModel, setIsLoadingModel] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const pipelineRef = React.useRef<Pipeline | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoadingModel(true);
        onStatusChange?.("Loading Whisper model…");
        pipelineRef.current = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-small-distil",
          {
            quantized: true
          }
        );
        if (!cancelled) {
          onStatusChange?.(null);
        }
      } catch (error) {
        console.error(error);
        onError?.("Failed to load Whisper model. See console for details.");
        onStatusChange?.(null);
      } finally {
        if (!cancelled) {
          setIsLoadingModel(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      pipelineRef.current = null;
    };
  }, [onError, onStatusChange]);

  const startRecording = async () => {
    if (isLoadingModel) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setIsProcessing(true);
          onStatusChange?.("Transcribing audio…");
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await blob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
          const data = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;
          audioContext.close();

          if (!pipelineRef.current) {
            throw new Error("Whisper pipeline is not ready");
          }

          const result = await pipelineRef.current(data, {
            sampling_rate: sampleRate,
            chunk_length_s: 30,
            return_timestamps: false
          });
          const text = typeof result === "string" ? result : result?.text ?? "";
          if (text.trim().length > 0) {
            onTranscription(text.trim());
          } else {
            onError?.("No speech detected in recording.");
          }
        } catch (error) {
          console.error(error);
          onError?.("Unable to transcribe recording.");
        } finally {
          setIsProcessing(false);
          onStatusChange?.(null);
        }
      };

      recorder.start();
      setIsRecording(true);
      onStatusChange?.("Recording…");
    } catch (error) {
      console.error(error);
      onError?.("Microphone permission denied or unavailable.");
      onStatusChange?.(null);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoadingModel || isProcessing}
        className="flex items-center gap-2"
      >
        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {isRecording ? "Stop" : "Record"}
      </Button>
      {isLoadingModel && (
        <span className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading model…
        </span>
      )}
      {isProcessing && !isLoadingModel && (
        <span className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing…
        </span>
      )}
    </div>
  );
};
