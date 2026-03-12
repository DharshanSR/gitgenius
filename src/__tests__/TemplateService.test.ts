import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TemplateService } from '../services/TemplateService';
import { CommitTemplate } from '../types';

describe('TemplateService', () => {
  let templateService: TemplateService;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    templateService = new TemplateService();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('createDefaultTemplates', () => {
    test('should return default templates array', () => {
      const templates = templateService.createDefaultTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    test('should include feature template', () => {
      const templates = templateService.createDefaultTemplates();
      const featureTemplate = templates.find(t => t.name === 'feature');
      expect(featureTemplate).toBeDefined();
      expect(featureTemplate?.pattern).toContain('feat');
    });

    test('should include bugfix template', () => {
      const templates = templateService.createDefaultTemplates();
      const bugfixTemplate = templates.find(t => t.name === 'bugfix');
      expect(bugfixTemplate).toBeDefined();
      expect(bugfixTemplate?.pattern).toContain('fix');
    });

    test('should include docs template', () => {
      const templates = templateService.createDefaultTemplates();
      const docsTemplate = templates.find(t => t.name === 'docs');
      expect(docsTemplate).toBeDefined();
    });

    test('each template should have name, pattern, and description', () => {
      const templates = templateService.createDefaultTemplates();
      templates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(typeof template.name).toBe('string');
        expect(template.pattern).toBeDefined();
        expect(typeof template.pattern).toBe('string');
        expect(template.description).toBeDefined();
        expect(typeof template.description).toBe('string');
      });
    });

    test('should include chore, refactor, style, and test templates', () => {
      const templates = templateService.createDefaultTemplates();
      const names = templates.map(t => t.name);
      expect(names).toContain('chore');
      expect(names).toContain('refactor');
      expect(names).toContain('style');
      expect(names).toContain('test');
    });
  });

  describe('findTemplate', () => {
    const sampleTemplates: CommitTemplate[] = [
      { name: 'feature', pattern: 'feat({scope}): {description}', description: 'New feature' },
      { name: 'bugfix', pattern: 'fix({scope}): {description}', description: 'Bug fix' },
      { name: 'docs', pattern: 'docs: {description}', description: 'Documentation' }
    ];

    test('should find template by name', () => {
      const template = templateService.findTemplate('feature', sampleTemplates);
      expect(template).toBeDefined();
      expect(template?.name).toBe('feature');
      expect(template?.pattern).toBe('feat({scope}): {description}');
    });

    test('should find bugfix template', () => {
      const template = templateService.findTemplate('bugfix', sampleTemplates);
      expect(template).toBeDefined();
      expect(template?.name).toBe('bugfix');
    });

    test('should return undefined for non-existent template', () => {
      const template = templateService.findTemplate('nonexistent', sampleTemplates);
      expect(template).toBeUndefined();
    });

    test('should return undefined for empty templates array', () => {
      const template = templateService.findTemplate('feature', []);
      expect(template).toBeUndefined();
    });
  });

  describe('listTemplates', () => {
    test('should log available templates', () => {
      const templates: CommitTemplate[] = [
        { name: 'feature', pattern: 'feat: {desc}', description: 'New feature' }
      ];
      templateService.listTemplates(templates);
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feature');
    });

    test('should log warning when no templates', () => {
      templateService.listTemplates([]);
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('No templates');
    });

    test('should list multiple templates', () => {
      const templates: CommitTemplate[] = [
        { name: 'feat', pattern: 'feat: {d}', description: 'Feature' },
        { name: 'fix', pattern: 'fix: {d}', description: 'Fix' }
      ];
      templateService.listTemplates(templates);
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('feat');
      expect(output).toContain('fix');
    });
  });

  describe('getTemplates', () => {
    test('should return an array of templates', () => {
      // Mock configManager's getConfig to return templates
      const configManager = (templateService as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue([
        { name: 'test', pattern: 'test: {d}', description: 'Test template' }
      ]);
      const templates = templateService.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    test('should return empty array when no templates configured', () => {
      const configManager = (templateService as any).configManager;
      jest.spyOn(configManager, 'getConfig').mockReturnValue(null);
      const templates = templateService.getTemplates();
      expect(templates).toEqual([]);
    });
  });

  describe('removeTemplate', () => {
    test('should remove an existing template', async () => {
      const templates: CommitTemplate[] = [
        { name: 'feature', pattern: 'feat: {d}', description: 'Feature' },
        { name: 'fix', pattern: 'fix: {d}', description: 'Fix' }
      ];
      const configManager = (templateService as any).configManager;
      jest.spyOn(configManager, 'setConfigValue').mockImplementation(() => {});

      await templateService.removeTemplate('feature', templates);

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('fix');
    });

    test('should log warning when template not found', async () => {
      const templates: CommitTemplate[] = [
        { name: 'fix', pattern: 'fix: {d}', description: 'Fix' }
      ];

      await templateService.removeTemplate('nonexistent', templates);
      const output = consoleSpy.mock.calls.map(c => c[0] as string).join(' ');
      expect(output).toContain('not found');
    });

    test('should save updated templates to config', async () => {
      const templates: CommitTemplate[] = [
        { name: 'feature', pattern: 'feat: {d}', description: 'Feature' }
      ];
      const configManager = (templateService as any).configManager;
      const setConfigSpy = jest.spyOn(configManager, 'setConfigValue').mockImplementation(() => {});

      await templateService.removeTemplate('feature', templates);
      expect(setConfigSpy).toHaveBeenCalledWith('templates', expect.any(Array));
    });
  });
});
