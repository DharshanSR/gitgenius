// Manual mock for clipboardy
import { jest } from '@jest/globals';

const clipboardy = {
  write: jest.fn().mockResolvedValue(undefined),
  read: jest.fn().mockResolvedValue(''),
  writeSync: jest.fn(),
  readSync: jest.fn().mockReturnValue(''),
};

export const { write, read, writeSync, readSync } = clipboardy;
export default clipboardy;
