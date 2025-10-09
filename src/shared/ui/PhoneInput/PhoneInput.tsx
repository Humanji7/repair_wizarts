import { forwardRef } from 'react'
import type {
  ChangeEventHandler,
  FocusEventHandler,
  InputHTMLAttributes,
} from 'react'

export const PHONE_MIN_DIGITS = 11

const INVALID_CHARACTERS_REGEXP = /[^0-9()+\-\s]/

const extractDigits = (value: string) => value.replace(/\D/g, '')

const normalizeDigits = (digits: string) => {
  if (!digits) {
    return ''
  }

  let normalized = digits

  if (normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`
  }

  if (!normalized.startsWith('7')) {
    normalized = `7${normalized}`
  }

  return normalized.slice(0, PHONE_MIN_DIGITS)
}

export const formatPhoneNumber = (value: string) => {
  const digits = normalizeDigits(extractDigits(value))

  if (!digits) {
    return ''
  }

  const region = digits.slice(1, 4)
  const firstPart = digits.slice(4, 7)
  const secondPart = digits.slice(7, 9)
  const thirdPart = digits.slice(9, 11)

  let formatted = '+7('

  formatted += region

  if (region.length === 3) {
    formatted += ')'
  }

  if (firstPart) {
    formatted += `${region.length === 3 ? '-' : ''}${firstPart}`
  }

  if (secondPart) {
    formatted += `-${secondPart}`
  }

  if (thirdPart) {
    formatted += `-${thirdPart}`
  }

  return formatted
}

export const isPhoneNumberComplete = (value: string) =>
  normalizeDigits(extractDigits(value)).length === PHONE_MIN_DIGITS

export type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> & {
  value: string
  onChange?: (value: string) => void
  onValidationError?: (message: string) => void
  onValidityChange?: (isValid: boolean) => void
  allowEmpty?: boolean
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      onValidationError,
      onValidityChange,
      allowEmpty = true,
      ...rest
    },
    ref
  ) => {
    const emitValidationState = (nextValue: string) => {
      if (onValidityChange) {
        onValidityChange(isPhoneNumberComplete(nextValue))
      }
    }

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      const rawValue = event.target.value

      if (onValidationError) {
        if (INVALID_CHARACTERS_REGEXP.test(rawValue)) {
          onValidationError(
            'Вы ввели недопустимый символ. Пожалуйста, введите только цифры.'
          )
        } else {
          onValidationError('')
        }
      }

      const digits = extractDigits(rawValue)

      if (!digits) {
        if (allowEmpty) {
          onChange?.('')
          emitValidationState('')
        }
        return
      }

      const formatted = formatPhoneNumber(digits)

      emitValidationState(formatted)
      onChange?.(formatted)
    }

    const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
      rest.onBlur?.(event)

      if (!onValidationError) {
        return
      }

      if (!event.target.value) {
        onValidationError('')
        return
      }

      if (!isPhoneNumberComplete(event.target.value)) {
        onValidationError('Введите полный номер телефона.')
      }
    }

    const formattedValue = value ? formatPhoneNumber(value) : ''

    return (
      <input
        ref={ref}
        inputMode="tel"
        {...rest}
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
