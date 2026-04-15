export type DeviceKind = "iphone" | "android" | "pc";

export function getDeviceKind(): DeviceKind {
  if (typeof window === "undefined") {
    return "pc";
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIphone = /iphone|ipod/.test(ua);
  const isIpad = /ipad/.test(ua);
  const isIpadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isAndroid = /android/.test(ua);

  if (isIphone || isIpad || isIpadOS) {
    return "iphone";
  }

  if (isAndroid) {
    return "android";
  }

  return "pc";
}

