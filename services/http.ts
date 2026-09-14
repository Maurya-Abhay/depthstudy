export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json(data, {
    status: 200,
    ...init,
  });
}

export function jsonCreated<T>(data: T) {
  return Response.json(data, { status: 201 });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return Response.json(
    {
      error: message,
      ...extra,
    },
    { status },
  );
}
