export const iceServerPublicList = [
  "stun:stun1.l.google.com:19302",
  "stun:stun.miwifi.com",
  "stun:stun.qq.com",
  "stun:stun3.l.google.com:19302",
  "stun:stun.syncthing.net",
  "stun:stun4.l.google.com:19302",
  "stun:stun.newtocktech.com",
];

export const userMediaVideoQualityList = ["1080p", "720p", "480p", "360p", "240p", "144p"] as const;

export type userMediaVideoQualityType = typeof userMediaVideoQualityList[number];

export const userMediaVideoTrackConstraints: Record<
  userMediaVideoQualityType,
  { width: number; height: number }
> = {
  "1080p": { width: 1920, height: 1080 },
  "720p": { width: 1280, height: 720 },
  "480p": { width: 640, height: 480 },
  "360p": { width: 480, height: 360 },
  "240p": { width: 320, height: 240 },
  "144p": { width: 192, height: 144 },
};

export default {};
