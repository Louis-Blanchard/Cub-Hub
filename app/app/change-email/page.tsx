
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ChangeEmailPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: userError } =
      await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Please log in before changing your email.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      email: email.trim()
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        'Email change requested. Please check both email inboxes for confirmation links.'
      )
    }

    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 500, margin: '50px auto', padding: 20 }}>
      <h1>Change Login Email</h1>
      <p>Enter the new email address for your Cub Hub account.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="New work email address"
          style={{ padding: 12, width: '100%', marginBottom: 15 }}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Request Email Change'}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </main>
  )
}
