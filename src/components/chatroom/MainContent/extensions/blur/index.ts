/* eslint-disable @typescript-eslint/no-this-alias */
import "image-capture";
import browserDetect from "platform-detect/browser.mjs";

import VideoBlurWorker from "./blur.worker.ts";

export class VideoBlurEffect {
  private blurWorker: Worker;

  constructor(canvasElement: HTMLCanvasElement) {
    this.blurWorker = new VideoBlurWorker();
    const offscreen = canvasElement.transferControlToOffscreen();
    this.blurWorker.postMessage({ type: "isSafari", data: browserDetect.safari });
    this.blurWorker.postMessage({ type: "createOffCanvas", canvas: offscreen }, [offscreen]);
  }

  public drawBlur(stream: MediaStream) {
    // create tempCanvas
    const [videoTrack] = stream.getVideoTracks();
    const imageCapture = new ImageCapture(videoTrack);

    const that = this;

    async function renderCanvasImg() {
      await imageCapture.grabFrame().then(videoBitMap => {
        that.blurWorker.postMessage({ type: "processVideo", video: videoBitMap }, [videoBitMap]);
      });
      return requestAnimationFrame(renderCanvasImg);
    }
    requestAnimationFrame(renderCanvasImg);
  }
}

export default VideoBlurEffect;
