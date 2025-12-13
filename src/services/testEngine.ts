interface TestContext {
  pm: {
    response: {
      code: number;
      status: string;
      headers: Record<string, string>;
      json: () => any;
      text: () => string;
      responseTime: number;
    };
    request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: any;
    };
    environment: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    globals: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    collectionVariables: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    test: (name: string, fn: () => void) => void;
    expect: (value: any) => ExpectChain;
  };
}

interface ExpectChain {
  to: {
    be: {
      equal: (expected: any) => void;
      above: (expected: number) => void;
      below: (expected: number) => void;
      oneOf: (values: any[]) => void;
      an: (type: string) => void;
    };
    have: {
      property: (prop: string) => void;
      length: (length: number) => void;
    };
    include: (expected: string) => void;
  };
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration?: number;
}

export class TestEngine {
  private results: TestResult[] = [];
  private environment: Map<string, string> = new Map();
  private globals: Map<string, string> = new Map();
  private collectionVariables: Map<string, string> = new Map();

  createContext(response: any, request: any, responseTime: number): TestContext {
    return {
      pm: {
        response: {
          code: response.status,
          status: response.statusText,
          headers: response.headers || {},
          json: () => {
            try {
              return JSON.parse(response.body);
            } catch {
              return null;
            }
          },
          text: () => response.body || "",
          responseTime,
        },
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers || {},
          body: request.body,
        },
        environment: {
          get: (key: string) => this.environment.get(key) || null,
          set: (key: string, value: string) => this.environment.set(key, value),
        },
        globals: {
          get: (key: string) => this.globals.get(key) || null,
          set: (key: string, value: string) => this.globals.set(key, value),
        },
        collectionVariables: {
          get: (key: string) => this.collectionVariables.get(key) || null,
          set: (key: string, value: string) => this.collectionVariables.set(key, value),
        },
        test: (name: string, fn: () => void) => {
          const startTime = Date.now();
          try {
            fn();
            const duration = Date.now() - startTime;
            this.results.push({ name, passed: true, duration });
          } catch (error: any) {
            const duration = Date.now() - startTime;
            this.results.push({
              name,
              passed: false,
              message: error.message,
              duration,
            });
          }
        },
        expect: (value: any) => this.createExpectChain(value),
      },
    };
  }

  private createExpectChain(value: any): ExpectChain {
    return {
      to: {
        be: {
          equal: (expected: any) => {
            if (value !== expected) {
              throw new Error(`Expected ${value} to equal ${expected}`);
            }
          },
          above: (expected: number) => {
            if (value <= expected) {
              throw new Error(`Expected ${value} to be above ${expected}`);
            }
          },
          below: (expected: number) => {
            if (value >= expected) {
              throw new Error(`Expected ${value} to be below ${expected}`);
            }
          },
          oneOf: (values: any[]) => {
            if (!values.includes(value)) {
              throw new Error(`Expected ${value} to be one of ${values.join(", ")}`);
            }
          },
          an: (type: string) => {
            const actualType = Array.isArray(value)
              ? "array"
              : value === null
              ? "null"
              : typeof value;
            if (actualType !== type) {
              throw new Error(`Expected type ${type}, got ${actualType}`);
            }
          },
        },
        have: {
          property: (prop: string) => {
            if (!(prop in value)) {
              throw new Error(`Expected object to have property ${prop}`);
            }
          },
          length: (length: number) => {
            if (value.length !== length) {
              throw new Error(`Expected length ${length}, got ${value.length}`);
            }
          },
        },
        include: (expected: string) => {
          if (!String(value).includes(expected)) {
            throw new Error(`Expected ${value} to include ${expected}`);
          }
        },
      },
    };
  }

  async runTests(
    testScript: string,
    response: any,
    request: any,
    responseTime: number
  ): Promise<TestResult[]> {
    this.results = [];
    const context = this.createContext(response, request, responseTime);

    try {
      // Create a function that executes the test script
      const testFunction = new Function(
        "pm",
        `
        ${testScript}
        `
      );

      testFunction(context.pm);
    } catch (error: any) {
      this.results.push({
        name: "Test Execution Error",
        passed: false,
        message: error.message,
      });
    }

    return [...this.results];
  }

  getResults(): TestResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }
}

