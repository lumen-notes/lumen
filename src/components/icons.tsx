import { cx } from "../utils/cx"

type IconProps = React.ComponentPropsWithoutRef<"svg">

function Icon({ size, ...props }: IconProps & { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="currentColor"
      aria-hidden
      {...props}
    />
  )
}

export function MoreIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
      />
    </Icon>
  )
}

export function MoreIcon24(props: IconProps) {
  return (
    <Icon size={24} {...props}>
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="20" cy="12" r="2" />
    </Icon>
  )
}

export function NoteIcon24(props: IconProps) {
  return (
    <Icon size={24} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 4.5h16A1.5 1.5 0 0 1 21.5 6v12a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V6A1.5 1.5 0 0 1 4 4.5ZM1 6a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6Zm6 3h10v1.5H7V9Zm0 4h7v1.5H7V13Z"
      />
    </Icon>
  )
}

export function NoteFillIcon24(props: IconProps) {
  return (
    <Icon size={24} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 3C2.11929 3 1 4.11929 1 5.5V18.5C1 19.8807 2.11929 21 3.5 21H20.5C21.8807 21 23 19.8807 23 18.5V5.5C23 4.11929 21.8807 3 20.5 3H3.5ZM7 9H17V10.5H7V9ZM7 13H14V14.5H7V13Z"
      />
    </Icon>
  )
}

export function NoteIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M4 6h8v1.5H4V6ZM9 9H4v1.5h5V9Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 2a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2Zm12 1.5H2a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5Z"
      />
    </Icon>
  )
}
export function NoteTemplateIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M10.5 2h-5v1.5h5V2ZM12 13h2a.5.5 0 0 0 .5-.5v-1H16v1a2 2 0 0 1-2 2h-2V13ZM16 10V6.5h-1.5V10H16ZM1.5 4v1H0V4a2 2 0 0 1 2-2h2v1.5H2a.5.5 0 0 0-.5.5ZM0 10V6.5h1.5V10H0ZM0 11.5v1a2 2 0 0 0 2 2h2V13H2a.5.5 0 0 1-.5-.5v-1H0ZM14.5 4v1H16V4a2 2 0 0 0-2-2h-2v1.5h2a.5.5 0 0 1 .5.5ZM10.5 13h-5v1.5h5V13Z" />
    </Icon>
  )
}

export function TagIcon24(props: IconProps) {
  return (
    <Icon size={24} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.5 5v6.757a1.5 1.5 0 0 1-.44 1.061l-8 8a1.5 1.5 0 0 1-2.12 0l-6.758-6.757a1.5 1.5 0 0 1 0-2.122l8-8a1.5 1.5 0 0 1 1.06-.439H19A1.5 1.5 0 0 1 20.5 5Zm1.5 6.757V5a3 3 0 0 0-3-3h-6.757a3 3 0 0 0-2.122.879l-8 8a3 3 0 0 0 0 4.242L8.88 21.88a3 3 0 0 0 4.242 0l8-8A3 3 0 0 0 22 11.757ZM15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </Icon>
  )
}

export function TagFillIcon24(props: IconProps) {
  return (
    <Icon size={24} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22 5v6.757a3 3 0 0 1-.879 2.122l-8 8a3 3 0 0 1-4.242 0L2.12 15.12a3 3 0 0 1 0-4.242l8-8A3 3 0 0 1 12.243 2H19a3 3 0 0 1 3 3Zm-6.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </Icon>
  )
}

export function TagIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M11 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m.914 9.914 5.172 5.172a2 2 0 0 0 2.828 0l6.5-6.5A2 2 0 0 0 16 7.172V2a2 2 0 0 0-2-2H8.828a2 2 0 0 0-1.414.586l-6.5 6.5a2 2 0 0 0 0 2.828ZM14.5 2v5.172a.5.5 0 0 1-.146.353l-6.5 6.5a.5.5 0 0 1-.708 0L1.975 8.854a.5.5 0 0 1 0-.708l6.5-6.5a.5.5 0 0 1 .353-.146H14a.5.5 0 0 1 .5.5Z"
      />
    </Icon>
  )
}

export function CalendarIcon24({ number }: IconProps & { number?: number }) {
  return (
    <Icon size={24}>
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
        {number}
      </text>
    </Icon>
  )
}

