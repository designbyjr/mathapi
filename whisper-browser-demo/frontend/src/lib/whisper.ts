import { env, pipeline, type Pipeline } from "@xenova/transformers";
import { executionProviders } from "@xenova/transformers/src/backends/onnx.js";

type WhisperProgress = (message: string) => void;

const hasNavigator = typeof navigator !== "undefined";
const hasHardwareConcurrency = hasNavigator && typeof navigator.hardwareConcurrency === "number";
const isWebGPUSupported = hasNavigator && "gpu" in navigator;

const wasmBackend = env.backends?.onnx?.wasm as Record<string, unknown> | undefined;
if (wasmBackend) {
  wasmBackend["proxy"] = false;
  if (hasHardwareConcurrency) {
    const threadBudget = Math.max(1, Math.min(4, navigator.hardwareConcurrency));
    wasmBackend["numThreads"] = threadBudget;
  }
}

if (isWebGPUSupported) {
  if (!executionProviders.includes("webgpu")) {
    executionProviders.unshift("webgpu");
  }
} else {
  const index = executionProviders.indexOf("webgpu");
  if (index !== -1) {
    executionProviders.splice(index, 1);
  }
}

env.allowLocalModels = false;

type ProgressPayload = {
  status?: string;
  file?: string;
};

const MODEL_ID = "Xenova/whisper-small-distil";
let whisperPipelinePromise: Promise<Pipeline> | null = null;

export { isWebGPUSupported };

export async function loadWhisperPipeline(progress?: WhisperProgress): Promise<Pipeline> {
  if (!whisperPipelinePromise) {
    const progressCallback = progress
      ? (payload: ProgressPayload) => {
          if (!payload || !payload.status) return;
          const suffix = payload.file ? ` (${payload.file})` : "";
          progress(`${payload.status}${suffix}`);
        }
      : undefined;

    whisperPipelinePromise = pipeline("automatic-speech-recognition", MODEL_ID, {
      quantized: true,
      progress_callback: progressCallback
    }).catch((error) => {
      whisperPipelinePromise = null;
      throw error;
    });
  } else if (progress) {
    progress("Model ready");
  }

  return whisperPipelinePromise;
}
