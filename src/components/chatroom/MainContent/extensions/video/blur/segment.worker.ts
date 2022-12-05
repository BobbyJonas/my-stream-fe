/* eslint-disable @typescript-eslint/ban-ts-comment */

importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2",
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0"
);
declare let tf: any;
declare let bodyPix: any;

tf.getBackend();
// @ts-ignore
let net: bodyPix.BodyPix;

bodyPix
  .load({
    architecture: "MobileNetV1",
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2,
  })
  .then(res => {
    net = res;
  });

let segmentOffCanvas: OffscreenCanvas;
let segmentOffCanvasContext: OffscreenCanvasRenderingContext2D;

let segmentation: any = null;

self.addEventListener(
  "message",
  async (
    event: MessageEvent<{
      type: string;
      width: number;
      height: number;
      bitmap: ImageBitmap;
    }>
  ) => {
    const eventData = event.data;

    switch (eventData.type) {
      case "createOffCanvas": {
        const width = eventData.width as number;
        const height = eventData.height as number;

        segmentOffCanvas = new OffscreenCanvas(width, height);
        segmentOffCanvasContext = segmentOffCanvas.getContext("2d", { willReadFrequently: true })!;

        break;
      }
      case "segment": {
        if (!segmentOffCanvasContext || !net) break;
        const videoBitmap = eventData.bitmap;

        await segmentOffCanvasContext.drawImage(
          videoBitmap,
          0,
          0,
          videoBitmap.width,
          videoBitmap.height,
          0,
          0,
          segmentOffCanvas.width,
          segmentOffCanvas.height
        );
        segmentation = await net.segmentPerson(
          segmentOffCanvasContext.getImageData(
            0,
            0,
            segmentOffCanvas.width,
            segmentOffCanvas.height
          ),
          {
            internalResolution: "medium",
          }
        );
        self.postMessage({
          type: "segment",
          segment: segmentation,
        });
        break;
      }
      default:
        break;
    }
  }
);

export {};
