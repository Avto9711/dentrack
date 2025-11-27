import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