export function CalendarFillIcon24({ number, ...props }: IconProps & { number?: number }) {
  return (
    <Icon size={24} {...props}>
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
        fill="currentColor"
        className="font-mono font-semibold leading-none text-bg-inset"
      >
        {number}
      </text>
    </Icon>
  )
}

export function CalendarIcon16({ number, ...props }: IconProps & { number?: number }) {
  return (
    <Icon size={16} {...props}>
      <path d="M13 4H3v1.5h10V4Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm2-.5h12a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5Z"
      />
      <text
        textAnchor="middle"
        x={8}
        y={12.5}
        fontSize="7.5px"
        fill="currentColor"
        className="font-mono font-bold leading-none"
      >
        {number}
      </text>
    </Icon>
  )
}

export function SearchIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5 6.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-.965 5.096a6.5 6.5 0 1 1 1.06-1.06l3.935 3.934-1.06 1.06-3.935-3.934Z"
      />
    </Icon>
  )
}

export function LoadingIcon16({ className, ...props }: IconProps) {
  return (
    <Icon size={16} className={cx("animate-spin", className)} {...props}>
      <path d="M8 1a7 7 0 1 0 7 7h-1.5A5.5 5.5 0 1 1 8 2.5V1Z" />
    </Icon>
  )
}

export function CloseIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 1.44 8 6.94l5.5-5.5 1.06 1.06L9.06 8l5.5 5.5-1.06 1.06L8 9.06l-5.5 5.5-1.06-1.06L6.94 8l-5.5-5.5L2.5 1.44Z"
      />
    </Icon>
  )
}

export function PlusIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M8.5 1H7v6H1v1.5h6v6h1.5v-6h6V7h-6V1Z" />
    </Icon>
  )
}

export function MinusIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M1 7v1.5h13.5V7H1Z" />
    </Icon>
  )
}

export function ChevronLeftIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="m5.06 8 5.97-5.97L9.97.97 2.94 8l7.03 7.03 1.06-1.06L5.06 8Z" />
    </Icon>
  )
}

export function ChevronRightIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="m10.94 8-5.97 5.97 1.06 1.06L13.06 8 6.03.97 4.97 2.03 10.94 8Z" />
    </Icon>
  )
}

export function PaperclipIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.345 2.405a2.255 2.255 0 0 0-3.19 0L3.533 8.028a3.67 3.67 0 0 0 5.19 5.19L13.5 8.438 14.56 9.5l-4.777 4.778a5.17 5.17 0 1 1-7.31-7.31l5.622-5.623a3.755 3.755 0 1 1 5.31 5.31l-5.5 5.5a2.341 2.341 0 0 1-3.31-3.31L9 4.439 10.06 5.5 5.656 9.905a.841.841 0 0 0 1.19 1.19l5.5-5.5c.88-.881.88-2.309 0-3.19Z"
      />
    </Icon>
  )
}

export function FileIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.757 1a3 3 0 0 1 2.122.879L20.12 6.12A3 3 0 0 1 21 8.243V20a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h7.757ZM4.5 20V4A1.5 1.5 0 0 1 6 2.5h7v5.75c0 .414.336.75.75.75h5.75v11a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20ZM19.303 7.5a1.503 1.503 0 0 0-.242-.318l-4.243-4.243a1.498 1.498 0 0 0-.318-.242V7.5h4.803Z"
      />
    </svg>
  )
}

export function FileIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M2 2a2 2 0 0 1 2-2h4.672a2 2 0 0 1 1.414.586l4.328 4.328A2 2 0 0 1 15 6.328V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2Zm11.5 5H9.25C8.56 7 8 6.44 8 5.75V1.5H4a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7Zm-.621-1.5L9.5 2.121V5.5h3.379Z" />
    </svg>
  )
}

export function ComposeIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m21.914 1.854 1.232 1.232a2 2 0 0 1 0 2.828l-8.407 8.408a2 2 0 0 1-.782.483l-3.271 1.09c-.977.326-1.907-.604-1.581-1.58l1.09-3.272a2 2 0 0 1 .483-.782l8.408-8.407a2 2 0 0 1 2.828 0Zm-1.768 1.06-8.407 8.408a.5.5 0 0 0-.12.195l-.933 2.797 2.797-.932a.5.5 0 0 0 .195-.121l8.408-8.407a.5.5 0 0 0 0-.708l-1.232-1.232a.5.5 0 0 0-.708 0Z" />
      <path d="M4.75 3A3.75 3.75 0 0 0 1 6.75v10.5A3.75 3.75 0 0 0 4.75 21h14.5A3.75 3.75 0 0 0 23 17.25V12h-1.5v5.25a2.25 2.25 0 0 1-2.25 2.25H4.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 4.75 4.5H12V3H4.75Z" />
    </svg>
  )
}

