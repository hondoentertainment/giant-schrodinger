import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method === 'POST') {
    const body = await req.json();
    // Discord interaction types
    if (body.type === 1) return new Response(JSON.stringify({ type: 1 }), { headers: { 'Content-Type': 'application/json' } }); // PING

    if (body.type === 2) { // APPLICATION_COMMAND
      const command = body.data?.name;
      if (command === 'venn') {
        return new Response(JSON.stringify({
          type: 4,
          data: {
            embeds: [{
              title: 'Venn Challenge!',
              description: 'A new Venn with Friends challenge awaits!',
              color: 0xa855f7,
              fields: [
                { name: 'How to Play', value: 'Connect two random concepts with one witty phrase.' },
                { name: 'Play Now', value: '[Click here to play](https://hondoentertainment.github.io/giant-schrodinger/)' }
              ]
            }]
          }
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
  }
  return new Response('OK');
});
