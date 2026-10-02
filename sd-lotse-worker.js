// Hintergrund-Thread fuer SD Lotse (lokales KI-Modell via WebLLM) in allen
// SD-Apps. Die Version muss zur Version in sd-ki.js (WEBLLM_URL) passen.
import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm@0.2.83';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
  handler.onmessage(msg);
};
