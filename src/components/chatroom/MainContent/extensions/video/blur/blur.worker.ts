importScripts(
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.2",
  "https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0"
);
declare let tf: any;
declare let bodyPix: any;

tf.getBackend();

let blurOffCanvas: OffscreenCanvas;
let blurOffCanvasContext: OffscreenCanvasRenderingContext2D;

let blurOffTmpCanvas: OffscreenCanvas;
let blurOffTmpCanvasContext: OffscreenCanvasRenderingContext2D;

let isSafari: boolean = false;
let blurSegmentation: any = null;

self.addEventListener(
  "message",
  async (
    event: MessageEvent<{
      type: string;
      isSafari: boolean;
      width: number;
      height: number;
      segment: any;
      bitmap: ImageBitmap;
    }>
  ) => {
    const eventData = event.data;

    switch (eventData.type) {
      case "isSafari": {
        isSafari = !!eventData.isSafari;
        break;
      }
      case "createOffCanvas": {
        const width = eventData.width as number;
        const height = eventData.height as number;

        blurOffCanvas = new OffscreenCanvas(width, height);
        blurOffCanvasContext = blurOffCanvas.getContext("2d", { willReadFrequently: true })!;

        blurOffTmpCanvas = new OffscreenCanvas(blurOffCanvas.width, blurOffCanvas.height);
        blurOffTmpCanvasContext = blurOffTmpCanvas.getContext("2d", { willReadFrequently: true })!;
        break;
      }

      case "segment": {
        blurSegmentation = eventData.segment;
        break;
      }

      case "process": {
        if (!blurOffCanvasContext) break;
        const videoBitMap = eventData.bitmap;

        const backgroundBlurAmount: number = 8;

        if (!blurSegmentation || backgroundBlurAmount === 0) {
          self.postMessage({
            type: "process",
            bitmap: videoBitMap,
          });
          return;
        } else {
          drawAndBlurImageOnCanvas(videoBitMap, backgroundBlurAmount, blurOffCanvasContext);
        }

        if (Array.isArray(blurSegmentation) && blurSegmentation.length === 0) {
          // nobody exist on the cam
          self.postMessage({
            type: "process",
            bitmap: blurOffCanvas.transferToImageBitmap(),
          });
          return;
        }

        const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
        const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
        const backgroundDarkeningMask = bodyPix.toMask(
          blurSegmentation,
          foregroundColor,
          backgroundColor
        );

        blurOffTmpCanvasContext.putImageData(backgroundDarkeningMask, 0, 0);
        blurOffTmpCanvasContext.globalCompositeOperation = "source-in";
        blurOffTmpCanvasContext.drawImage(videoBitMap, 0, 0);
        blurOffTmpCanvasContext.globalCompositeOperation = "source-over";

        blurOffCanvasContext.drawImage(blurOffTmpCanvas, 0, 0);

        self.postMessage({
          type: "process",
          bitmap: blurOffCanvas.transferToImageBitmap(),
        });
        break;
      }
      default:
        break;
    }
  }
);

function drawAndBlurImageOnCanvas(
  image: ImageBitmap,
  blurAmount: number,
  canvasContext: OffscreenCanvasRenderingContext2D
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

function cpuBlur(
  canvasContext: OffscreenCanvasRenderingContext2D,
  image: CanvasImageSource,
  blur: number
) {
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

export {};
