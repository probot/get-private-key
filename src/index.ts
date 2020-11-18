import { resolve } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";

import isBase64 from "is-base64";

import { VERSION } from "./version";

type Options = {
  filepath?: string;
  env?: {
    PRIVATE_KEY?: string;
    PRIVATE_KEY_PATH?: string;
    [key: string]: string | undefined;
  };
  cwd?: string;
};

export function getPrivateKey(options: Options = {}): string | null {
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();

  if (options.filepath) {
    return readFileSync(resolve(cwd, options.filepath), "utf-8");
  }

  if (env.PRIVATE_KEY) {
    let privateKey = env.PRIVATE_KEY;

    if (isBase64(privateKey)) {
      // Decode base64-encoded certificate
      privateKey = Buffer.from(privateKey, "base64").toString();
    }

    const begin = "-----BEGIN RSA PRIVATE KEY-----";
    const end = "-----END RSA PRIVATE KEY-----";
    if (privateKey.includes(begin) && privateKey.includes(end)) {
      // Full key with new lines
      return privateKey.replace(/\\n/g, "\n");
    }

    throw new Error(
      `[@probot/get-private-key] The contents of "env.PRIVATE_KEY" could not be validated. Please check to ensure you have copied the contents of the .pem file correctly.`
    );
  }

  if (env.PRIVATE_KEY_PATH) {
    const filepath = resolve(cwd, env.PRIVATE_KEY_PATH);
    if (existsSync(filepath)) {
      return readFileSync(filepath, "utf-8");
    } else {
      throw new Error(
        `[@probot/get-private-key] Private key does not exists at path: "${env.PRIVATE_KEY_PATH}". Please check to ensure that "env.PRIVATE_KEY_PATH" is correct.`
      );
    }
  }
  const pemFiles = readdirSync(cwd).filter((path) => path.endsWith(".pem"));
  if (pemFiles.length > 1) {
    const paths = pemFiles.join(", ");
    throw new Error(
      `[@probot/get-private-key] More than one file found: "${paths}". Set { filepath } option or set one of the environment variables: PRIVATE_KEY, PRIVATE_KEY_PATH`
    );
  } else if (pemFiles[0]) {
    return getPrivateKey({ filepath: pemFiles[0], cwd });
  }
  return null;
}

getPrivateKey.VERSION = VERSION;
