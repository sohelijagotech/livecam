import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @CurrentUser() user: { userId: string },
    @Body() body: { coinPackageId: string },
  ) {
    return this.paymentsService.createCheckoutSession(user.userId, body.coinPackageId);
  }

  // NOTE: this route must receive the RAW request body (not JSON-parsed) for Stripe's
  // signature check to pass. See main.ts, where express.raw() is applied to this exact path
  // before the global JSON body parser runs.
  @Post('stripe/webhook')
  webhook(@Req() req: Request, @Headers('stripe-signature') signature: string) {
    return this.paymentsService.handleWebhook(req.body, signature);
  }
}
