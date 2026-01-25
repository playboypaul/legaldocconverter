import os
import logging
import stripe
from fastapi import APIRouter, Request, HTTPException, Header
from database import db

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter()

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook events"""
    
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook not configured")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event['type']
    data = event['data']['object']
    
    logger.info(f"Received Stripe webhook: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            await handle_checkout_completed(data)
        
        elif event_type == 'customer.subscription.created':
            await handle_subscription_created(data)
        
        elif event_type == 'customer.subscription.updated':
            await handle_subscription_updated(data)
        
        elif event_type == 'customer.subscription.deleted':
            await handle_subscription_deleted(data)
        
        elif event_type == 'invoice.payment_succeeded':
            await handle_payment_succeeded(data)
        
        elif event_type == 'invoice.payment_failed':
            await handle_payment_failed(data)
        
        else:
            logger.info(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Error handling webhook {event_type}: {e}")
        # Return 200 anyway to prevent Stripe from retrying
    
    return {"status": "success"}


async def handle_checkout_completed(session):
    """Handle successful checkout session"""
    logger.info(f"Checkout completed: {session.get('id')}")
    
    customer_id = session.get('customer')
    customer_email = session.get('customer_email') or session.get('customer_details', {}).get('email')
    subscription_id = session.get('subscription')
    
    if customer_email:
        # Update user with Stripe customer ID and upgrade to Professional
        success = await db.update_subscription(
            email=customer_email,
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
            tier='professional',
            status='active'
        )
        
        if success:
            logger.info(f"Upgraded user {customer_email} to Professional")
        else:
            logger.warning(f"Could not find user with email {customer_email}")
    else:
        logger.warning("No customer email in checkout session")


async def handle_subscription_created(subscription):
    """Handle new subscription created"""
    logger.info(f"Subscription created: {subscription.get('id')}")
    
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    # Get tier from subscription items
    tier = 'professional'  # Default to professional for paid subscriptions
    
    await db.update_subscription(
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
        tier=tier,
        status=status
    )


async def handle_subscription_updated(subscription):
    """Handle subscription update (upgrade, downgrade, status change)"""
    logger.info(f"Subscription updated: {subscription.get('id')}")
    
    customer_id = subscription.get('customer')
    subscription_id = subscription.get('id')
    status = subscription.get('status')
    
    # Map Stripe status to our status
    status_map = {
        'active': 'active',
        'past_due': 'past_due',
        'canceled': 'canceled',
        'unpaid': 'unpaid',
        'trialing': 'active'
    }
    
    mapped_status = status_map.get(status, status)
    
    # If canceled or unpaid, downgrade to free
    tier = 'free' if mapped_status in ['canceled', 'unpaid'] else 'professional'
    
    await db.update_subscription(
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
        tier=tier,
        status=mapped_status
    )
    
    logger.info(f"Updated subscription {subscription_id} - tier: {tier}, status: {mapped_status}")


async def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    logger.info(f"Subscription deleted: {subscription.get('id')}")
    
    customer_id = subscription.get('customer')
    
    # Downgrade user to free tier
    await db.update_subscription(
        stripe_customer_id=customer_id,
        tier='free',
        status='canceled'
    )
    
    logger.info(f"Downgraded customer {customer_id} to free tier")


async def handle_payment_succeeded(invoice):
    """Handle successful payment"""
    logger.info(f"Payment succeeded: {invoice.get('id')}")
    
    customer_id = invoice.get('customer')
    
    # Ensure subscription is active
    await db.update_subscription(
        stripe_customer_id=customer_id,
        status='active'
    )


async def handle_payment_failed(invoice):
    """Handle failed payment"""
    logger.warning(f"Payment failed: {invoice.get('id')}")
    
    customer_id = invoice.get('customer')
    
    # Mark subscription as past due
    await db.update_subscription(
        stripe_customer_id=customer_id,
        status='past_due'
    )
