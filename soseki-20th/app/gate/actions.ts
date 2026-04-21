'use server'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type State = { error: boolean } | null

export async function verifyPassphrase(
  _prev: State,
  formData: FormData,
): Promise<{ error: boolean }> {
  const normalize = (s: string) => s.normalize('NFKC').trim()
  const input = normalize(formData.get('passphrase')?.toString() ?? '')
  if (input !== normalize(process.env.SECRET_WORD ?? '')) {
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
