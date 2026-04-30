// Local smoke test for the portrait pipeline.
// Run with: PORTRAITS_DIR=... PORTRAIT_CACHE_DIR=... npx tsx scripts/_portrait-smoke.ts

import { renderPortrait } from "../lib/portrait";

async function main() {
  console.log("PORTRAITS_DIR=", process.env.PORTRAITS_DIR);
  console.log("PORTRAIT_CACHE_DIR=", process.env.PORTRAIT_CACHE_DIR);

  const cold = await renderPortrait({ resref: "po_hu_m_dl_01_", width: 128 });
  console.log(`cold:  ${cold.body.length}b cache=${cold.fromCache} src=${cold.source}`);

  const warm = await renderPortrait({ resref: "po_hu_m_dl_01_", width: 128 });
  console.log(`warm:  ${warm.body.length}b cache=${warm.fromCache}`);

  const big = await renderPortrait({ resref: "po_hu_m_dl_01_", width: 256 });
  console.log(`256w:  ${big.body.length}b cache=${big.fromCache}`);

  try {
    await renderPortrait({ resref: "nonexistent_xyz", width: 128 });
  } catch (e) {
    console.log(`miss:  ${(e as Error).constructor.name} - ${(e as Error).message}`);
  }
}

void main();