export function ComposeFillIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m22.384 1.384 1.232 1.232a1.25 1.25 0 0 1 0 1.768L14.21 13.79a1.25 1.25 0 0 1-.489.302l-3.271 1.09a.5.5 0 0 1-.633-.632l1.09-3.271c.062-.184.165-.351.303-.489l9.407-9.407a1.25 1.25 0 0 1 1.768 0Z" />
      <path d="M4 3h12.525L9.971 9.554a3 3 0 0 0-.725 1.172l-1.09 3.272c-.586 1.759 1.087 3.432 2.846 2.846l3.271-1.09a3 3 0 0 0 1.173-.725L23 7.475V18a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
    </svg>
  )
}

export function GraphIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.556 9.686A3.987 3.987 0 0 1 12 10a3.987 3.987 0 0 1-1.556-.314l-3.64 5.46a4 4 0 1 1-1.247-.833l3.64-5.46a4 4 0 1 1 5.607 0l3.64 5.46a4 4 0 1 1-1.247.833l-3.641-5.46ZM14.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM4 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM22.5 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
      />
    </svg>
  )
}

export function GraphFillIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.556 9.686A3.987 3.987 0 0 1 12 10a3.987 3.987 0 0 1-1.556-.314l-3.64 5.46a4 4 0 1 1-1.247-.833l3.64-5.46a4 4 0 1 1 5.607 0l3.64 5.46a4 4 0 1 1-1.247.833l-3.641-5.46Z"
      />
    </svg>
  )
}

export function CopyIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Zm2-.5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5Z" />
      <path d="M2 4h1v1.5H2a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-1H12v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

export function TrashIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M15 3h-4V2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1H1v1.5h14V3ZM7 1.5h2a.5.5 0 0 1 .5.5v1h-3V2a.5.5 0 0 1 .5-.5ZM2.858 14.153 2.23 6h1.504l.618 8.038a.5.5 0 0 0 .499.462h6.296a.5.5 0 0 0 .498-.462L12.265 6h1.504l-.627 8.153A2 2 0 0 1 11.148 16H4.852a2 2 0 0 1-1.994-1.847Z" />
    </svg>
  )
}

export function EditIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M10.586 1.354a2 2 0 0 1 2.828 0l1.232 1.232a2 2 0 0 1 0 2.828L6.281 13.78a2.25 2.25 0 0 1-.88.543l-3.215 1.072c-.977.326-1.907-.604-1.581-1.58l1.071-3.216a2.25 2.25 0 0 1 .544-.88l8.366-8.365Zm1.768 1.06a.5.5 0 0 0-.708 0L3.281 10.78a.75.75 0 0 0-.181.293l-.914 2.741 2.74-.914a.751.751 0 0 0 .294-.18l8.366-8.366a.5.5 0 0 0 0-.708l-1.232-1.232ZM8 14h8v1.5H8V14Z" />
    </Icon>
  )
}

export function ExternalLinkIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M7 3.5H3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V9H14v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4v1.5Z" />
      <path d="M16 0H9v1.5h4.44L6.94 8 8 9.06l6.5-6.5V7H16V0Z" />
    </svg>
  )
}

export function ErrorIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M8.75 4v5h-1.5V4h1.5ZM8 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm0-1.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
    </Icon>
  )
}

export function ClearIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm2.47-11.53 1.06 1.06L9.06 8l2.47 2.47-1.06 1.06L8 9.06l-2.47 2.47-1.06-1.06L6.94 8 4.47 5.53l1.06-1.06L8 6.94l2.47-2.47Z" />
    </svg>
  )
}

export function SettingsIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8.095 12.5a3.001 3.001 0 0 0 5.81 0H16V11h-2.095a3.001 3.001 0 0 0-5.81 0H0v1.5h8.095Zm4.405-.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM2.095 4H0v1.5h2.095a3.001 3.001 0 0 0 5.81 0H16V4H7.905a3.001 3.001 0 0 0-5.81 0Zm4.405.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  )
}

