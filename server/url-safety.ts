import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message = "URL is not allowed") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

function ipv4ToNumber(address: string): number {
  return address.split(".").reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);
}

function ipv4InRange(address: string, network: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4ToNumber(address) & mask) === (ipv4ToNumber(network) & mask);
}

function isNonPublicIpv4(address: string): boolean {
  const deniedRanges: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];
  return deniedRanges.some(([network, prefix]) => ipv4InRange(address, network, prefix));
}

function expandIpv6(address: string): number[] | null {
  let value = address.toLowerCase();
  const dottedPart = value.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (dottedPart) {
    if (isIP(dottedPart) !== 4) return null;
    const [a, b, c, d] = dottedPart.split(".").map(Number);
    value = value.slice(0, value.length - dottedPart.length) + [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)].join(":");
  }

  const halves = value.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[\da-f]{1,4}$/.test(group))) return null;
  return groups.map(group => parseInt(group, 16));
}

function isNonPublicIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return true;

  // IPv4-mapped IPv6 addresses inherit the restrictions of the embedded IPv4 address.
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff) {
    const embedded = `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
    return isNonPublicIpv4(embedded);
  }

  // Only globally-routable unicast space (2000::/3) is accepted. This excludes
  // unspecified, loopback, unique-local, link-local, multicast, and transition
  // ranges that can carry or expose private IPv4 destinations.
  if ((groups[0] & 0xe000) !== 0x2000) return true;
  const first32 = (groups[0] * 0x10000) + groups[1];
  if ((first32 & 0xfffffe00) === 0x20010000) return true; // IETF special-purpose 2001::/23
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true; // documentation 2001:db8::/32
  if (groups[0] === 0x2002) return true; // 6to4 embeds an IPv4 address
  if (groups[0] === 0x3fff && (groups[1] & 0xf000) === 0) return true; // documentation 3fff::/20
  return false;
}

function isNonPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isNonPublicIpv4(address);
  if (version === 6) return isNonPublicIpv6(address);
  return true;
}

function normalizedHostname(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, "").replace(/\.+$/, "").toLowerCase();
}

function isDisallowedHostname(hostname: string): boolean {
  return hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".example") ||
    hostname === "metadata" ||
    hostname === "metadata.google.internal" ||
    hostname === "metadata.google" ||
    hostname === "instance-data.ec2.internal";
}

/**
 * Validate a URL and every DNS address it can resolve to. DNS failures and
 * empty answers fail closed; callers should run this for every browser request.
 */
export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Invalid URL format");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new UnsafeUrlError();
  }

  const hostname = normalizedHostname(url);
  if (!hostname || isDisallowedHostname(hostname)) throw new UnsafeUrlError();

  const addressType = isIP(hostname);
  if (addressType) {
    if (isNonPublicAddress(hostname)) throw new UnsafeUrlError();
    return url;
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("Unable to verify URL destination");
  }
  if (!addresses.length || addresses.some(({ address }) => isNonPublicAddress(address))) {
    throw new UnsafeUrlError();
  }
  return url;
}