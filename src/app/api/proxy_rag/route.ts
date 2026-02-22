import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request){
    try{
        const body = await request.json();
        const backendResponse = await fetch(
            "http://127.0.0.1:8000/rag_ui", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body)
            }
        );
        return new Response(backendResponse.body, {
            status: backendResponse.status,
            headers: {
                "Content-Type": backendResponse.headers.get("Content-Type") || "text/event-stream",
                "Cache-Control":"no-cache",
                "Connection": "keep-alive",
            }
        });
    }
    catch (error){
        console.error("Proxy Error:", error);
        return NextResponse.json({error: "backend not responding"}, {status: 500})
    }
}