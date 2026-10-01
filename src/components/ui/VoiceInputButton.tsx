import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '../../lib/utils';
import { cleanVoiceInput } from '../../lib/voiceParser';

interface VoiceInputButtonProps {
  fieldType: 'email' | 'phone' | 'name' | 'text';
  onTranscript: (cleanText: string) => void;
  className?: string;
  disabled?: boolean;
  fieldLabel?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  fieldType,
  onTranscript,
  className,
  disabled = false,
  fieldLabel,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef('');

  // Check support
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // Commit final cleaned transcript when user clicks done
    if (transcriptRef.current) {
      const cleaned = cleanVoiceInput(transcriptRef.current, fieldType);
      if (cleaned) {
        onTranscript(cleaned);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {
        // ignore
      }
    }
  }, [fieldType, onTranscript]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Keep continuous listening until the user clicks to finish
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      try {
        recognition.lang = navigator.language || 'en-US';
      } catch {
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {
            // ignore
          }
        }
      };

      recognition.onresult = (event: any) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullText += event.results[i][0].transcript + ' ';
        }
        const trimmed = fullText.trim();
        if (trimmed) {
          transcriptRef.current = trimmed;
          const cleaned = cleanVoiceInput(trimmed, fieldType);
          if (cleaned) {
            onTranscript(cleaned);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
        }
        // In noisy environments 'no-speech' or 'audio-capture' can occur;
        // do not turn off by itself, onend will resume if still active
      };

      recognition.onend = () => {
        // Do NOT turn off by itself! Keep listening until user clicks done
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // Ignore if already active or blocked
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) return;

    if (isListeningRef.current) {
      // User clicked when done
      stopListening();
    } else {
      // User clicked to start
      transcriptRef.current = '';
      isListeningRef.current = true;
      setIsListening(true);
      startRecognition();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleToggle}
      title={
        isListening
          ? 'Listening... click when done'
          : `Voice input for ${fieldLabel || fieldType}`
      }
      aria-label={`Voice input for ${fieldLabel || fieldType}`}
      className={cn(
        'p-1.5 rounded-lg transition-colors duration-150 flex items-center justify-center shrink-0 cursor-pointer focus:outline-none',
        isListening
          ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
};
