export function MoreIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      />
    </svg>
  )
}

export function MoreIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="20" cy="12" r="2" />
    </svg>
  )
}

export function NoteIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 4.5h16A1.5 1.5 0 0 1 21.5 6v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5ZM1 6a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6Zm6 3h10v1.5H7V9Zm0 4h7v1.5H7V13Z"
      />
    </svg>
  )
}

export function NoteFillIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 3C2.11929 3 1 4.11929 1 5.5V18.5C1 19.8807 2.11929 21 3.5 21H20.5C21.8807 21 23 19.8807 23 18.5V5.5C23 4.11929 21.8807 3 20.5 3H3.5ZM7 9H17V10.5H7V9ZM7 13H14V14.5H7V13Z"
      />
    </svg>
  )
}

export function NoteIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 6h8v1H4V6ZM9 9H4v1h5V9Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13Zm13 1h-13a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5Z"
      />
    </svg>
  )
}

export function TagIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.5 5v6.757a1.5 1.5 0 0 1-.44 1.061l-8 8a1.5 1.5 0 0 1-2.12 0l-6.758-6.757a1.5 1.5 0 0 1 0-2.122l8-8a1.5 1.5 0 0 1 1.06-.439H19A1.5 1.5 0 0 1 20.5 5Zm1.5 6.757V5a3 3 0 0 0-3-3h-6.757a3 3 0 0 0-2.122.879l-8 8a3 3 0 0 0 0 4.242L8.88 21.88a3 3 0 0 0 4.242 0l8-8A3 3 0 0 0 22 11.757ZM15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  )
}

export function TagFillIcon24() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 5v6.757a3 3 0 0 1-.879 2.122l-8 8a3 3 0 0 1-4.242 0L2.12 15.12a3 3 0 0 1 0-4.242l8-8A3 3 0 0 1 12.243 2H19a3 3 0 0 1 3 3Zm-6.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  )
}

export function CalendarIcon24({ date }: { date?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5ZM2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5Zm16 2H6v1.5h12V7Z"
      />
      <text
        textAnchor="middle"
        x={12}
        y={18}
        fontSize="10px"
        className="font-mono font-semibold leading-none"
      >
        {date}
      </text>
    </svg>
  )
}

export function CalendarFillIcon24({ date }: { date?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19V5C22 3.34315 20.6569 2 19 2H5ZM18 7H6V8.5H18V7Z"
      />
      <text
        textAnchor="middle"
        x={12}
        y={18}
        fontSize="10px"
        className="font-mono font-semibold leading-none text-bg-inset"
      >
        {date}
      </text>
    </svg>
  )
}

export function CalendarIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M13 4H3v1h10V4Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm2-1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z"
      />
    </svg>
  )
}

export function SearchIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.73 11.436a6.5 6.5 0 1 1 .707-.707l4.417 4.417-.707.708-4.418-4.418ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
      />
    </svg>
  )
}

export function LoadingIcon16() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 1a7 7 0 1 0 7 7h-1a6 6 0 1 1-6-6V1Z" />
    </svg>
  )
}

export function CloseIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="m2.5 1.793 5.5 5.5 5.5-5.5.707.707-5.5 5.5 5.5 5.5-.707.707-5.5-5.5-5.5 5.5-.707-.707 5.5-5.5-5.5-5.5.707-.707Z" />
    </svg>
  )
}

export function PlusIcon16() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1H7v6H1v1h6v6h1V8h6V7H8V1Z" />
    </svg>
  )
}
