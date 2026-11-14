import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { createLogger } from "@/lib/logger";

/**
 * Camada de storage com uma unica interface e duas implementacoes.
 *
 * Hoje: disco local em .uploads (fora do build, com backup trivial).
 * Amanha: trocar `STORAGE_DRIVER=s3` e implementar os 4 metodos. Nenhum
 * chamador precisa mudar.
 */

const logger = createLogger("storage");

const ROOT = resolve(process.cwd(), process.env.UPLOAD_DIR ?? ".uploads");

export type StoredObject = {
  key: string;
  size: number;
  contentType: string;
};

export interface StorageDriver {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

function safeJoin(root: string, key: string) {
  const target = resolve(join(root, key));
  // Defense in depth: mesmo com key validada, garantimos que nao saia da raiz.
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error("chave de storage invalida");
  }
  return target;
}

const localDriver: StorageDriver = {
  name: "local",

  async put(key, data, contentType) {
    const target = safeJoin(ROOT, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    logger.debug("objeto gravado", { driver: "local", key, bytes: data.byteLength });
    return { key, size: data.byteLength, contentType };
  },

  async get(key) {
    try {
      return await readFile(safeJoin(ROOT, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  },

  async delete(key) {
    try {
      await unlink(safeJoin(ROOT, key));
      logger.debug("objeto removido", { driver: "local", key });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },
};

/**
 * Driver S3/R2 — descomente e implemente ao migrar.
 * A interface e propositalmente pequena: put/get/delete.
 */
const s3Driver: StorageDriver | null = null;

const driver = process.env.STORAGE_DRIVER === "s3" && s3Driver ? s3Driver : localDriver;

export const storage: StorageDriver = driver;
export const storageDriverName = driver.name;
export const STORAGE_ROOT = ROOT;