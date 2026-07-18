'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className={styles.container}>
      {messages.map((msg) => (
        <ToastItem
          key={msg.id}
          message={msg}
          onDismiss={() => onDismiss(msg.id)}
          duration={msg.duration ?? 3000}
        />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  onDismiss,
  duration,
}: {
  message: ToastMessage;
  onDismiss: () => void;
  duration: number;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Delay for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[message.type]} ${isVisible ? styles.show : ''}`}>
      <span>{message.message}</span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300);
        }}
      >
        ✕
      </button>
    </div>
  );
}
