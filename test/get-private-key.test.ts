import { beforeEach, describe, it, expect, vi, Mock } from "vitest";
vi.mock("fs");

import { resolve } from "path";
import fs from "fs";

import { getPrivateKey } from "../src/index.ts";

const existsSync = fs.existsSync as Mock;
const readdirSync = fs.readdirSync as Mock;
const readFileSync = fs.readFileSync as Mock;

const PRIVATE_KEY =
  "-----BEGIN RSA PRIVATE KEY-----\n7HjkPK\nKLm395\nAIBII\n-----END RSA PRIVATE KEY-----";

const PRIVATE_KEY_NO_NEWLINES =
  "-----BEGIN RSA PRIVATE KEY----- 7HjkPK KLm395 AIBII -----END RSA PRIVATE KEY-----";

const PRIVATE_KEY_NO_NEWLINES_MULTIPLE_SPACES =
  "-----BEGIN RSA PRIVATE KEY----- 7HjkPK  KLm395 AIBII   -----END RSA PRIVATE KEY-----";

const PRIVATE_KEY_ESCAPED_NEWLINES =
  "-----BEGIN RSA PRIVATE KEY-----\\n7HjkPK\\nKLm395\\nAIBII\\n-----END RSA PRIVATE KEY-----";

describe("getPrivateKey", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    existsSync.mockReturnValue(true);
    readdirSync.mockReturnValue([]);
    readFileSync.mockReturnValue("test.pem content");

    delete process.env.PRIVATE_KEY;
    delete process.env.PRIVATE_KEY_PATH;
  });

  describe("no environment variables", () => {
    it("returns null if called without arguments", () => {
      const result = getPrivateKey();
      expect(result).toBeNull();
    });

    it("{ filepath } option", () => {
      const result = getPrivateKey({ filepath: "test.pem" });
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
        "utf-8",
      );
      expect(result).toEqual("test.pem content");
    });

    it("{ env: { PRIVATE_KEY } }", () => {
      const result = getPrivateKey({
        env: {
          PRIVATE_KEY,
        },
      });
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("{ env: { PRIVATE_KEY_PATH } }", () => {
      const result = getPrivateKey({
        env: {
          PRIVATE_KEY_PATH: "test.pem",
        },
      });
      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(existsSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
      );

      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
        "utf-8",
      );
      expect(result).toEqual("test.pem content");
    });

    it("{ filepath, env }", () => {
      const result = getPrivateKey({
        filepath: "test.pem",
        env: { PRIVATE_KEY },
      });
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
        "utf-8",
      );
      expect(result).toEqual("test.pem content");
    });

    it("single test.pem file in current working directory", () => {
      readdirSync.mockReturnValue(["test.pem"]);
      const result = getPrivateKey();
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
        "utf-8",
      );
      expect(result).toEqual("test.pem content");
    });

    it("two *.pem files in current working directory", () => {
      readdirSync.mockReturnValue(["test1.pem", "test2.pem"]);
      expect(() => getPrivateKey()).toThrow(
        `[@probot/get-private-key] More than one file found: \"test1.pem, test2.pem\". Set { filepath } option or set one of the environment variables: PRIVATE_KEY, PRIVATE_KEY_PATH`,
      );
    });

    it("{ cwd }", () => {
      const result = getPrivateKey({
        cwd: "/app/current",
      });
      expect(result).toEqual(null);
      expect(readdirSync).toHaveBeenCalledWith("/app/current");
    });
  });

  describe("with environment variables", () => {
    it("PRIVATE_KEY", () => {
      process.env.PRIVATE_KEY = PRIVATE_KEY;
      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("PRIVATE_KEY is base64 encoded", () => {
      process.env.PRIVATE_KEY = Buffer.from(PRIVATE_KEY, "utf-8").toString(
        "base64",
      );
      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("PRIVATE_KEY contains no newlines", () => {
      process.env.PRIVATE_KEY = PRIVATE_KEY_NO_NEWLINES;
      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("PRIVATE_KEY contains consecutive spaces", () => {
      process.env.PRIVATE_KEY = PRIVATE_KEY_NO_NEWLINES_MULTIPLE_SPACES;
      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("PRIVATE_KEY contains escaped newlines", () => {
      process.env.PRIVATE_KEY = PRIVATE_KEY_ESCAPED_NEWLINES;
      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });

    it("PRIVATE_KEY invalid", () => {
      process.env.PRIVATE_KEY = "invalid";
      expect(() => getPrivateKey()).toThrow(
        `[@probot/get-private-key] The contents of "env.PRIVATE_KEY" could not be validated. Please check to ensure you have copied the contents of the .pem file correctly.`,
      );
    });

    it("PRIVATE_KEY_PATH", () => {
      process.env.PRIVATE_KEY_PATH = "test.pem";
      const result = getPrivateKey();
      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(existsSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
      );

      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(
        resolve(process.cwd(), "test.pem"),
        "utf-8",
      );
      expect(result).toEqual("test.pem content");
    });

    it("PRIVATE_KEY_PATH does not exist", () => {
      process.env.PRIVATE_KEY_PATH = "test.pem";
      existsSync.mockReturnValue(false);
      expect(() => getPrivateKey()).toThrow(
        `[@probot/get-private-key] Private key does not exists at path: "test.pem". Please check to ensure that "env.PRIVATE_KEY_PATH" is correct.`,
      );
    });

    it("both PRIVATE_KEY and PRIVATE_KEY_PATH", () => {
      process.env.PRIVATE_KEY = PRIVATE_KEY;
      process.env.PRIVATE_KEY_PATH = "test.pem";

      const result = getPrivateKey();
      expect(result).toEqual(PRIVATE_KEY);
    });
  });
});
