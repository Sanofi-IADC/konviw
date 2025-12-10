import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { QueryParamsLoggerInterceptor } from '../../../../src/common/interceptors/query-params-logger.interceptor';

describe('QueryParamsLoggerInterceptor', () => {
  let interceptor: QueryParamsLoggerInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryParamsLoggerInterceptor],
    }).compile();

    interceptor = module.get<QueryParamsLoggerInterceptor>(QueryParamsLoggerInterceptor);
    
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    
    mockCallHandler = {
      handle: jest.fn(() => of('controller-response')),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (queryParams: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          query: queryParams,
          path: '/test/path',
          method: 'GET',
        }),
      }),
    } as ExecutionContext;
  };

  describe('Query Parameter Logging and Detection', () => {
    it('should silently accept atlOrigin without logging', (done) => {
      mockExecutionContext = createMockContext({ 
        atlOrigin: 'eyJpIjoiYTg5MmIyN2ZjMmQ4NDdhNmJlODQxNWZjYWQ1ZGY0YTUiLCJwIjoiYyJ9'
      });

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
        expect(loggerDebugSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Unexpected query parameters')
        );
        done();
      });
    });

    it('should log list of all unknown/unexpected query parameters', (done) => {
      mockExecutionContext = createMockContext({ 
        maliciousParam: '__proto__',
        xssAttempt: '<script>alert(1)</script>',
        unknownParam1: 'val1',
        unknownParam2: 'val2',
      });
  
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(loggerDebugSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unexpected query parameters on /test/path: maliciousParam, xssAttempt, unknownParam1, unknownParam2')
        );
        done();
      });
    });
  
    it('should handle empty query object gracefully', (done) => {
      mockExecutionContext = createMockContext({});
  
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(loggerDebugSpy).not.toHaveBeenCalled();
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });
  
    it('should handle null query params', (done) => {
      mockExecutionContext = createMockContext(null);
  
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });
  
    it('should handle undefined query params', (done) => {
      mockExecutionContext = createMockContext(undefined);
  
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });
  
    it('should not block request execution with unexpected params', (done) => {
      mockExecutionContext = createMockContext({ 
        unknownParam1: 'val1',
        unknownParam2: 'val2',
        unknownParam3: 'val3'
      });
  
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
        expect(result).toBe('controller-response');
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
    });
  });
});
