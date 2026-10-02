// Hintergrund-Thread fuer das lokale Llama-Modell (WebLLM).
// Das Modell rechnet hier statt im Haupt-Thread, damit die Seite beim
// Laden und beim Antworten nicht einfriert. Die Version muss zur Version
// in index.html (WEBLLM_URL) passen.
import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm@0.2.83';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
  handler.onmessage(msg);
};
