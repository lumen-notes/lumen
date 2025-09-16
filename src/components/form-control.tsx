import { cx } from "../utils/cx"

type FormControlProps = {
  htmlFor: string
  label: React.ReactNode
  description?: React.ReactNode
  required?: boolean
  visuallyHideLabel?: boolean
  className?: string
  children: React.ReactNode
}

export function FormControl({
  htmlFor,
  label,
  description,
  required,
  visuallyHideLabel,
  className,
  children,
}: FormControlProps) {
  return (
    <div className={cx("flex flex-col gap-2 w-full", className)}>
      <label
        htmlFor={htmlFor}
        className={cx("self-start text-sm/4 text-text-secondary", visuallyHideLabel && "sr-only")}
      >
        {label}
        {required ? <span className="ml-1 text-text-secondary">*</span> : null}
      </label>
      {children}
      {description ? (
        <span className="text-sm text-text-secondary text-pretty">{description}</span>
      ) : null}
    </div>
  )
}
