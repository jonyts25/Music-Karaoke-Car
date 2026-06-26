type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionLike = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionLike, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

function getSpeechWindow(): SpeechWindow | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window as SpeechWindow;
}

export function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructorLike
  | undefined {
  const speechWindow = getSpeechWindow();
  if (!speechWindow) {
    return undefined;
  }

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== undefined;
}

export function getSpeechRecognitionSupportFlags(): {
  speechRecognitionSupported: "yes" | "no" | "unknown";
  webkitSpeechRecognitionSupported: "yes" | "no" | "unknown";
  isSecureContext: "yes" | "no" | "unknown";
} {
  const speechWindow = getSpeechWindow();
  if (!speechWindow) {
    return {
      speechRecognitionSupported: "unknown",
      webkitSpeechRecognitionSupported: "unknown",
      isSecureContext: "unknown",
    };
  }

  return {
    speechRecognitionSupported: speechWindow.SpeechRecognition ? "yes" : "no",
    webkitSpeechRecognitionSupported: speechWindow.webkitSpeechRecognition
      ? "yes"
      : "no",
    isSecureContext: speechWindow.isSecureContext ? "yes" : "no",
  };
}

export type { SpeechRecognitionLike, SpeechRecognitionEventLike, SpeechRecognitionErrorEventLike };
