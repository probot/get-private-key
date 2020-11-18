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
};

export function getPrivateKey(options: Options = {}): string | null {
  if (options.filepath) {
    return readFileSync(options.filepath, "utf-8");
  }

  const env = options.env || process.env;

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
    if (existsSync(env.PRIVATE_KEY_PATH)) {
      return readFileSync(env.PRIVATE_KEY_PATH, "utf-8");
    } else {
      throw new Error(
        `[@probot/get-private-key] Private key does not exists at path: "${env.PRIVATE_KEY_PATH}". Please check to ensure that "env.PRIVATE_KEY_PATH" is correct.`
      );
    }
  }
  const pemFiles = readdirSync(process.cwd()).filter((path) =>
    path.endsWith(".pem")
  );
  if (pemFiles.length > 1) {
    const paths = pemFiles.join(", ");
    throw new Error(
      `[@probot/get-private-key] More than one file found: "${paths}". Set { filepath } option or set one of the environment variables: PRIVATE_KEY, PRIVATE_KEY_PATH`
    );
  } else if (pemFiles[0]) {
    return getPrivateKey({ filepath: pemFiles[0] });
  }
  return null;
}

getPrivateKey.VERSION = VERSION;
