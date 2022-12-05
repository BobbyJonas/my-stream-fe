/* eslint-disable node/handle-callback-err */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-this-alias */

import { extensions } from "..";
const videoExtensions = extensions?.filter(item => item.type === "video") || [];

export class VideoEffectCanvas {
  running: boolean = true;

  videoTrack: MediaStreamTrack | null = null;
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D | null;

  extensionFn: any[] = [];
  imageCapture?: ImageCapture;
  grabFramePromise?: Promise<any>;

  constructor(
    canvas: HTMLCanvasElement,
    canvasContext: CanvasRenderingContext2D,
    mediaStream: MediaStream
  ) {
    this.setNewMediaSource(mediaStream);
    this.canvas = canvas;
    const { width, height } = this.videoTrack?.getSettings() || {};
    Object.assign(this.canvas, {
      width,
      height,
    });
    this.canvasContext = canvasContext;
    this.initExtension();
  }

  initExtension(): void {
    this.extensionFn = [];
    let k = -1;
    videoExtensions.forEach(extItem => {
      const Module = extItem.src?.default;
      if (Module) {
        this.extensionFn[++k] = new Module(this.canvas);
      }
    });
    console.log(this.extensionFn);
  }

  setNewMediaSource(mediaStream: MediaStream) {
    this.videoTrack = mediaStream.getVideoTracks()[0];
    const that = this;
    this.videoTrack.addEventListener("ended", () => {
      that.running = false;
    });
    this.running = true;
    setTimeout(() => {
      if (this.videoTrack) this.imageCapture = new ImageCapture(this.videoTrack);
      requestAnimationFrame(this.requestAnimationFrameFn.bind(this));
    }, 0);
  }

  public async requestAnimationFrameFn() {
    if (
      !this.running ||
      !this.canvasContext ||
      !this.videoTrack ||
      this.videoTrack.readyState !== "live" ||
      !this.imageCapture ||
      this.imageCapture?.track?.readyState !== "live" ||
      !this.imageCapture?.track?.enabled
    ) {
      return requestAnimationFrame(this.requestAnimationFrameFn.bind(this));
    }

    let resVideoBitmap: ImageBitmap;
    if (!this.grabFramePromise) {
      this.grabFramePromise = this.imageCapture
        .grabFrame()
        .then(async videoBitmap => {
          resVideoBitmap = videoBitmap;
          try {
            for (let k = 0; k < this.extensionFn?.length; k++) {
              resVideoBitmap =
                (await this.extensionFn[k]?.draw?.(
                  resVideoBitmap,
                  this.canvas,
                  this.videoTrack,
                  this.imageCapture
                )) || resVideoBitmap;
            }
          } catch (e) {
            console.warn(e);
          } finally {
            this.canvasContext?.drawImage(
              resVideoBitmap,
              0,
              0,
              this.canvas.width,
              this.canvas.height
            );
          }
        })
        .then(() => {
          this.grabFramePromise = undefined;
        })
        .catch(error => {});
    }

    return requestAnimationFrame(this.requestAnimationFrameFn.bind(this));
  }
}

export default VideoEffectCanvas;
