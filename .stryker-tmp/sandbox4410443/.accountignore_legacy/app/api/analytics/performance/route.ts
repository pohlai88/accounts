// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PerformanceMetric = await request.json();

    // Validate required fields
    if (!body.name || typeof body.value !== "number" || !body.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: name, value, timestamp" },
        { status: 400 },
      );
    }

    // Store performance metric in Supabase
    const { error } = await supabase.from("performance_metrics").insert({
      metric_name: body.name,
      metric_value: body.value,
      timestamp: body.timestamp,
      metadata: body.metadata || {},
      user_id: body.user_id,
      session_id: body.session_id,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing performance metric:", error);
      return NextResponse.json({ error: "Failed to store performance metric" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing performance metric:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get("metric");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from("performance_metrics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (metricName) {
      query = query.eq("metric_name", metricName);
    }

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }

    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching performance metrics:", error);
      return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 });
    }

    return NextResponse.json({ metrics: data || [] });
  } catch (error) {
    console.error("Error processing performance metrics request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
