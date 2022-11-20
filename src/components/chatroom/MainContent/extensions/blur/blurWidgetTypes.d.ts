import type { OffscreenCanvas } from "@types/offscreencanvas";
import type { ImageCapture } from "@types/w3c-image-capture";

declare global {
  type OffscreenCanvas = OffscreenCanvas;
  type ImageCapture = ImageCapture;
}
