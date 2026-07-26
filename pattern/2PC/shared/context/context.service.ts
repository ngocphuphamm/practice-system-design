// Shared Context Management Service for Async Trace Propagation
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// TypeScript definitions for context
export interface RequestContext {
  traceId?: string;
  spanId?: string;
  gtid?: string;
  userId?: string;
}

// In-memory storage for context - in a production system this would use AsyncLocalStorage
// For this implementation we're simulating a simple approach
const contextStore: Map<string, RequestContext> = new Map();

@Injectable()
export class ContextService {
  static createContext(traceId?: string, spanId?: string, gtid?: string, userId?: string): string {
    const id = uuidv4().replace(/-/g, ''); // UUID without hyphens
    const context: RequestContext = {
      traceId: traceId || id,
      spanId: spanId || id.substring(0, 16),
      gtid: gtid,
      userId: userId
    };
    
    contextStore.set(id, context);
    return id;
  }

  static getContext(contextId: string): RequestContext | undefined {
    return contextStore.get(contextId);
  }

  static setContext(contextId: string, context: Partial<RequestContext>): void {
    const existing = contextStore.get(contextId);
    if (existing) {
      contextStore.set(contextId, { ...existing, ...context });
    }
  }

  static removeContext(contextId: string): void {
    contextStore.delete(contextId);
  }

  static getCurrentContext(): RequestContext | null {
    // Returns the first context found - in a full implementation this 
    // would be based on actual async context tracking
    const contexts = Array.from(contextStore.values());
    return contexts.length > 0 ? contexts[0] : null;
  }

  static getOrCreateCurrentContext(traceId?: string, spanId?: string, gtid?: string, userId?: string): RequestContext {
    // This is a placeholder for what would normally use AsyncLocalStorage
    // For demonstration purposes, we'll use the simplest approach possible
    const context = this.getCurrentContext();
    if (context) {
      return context;
    }
    
    // Create a new context if none exists
    const newContextId = this.createContext(traceId, spanId, gtid, userId);
    return this.getContext(newContextId) || {};
  }
}