/* eslint-disable @typescript-eslint/ban-ts-comment */

importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2",
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0"
);
declare let tf: any;
declare let bodyPix: any;

console.log(tf.getBackend());
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

let offCanvas: HTMLCanvasElement;
let offCanvasContext: CanvasRenderingContext2D | null = null;

let offTmpCanvas: OffscreenCanvas;
let offTmpCanvasContext: OffscreenCanvasRenderingContext2D | null = null;

let eventVideoSource: ImageBitmap;
let isSafari: boolean = false;

self.addEventListener("message", async event => {
  const eventData = event.data;

  switch (eventData.type) {
    case "isSafari": {
      isSafari = !!eventData.data;
      break;
    }
    case "createOffCanvas": {
      // define offCanvas element
      offCanvas = eventData.canvas as HTMLCanvasElement;
      offCanvasContext = offCanvas.getContext("2d");

      offTmpCanvas = new OffscreenCanvas(offCanvas.width, offCanvas.height);
      offTmpCanvasContext = offTmpCanvas.getContext("2d", { willReadFrequently: true });

      break;
    }
    case "processVideo": {
      if (!offCanvasContext || !offTmpCanvasContext || !net) break;

      eventVideoSource = eventData.video as ImageBitmap;
      const backgroundBlurAmount: number = 8;

      offTmpCanvasContext.drawImage(
        eventVideoSource,
        0,
        0,
        eventVideoSource.width,
        eventVideoSource.height,
        0,
        0,
        640,
        480
      );

      const segmentation = await net.segmentPerson(
        offTmpCanvasContext.getImageData(0, 0, 640, 480),
        {
          internalResolution: "medium",
        }
      );

      if (backgroundBlurAmount === 0) {
        offCanvasContext.drawImage(eventVideoSource, 0, 0);
        return;
      } else {
        drawAndBlurImageOnCanvas(eventVideoSource, backgroundBlurAmount, offCanvasContext);
      }
      if (Array.isArray(segmentation) && segmentation.length === 0) {
        // nobody exist on the cam
        return;
      }

      const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
      const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
      const backgroundDarkeningMask = bodyPix.toMask(
        segmentation,
        foregroundColor,
        backgroundColor
      );

      offTmpCanvasContext.putImageData(backgroundDarkeningMask, 0, 0);
      offTmpCanvasContext.globalCompositeOperation = "source-in";
      offTmpCanvasContext.drawImage(eventVideoSource, 0, 0);
      offTmpCanvasContext.globalCompositeOperation = "source-over";

      offCanvasContext.drawImage(offTmpCanvas, 0, 0);
      offCanvasContext.restore();
      break;
    }
    default:
      break;
  }
});

function drawAndBlurImageOnCanvas(
  image: ImageBitmap,
  blurAmount: number,
  canvasContext: CanvasRenderingContext2D
) {
  const { height, width } = image;
  const ctx = canvasContext;

  (canvasContext as any).width = width;
  (canvasContext as any).height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  // judge whether it's on Safari
  if (isSafari) {
    cpuBlur(canvasContext, image, blurAmount);
  } else {
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(image, 0, 0, width, height);
  }
  ctx.restore();
}

function cpuBlur(canvasContext: CanvasRenderingContext2D, image: CanvasImageSource, blur: number) {
  const ctx = canvasContext;

  let sum = 0;
  const delta = 5;
  const alphaLeft = 1 / (2 * Math.PI * delta * delta);
  const step = blur < 3 ? 1 : 2;
  for (let y = -blur; y <= blur; y += step) {
    for (let x = -blur; x <= blur; x += step) {
      const weight = alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta));
      sum += weight;
    }
  }
  for (let y = -blur; y <= blur; y += step) {
    for (let x = -blur; x <= blur; x += step) {
      ctx.globalAlpha =
        ((alphaLeft * Math.exp(-(x * x + y * y) / (2 * delta * delta))) / sum) * blur;
      ctx.drawImage(image, x, y);
    }
  }
  ctx.globalAlpha = 1;
}
