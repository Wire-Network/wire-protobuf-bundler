import degit from "degit"
import Path from "node:path"
import Fs from "node:fs"
import { log } from "../util/logger.js"

export interface FetchProtosOptions {
  repo: string
  outputDir: string
}

export async function fetchProtos(
  opts: FetchProtosOptions
): Promise<string[]> {
  const protoDir = Path.join(opts.outputDir, "proto")

  log.info("Fetching protos from %s → %s", opts.repo, protoDir)

  const emitter = degit(opts.repo, {
    cache: false,
    force: true,
    verbose: true
  })

  emitter.on("info", info => {
    log.debug("degit: %s", info.message)
  })

  await emitter.clone(protoDir)

  const protos = walkDir(protoDir).filter(f => f.endsWith(".proto"))

  if (protos.length === 0) {
    throw new Error(
      `No .proto files found after cloning ${opts.repo} into ${protoDir}`
    )
  }

  log.info("Found %d .proto file(s)", protos.length)
  return protos
}

function walkDir(dir: string): string[] {
  const results: string[] = []
  if (!Fs.existsSync(dir)) return results
  for (const entry of Fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = Path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}