export function SettingsIcon24() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 7.5h-9.325a3.751 3.751 0 0 1-7.35 0H2V6h3.325a3.751 3.751 0 0 1 7.35 0H22v1.5Zm-13-3A2.25 2.25 0 1 0 9 9a2.25 2.25 0 0 0 0-4.5ZM22 17.5V16h-3.325a3.751 3.751 0 0 0-7.35 0H2v1.5h9.325a3.751 3.751 0 0 0 7.35 0H22Zm-7-3a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z" />
    </svg>
  )
}

export function InfoIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8.25 7H6.5v1.5h1v2h-.961V12H10v-1.5H9V7.75A.75.75 0 0 0 8.25 7Z" />
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm0-1.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" />
    </svg>
  )
}

export function PhoneIcon16() {
  return (
    // The phone icon expands beyond the 16x16 viewBox, so we need to use overflow-visible
    <svg className="h-4 w-4 overflow-visible" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.334-.345A1.95 1.95 0 0 1 5.75.669l1.66 3.558L5.77 5.868c.937 2.102 2.26 3.426 4.363 4.363l1.641-1.641 3.558 1.66a1.95 1.95 0 0 1 1.014 2.416l-.727 2.059c-.427 1.21-1.666 2.013-2.988 1.75-3.574-.709-6.503-2.169-8.72-4.385C1.694 9.873.234 6.944-.476 3.37-.738 2.047.064.808 1.275.381l2.059-.727Zm1.057 1.649a.45.45 0 0 0-.558-.235l-2.059.727c-.568.2-.883.753-.778 1.281C1.658 6.415 3 9.058 4.97 11.03c1.97 1.97 4.614 3.313 7.951 3.975.53.105 1.081-.21 1.282-.778l.726-2.06a.45.45 0 0 0-.234-.557l-2.605-1.216L10.486 12l-.46-.184c-2.902-1.161-4.68-2.94-5.841-5.842l-.184-.459L5.607 3.91 4.39 1.304Z" />
    </svg>
  )
}

export function MessageIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 2.5C4.302 2.5 1.5 5.063 1.5 8c0 1.081.37 2.096 1.021 2.957l.2.265-.515 2.751 3.335-.878.206.065c.7.22 1.459.34 2.253.34 3.698 0 6.5-2.563 6.5-5.5S11.698 2.5 8 2.5ZM0 8c0-3.967 3.69-7 8-7 4.31 0 8 3.033 8 7s-3.69 7-8 7c-.868 0-1.705-.12-2.49-.345l-3.305.87a1.25 1.25 0 0 1-1.546-1.44l.468-2.498A6.334 6.334 0 0 1 0 8Z" />
    </svg>
  )
}

export function GlobeIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm2.001-1.814c1.032-1.636 1.607-3.522 1.726-5.436h2.73a6.507 6.507 0 0 1-4.456 5.436Zm-4.002 0A6.506 6.506 0 0 1 1.543 8.75h2.73c.12 1.914.694 3.8 1.726 5.436ZM5.777 8.75h4.446c-.145 2.046-.886 4.047-2.223 5.64-1.337-1.593-2.078-3.594-2.223-5.64Zm4.446-1.5H5.777C5.922 5.204 6.663 3.203 8 1.61c1.337 1.593 2.078 3.594 2.223 5.64Zm1.504 0c-.12-1.914-.694-3.8-1.726-5.436a6.507 6.507 0 0 1 4.456 5.436h-2.73ZM5.999 1.814C4.967 3.45 4.392 5.336 4.273 7.25h-2.73a6.507 6.507 0 0 1 4.456-5.436Z" />
    </svg>
  )
}

export function MailIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3Zm2-.5a.498.498 0 0 0-.298.098L8 7.546l6.297-4.948A.497.497 0 0 0 14 2.5H2Zm-.5 1.847V13a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V4.347l-5.728 4.5a1.25 1.25 0 0 1-1.544 0L1.5 4.347Z" />
    </svg>
  )
}

