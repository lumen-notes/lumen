import React from "react"
import { Slot } from "@radix-ui/react-slot"

type FileInputButtonProps = React.PropsWithChildren<{
  asChild?: boolean
  multiple?: boolean
  onChange?: (files: FileList | null) => void
}>

export function FileInputButton({
  asChild = false,
  multiple = false,
  onChange,
  children,
}: FileInputButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const Component = asChild ? Slot : "button"
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple={multiple}
        onChange={(event) => {
          onChange?.(event.target.files)
        }}
      />
      <Component
        onClick={(event) => {
          fileInputRef.current?.click()
          event.preventDefault()
        }}
      >
        {children}
      </Component>
    </>
  )
}
