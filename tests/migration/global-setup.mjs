import { captureLegacyContracts } from '../../scripts/migration/capture_legacy_contracts.mjs';

export default function globalSetup() {
  captureLegacyContracts({ update: false });
}
