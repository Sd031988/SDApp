// Hintergrund-Thread für die KI-Vervollständigung im Code-Studio (WebLLM).
// Die Version muss zu WEBLLM in ki-vervollstaendigung.js passen.
import { WebWorkerMLCEngineHandler } from 'https://esm.run/@mlc-ai/web-llm@0.2.83';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => {
  handler.onmessage(msg);
};
