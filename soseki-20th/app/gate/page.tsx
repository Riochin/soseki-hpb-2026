'use client'
import { useActionState } from 'react'
import { verifyPassphrase } from './actions'

export default function GatePage() {
  const [state, action, pending] = useActionState(verifyPassphrase, null)
  const hasError = state?.error === true

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-edge-strong" />
          <h1
            className="text-2xl tracking-[0.25em] text-foreground"
            style={{ fontFamily: "var(--font-yuji-syuku)" }}
          >
            あいことば
          </h1>
          <div className="h-px flex-1 bg-edge-strong" />
        </div>

        <div className="modal-panel p-8">
          <p className="mb-6 text-center text-xs text-foreground/50 tracking-wider leading-relaxed">
            と、言えば〜⁉️⁉️⁉️
          </p>

          <form action={action} className="flex flex-col gap-3">
            <input
              name="passphrase"
              type="text"
              autoComplete="off"
              autoFocus
              className={[
                "w-full bg-surface px-4 py-3 text-center text-foreground",
                "tracking-[0.15em] rounded-control border-2 outline-none transition-colors",
                hasError
                  ? "border-red-500/60 focus:border-red-400"
                  : "border-edge-strong focus:border-accent",
              ].join(" ")}
              placeholder="・・・"
            />

            {hasError && (
              <p className="text-center text-xs text-red-400 tracking-wider">
                あいことばが違います
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-control bg-accent py-3 text-sm font-bold text-black tracking-[0.2em] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "確認中…" : "入　場　す　る"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-foreground/20 tracking-widest">
          漱石 生誕20周年祭
        </p>
      </div>
    </main>
  );
}