export function MapIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M5.744.142A1.25 1.25 0 0 0 4.712.18L1.078 1.998A1.95 1.95 0 0 0 0 3.742V14.44c0 .93.978 1.534 1.809 1.118l3.472-1.736 4.975 2.035c.334.137.71.123 1.032-.039l3.634-1.817A1.95 1.95 0 0 0 16 12.258V1.56A1.25 1.25 0 0 0 14.191.441l-3.472 1.736L5.744.142ZM4.5 1.964v10.572l-3 1.5V3.742a.45.45 0 0 1 .249-.403L4.5 1.964ZM6 12.496V1.867l4 1.637v10.629l-4-1.636Zm5.5-9.032 3-1.5v10.294a.45.45 0 0 1-.249.403L11.5 14.037V3.463Z" />
    </svg>
  )
}

export function QueryIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.818 12.879a3.75 3.75 0 1 1 1.06-1.06l3.152 3.15-1.06 1.061-3.152-3.151ZM11 9.75a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" />
      <path d="M1.95 2A1.95 1.95 0 0 0 0 3.95v8.6a1.95 1.95 0 0 0 1.95 1.95H4.5V13H1.95a.45.45 0 0 1-.45-.45v-8.6a.45.45 0 0 1 .45-.45h12.1a.45.45 0 0 1 .45.45V12H16V3.95A1.95 1.95 0 0 0 14.05 2H1.95Z" />
    </svg>
  )
}

export function LinkIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="m8.836 4.336 1.25-1.25a2 2 0 1 1 2.828 2.828l-2.5 2.5a2 2 0 0 1-2.828 0l-1.06 1.06a3.5 3.5 0 0 0 4.949 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.949l-1.25 1.25 1.06 1.06Z" />
      <path d="m7.164 11.664-1.25 1.25a2 2 0 0 1-2.828-2.828l2.5-2.5a2 2 0 0 1 2.828 0l1.06-1.06a3.5 3.5 0 0 0-4.949 0l-2.5 2.5a3.5 3.5 0 1 0 4.95 4.949l1.25-1.25-1.06-1.06Z" />
    </svg>
  )
}

export function UnlinkIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="m10.086 3.086-1.75 1.75-1.06-1.06 1.75-1.75a3.5 3.5 0 0 1 4.949 4.949l-1.75 1.75-1.06-1.06 1.75-1.75a2 2 0 1 0-2.83-2.83ZM5.914 12.914l1.75-1.75 1.061 1.06-1.75 1.75a3.5 3.5 0 1 1-4.95-4.949l1.75-1.75 1.06 1.06-1.75 1.75a2 2 0 1 0 2.83 2.83ZM1.47 2.53l12 12 1.06-1.06-12-12-1.06 1.06Z" />
    </svg>
  )
}

export function ListIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M5 2h10v1.5H5V2ZM5 7h10v1.5H5V7ZM5 12h10v1.5H5V12ZM1 2h2v1.5H1V2ZM1 7h2v1.5H1V7ZM1 12h2v1.5H1V12Z" />
    </svg>
  )
}

export function CardsIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M13 1.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5h10ZM3 0a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H3ZM13 10.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h10ZM3 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z" />
    </svg>
  )
}

export function TriangleRightIcon8({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-2 w-2 overflow-visible", className)}
      viewBox="0 0 8 8"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7.43 3.593 1.79-.435A.5.5 0 0 0 1-.028v8.056a.5.5 0 0 0 .79.407l5.64-4.028a.5.5 0 0 0 0-.814Z" />
    </svg>
  )
}

export function CheckIcon8({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-2 w-2 overflow-visible", className)}
      viewBox="0 0 8 8"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8.05.85 3.1 7.45a.75.75 0 0 1-1.186.019L-.554 4.383l1.171-.937 1.864 2.33L6.851-.05l1.2.9Z" />
    </svg>
  )
}

export function CheckIcon12(props: IconProps) {
  return (
    <Icon size={12} {...props}>
      <path d="M10.795 1.82 4.9 10.181a.75.75 0 0 1-1.22.01L.953 6.452l1.212-.885 2.111 2.896L9.57.955l1.226.864Z" />
    </Icon>
  )
}

export function CheckIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M14.05 2.846 6.351 13.197a.75.75 0 0 1-1.228-.034L1.961 8.37l1.252-.826 2.574 3.9 7.059-9.493 1.203.895Z" />
    </Icon>
  )
}

