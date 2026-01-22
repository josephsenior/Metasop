
import fs from 'fs';

async function triggerAPI() {
    const payload = JSON.parse(fs.readFileSync('test_payload.json', 'utf8'));

    console.log("🚀 Triggering API Generation...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("http://127.0.0.1:3000/api/diagrams/generate?stream=true", {
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

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim());

            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    console.log(`[EVENT] ${event.type}: ${event.step_id || event.role || ''}`);
                    if (event.error) {
                        console.error("❌ EVENT ERROR:", JSON.stringify(event.error, null, 2));
                    }
                } catch {
                    console.log("[CHUNK]", line);
                }
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
