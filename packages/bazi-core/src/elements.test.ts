import { describe, expect, it } from 'vitest';
import { branchElement, branchYinYang, stemElement, stemYinYang } from './elements.js';

describe('五行映射', () => {
  it('天干五行正确', () => {
    expect(stemElement('甲')).toBe('木');
    expect(stemElement('丙')).toBe('火');
    expect(stemElement('戊')).toBe('土');
    expect(stemElement('庚')).toBe('金');
    expect(stemElement('壬')).toBe('水');
  });

  it('地支五行正确', () => {
    expect(branchElement('子')).toBe('水');
    expect(branchElement('寅')).toBe('木');
    expect(branchElement('午')).toBe('火');
    expect(branchElement('申')).toBe('金');
    expect(branchElement('辰')).toBe('土');
  });
});

describe('阴阳映射', () => {
  it('天干阴阳正确', () => {
    expect(stemYinYang('甲')).toBe('阳');
    expect(stemYinYang('乙')).toBe('阴');
  });

  it('地支阴阳按位置正确', () => {
    expect(branchYinYang('子')).toBe('阳');
    expect(branchYinYang('丑')).toBe('阴');
    expect(branchYinYang('午')).toBe('阳');
  });
});
