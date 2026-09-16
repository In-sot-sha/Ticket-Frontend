export function getApiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as {
    response?: { data?: unknown };
    message?: string;
  };
  const data = anyErr?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const payload = data as { message?: unknown; error?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  }

  const axiosStatusMessage = /^Request failed with status code \d+$/;
  if (
    typeof anyErr?.message === 'string' &&
    anyErr.message.trim() &&
    !axiosStatusMessage.test(anyErr.message)
  ) {
    return anyErr.message.trim();
  }

  return fallback;
}
