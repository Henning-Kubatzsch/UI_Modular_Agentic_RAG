//{"data":{"llm":{"model_path":"models/qwen2.5-3b-instruct-q4_k_m.gguf","family":"qwen","n_ctx":2048,"n_gpu_layers":-1,"n_threads":8,"n_batch":256,"seed":42,"temperature":0.4,"top_p":0.9,"repeat_penalty":1.1,"max_tokens":512,"use_mmap":false,"use_mlock":false},"prompt":{"language":"en","style":"steps","max_context_chars":3000,"cite":false,"require_citations":false},"retriever":{"k":3}}}

import { useEffect, useState, useRef, useMemo } from "react"

const data = {
  "llm": {
    "properties": {
      "model_path": {
        "default": "models/qwen2.5-3b-instruct-q4_k_m.gguf",
        "title": "Model Path",
        "type": "string"
      },
      "family": {
        "default": "qwen",
        "enum": [
          "qwen",
          "qwen2",
          "qwen2.5",
          "llama3",
          "phi3",
          "mistral"
        ],
        "title": "Family",
        "type": "string"
      },
      "n_ctx": {
        "default": 4096,
        "maximum": 32768,
        "minimum": 512,
        "title": "N Ctx",
        "type": "integer"
      },
      "n_gpu_layers": {
        "default": -1,
        "title": "N Gpu Layers",
        "type": "integer"
      },
      "n_threads": {
        "default": 6,
        "description": "CPU threads for llama.cpp. None = auto-detect",
        "minimum": 1,
        "title": "N Threads",
        "type": "integer"
      },
      "seed": {
        "default": 42,
        "title": "Seed",
        "type": "integer"
      },
      "temperature": {
        "default": 0.2,
        "maximum": 2,
        "minimum": 0,
        "title": "Temperature",
        "type": "number"
      },
      "top_p": {
        "default": 0.9,
        "maximum": 1,
        "minimum": 0,
        "title": "Top P",
        "type": "number"
      },
      "repeat_penalty": {
        "default": 1.1,
        "minimum": 0,
        "title": "Repeat Penalty",
        "type": "number"
      },
      "max_tokens": {
        "default": 512,
        "maximum": 8192,
        "minimum": 1,
        "title": "Max Tokens",
        "type": "integer"
      },
      "stop": {
        "anyOf": [
          {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          {
            "type": "null"
          }
        ],
        "default": null,
        "title": "Stop"
      },
      "n_batch": {
        "default": 256,
        "description": "Batch for prompt processing",
        "maximum": 2048,
        "minimum": 32,
        "title": "N Batch",
        "type": "integer"
      },
      "use_mmap": {
        "default": false,
        "title": "Use Mmap",
        "type": "boolean"
      },
      "use_mlock": {
        "default": false,
        "title": "Use Mlock",
        "type": "boolean"
      }
    },
    "title": "LLMConfig",
    "type": "object"
  },
  "prompt": {
    "properties": {
      "language": {
        "default": "en",
        "enum": [
          "en",
          "de"
        ],
        "title": "Language",
        "type": "string"
      },
      "style": {
        "default": "steps",
        "enum": [
          "steps",
          "qa"
        ],
        "title": "Style",
        "type": "string"
      },
      "max_context_chars": {
        "default": 4000,
        "maximum": 10000,
        "minimum": 500,
        "title": "Max Context Chars",
        "type": "integer"
      },
      "cite": {
        "default": true,
        "title": "Cite",
        "type": "boolean"
      },
      "require_citations": {
        "default": true,
        "title": "Require Citations",
        "type": "boolean"
      }
    },
    "title": "PromptOptions",
    "type": "object"
  },
  "retriever": {
    "properties": {
      "k": {
        "default": 4,
        "maximum": 10,
        "minimum": 1,
        "title": "K",
        "type": "integer"
      }
    },
    "title": "RetrieverConfig",
    "type": "object"
  }
}

const savedTypes = {
  "llm.family": "string",
  "llm.max_tokens": "int",
  "llm.model_path": "string",
  "llm.n_batch": "int",
  "llm.n_ctx": "int",
  "llm.n_gpu_layers": "int",
  "llm.n_threads": "int",
  "llm.repeat_penalty": "float",
  "llm.seed": "int",
  "llm.temperature": "float",
  "llm.top_p": "float",
  "llm.use_mlock": "boolean",
  "llm.use_mmap": "boolean",
  "prompt.cite": "boolean",
  "prompt.language": "string",
  "prompt.max_context_chars": "int",
  "prompt.require_citations": "boolean",
  "prompt.style": "string",
  "retriever.k": "int"
};

//const originalTypes = useRef<Record<string, string>>({});

const types: Record<string, string> = {}

for (const [key, value] of Object.entries(savedTypes)){
  console.log(key)
  types[key] = value;
}

console.log(data["llm"].properties["family"].enum)