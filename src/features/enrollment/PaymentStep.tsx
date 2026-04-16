import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'

type PaymentStepProps = {
  onSuccess: (paymentIntentId: string) => void
  onError: (message: string) => void
  disabled?: boolean
  amount: number
  currency: string
}

/** Format minor-unit amount (cents) as a display price. */
function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

export function PaymentStep({ onSuccess, onError, disabled, amount, currency }: PaymentStepProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    if (!stripe || !elements || isPending || disabled) return

    setIsPending(true)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message ?? 'Payment failed. Please check your card details and try again.')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      } else {
        onError('Payment could not be confirmed. Please try again.')
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="payment-step">
      <div className="payment-step__element">
        <PaymentElement />
      </div>
      <div className="enrollment-form__actions">
        <button
          className="button button--primary enrollment-form__submit"
          disabled={!stripe || isPending || disabled}
          onClick={() => void handleConfirm()}
          type="button"
        >
          {isPending ? 'Processing payment...' : `Pay ${formatPrice(amount, currency)} & Submit`}
        </button>
      </div>
    </div>
  )
}
