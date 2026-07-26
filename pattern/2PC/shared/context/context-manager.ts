// Simple context manager for trace propagation in the 2PC system
export interface RequestContext {
  traceId?: string;
  spanId?: string;
  gtid?: string;
  userId?: string;
}

// Simple in-memory context handling for demonstration purposes
// In a production system, this would use AsyncLocalStorage or similar
export class ContextManager {
  // Static map to simulate request contexts - not suitable for production
  private static contexts: Map<string, RequestContext> = new Map();
  
  static setCurrentContext(contextId: string, context: RequestContext): void {
    this.contexts.set(contextId, context);
  }
  
  static getCurrentContext(contextId: string): RequestContext | undefined {
    return this.contexts.get(contextId);
  }
  
  static removeContext(contextId: string): void {
    this.contexts.delete(contextId);
  }
  
  static generateTraceId(): string {
    // Simple UUID generator without hyphens - per specifications
    return 'trace-' + Math.random().toString(36).substr(2, 16);
  }
  
  static generateSpanId(): string {
    // Generate a 16-hex-character span ID
    return Math.random().toString(16).substr(2, 16);
  }
}