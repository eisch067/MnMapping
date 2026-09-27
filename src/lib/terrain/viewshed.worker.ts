import { calculateViewshed, type ViewshedRequest } from "./viewshed";

self.onmessage = (event: MessageEvent<ViewshedRequest>) => {
  try {
    const visible = calculateViewshed(event.data);
    self.postMessage({ visible }, { transfer: [visible.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Viewshed computation failed." });
  }
};