export function CloseIcon8(props: IconProps) {
  return (
    <Icon size={8} {...props}>
      <path d="M4 2.94 6.47.47l1.06 1.06L5.06 4l2.47 2.47-1.06 1.06L4 5.06 1.53 7.53.47 6.47 2.94 4 .47 1.53 1.53.47 4 2.94Z" />
    </Icon>
  )
}

export function CloseIcon12(props: IconProps) {
  return (
    <Icon size={12} {...props}>
      <path d="M10.56 2.5 7.008 6.054 10.56 9.48l-1.04 1.08-3.574-3.446L2.5 10.56 1.44 9.5l3.426-3.427L1.44 2.77l1.04-1.08 3.447 3.324L9.5 1.439 10.56 2.5Z" />
    </Icon>
  )
}

export function ShareIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M8 .19 3.69 4.5l1.06 1.06 2.5-2.5V11h1.5V3.06l2.5 2.5 1.06-1.06L8 .19Z" />
      <path d="M1 9v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9h-1.5v5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V9H1Z" />
    </Icon>
  )
}

export function TaskListIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M9 2h6v1.5H9V2ZM9 7h6v1.5H9V7ZM9 12h6v1.5H9V12ZM2.5 2.5h3v3h-3v-3ZM2 1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2ZM7.044 9.81l-3.197 4.617a.75.75 0 0 1-1.22.018l-1.676-2.27 1.207-.89L3.21 12.71l2.6-3.755 1.233.854Z" />
    </Icon>
  )
}

export function SidebarIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M1.95 1A1.95 1.95 0 0 0 0 2.95v9.6a1.95 1.95 0 0 0 1.95 1.95h12.1A1.95 1.95 0 0 0 16 12.55v-9.6A1.95 1.95 0 0 0 14.05 1H1.95ZM1.5 2.95a.45.45 0 0 1 .45-.45H9.5V13H1.95a.45.45 0 0 1-.45-.45v-9.6ZM11 13V2.5h3.05a.45.45 0 0 1 .45.45v9.6a.45.45 0 0 1-.45.45H11Z" />
    </Icon>
  )
}

export function OfflineIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M3.845 4.104 1.449 1.51 2.55.49l12 13-1.102 1.018-4.812-5.213a4.5 4.5 0 0 0-3.819 1.272l-1.06-1.06a6 6 0 0 1 3.496-1.71L4.935 5.285a8.964 8.964 0 0 0-3.299 2.1l-1.06-1.06a10.47 10.47 0 0 1 3.269-2.222Z" />
      <path d="M7 13a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM7.17 3.283l1.368 1.483c2.12.126 4.205 1 5.826 2.62l1.06-1.06A10.477 10.477 0 0 0 7.17 3.283Z" />
    </Icon>
  )
}

export function OfflineIcon24({ className }: { className?: string }) {
  return (
    <svg className={cx("h-6 w-6", className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m18.454 20.514-4.56-4.846a4.5 4.5 0 0 0-5.076.9l-1.06-1.06a6 6 0 0 1 4.33-1.757l-2.512-2.67a8.957 8.957 0 0 0-3.94 2.305l-1.06-1.06a10.459 10.459 0 0 1 3.86-2.455L6.24 7.537a13.477 13.477 0 0 0-3.786 2.667l-1.06-1.06a14.99 14.99 0 0 1 3.77-2.75l-2.71-2.88 1.092-1.028 16 17-1.092 1.028ZM13.502 10.876l-1.53-1.626a10.468 10.468 0 0 1 7.452 3.076l-1.06 1.06a8.96 8.96 0 0 0-4.862-2.51ZM9.388 6.504 8.196 5.238c4.983-1.301 10.505 0 14.41 3.906l-1.06 1.06a13.486 13.486 0 0 0-12.158-3.7ZM12 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  )
}

export function MaximizeIcon16({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4", className)} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M7 15H1V9h1.5v3.44l4-4L7.56 9.5l-4 4H7V15ZM9 1h6v6h-1.5V3.56l-4 4L8.44 6.5l4-4H9V1Z" />
    </svg>
  )
}

export function MinimizeIcon16({ className }: { className?: string }) {
  return (
    <svg className={cx("h-4 w-4", className)} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9 7h6V5.5h-3.44l4-4L14.5.44l-4 4V1H9v6ZM7 9H1v1.5h3.44l-4 4 1.06 1.06 4-4V15H7V9Z" />
    </svg>
  )
}

export function GlassesIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M3 2.5A1.5 1.5 0 0 0 1.5 4v3.627A3.501 3.501 0 0 1 6.92 9.75h2.16a3.501 3.501 0 0 1 5.42-2.123V4A1.5 1.5 0 0 0 13 2.5V1a3 3 0 0 1 3 3v6.5a3.5 3.5 0 0 1-6.92.75H6.92A3.501 3.501 0 0 1 0 10.5V4a3 3 0 0 1 3-3v1.5Zm11.5 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0Zm-11 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </Icon>
  )
}

