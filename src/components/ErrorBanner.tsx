import { ApiRequestError } from '../api/client';

function formatDetails(details: unknown): string | null {
  if (!details) return null;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return null;
  }
}

export default function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;

  const message = error instanceof ApiRequestError ? error.message : (error as Error).message || 'Something went wrong.';
  const details = error instanceof ApiRequestError ? formatDetails(error.details) : null;
  const code = error instanceof ApiRequestError ? error.code : undefined;

  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <p className="font-medium">
        {message}
        {code ? <span className="ml-2 font-mono text-xs text-rose-500">[{code}]</span> : null}
      </p>
      {details ? (
        <pre className="mt-2 overflow-x-auto rounded bg-rose-100/60 p-2 text-xs text-rose-700">{details}</pre>
      ) : null}
    </div>
  );
}
