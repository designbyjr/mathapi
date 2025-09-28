import React from "react";
import { type Pipeline } from "@xenova/transformers";
import {
  isWebGPUSupported,
  loadWhisperPipeline
} from "../lib/whisper";

interface RecorderRenderProps {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  isLoadingModel: boolean;
  volume: number;
}

interface RecorderProps {
  onTranscription: (text: string) => void;
  onStatusChange?: (status: string | null) => void;
  onError?: (error: string) => void;
  children: (props: RecorderRenderProps) => React.ReactNode;
}

export const Recorder: React.FC<RecorderProps> = ({
  onTranscription,
  onStatusChange,
  onError,
  children
}) => {
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isLoadingModel, setIsLoadingModel] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [volume, setVolume] = React.useState(0);
  const pipelineRef = React.useRef<Pipeline | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const dataArrayRef = React.useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = React.useRef<number>();

  const stopMonitoringVolume = React.useCallback(async () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }

    setVolume(0);

    try {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
    } catch (error) {
      console.warn("Failed to close audio context", error);
    } finally {
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoadingModel(true);
        onStatusChange?.("Loading Whisper Small Distil…");
        const pipeline = await loadWhisperPipeline((message) => {
          if (cancelled) return;
          const trimmed = message.trim();
          if (trimmed.length > 0) {
            onStatusChange?.(`Loading Whisper Small Distil… ${trimmed}`);
          }
        });
        if (cancelled) {
          return;
        }

        pipelineRef.current = pipeline;
        const accelerator = isWebGPUSupported ? "WebGPU" : "WebAssembly";
        onStatusChange?.(`Tap the microphone to begin (${accelerator}).`);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          onError?.("Failed to load Whisper model. See console for details.");
          onStatusChange?.(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModel(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      pipelineRef.current = null;
      stopMonitoringVolume();
    };
  }, [onError, onStatusChange, stopMonitoringVolume]);

  const monitorVolume = React.useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    const buffer = new ArrayBuffer(
      analyser.fftSize * Float32Array.BYTES_PER_ELEMENT
    );
    dataArrayRef.current = new Float32Array(buffer) as Float32Array<ArrayBuffer>;

    const updateVolume = () => {
      const analyserNode = analyserRef.current;
      const array = dataArrayRef.current;
      if (!analyserNode || !array) return;

      analyserNode.getFloatTimeDomainData(array);
      let sumSquares = 0;
      for (let i = 0; i < array.length; i += 1) {
        const value = array[i];
        sumSquares += value * value;
      }
      const rms = Math.sqrt(sumSquares / array.length);
      setVolume(rms);
      rafRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }, []);

  const startRecording = React.useCallback(async () => {
    if (isLoadingModel || isProcessing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      monitorVolume(stream);

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
          await audioContext.close();

          if (!pipelineRef.current) {
            throw new Error("Whisper pipeline is not ready");
          }

          const result = await pipelineRef.current(data, {
            sampling_rate: sampleRate,
            chunk_length_s: 30,
            return_timestamps: false
          });
          const text = typeof result === "string" ? result : (result as { text?: string })?.text ?? "";
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
          onStatusChange?.("Tap the microphone to begin.");
        }
      };

      recorder.start();
      setIsRecording(true);
      onStatusChange?.("Listening…");
    } catch (error) {
      console.error(error);
      onError?.("Microphone permission denied or unavailable.");
      onStatusChange?.(null);
      await stopMonitoringVolume();
    }
  }, [isLoadingModel, isProcessing, monitorVolume, onError, onStatusChange, stopMonitoringVolume]);

  const stopRecording = React.useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    stopMonitoringVolume();
  }, [stopMonitoringVolume]);

  return <>{children({ startRecording, stopRecording, isRecording, isProcessing, isLoadingModel, volume })}</>;
};
