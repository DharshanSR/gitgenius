import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DisplayUtils } from '../utils/DisplayUtils';

describe('DisplayUtils', () => {
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('success', () => {
    test('should log a success message', () => {
      DisplayUtils.success('Operation completed');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[SUCCESS]');
      expect(output).toContain('Operation completed');
    });

    test('should include icon when withIcon is true', () => {
      DisplayUtils.success('Done', true);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('✨');
      expect(output).toContain('[SUCCESS]');
    });

    test('should not include icon by default', () => {
      DisplayUtils.success('Done');
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).not.toContain('✨');
    });
  });

  describe('error', () => {
    test('should log an error message', () => {
      DisplayUtils.error('Something went wrong');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[ERROR]');
      expect(output).toContain('Something went wrong');
    });
  });

  describe('warning', () => {
    test('should log a warning message', () => {
      DisplayUtils.warning('Be careful');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[WARNING]');
      expect(output).toContain('Be careful');
    });
  });

  describe('info', () => {
    test('should log an info message', () => {
      DisplayUtils.info('Some information');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[INFO]');
      expect(output).toContain('Some information');
    });
  });

  describe('log', () => {
    test('should log a categorized message', () => {
      DisplayUtils.log('stats', 'Commit count: 10');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[STATS]');
      expect(output).toContain('Commit count: 10');
    });

    test('should uppercase the category', () => {
      DisplayUtils.log('git', 'Branch info');
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('[GIT]');
    });
  });

  describe('highlight', () => {
    test('should log a highlighted message', () => {
      DisplayUtils.highlight('Important text');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Important text');
    });
  });

  describe('dim', () => {
    test('should log a dim message', () => {
      DisplayUtils.dim('Subtle info');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Subtle info');
    });
  });

  describe('accent', () => {
    test('should log an accented message', () => {
      DisplayUtils.accent('Accented text');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Accented text');
    });
  });

  describe('cyan', () => {
    test('should log a cyan message', () => {
      DisplayUtils.cyan('Cyan text');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Cyan text');
    });
  });

  describe('green', () => {
    test('should log a green message', () => {
      DisplayUtils.green('Green text');
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('Green text');
    });
  });

  describe('formatList', () => {
    test('should log each item with default indent', () => {
      DisplayUtils.formatList(['item1', 'item2', 'item3']);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect((consoleSpy.mock.calls[0][0] as string)).toContain('item1');
      expect((consoleSpy.mock.calls[1][0] as string)).toContain('item2');
      expect((consoleSpy.mock.calls[2][0] as string)).toContain('item3');
    });

    test('should use custom indent', () => {
      DisplayUtils.formatList(['item1'], '  ');
      const output = consoleSpy.mock.calls[0][0] as string;
      expect(output).toContain('  item1');
    });

    test('should handle empty list', () => {
      DisplayUtils.formatList([]);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('separator', () => {
    test('should log an empty line', () => {
      DisplayUtils.separator();
      expect(consoleSpy).toHaveBeenCalledWith('');
    });
  });
});
