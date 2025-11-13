import { parse, stringify } from "yaml";

async function testGET(){
    console.log("Testing GET...")
    // calling fetch on api/config without additional properties is the default case and corresponds with the GET method
    const response = await fetch("http://localhost:3000/api/config");
    // take response body which is a json string and parses it back to java object
    const data = await response.json();
    console.log("GET Result:", data);
}

async function testPUTReplace(){
    console.log("\nTesting PUT (replace mode)...");
    const response = await fetch("http://localhost:3000/api/config?mode=replace", {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            data: {
                llm: {
                    model_path: 'models/qwen2.5-3b-instruct-q4_k_m.gguf',
                    family: 'phi3',
                    n_ctx: 2048,
                    n_gpu_layers: -1,
                    n_threads: 8,
                    n_batch: 256,
                    seed: 42,
                    temperature: 0.4,
                    top_p: 0.9,
                    repeat_penalty: 1.1,
                    max_tokens: 512,
                    use_mmap: false,
                    use_mlock: false
                },
                prompt: {
                    language: 'en',
                    style: 'steps',
                    max_context_chars: 3000,
                    cite: false,
                    require_citations: false
                },
                retriever: { 
                    k: 5 
                }
            }
        })
    });
    const result = await response.json();
    console.log("PUT Replace Result:", result)
}

testGET();
testPUTReplace();