export function FullwidthIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M14 2.5C14.2761 2.5 14.5 2.72386 14.5 3V13C14.5 13.2761 14.2761 13.5 14 13.5H2C1.72386 13.5 1.5 13.2761 1.5 13V3C1.5 2.72386 1.72386 2.5 2 2.5H14ZM2 1C0.895431 1 0 1.89543 0 3V13C0 14.1046 0.895431 15 2 15H14C15.1046 15 16 14.1046 16 13V3C16 1.89543 15.1046 1 14 1H2Z" />
      <path d="M3 4H13V12H3V4Z" className="opacity-50" />
    </Icon>
  )
}

export function CenteredIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M14 2.5C14.2761 2.5 14.5 2.72386 14.5 3V13C14.5 13.2761 14.2761 13.5 14 13.5H2C1.72386 13.5 1.5 13.2761 1.5 13V3C1.5 2.72386 1.72386 2.5 2 2.5H14ZM2 1C0.895431 1 0 1.89543 0 3V13C0 14.1046 0.895431 15 2 15H14C15.1046 15 16 14.1046 16 13V3C16 1.89543 15.1046 1 14 1H2Z" />
      <path d="M5 4h6v8H5V4Z" className="opacity-50" />
    </Icon>
  )
}

export function PinIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M3.95.99a1.95 1.95 0 0 1 2.985.274l1.719 2.5.18.011c.35.025.832.075 1.367.175 1.033.194 2.412.602 3.33 1.52a.75.75 0 0 1 0 1.06L10.56 9.5l4.97 4.97-1.061 1.06-4.97-4.97-2.97 2.97a.75.75 0 0 1-1.06 0c-.918-.917-1.326-2.296-1.52-3.33a12.24 12.24 0 0 1-.186-1.546l-2.5-1.719A1.95 1.95 0 0 1 .99 3.95L3.95.99Zm4.304 4.26h-.005a.75.75 0 0 1-.617-.325L5.699 2.114a.45.45 0 0 0-.689-.064L2.05 5.01a.45.45 0 0 0 .064.69l2.81 1.932a.75.75 0 0 1 .326.618v.026l.003.093a10.742 10.742 0 0 0 .172 1.556c.128.683.336 1.38.653 1.937l5.783-5.784c-.556-.317-1.254-.525-1.937-.653a10.742 10.742 0 0 0-1.649-.175h-.021Z" />
    </Icon>
  )
}

export function PinFillIcon16(props: IconProps) {
  return (
    <Icon size={16} {...props}>
      <path d="M3.95.99a1.95 1.95 0 0 1 2.985.274l1.719 2.5.18.011c.35.025.832.075 1.367.175 1.033.194 2.412.602 3.33 1.52a.75.75 0 0 1 0 1.06l-7 7a.75.75 0 0 1-1.061 0c-.918-.917-1.326-2.296-1.52-3.33a12.24 12.24 0 0 1-.186-1.546l-2.5-1.719A1.95 1.95 0 0 1 .99 3.95L3.95.99ZM10.47 11.53l4 4 1.06-1.06-4-4-1.06 1.06Z" />
    </Icon>
  )
}

// Brand icons

export function GitHubIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="var(--color-text)" aria-hidden>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  )
}

