// @ts-nocheck
export function ok<T>(data: T, requestId: string, status = 200) {
  return Response.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status },
  );
}

export function problem({
  status,
  title,
  code,
  detail,
  requestId,
}: {
  status: number;
  title: string;
  code?: string;
  detail?: string;
  requestId: string;
}) {
  return Response.json(
    {
      success: false,
      timestamp: new Date().toISOString(),
      requestId,
      error: {
        type: "about:blank",
        title,
        status,
        code,
        detail,
      },
    },
    { status },
  );
}
