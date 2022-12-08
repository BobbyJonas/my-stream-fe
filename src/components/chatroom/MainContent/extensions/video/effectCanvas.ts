/* eslint-disable no-lonely-if */
/* eslint-disable node/handle-callback-err */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-this-alias */

import { extensions } from "..";
const videoExtensions = extensions?.filter(item => item.type === "video") || [];

export class VideoEffectCanvas {
  running: boolean = true;

  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D | null;
  videoTrack: MediaStreamTrack | null = null;
  videoRef: HTMLVideoElement;

  extensionFn: any[] = [];
  imageCapture?: ImageCapture;
  imageCaptureFlag: boolean = true;
  grabFramePromise?: Promise<any>;

  constructor(
    canvas: HTMLCanvasElement,
    canvasContext: CanvasRenderingContext2D,
    mediaStream: MediaStream,
    videoRef: HTMLVideoElement
  ) {
    this.setNewMediaSource(mediaStream);
    this.canvas = canvas;
    this.videoRef = videoRef;
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
    this.videoTrack.addEventListener("ended", () => {
      console.log("ended");

      this.running = false;
    });
    this.running = true;
    setTimeout(() => {
      this.imageCaptureFlag = true;
      requestAnimationFrame(this.requestAnimationFrameFn);
    }, 0);
  }

  public requestAnimationFrameFn = () => {
    if (
      !this.running ||
      !this.canvasContext ||
      !this.videoTrack ||
      this.videoTrack.readyState !== "live"
    ) {
      this.imageCaptureFlag = true;
      return requestAnimationFrame(this.requestAnimationFrameFn);
    }

    if (this.imageCaptureFlag) {
      this.imageCapture = new ImageCapture(this.videoTrack);
      this.imageCaptureFlag = false;
    }

    if (
      !this.imageCapture ||
      !window.ImageCapture?.prototype?.grabFrame ||
      this.imageCapture?.track?.readyState !== "live" ||
      !this.imageCapture?.track?.enabled
    ) {
      this.canvasContext?.drawImage(this.videoRef, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      if (window.ImageCapture?.prototype?.grabFrame) {
        let resVideoBitmap: ImageBitmap;
        if (!this.grabFramePromise) {
          // console.log(this.imageCapture);

          // https://w3c.github.io/mediacapture-image/index.html#dom-imagecapture-grabframe
          this.grabFramePromise = this.imageCapture
            .grabFrame()
            .then(async videoBitmap => {
              // console.log(videoBitmap);

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
            .catch(error => {
              this.grabFramePromise = undefined;
              console.warn(error);
            });
        }
      }
    }

    return requestAnimationFrame(this.requestAnimationFrameFn);
  };
}

export default VideoEffectCanvas;
