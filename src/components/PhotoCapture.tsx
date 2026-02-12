import { forwardRef, useImperativeHandle, useRef } from 'react'

export interface PhotoCaptureHandle {
  trigger: () => void
}

interface PhotoCaptureProps {
  onPhotoSelected: (file: File) => void
  disabled?: boolean
}

export const PhotoCapture = forwardRef<PhotoCaptureHandle, PhotoCaptureProps>(
  function PhotoCapture({ onPhotoSelected, disabled }, ref) {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      trigger() {
        inputRef.current?.click()
      },
    }))

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) return
      onPhotoSelected(file)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }

    return (
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        data-testid="photo-capture-input"
      />
    )
  },
)
