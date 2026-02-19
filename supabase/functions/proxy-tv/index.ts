/**
 * TV Proxy — fetches embedtv pages server-side, strips sandbox/iframe
 * detection, and returns cleaned HTML as JSON (to avoid Supabase gateway CSP).
 * The frontend renders it via srcdoc or blob URL.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let channelUrl: string | null = null;

    if (req.method === "POST") {
      const body = await req.json();
      channelUrl = body.url;
    } else {
      channelUrl = url.searchParams.get("url");
    }

    if (!channelUrl) {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = new URL(channelUrl);
    if (!parsed.hostname.includes("embedtv.best")) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the embed page as a normal top-level navigation
    const resp = await fetch(channelUrl, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Upstream error", status: resp.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let html = await resp.text();

    // === STRIP SANDBOX DETECTION ===

    // 1. Remove the sandbox_detect div entirely
    html = html.replace(/<div\s+id=["']?sandbox_detect["']?[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '');

    // 2. Remove scripts referencing sandbox_detect
    html = html.replace(/<script[^>]*>[\s\S]*?sandbox_detect[\s\S]*?<\/script>/gi, '');

    // 3. Remove iframe detection scripts
    html = html.replace(/<script[^>]*>[\s\S]*?(window\.top\s*!==?\s*window\.self|self\s*!==?\s*top|frameElement|inIframe|parent\.location\s*=)[\s\S]*?<\/script>/gi, '');

    // 4. Inject anti-sandbox override + base href
    const injection = `
<script>
(function(){
  try{Object.defineProperty(window,'frameElement',{get:function(){return null}})}catch(e){}
  try{Object.defineProperty(window,'top',{get:function(){return window.self}})}catch(e){}
  try{Object.defineProperty(window,'parent',{get:function(){return window.self}})}catch(e){}
  var c=0,ci=setInterval(function(){c++;if(c>120){clearInterval(ci);return}
    var el=document.getElementById('sandbox_detect');if(el)el.remove();
    document.querySelectorAll('[style*="z-index"]').forEach(function(e){
      if((e.textContent||'').includes('SANDBOX')||(e.textContent||'').includes('DIGA'))e.remove();
    });
  },250);
})();
</script>
<base href="${parsed.origin}/">`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>' + injection);
    } else if (html.includes('<HEAD>')) {
      html = html.replace('<HEAD>', '<HEAD>' + injection);
    } else {
      html = injection + html;
    }

    // 5. Remove X-Frame-Options meta
    html = html.replace(/<meta[^>]*x-frame-options[^>]*>/gi, '');

    // Return as JSON so Supabase gateway doesn't add restrictive CSP
    return new Response(JSON.stringify({ html }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store",
      },
    });

  } catch (err) {
    console.error("[proxy-tv] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
