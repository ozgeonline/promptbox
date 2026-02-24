import { describe, it, expect } from 'vitest';

// We are simulating the slugify function from UIContext.tsx
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

describe('slugify function tests', () => {
  it('should convert spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('should remove Turkish characters and make lowercase', () => {
    expect(slugify('TÜRKÇE Şeker')).toBe('turkce-seker');
  });

  it('should remove special characters', () => {
    expect(slugify('test!@# folder$')).toBe('test-folder');
  });
});
