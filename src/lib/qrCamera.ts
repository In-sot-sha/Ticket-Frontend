import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/**
 * iOS only allows getUserMedia in a secure context. http://192.168.x.x is not one.
 * Android Chrome still allows it, which is why the same URL scans there.
 */
export function iosCameraSetupMessage(): string | null {
  if (typeof window === 'undefined' || window.isSecureContext || !isIosDevice()) return null;
  const host = window.location.host;
  return `iPhone blocks the camera on http://${host}. Open https://${host} and accept the certificate warning.`;
}

export async function resolveCameraConfig(): Promise<string | { facingMode: 'environment' }> {
  try {
    const cameras = await Html5Qrcode.getCameras();
    const back =
      cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ||
      cameras[cameras.length - 1];
    if (back?.id) return back.id;
  } catch {
    /* use facingMode */
  }
  return { facingMode: 'environment' };
}

export function qrScannerOptions(): { verbose: boolean; useBarCodeDetectorIfSupported: boolean } {
  return {
    verbose: false,
    useBarCodeDetectorIfSupported: true,
  };
}

export function qrScanConfig(): Html5QrcodeCameraScanConfig {
  return {
    fps: 10,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const size = Math.max(50, Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.9));
      return {
        width: Math.min(size, viewfinderWidth),
        height: Math.min(size, viewfinderHeight),
      };
    },
  };
}

type QrDetector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

function makeBarcodeDetector(): QrDetector | null {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  const Detector = (window as unknown as {
    BarcodeDetector: new (opts?: { formats?: string[] }) => QrDetector;
  }).BarcodeDetector;
  try {
    return new Detector({ formats: ['qr_code'] });
  } catch {
    try {
      return new Detector();
    } catch {
      return null;
    }
  }
}

/**
 * iPhone path. html5-qrcode draws a stretched crop and misses the code.
 * This opens the back camera itself and reads each real video frame.
 */
export async function startIosCameraScan(
  containerId: string,
  onCode: (text: string) => void,
): Promise<() => void> {
  const box = document.getElementById(containerId);
  if (!box) throw new Error('scanner box is not on the page');
  box.replaceChildren();

  const video = document.createElement('video');
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.setAttribute('autoplay', 'true');
  video.setAttribute('muted', 'true');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.background = '#000';
  box.appendChild(video);

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'environment' },
    });
  }

  video.srcObject = stream;
  await video.play();
  if (!video.videoWidth) {
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener('loadedmetadata', done);
        resolve();
      };
      video.addEventListener('loadedmetadata', done);
      window.setTimeout(done, 1200);
    });
  }

  const detector = makeBarcodeDetector();
  const { default: jsQR } = await import('jsqr');

  let stopped = false;
  let busy = false;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  const stop = () => {
    stopped = true;
    stream.getTracks().forEach((item) => {
      try { item.stop(); } catch { /* already stopped */ }
    });
    video.srcObject = null;
    if (box.contains(video)) video.remove();
  };

  const found = (text: string) => {
    if (stopped) return;
    stop();
    onCode(text);
  };

  const readFrame = async () => {
    if (stopped || busy) return;
    if (video.readyState < 2 || !video.videoWidth || !context) return;
    busy = true;
    try {
      if (detector) {
        try {
          const codes = await detector.detect(video);
          const native = codes.map((code) => code.rawValue).find((value) => value && value.trim());
          if (native) {
            found(native);
            return;
          }
        } catch {
          /* native reader missed this frame; the frame decoder still runs */
        }
      }
      // Center square of the camera, which is what the preview shows. Full-frame
      // samples shrink the QR until the iPhone decoder cannot see it.
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = Math.floor((video.videoWidth - side) / 2);
      const sy = Math.floor((video.videoHeight - side) / 2);
      const out = Math.min(side, 900);
      canvas.width = out;
      canvas.height = out;
      context.drawImage(video, sx, sy, side, side, 0, 0, out, out);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
      if (decoded?.data) {
        found(decoded.data);
      }
    } catch {
      /* keep reading frames */
    } finally {
      busy = false;
    }
  };

  const schedule = () => {
    if (stopped) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(() => {
        void readFrame().finally(schedule);
      });
      return;
    }
    window.setTimeout(() => {
      void readFrame().finally(schedule);
    }, 120);
  };
  schedule();

  return stop;
}
