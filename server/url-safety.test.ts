import assert from "node:assert/strict";
import test from "node:test";
import { assertSafePublicUrl } from "./url-safety";

test("rejects private, loopback, link-local, and metadata IP destinations", async () => {
  const blockedUrls = [
    "http://127.0.0.1/",
    "http://10.2.3.4/",
    "http://172.31.0.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[fd00::1]/",
    "http://[fe80::1]/",
    "http://[2001:db8::1]/",
    "http://[::ffff:127.0.0.1]/",
  ];

  for (const url of blockedUrls) {
    await assert.rejects(assertSafePublicUrl(url), undefined, url);
  }
});

test("accepts public IPv4 and IPv6 URL destinations", async () => {
  await assert.doesNotReject(assertSafePublicUrl("https://8.8.8.8/"));
  await assert.doesNotReject(assertSafePublicUrl("https://[2606:4700:4700::1111]/"));
});

test("rejects non-HTTP protocols and local hostnames", async () => {
  await assert.rejects(assertSafePublicUrl("file:///etc/passwd"));
  await assert.rejects(assertSafePublicUrl("http://service.local/"));
  await assert.rejects(assertSafePublicUrl("http://metadata.google.internal/"));
});