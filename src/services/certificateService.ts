/**
 * Certificate Service
 * Validate SSL certificates và certificate pinning
 */

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
}

/**
 * Certificate pinning configuration
 */
const PINNED_CERTIFICATES: Record<string, string[]> = {
  // Ví dụ: pin certificates cho các domain quan trọng
  // 'api.example.com': ['sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
};

/**
 * Validate SSL certificate
 */
export async function validateCertificate(
  url: string,
  allowSelfSigned: boolean = false
): Promise<CertificateInfo | null> {
  try {
    const urlObj = new URL(url);
    
    // Trong browser environment, certificate validation được xử lý bởi browser
    // Chúng ta chỉ có thể kiểm tra qua fetch
    if (typeof window !== 'undefined') {
      // Browser tự động validate certificates
      // Chúng ta chỉ có thể kiểm tra nếu request thành công
      return null; // Browser handles this
    }

    // Trong Tauri/Node environment, có thể validate certificate chi tiết hơn
    // TODO: Implement certificate validation cho Tauri environment
    
    return null;
  } catch (error) {
    console.error('Certificate validation error:', error);
    return null;
  }
}

/**
 * Check certificate pinning
 */
export function checkCertificatePinning(
  hostname: string,
  fingerprint: string
): boolean {
  const pinnedFingerprints = PINNED_CERTIFICATES[hostname];
  
  if (!pinnedFingerprints || pinnedFingerprints.length === 0) {
    // Không có pinning cho hostname này, cho phép
    return true;
  }

  return pinnedFingerprints.includes(fingerprint);
}

/**
 * Add certificate pin
 */
export function addCertificatePin(hostname: string, fingerprint: string): void {
  if (!PINNED_CERTIFICATES[hostname]) {
    PINNED_CERTIFICATES[hostname] = [];
  }
  
  if (!PINNED_CERTIFICATES[hostname].includes(fingerprint)) {
    PINNED_CERTIFICATES[hostname].push(fingerprint);
  }
}

/**
 * Remove certificate pin
 */
export function removeCertificatePin(hostname: string, fingerprint: string): void {
  if (PINNED_CERTIFICATES[hostname]) {
    PINNED_CERTIFICATES[hostname] = PINNED_CERTIFICATES[hostname].filter(
      (fp) => fp !== fingerprint
    );
    
    if (PINNED_CERTIFICATES[hostname].length === 0) {
      delete PINNED_CERTIFICATES[hostname];
    }
  }
}

/**
 * Validate URL và certificate trước khi request
 */
export async function validateRequestSecurity(url: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const urlObj = new URL(url);
    
    // Kiểm tra protocol
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return {
        valid: false,
        error: 'Protocol không được hỗ trợ',
      };
    }

    // Trong production, reject HTTP (chỉ cho phép HTTPS)
    if (
      import.meta.env.PROD &&
      urlObj.protocol === 'http:' &&
      urlObj.hostname !== 'localhost' &&
      urlObj.hostname !== '127.0.0.1'
    ) {
      return {
        valid: false,
        error: 'Chỉ cho phép HTTPS trong production',
      };
    }

    // Validate certificate nếu là HTTPS
    if (urlObj.protocol === 'https:') {
      const certInfo = await validateCertificate(url, false);
      
      if (certInfo) {
        // Check certificate pinning
        const isPinned = checkCertificatePinning(urlObj.hostname, certInfo.fingerprint);
        
        if (!isPinned && PINNED_CERTIFICATES[urlObj.hostname]) {
          return {
            valid: false,
            error: 'Certificate không khớp với pinned certificate',
          };
        }
      }
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'URL không hợp lệ',
    };
  }
}
