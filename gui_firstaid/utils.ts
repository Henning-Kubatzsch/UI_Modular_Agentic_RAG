// utils.ts
// 
export function pruneEmpty(v: any): any {
  if (Array.isArray(v)) {
    const arr = v.map(pruneEmpty).filter((x) => x !== undefined);
    return arr.length ? arr : undefined;
  }
  if (v && typeof v === "object") {
    const o: any = {};
    for (const [k, val] of Object.entries(v)) {
      const p = pruneEmpty(val);
      if (p !== undefined) o[k] = p;
    }
    return Object.keys(o).length ? o : undefined;
  }
  // read like this: if v is empty string or it is undefined -> return undefined, else return v
  return v === "" || v === undefined ? undefined : v; // 0/false bleiben
}

