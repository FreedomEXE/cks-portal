import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      roleCode: string;
      capabilities: string[];
      sessionId?: string;
      metadata?: any;
    };
    context?: {
      role: string;
      domain?: string;
      ecosystem?: {
        contractorId?: string;
        managerId?: string;
        customerId?: string;
        centerId?: string;
        warehouseId?: string;
      };
    };
  }
}