export function TwitterIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="#1d9bf0" aria-hidden>
      <path d="M15.969 3.047a6.666 6.666 0 0 1-1.884.516 3.305 3.305 0 0 0 1.442-1.815c-.634.37-1.336.64-2.084.79a3.28 3.28 0 0 0-5.59 2.987 9.292 9.292 0 0 1-6.76-3.417c-.294.5-.447 1.07-.444 1.65 0 1.14.58 2.142 1.459 2.73a3.27 3.27 0 0 1-1.485-.41v.04a3.282 3.282 0 0 0 2.63 3.218 3.33 3.33 0 0 1-1.474.057 3.29 3.29 0 0 0 3.069 2.278A6.578 6.578 0 0 1 .78 13.074c-.26 0-.52-.015-.78-.045a9.33 9.33 0 0 0 5.038 1.473c6.035 0 9.332-4.997 9.332-9.323 0-.14 0-.28-.01-.42A6.623 6.623 0 0 0 16 3.06l-.031-.013Z" />
    </svg>
  )
}

export function YouTubeIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M15.665 4.124A2.01 2.01 0 0 0 14.251 2.7C13.003 2.363 8 2.363 8 2.363s-5.003 0-6.251.337A2.011 2.011 0 0 0 .335 4.124C0 5.38 0 8 0 8s0 2.62.335 3.876A2.01 2.01 0 0 0 1.749 13.3c1.248.337 6.251.337 6.251.337s5.003 0 6.251-.337a2.009 2.009 0 0 0 1.415-1.424C16 10.62 16 8 16 8s0-2.62-.335-3.876Z"
        fill="#ff0000"
      />
      <path d="M6.363 10.379V5.62L10.545 8l-4.182 2.379Z" fill="#ffffff" />
    </svg>
  )
}

export function InstagramIcon16() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" aria-hidden>
      <defs>
        <linearGradient id="myGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="-10.92%" stopColor="#FFD522" />
          <stop offset="48.02%" stopColor="#F1000B" />
          <stop offset="106.81%" stopColor="#B900B3" />
        </linearGradient>
      </defs>
      <path
        d="M4.703.095c-.847.04-1.425.176-1.93.374a3.894 3.894 0 0 0-1.409.92A3.9 3.9 0 0 0 .45 2.801c-.197.507-.33 1.086-.367 1.933-.037.85-.045 1.12-.041 3.281.004 2.162.013 2.433.054 3.282.04.847.176 1.425.374 1.931.204.524.477.967.92 1.408.443.442.888.713 1.412.916.506.196 1.085.329 1.933.366.849.037 1.12.046 3.28.042 2.163-.005 2.434-.014 3.283-.054.847-.04 1.425-.177 1.931-.374a3.901 3.901 0 0 0 1.408-.92c.442-.444.713-.889.915-1.413.196-.506.33-1.085.367-1.932.037-.85.045-1.12.041-3.282-.004-2.162-.014-2.432-.054-3.281-.04-.848-.176-1.426-.374-1.932a3.905 3.905 0 0 0-.92-1.408A3.896 3.896 0 0 0 13.199.45c-.506-.196-1.085-.33-1.932-.366-.85-.038-1.12-.046-3.282-.042-2.162.004-2.433.013-3.282.054Zm.093 14.39c-.776-.034-1.197-.162-1.478-.27a2.48 2.48 0 0 1-.917-.594 2.474 2.474 0 0 1-.597-.914c-.109-.281-.24-.702-.277-1.478-.04-.84-.048-1.09-.052-3.216-.004-2.125.004-2.377.04-3.217.033-.775.163-1.197.271-1.478a2.47 2.47 0 0 1 .594-.917c.278-.279.543-.451.914-.597.28-.11.702-.24 1.477-.276.84-.04 1.091-.049 3.216-.053 2.126-.004 2.377.004 3.217.04.776.034 1.198.163 1.478.271.372.144.637.316.917.594.279.278.452.542.597.915.11.28.24.7.276 1.476.04.84.05 1.092.053 3.217.004 2.125-.003 2.377-.04 3.216-.034.776-.163 1.198-.271 1.479a2.473 2.473 0 0 1-.594.916 2.474 2.474 0 0 1-.914.597c-.28.11-.702.24-1.477.277-.84.04-1.091.049-3.217.052-2.125.005-2.376-.003-3.216-.04Zm6.49-10.74a.955.955 0 1 0 1.91-.004.955.955 0 0 0-1.91.004ZM3.912 8.008a4.087 4.087 0 1 0 8.174-.016 4.087 4.087 0 0 0-8.174.016Zm1.433-.003a2.653 2.653 0 1 1 5.307-.01 2.653 2.653 0 0 1-5.307.01Z"
        fill="url(#myGradient)"
      />
    </svg>
  )
}
