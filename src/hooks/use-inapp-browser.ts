"use client";

export function useInAppBrowserDetect() {
  const isClient = typeof window !== "undefined";
  const ua = isClient ? (navigator.userAgent || navigator.vendor || (window as any).opera || "") : "";
  const lower = ua.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(lower);
  const isAndroid = /android/.test(lower);

  const isFacebook = /fb_iab|fbav|fban/.test(lower);
  const isInstagram = /instagram/.test(lower);
  const isTwitter = /twitter/.test(lower);
  const isTikTok = /tiktok|musical\.ly/.test(lower);
  const isTelegram = /telegram/.test(lower);
  const isSnapchat = /snapchat/.test(lower);
  const isPinterest = /pinterest/.test(lower);
  const isLine = / line\//.test(lower);
  const isWeChat = /micromessenger|wechat/.test(lower);

  const search = isClient ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const forceInApp = search.get("iab") === "1" || search.get("forceInApp") === "1";

  const inApp = forceInApp || isFacebook || isInstagram || isTwitter || isTikTok || isTelegram || isSnapchat || isPinterest || isLine || isWeChat;

  const currentUrl = isClient ? window.location.href : "";
  const chromeIOS = `googlechrome://navigate?url=${encodeURIComponent(currentUrl)}`;
  const firefoxIOS = `firefox://open-url?url=${encodeURIComponent(currentUrl)}`;
  const edgeIOS = `microsoft-edge-https://${isClient ? window.location.host : ""}${isClient ? window.location.pathname : ""}${isClient ? window.location.search : ""}`;

  const chromeAndroidIntent = `intent://${isClient ? window.location.host : ""}${isClient ? window.location.pathname : ""}${isClient ? window.location.search : ""}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;

  return {
    isClient,
    isIOS,
    isAndroid,
    inApp,
    links: {
      chromeIOS,
      firefoxIOS,
      edgeIOS,
      chromeAndroidIntent,
      currentUrl,
    },
  };
}