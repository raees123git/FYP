/**
 * Browser Speech Recognition Hook
 * ONLY FOR REAL-TIME TEXT DISPLAY
 * Does NOT replace Whisper - Whisper continues to provide ALL audio analysis
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useBrowserSpeech() {
  const [displayText, setDisplayText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const accumulatedTextRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        accumulatedTextRef.current += final;
        setDisplayText(accumulatedTextRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Browser speech error:', event.error);
      }
    };

    recognition.onend = () => {
      setIsActive(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsActive(true);
    } catch (err) {
      // Already started, ignore
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore
      }
    }
    setIsActive(false);
    setInterimText('');
  }, []);

  const reset = useCallback(() => {
    accumulatedTextRef.current = '';
    setDisplayText('');
    setInterimText('');
  }, []);

  return {
    displayText,
    interimText,
    isActive,
    isSupported,
    start,
    stop,
    reset
  };
}
