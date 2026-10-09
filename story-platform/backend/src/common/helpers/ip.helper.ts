import { Request } from 'express';

/**
 * Get client IP address from request
 * Handles Cloudflare -> Render -> NestJS proxy chain
 */
export function getClientIp(request: Request): string {
  // Try Cloudflare header first
  const cfConnectingIp = request.headers['cf-connecting-ip'] as string;
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Try X-Forwarded-For header (parse correctly)
  const xForwardedFor = request.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
    // The first IP is the original client IP
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // Try X-Real-IP header
  const xRealIp = request.headers['x-real-ip'] as string;
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to socket address
  const socketAddress = request.socket.remoteAddress;
  if (socketAddress) {
    // Handle IPv6-mapped IPv4 addresses (::ffff:127.0.0.1)
    if (socketAddress.startsWith('::ffff:')) {
      return socketAddress.substring(7);
    }
    return socketAddress;
  }

  // If no IP found, return UNKNOWN
  return 'UNKNOWN';
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  if (!ip || ip === 'UNKNOWN') {
    return false;
  }

  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get country from request headers (if available via Cloudflare)
 */
export function getCountryFromRequest(request: Request): string | null {
  const cfCountry = request.headers['cf-ipcountry'] as string;
  if (cfCountry) {
    return cfCountry;
  }
  return null;
}

/**
 * Get user agent from request headers
 */
export function getUserAgentFromRequest(request: Request): string | null {
  const userAgent = request.headers['user-agent'] as string;
  if (userAgent) {
    return userAgent;
  }
  return null;
}
