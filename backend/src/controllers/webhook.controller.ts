import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../lib/logger.js';

const authService = new AuthService(new AuthRepository());

export class WebhookController {
  handleClerk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body;
      const rawBody = (req as any).rawBody;

      // 1. Verify signatures
      const svixId = req.headers['svix-id'] as string;
      const svixTimestamp = req.headers['svix-timestamp'] as string;
      const svixSignature = req.headers['svix-signature'] as string;

      const secret = config.auth.clerkWebhookSecret;

      if (secret && secret !== 'whsec_dummy') {
        if (!svixId || !svixTimestamp || !svixSignature) {
          logger.warn('Clerk Webhook verification failed: Missing headers');
          res.status(400).json({ error: 'Missing svix headers' });
          return;
        }

        const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
        
        // Split signatures in header (separated by spaces)
        const passedSignatures = svixSignature.split(' ').map((sig) => {
          const parts = sig.split(',');
          return parts[1] || parts[0];
        });

        // Compute local HMAC
        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('base64');

        const isMatched = passedSignatures.some(
          (passedSig) => passedSig === computedSignature
        );

        if (!isMatched) {
          logger.warn('Clerk Webhook verification failed: Signature mismatch');
          res.status(401).json({ error: 'Invalid webhook signature' });
          return;
        }
      } else {
        logger.info('Clerk webhook secret is dummy/not configured. Skipping verification.');
      }

      // 2. Parse Event Details
      const eventType = payload.type;
      const eventData = payload.data;

      logger.info(`Received Clerk webhook event: ${eventType}`);

      switch (eventType) {
        case 'user.created': {
          const clerkUserId = eventData.id;
          const emailAddresses = eventData.email_addresses || [];
          const primaryEmailId = eventData.primary_email_address_id;
          
          const primaryEmailObj = emailAddresses.find(
            (email: any) => email.id === primaryEmailId
          );
          const email = primaryEmailObj?.email_address || emailAddresses[0]?.email_address;

          if (!email) {
            logger.warn(`Clerk webhook user.created: No email found for user ${clerkUserId}`);
            res.status(400).json({ error: 'No email found in event' });
            return;
          }

          const firstName = eventData.first_name || null;
          const lastName = eventData.last_name || null;
          const avatar = eventData.image_url || null;

          await authService.syncAuthenticatedUser({
            clerkUserId,
            email,
            firstName,
            lastName,
            avatar,
          });

          logger.info(`Clerk webhook user.created: Successfully synced user ${clerkUserId}`);
          break;
        }

        case 'user.updated': {
          const clerkUserId = eventData.id;
          const emailAddresses = eventData.email_addresses || [];
          const primaryEmailId = eventData.primary_email_address_id;
          
          const primaryEmailObj = emailAddresses.find(
            (email: any) => email.id === primaryEmailId
          );
          const email = primaryEmailObj?.email_address || emailAddresses[0]?.email_address;

          if (email) {
            const firstName = eventData.first_name || null;
            const lastName = eventData.last_name || null;
            const avatar = eventData.image_url || null;

            await prisma.user.upsert({
              where: { clerkUserId },
              create: {
                clerkUserId,
                email,
                firstName,
                lastName,
                avatar,
                status: 'ACTIVE',
              },
              update: {
                email,
                firstName,
                lastName,
                avatar,
              },
            });
            logger.info(`Clerk webhook user.updated: Successfully updated user ${clerkUserId}`);
          }
          break;
        }

        case 'user.deleted': {
          const clerkUserId = eventData.id;
          await prisma.user.updateMany({
            where: { clerkUserId },
            data: { status: 'SUSPENDED' },
          });
          logger.info(`Clerk webhook user.deleted: Set status to SUSPENDED for user ${clerkUserId}`);
          break;
        }

        default:
          logger.info(`Clerk webhook event type ${eventType} ignored.`);
          break;
      }

      sendSuccess(res, { received: true }, 200, 'Webhook processed');
    } catch (error: any) {
      logger.error(`Error in Clerk webhook handler: ${error.message}`);
      next(error);
    }
  };
}
