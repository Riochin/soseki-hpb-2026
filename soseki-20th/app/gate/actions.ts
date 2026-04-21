'use server'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type State = { error: boolean } | null

export async function verifyPassphrase(
  _prev: State,
  formData: FormData,
): Promise<{ error: boolean }> {
  const input = formData.get('passphrase')?.toString().trim() ?? ''
  if (input !== process.env.SECRET_WORD) {
    return { error: true }
  }
  const token = createHash('sha256')
    .update(process.env.SECRET_WORD!)
    .digest('hex')
  ;(await cookies()).set('gate', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
  })
  redirect('/')
}
