'use client';

import Link from 'next/link';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>{icon}</div>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && (
        <>
          {actionHref ? (
            <Link href={actionHref} className={styles.button}>
              {actionLabel}
            </Link>
          ) : (
            <button type="button" className={styles.button} onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
