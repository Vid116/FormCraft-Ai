import { getStripe, getPlanByPriceId } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Use service role for webhook (no user session)
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;

      if (!userId || !plan) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) break;

      // Fetch subscription to get period end
      const stripeSubResponse = await getStripe().subscriptions.retrieve(subscriptionId);
      const stripeSub = stripeSubResponse as unknown as { current_period_end: number };

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null,
          stripe_subscription_id: subscriptionId,
          plan,
          status: "active",
          current_period_end: new Date(
            stripeSub.current_period_end * 1000
          ).toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as {
        customer: string | { id: string };
        items: { data: Array<{ price?: { id: string } }> };
        cancel_at_period_end: boolean;
        status: string;
        current_period_end: number;
      };
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

      if (!customerId) break;

      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceId ? getPlanByPriceId(priceId) : "free";
      const status = sub.cancel_at_period_end
        ? "canceled"
        : sub.status === "active"
          ? "active"
          : sub.status === "past_due"
            ? "past_due"
            : "active";

      await supabase
        .from("subscriptions")
        .update({
          plan,
          status,
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

      if (!customerId) break;

      await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "canceled" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
