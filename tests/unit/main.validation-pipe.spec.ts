import { ValidationPipe } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { IsString, IsOptional, validate } from 'class-validator';

class TestQueryDTO {
  @IsOptional()
  @IsString()
    style?: string;

  @IsOptional()
  @IsString()
    theme?: string;
}

describe('ValidationPipe', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: true,
      disableErrorMessages: true,
      validationError: {
        value: true,
      },
      transform: true,
    });
  });

  describe('Configuration Settings', () => {
    it('should have whitelist enabled, forbidUnknownValues enabled, and forbidNonWhitelisted disabled', () => {
      const options = (validationPipe as any).validatorOptions;
      
      expect(options.whitelist).toBe(true);
      expect(options.forbidUnknownValues).toBe(true);
      expect(options.forbidNonWhitelisted).toBe(false);
    });


    it('should accept null and undefined for optional fields', async () => {
      const input = {
        style: null,
        theme: undefined,
      };

      const transformed = plainToClass(TestQueryDTO, input);
      const errors = await validate(transformed);

      expect(errors.length).toBe(0);
      expect(transformed.style).toBeNull();
      expect(transformed.theme).toBeUndefined();
    });

    it('should reject invalid types even when optional', async () => {
      const input = {
        style: 123,
        theme: 'dark',
      };

      const transformed = plainToClass(TestQueryDTO, input);
      const errors = await validate(transformed);

      expect(errors.length).toBeGreaterThan(0);
      const styleError = errors.find(e => e.property === 'style');
      expect(styleError).toBeDefined();
      expect(styleError?.constraints).toHaveProperty('isString');
    });
  });

  describe('Security', () => {
    it('should strip malicious properties via whitelist', async () => {
      const maliciousInput = {
        style: 'konviw',
        theme: 'dark',
        '__proto__': { polluted: true },
        'constructor': { dangerous: true },
        'isAdmin': true,
        'hasAccess': true,
      };

      const transformed = plainToClass(TestQueryDTO, maliciousInput);
      const errors = await validate(transformed, { whitelist: true });

      expect(errors.length).toBe(0);
      expect(transformed.style).toBe('konviw');
      expect(transformed.theme).toBe('dark');
      
      expect(Object.getPrototypeOf(transformed)).not.toHaveProperty('polluted');
      expect((transformed as any).constructor).not.toHaveProperty('dangerous');
      expect((transformed as any).isAdmin).toBeUndefined();
      expect((transformed as any).hasAccess).toBeUndefined();
      
      // Only whitelisted properties exist
      expect(Object.keys(transformed).sort()).toEqual(['style', 'theme']);
    });

    it('should strip SQL injection attempts in property names', async () => {
      const maliciousInput = {
        style: 'konviw',
        "'; DROP TABLE users--": 'malicious',
        'OR 1=1': 'attack',
      };

      const transformed = plainToClass(TestQueryDTO, maliciousInput);
      const errors = await validate(transformed, { whitelist: true });

      expect(errors.length).toBe(0);
      expect(transformed.style).toBe('konviw');
      expect((transformed as any)["'; DROP TABLE users--"]).toBeUndefined();
      expect((transformed as any)['OR 1=1']).toBeUndefined();
      expect(Object.keys(transformed)).toEqual(['style']);
    });

    it('should strip NoSQL injection attempts', async () => {
      const maliciousInput = {
        theme: 'dark',
        '$where': '1 == 1',
        '$ne': null,
        '$gt': '',
      };

      const transformed = plainToClass(TestQueryDTO, maliciousInput);
      const errors = await validate(transformed, { whitelist: true });

      expect(errors.length).toBe(0);
      expect(transformed.theme).toBe('dark');
      expect((transformed as any).$where).toBeUndefined();
      expect((transformed as any).$ne).toBeUndefined();
      expect((transformed as any).$gt).toBeUndefined();
      expect(Object.keys(transformed)).toEqual(['theme']);
    });

    it('should strip XSS attempts via property names', async () => {
      const maliciousInput = {
        style: 'konviw',
        '<script>alert("xss")</script>': 'bad',
        'onload': 'alert(1)',
        'onerror': 'fetch("evil.com")',
      };

      const transformed = plainToClass(TestQueryDTO, maliciousInput);
      const errors = await validate(transformed, { whitelist: true });

      expect(errors.length).toBe(0);
      expect(transformed.style).toBe('konviw');
      expect((transformed as any)['<script>alert("xss")</script>']).toBeUndefined();
      expect((transformed as any).onload).toBeUndefined();
      expect((transformed as any).onerror).toBeUndefined();
      expect(Object.keys(transformed)).toEqual(['style']);
    });

    it('should handle empty object gracefully', async () => {
      const input = {};
      const transformed = plainToClass(TestQueryDTO, input);
      const errors = await validate(transformed, { whitelist: true });

      expect(errors.length).toBe(0);
      expect(transformed).toBeDefined();
    });
  });

  describe('Unknown Parameter Handling', () => {
    it('should strip unknown parameters like atlOrigin without throwing error', async () => {
      const input = {
        style: 'konviw',
        atlOrigin: 'eyJpIjoiYTg5MmIyN2ZjMmQ4NDdhNmJlODQxNWZjYWQ1ZGY0YTUiLCJwIjoiYyJ9',
        unknownParam: 'test',
      };

      const transformed = plainToClass(TestQueryDTO, input);
      const errors = await validate(transformed, { 
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      expect(errors.length).toBe(0);
      expect(transformed.style).toBe('konviw');
      expect((transformed as any).atlOrigin).toBeUndefined(); 
      expect((transformed as any).unknownParam).toBeUndefined();
    });

    it('should validate known parameters and strip unknown ones simultaneously', async () => {
      const input = {
        theme: 'dark',
        style: 'konviw',
        fbclid: 'tracking123',
        gclid: 'google123',
      };

      const transformed = plainToClass(TestQueryDTO, input);
      const errors = await validate(transformed, { 
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      expect(errors.length).toBe(0);
      expect(transformed.theme).toBe('dark');
      expect(transformed.style).toBe('konviw');
      expect((transformed as any).fbclid).toBeUndefined();
      expect((transformed as any).gclid).toBeUndefined();
    });
  });
});
