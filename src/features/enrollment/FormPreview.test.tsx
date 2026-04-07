import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ApiClientError } from '../../lib/api'
import { FormPreview } from './FormPreview'

const { createEnrollmentMock } = vi.hoisted(() => ({
  createEnrollmentMock: vi.fn(),
}))

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>()

  return {
    ...actual,
    createEnrollment: createEnrollmentMock,
  }
})

const baseSchema = {
  version: 3,
  fields: [
    {
      fieldId: 'first_name',
      type: 'short_text' as const,
      label: 'First name',
      required: true,
    },
  ],
}

function renderFormPreview(schema = baseSchema) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FormPreview
          courseId="course-1"
          schema={schema}
          tenantCode="acme-training"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FormPreview', () => {
  beforeEach(() => {
    createEnrollmentMock.mockReset()
  })

  it('submits the enrollment form and shows the success state', async () => {
    createEnrollmentMock.mockResolvedValue({
      data: {
        submissionId: 'sub_123',
        status: 'submitted',
        courseTitle: 'Intro to AI',
        links: {
          course: '/acme-training/courses/course-1',
          tenantHome: '/acme-training',
        },
      },
    })

    renderFormPreview()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit enrolment/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /application submitted/i }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByText(/intro to ai/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to courses/i })).toHaveAttribute(
      'href',
      '/acme-training/courses',
    )

    expect(createEnrollmentMock).toHaveBeenCalledWith(
      'acme-training',
      'course-1',
      expect.objectContaining({
        formVersion: 3,
        answers: expect.objectContaining({
          first_name: 'Alice',
        }),
      }),
    )
  })

  it('shows a friendly rate-limit error and no retry button on 429', async () => {
    createEnrollmentMock.mockRejectedValue(
      new ApiClientError(
        429,
        { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
        'Too many requests.',
      ),
    )

    renderFormPreview()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit enrolment/i }))

    await waitFor(() =>
      expect(
        screen.getByText(/you've submitted too many applications recently/i),
      ).toBeInTheDocument(),
    )

    // No retry submit button on 429
    expect(screen.queryByRole('button', { name: /submit enrolment/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to courses/i })).toBeInTheDocument()
  })

  it('shows the generic error banner for non-429 errors', async () => {
    createEnrollmentMock.mockRejectedValue(
      new ApiClientError(
        500,
        { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } },
        'Something went wrong.',
      ),
    )

    renderFormPreview()

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit enrolment/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    // Retry button is present for non-429 errors
    expect(screen.getByRole('button', { name: /submit enrolment/i })).toBeInTheDocument()
  })

  it('has a honeypot field that is hidden from human users', () => {
    renderFormPreview()

    const honeypot = document.querySelector('input[name="website"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot).toHaveAttribute('aria-hidden', 'true')
    expect(honeypot).toHaveAttribute('autocomplete', 'off')
  })

  it('silently shows success without calling the API when honeypot is filled', async () => {
    renderFormPreview()

    // Simulate a bot filling the honeypot field
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement
    fireEvent.change(honeypot, { target: { value: 'http://spam.example.com' } })

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Bot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit enrolment/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /application submitted/i }),
      ).toBeInTheDocument(),
    )

    // API must NOT have been called
    expect(createEnrollmentMock).not.toHaveBeenCalled()
  })
})
