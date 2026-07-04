import Stripe from 'stripe';

export default async (req) => {
  try {
    const { items, email, ref, shipping } = await req.json();

    const stripe = new Stripe(Netlify.env.get('STRIPE_SECRET_KEY'));

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: 'Size: ' + item.size,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      client_reference_id: ref,
      shipping_address_collection: { allowed_countries: ['CA','US','GB','AU','FR','DE','ES','IT','NL','BE','PT','JP','KR','MX','BR'] },
      metadata: {
        order_ref: ref,
        customer_name: shipping.name,
        shipping_address: shipping.address,
      },
      success_url: Netlify.env.get('URL') + '?order=success&ref=' + ref,
      cancel_url: Netlify.env.get('URL') + '?order=cancelled',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: '/api/create-checkout',
};
