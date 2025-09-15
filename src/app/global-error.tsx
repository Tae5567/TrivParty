'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '400px',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem'
          }}>
            <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>Something went wrong!</h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              A global error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}