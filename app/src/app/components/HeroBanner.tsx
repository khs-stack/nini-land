'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './HeroBanner.module.css';

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  background: string;
}

export function HeroBanner({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <div className={styles.wrapper} style={{ background: slide.background }}>
      <Link href={slide.href} className={styles.link}>
        <p className={styles.eyebrow}>{slide.eyebrow}</p>
        <h1 className={styles.title}>{slide.title}</h1>
        <p className={styles.description}>{slide.description}</p>
      </Link>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 배너"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 배너"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => setIndex((current) => (current + 1) % slides.length)}
          >
            ›
          </button>
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번째 배너로 이동`}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
