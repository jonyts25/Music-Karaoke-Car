"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionErrorEventLike,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from "./speechRecognitionSupport";

const DEFAULT_LANG = "es-MX";

function mapSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Permiso de micrófono denegado";
    case "no-speech":
      return "No escuché nada";
    case "audio-capture":
      return "No se pudo capturar audio del micrófono";
    case "network":
      return "Error de red en reconocimiento de voz";
    case "aborted":
      return "Reconocimiento cancelado";
    case "service-not-allowed":
      return "Servicio de voz no permitido en este contexto";
    default:
      return `Error de voz: ${code}`;
  }
}

export function useSpeechSearch(lang: string = DEFAULT_LANG) {
  const [isSupported] = useState(() => isSpeechRecognitionSupported());
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage("");
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") {
      setErrorMessage("Voz no soportada en este navegador");
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass) {
      setErrorMessage("Voz no soportada en este navegador");
      return;
    }

    setErrorMessage("");
    setInterimTranscript("");

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText.trim()) {
        setTranscript(finalText.trim());
      }
      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "aborted") {
        return;
      }
      setErrorMessage(mapSpeechError(event.error));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setErrorMessage("No se pudo iniciar el reconocimiento de voz");
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  };
}
