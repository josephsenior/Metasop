
import fs from 'fs';

async function triggerAPI() {
    const payload = JSON.parse(fs.readFileSync('test_payload.json', 'utf8'));

    console.log("🚀 Triggering API Generation...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("http://127.0.0.1:3000/api/diagrams/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const responseJson = await response.json();
        const streamUrl = responseJson?.data?.streamUrl;
        if (!streamUrl) throw new Error("Missing stream URL");

        const streamResponse = await fetch(`http://127.0.0.1:3000${streamUrl}`);
        if (!streamResponse.ok) {
            const errorText = await streamResponse.text();
            throw new Error(`Stream Error (${streamResponse.status}): ${errorText}`);
        }

        const reader = streamResponse.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let splitIndex = buffer.indexOf("\n\n");
            while (splitIndex !== -1) {
                const chunk = buffer.slice(0, splitIndex);
                buffer = buffer.slice(splitIndex + 2);

                const dataLines = chunk.split("\n").filter(line => line.startsWith("data:"));
                if (dataLines.length > 0) {
                    const payload = dataLines.map(line => line.replace(/^data:\s?/, "")).join("\n");
                    if (payload && payload !== "[DONE]") {
                        try {
                            const event = JSON.parse(payload);
                            console.log(`[EVENT] ${event.type}: ${event.step_id || event.role || ''}`);
                            if (event.error) {
                                console.error("❌ EVENT ERROR:", JSON.stringify(event.error, null, 2));
                            }
                        } catch {
                            console.log("[CHUNK]", payload);
                        }
                    }
                }

                splitIndex = buffer.indexOf("\n\n");
            }
        }

        console.log("🏁 API Generation Completed.");
    } catch (error) {
        console.error("❌ Error triggering API:");
        console.error(error);
        process.exit(1);
    }
}

triggerAPI();
