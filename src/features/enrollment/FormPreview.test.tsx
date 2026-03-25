import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
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

describe('FormPreview', () => {
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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FormPreview
            courseId="course-1"
            schema={{
              version: 3,
              fields: [
                {
                  fieldId: 'first_name',
                  type: 'short_text',
                  label: 'First name',
                  required: true,
                },
              ],
            }}
            tenantCode="acme-training"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Alice' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit enrollment/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /your application was received/i }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByText(/intro to ai/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to course/i })).toHaveAttribute(
      'href',
      '/acme-training/courses/course-1',
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
})
