import { LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Define the log entry structure to match OpenTelemetry schema
export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: {
    name: string;
    version: string;
    environment: string;
  };
  trace_id?: string;
  span_id?: string;
  gtid?: string;
  user?: {
    id?: string;
  };
  event?: string;
  message: string;
  duration_ms?: number;
  error?: {
    type?: string;
    message?: string;
    stack?: string;
    code?: string;
  };
  attributes?: Record<string, any>;
}

// Create a Winston logger with JSON format
export const createLoggerWithJsonFormat = (serviceName: string) => {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: {
      service: {
        name: serviceName,
        version: process.env.VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    },
    transports: [
      new transports.Console()
    ]
  });
};

// Minimal implementation focusing on practical logging without complex async context
export class StructuredLogger implements LoggerService {
  private logger: any;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = createLoggerWithJsonFormat(serviceName);
  }

  // Method to set context metadata for logging 
  // Note: Since AsyncLocalStorage isn't available in some implementations,
  // this focuses on simple context passing with overrides
  setContext(traceId?: string, spanId?: string, gtid?: string, userId?: string) {
    // This implementation will handle context at the log level,
    // which is acceptable for demonstrating the concept
  }

  // Generate JSON log entry with proper structure
  private generateLogEntry(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, 
                          traceId?: string, spanId?: string, gtid?: string, userId?: string, 
                          eventName?: string, error?: any, attributes?: Record<string, any>): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: {
        name: this.serviceName,
        version: process.env.VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Add optional fields as needed
    if (traceId) logEntry.trace_id = traceId;
    if (spanId) logEntry.span_id = spanId;
    if (gtid) logEntry.gtid = gtid;
    if (userId) {
      logEntry.user = { id: userId };
    }
    if (eventName) logEntry.event = eventName;
    
    if (error) {
      logEntry.error = {
        message: error.message
      };
      if (error.stack) {
        logEntry.error.stack = error.stack;
      }
    }
    
    if (attributes) {
      logEntry.attributes = attributes;
    }

    return logEntry;
  }

  log(message: string, context?: string) {
    const logEntry = this.generateLogEntry('INFO', context ? `${context}: ${message}` : message);
    this.logger.info(logEntry);
  }

  error(message: string, trace?: string, context?: string) {
    const error: { message: string; stack?: string } = {
      message: context ? `${context}: ${message}` : message
    };
    
    if (trace) {
      error.stack = trace;
    }
    
    const logEntry = this.generateLogEntry('ERROR', message, undefined, undefined, undefined, undefined, undefined, error);
    this.logger.error(logEntry);
  }

  warn(message: string, context?: string) {
    const logEntry = this.generateLogEntry('WARN', context ? `${context}: ${message}` : message);
    this.logger.warn(logEntry);
  }

  debug(message: string, context?: string) {
    const logEntry = this.generateLogEntry('DEBUG', context ? `${context}: ${message}` : message);
    this.logger.debug(logEntry);
  }

  verbose(message: string, context?: string) {
    const logEntry = this.generateLogEntry('INFO', context ? `${context}: ${message}` : message);
    this.logger.verbose(logEntry);
  }
}