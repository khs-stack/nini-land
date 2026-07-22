'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './HeroBanner.module.css';

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  background: string;
  image?: string;
  imagePosition?: string;
  theme?: 'light' | 'dark';
}

export function HeroBanner({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    setImageFailed(false);
  }, [index]);

  if (slides.length === 0) return null;
  const slide = slides[index];
  const dark = slide.theme === 'dark';

  return (
    <section
      className={`${styles.wrapper} ${dark ? styles.dark : styles.light}`}
      style={{ background: slide.background }}
      aria-label="주요 상품"
    >
      <Link href={slide.href} className={styles.link}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h1 className={styles.title}>{slide.title}</h1>
          <p className={styles.description}>{slide.description}</p>
          <span className={styles.cta}>상품 보러가기 <span aria-hidden="true">→</span></span>
        </div>

        {slide.image && !imageFailed && (
          <div className={styles.imageWrap}>
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 767px) 46vw, 520px"
              className={styles.image}
              style={{ objectPosition: slide.imagePosition || 'center' }}
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
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
    </section>
  );
}
