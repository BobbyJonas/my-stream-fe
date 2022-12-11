import "image-capture";
import browserDetect from "platform-detect/browser.mjs";

import VideoSegmentWorker from "./segment.worker.ts";
import VideoBlurWorker from "./blur.worker.ts";

export class VideoBlurEffect {
  private canvas?: HTMLCanvasElement;
  private videoTrack?: MediaStreamTrack;

  private segmentWorker: Worker;
  private blurWorker: Worker;

  private currentDrawPromise?: Promise<ImageBitmap>;
  private grabFramePromise?: Promise<any>;
  private currentDrawPromiseResolve?: (result: ImageBitmap) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.segmentWorker = new VideoSegmentWorker();
    this.segmentWorker.postMessage({
      type: "createOffCanvas",
      width: canvas.width,
      height: canvas.height,
    });

    this.blurWorker = new VideoBlurWorker();
    this.blurWorker.postMessage({ type: "isSafari", isSafari: browserDetect.safari });
    this.blurWorker.postMessage({
      type: "createOffCanvas",
      width: canvas.width,
      height: canvas.height,
    });
    this.segmentWorker.onmessage = this.onWorkerMessage.bind(this);
    this.blurWorker.onmessage = this.onWorkerMessage.bind(this);
  }

  public draw(
    videoBitmap: ImageBitmap,
    canvas: HTMLCanvasElement,
    videoTrack: MediaStreamTrack,
    imageCapture: ImageCapture
  ): Promise<ImageBitmap> {
    this.canvas = canvas;
    this.videoTrack = videoTrack;
    this.currentDrawPromise = new Promise<ImageBitmap>((resolve, reject) => {
      this.segmentWorker.postMessage({ type: "segment", bitmap: videoBitmap });
      this.blurWorker.postMessage({ type: "process", bitmap: videoBitmap });
      this.currentDrawPromiseResolve = resolve;
    });

    return this.currentDrawPromise;
  }

  private async onWorkerMessage(
    event: MessageEvent<{ type: string; bitmap?: ImageBitmap; segment?: any }>
  ): Promise<void> {
    const eventData = event.data;

    switch (eventData.type) {
      case "segment": {
        this.blurWorker.postMessage({ type: "segment", segment: eventData.segment });
        break;
      }
      case "process": {
        if (!eventData.bitmap) return;
        this.currentDrawPromiseResolve?.(eventData.bitmap);
        break;
      }
      default:
        break;
    }
  }
}

export default VideoBlurEffect;
