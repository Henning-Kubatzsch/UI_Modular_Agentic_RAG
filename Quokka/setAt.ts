type AnyObj = Record<string, any>;


let myObj: Record<string, any> = {
    llm: {
        model_path: "models/qwen2.5-3b-instruct-q4_k_m.gguf",
        family: "qwen",
        n_ctx: 512,
        n_gpu_layers: -1,
        n_threads: 8,
        n_batch: 512,
        seed: 42,
        temperature: 0.1,
        top_p: 0.9,
        repeat_penalty: 1.1,
        max_tokens: 512,
        use_mmap: false,
        use_mlock: false,
    },
    prompt: {
        language: "en",
        style: "steps",
        max_context_chars: 3000,
        cite: false,
        require_citations: false
    },
    retriever: {
        k: 3
    }};



function setAt(prevForm: AnyObj, path: string, newValue: any) {
    const keys = path.split(".");
    const newForm = structuredClone(prevForm ?? {});

    let current = newForm;
    console.log(path);
    console.log(keys.slice(0, -1));
        
    for (const key of keys.slice(0, -1)){
        current[key] ??= {};
        current = current[key]
    }

    current[keys.at(-1)!] = newValue; 
    console.log(current);
    return newForm;
}

let test1 =setAt(myObj, "llm.temperature", 0.5);
console.log(test1.llm.temperature); 




// Playing Games

function setAt2(prevForm: AnyObj, path: string, newValue: any) {
    const keys = path.split(".");
    const newForm = structuredClone(prevForm);

    let current = newForm;

    for(let i=0; i < keys.length - 1; i++){
        current = current[keys[i]];
    }
    current[keys.at(-1)!] = newValue;

    console.log(newForm[keys[0]][keys[1]]);
    return newForm;
}
  

let test2 = setAt2(myObj, "llm.temperature", 0.5);
console.log(test2.llm.temperature); 

