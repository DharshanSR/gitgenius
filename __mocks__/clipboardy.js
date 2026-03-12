// Manual mock for clipboardy
const clipboardy = {
  write: jest.fn().mockResolvedValue(undefined),
  read: jest.fn().mockResolvedValue(''),
  writeSync: jest.fn(),
  readSync: jest.fn().mockReturnValue(''),
};

module.exports = clipboardy;
module.exports.default = clipboardy;
