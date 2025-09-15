import { NextRequest } from "next/server";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { webSocketServer } from "@aibos/web-api/lib/websocket-server";

export async function GET(req: NextRequest) {
  try {
    // Start WebSocket server if not already running
    if (!webSocketServer["isRunning"]) {
      await webSocketServer.start(8080);
    }

    // Get security context for authentication
    const ctx = await getSecurityContext(req);

    // Return WebSocket connection info
    return Response.json({
      success: true,
      data: {
        wsUrl: `ws://localhost:8080/ws?tenantId=${ctx.tenantId}&userId=${ctx.userId}&token=${req.headers.get("authorization")?.replace("Bearer ", "")}`,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        features: {
          presence: true,
          notifications: true,
          events: true,
          channels: true,
        },
        serverStatus: webSocketServer.getStatus(),
      },
      requestId: ctx.requestId,
    });
  } catch (error: unknown) {
    console.error("WebSocket setup error:", error);

    return Response.json(
      {
        success: false,
        error: {
          type: "about:blank",
          title: "WebSocket setup failed",
          status: 500,
          detail: error instanceof Error ? error.message : "Failed to setup WebSocket connection",
          instance: req.url,
        },
      },
      { status: 500 },
    );
  }
}

// Health check for WebSocket server
export async function POST(req: NextRequest) {
  try {
    const status = webSocketServer.getStatus();

    if (!status.isRunning) {
      return Response.json(
        {
          success: false,
          error: {
            type: "about:blank",
            title: "WebSocket server not running",
            status: 503,
            detail: "WebSocket server is not initialized",
            instance: req.url,
          },
        },
        { status: 503 },
      );
    }

    return Response.json({
      success: true,
      data: {
        status: "running",
        ...status,
      },
    });
  } catch (error: unknown) {
    console.error("WebSocket health check error:", error);

    return Response.json(
      {
        success: false,
        error: {
          type: "about:blank",
          title: "WebSocket health check failed",
          status: 500,
          detail: error instanceof Error ? error.message : "Failed to check WebSocket server health",
          instance: req.url,
        },
      },
      { status: 500 },
    );
  }
}
