import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentCustomerContext {
  accountId: string;
  customerId: string;
  tenantId: string;
  phone: string;
  email?: string;
  status: string;
  token?: string;
}

export const CurrentCustomer = createParamDecorator(
  (data: keyof CurrentCustomerContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request.customer;

    if (!customer) return null;
    return data ? customer[data] : customer;
  },
);
