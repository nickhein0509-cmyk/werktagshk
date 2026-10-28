import { describe, expect, it } from 'vitest';
import { assistanceOwnerProof } from './assistance-access';

describe('personal assistant owner proof', () => {
  const owner = 'synthetic-owner-capability';

  it('accepts the original raw capability and current account connection link', () => {
    expect(assistanceOwnerProof(` ${owner} `)).toBe(owner);
    expect(assistanceOwnerProof(`https://werk-tag.com/konto#connect=${owner}`)).toBe(owner);
    expect(assistanceOwnerProof(`#owner=${owner}`)).toBe(owner);
  });

  it('takes the owner proof from an old private link while keeping the read key separate', () => {
    expect(assistanceOwnerProof(`https://legacy.example.invalid/map#key=synthetic-read-only&owner=${owner}`)).toBe(owner);
    expect(assistanceOwnerProof(`https://werk-tag.com/konto#type=recovery&connect=${owner}&access_token=synthetic-auth`)).toBe(owner);
  });

  it('rejects read-only links instead of mistaking their map key for ownership', () => {
    expect(() => assistanceOwnerProof('https://werk-tag.com/assistenz#key=synthetic-read-only')).toThrow('nur zum Lesen');
    expect(() => assistanceOwnerProof('#key=synthetic-read-only')).toThrow('nur zum Lesen');
    expect(() => assistanceOwnerProof('https://werk-tag.com/konto?connect=synthetic-query-proof')).toThrow('Besitzerlink');
  });

  it('rejects ambiguous, malformed, oversized or whitespace-bearing capabilities without echoing them', () => {
    for (const value of ['', '#owner=one&owner=two', '#connect=one&owner=two', 'broken#owner=value', 'file://host/#owner=value', '#owner=two%20words', 'a'.repeat(513), 'one\ntwo']) {
      expect(() => assistanceOwnerProof(value)).toThrow();
    }
    const secret = 'synthetic-private-proof one';
    try { assistanceOwnerProof(secret); } catch (error) { expect(String(error)).not.toContain(secret); }
  });
});
