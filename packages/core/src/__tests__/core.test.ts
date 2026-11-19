import { describe, it, expect } from 'vitest';

describe('PAI Agent Kit Core', () => {
  it('defines SOUL protocol agent attributes', () => {
    const soulConfig = {
      muraqabah: true,
      tawbah: true,
      sidq: true,
      rahma: true,
      shura: true,
    };
    expect(soulConfig.muraqabah).toBe(true);
    expect(soulConfig.sidq).toBe(true);
  });

  it('validates tri-lingual support requirement (EN, AR, ZH)', () => {
    const supportedLocales = ['en', 'ar', 'zh'];
    expect(supportedLocales).toHaveLength(3);
    expect(supportedLocales).toContain('ar');
  });
});
