/**
 * Pi App Validator — Pi Studio Compliance Extension
 *
 * Extends the base AgentAppValidator with Pi Network specific requirements
 * for Pi Studio app submission and runtime compliance.
 *
 * Official References:
 * - Pi SDK Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference
 * - Pi SDK Installation & Initialization: https://deepwiki.com/pi-apps/pi-platform-docs/3.1-sdk-installation-and-initialization
 * - Pi Sandbox Guide: https://pi-apps.github.io/pi-sdk-docs/getting-started/Sandbox
 * - Official SDK Reference: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md
 *
 * Spec: PPP.md §3 (Pi App Requirements), PAI-MEM-SPEC.md §7 (Trust-Gate)
 */

import { AgentAppValidator, AgentAppManifest, AgentAppValidationResult, AgentAppPermission } from './validator';

export interface PiAppConfig {
  /** Pi SDK initialization configuration */
  sdkInit: boolean;
  /** Authentication flow type */
  authFlow: 'oauth' | 'native';
  /** Whether the app implements Pi Payments */
  payments: boolean;
  /** Native Pi features used */
  nativeFeatures: string[];
  /** Sandbox mode toggle in UI */
  sandboxToggle: boolean;
  /** CSP headers for Pi Browser */
  cspHeaders: boolean;
  /** Pi user context handling */
  userContext: boolean;
}

export interface PiAppManifest extends AgentAppManifest {
  /** Pi-specific configuration for Pi Studio submission */
  pi?: PiAppConfig;
}

export interface PiAppValidationResult extends AgentAppValidationResult {
  /** Whether the app passes Pi Studio compliance checks */
  piCompliant: boolean;
  /** Pi-specific errors */
  piErrors: string[];
  /** Pi-specific risk contribution */
  piRiskScore: number;
}

const PI_NATIVE_FEATURES = [
  'sharePassport',
  'requestUsername',
  'requestContactInfo',
  'requestWalletAddress',
  'requestProfilePicture',
  'requestKYCStatus',
  'openPiBrowser',
  'shareToPiBrowser',
  'requestPiPayment',
] as const;

const PI_AUTH_FLOWS = ['oauth', 'native'] as const;

export class PiAppValidator extends AgentAppValidator {
  /**
   * Validates an Agent App Manifest against Pi Studio compliance requirements
   *
   * Reference: Pi SDK Reference - https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference
   * Sandbox Mode: https://pi-apps.github.io/pi-sdk-docs/getting-started/Sandbox
   * Authentication: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#authentication
   * Payments: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md#payments
   * Native Features: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#native-features
   */
  public validatePiApp(manifest: any): any {
    // Run base validation first
    const baseResult = this.validateAppManifest(manifest);

    const piErrors: string[] = [];
    let piRisk = 0;

    // Check for Pi config presence
    if (!manifest.pi) {
      piErrors.push('Missing pi config for Pi Studio submission (required)');
      piRisk += 20;
    } else {
      const pi = manifest.pi;

      // 1. Pi SDK Initialization
      // Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#initialization
      // Sandbox mode: https://pi-apps.github.io/pi-sdk-docs/getting-started/Sandbox
      if (!pi.sdkInit) {
        piErrors.push('Missing pi.sdkInit — must call initSandboxCompatibility() + determineSandboxMode() at startup');
        piRisk += 15;
      }

      // 2. Authentication Flow
      // Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#authentication
      if (!pi.authFlow || !['oauth', 'native'].includes(pi.authFlow)) {
        piErrors.push('Missing or invalid pi.authFlow — must be "oauth" or "native"');
        piRisk += 15;
      }

      // 3. Payments
      // Reference: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md#payments
      // Pi Payments: https://minepi.com/developers/
      const hasNetworkEgress = manifest.permissions.some((p: any) => p.scope === 'network:egress');
      if (hasNetworkEgress && !pi.payments) {
        piErrors.push('network:egress permission requires pi.payments config (Pi Payments integration)');
        piRisk += 10;
      }

      // 4. Native Features
      // Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#native-features
      if (!pi.nativeFeatures || pi.nativeFeatures.length === 0) {
        piErrors.push('Pi Studio requires at least one native feature (sharePassport, requestUsername, etc.)');
        piRisk += 10;
      } else {
        // Validate known features
        const KNOWN_FEATURES = [
          'sharePassport',
          'requestUsername',
          'requestContactInfo',
          'requestWalletAddress',
          'requestProfilePicture',
          'requestKYCStatus',
          'openPiBrowser',
          'shareToPiBrowser',
          'requestPiPayment',
        ];
        for (const feature of pi.nativeFeatures) {
          if (!['sharePassport', 'requestUsername', 'requestContactInfo', 'requestWalletAddress',
            'requestProfilePicture', 'requestKYCStatus', 'openPiBrowser', 'shareToPiBrowser', 'requestPiPayment'].includes(feature)) {
            piErrors.push(`Unknown Pi native feature: ${feature}`);
            piRisk += 5;
          }
        }
      }

      // 5. Sandbox Toggle
      // Reference: https://pi-apps.github.io/pi-sdk-docs/getting-started/Sandbox
      // Sandbox mode detection: https://pi-apps.github.io/pi-sdk-docs/getting-started/Sandbox
      if (!pi.sandboxToggle) {
        piErrors.push('Missing pi.sandboxToggle — must expose determineSandboxMode() toggle in UI');
        piRisk += 10;
      }

      // 6. CSP Headers
      // Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#initialization
      // CSP for Pi Browser: https://developers.minepi.com/
      if (!pi.cspHeaders) {
        piErrors.push('Missing pi.cspHeaders — must configure frame-ancestors for *.minepi.com, *.pinet.com');
        piRisk += 15;
      }

      // 7. Pi User Context
      // Reference: https://pi-apps.github.io/pi-sdk-docs/platform/SdkReference#authentication
      if (!pi.userContext) {
        piErrors.push('Missing pi.userContext — must implement fetchPiUser + session mapping');
        piRisk += 10;
      }
    }

    const combinedValid = baseResult.valid && piErrors.length === 0;
    const combinedRisk = Math.min(100, baseResult.securityRiskScore + piRisk);

    return {
      valid: combinedValid,
      appId: baseResult.appId,
      errors: [...baseResult.errors, ...piErrors],
      securityRiskScore: combinedRisk,
      piCompliant: piErrors.length === 0,
      piErrors,
      piRiskScore: piRisk,
    };
  }
}

/**
 * Convenience function for CLI and CI validation
 */
export function validatePiAppManifest(manifest: any): any {
  const validator = new PiAppValidator();
  return validator.validatePiApp(manifest);
}