import { NextRequest } from "next/server";

// Returns the embeddable widget script
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  const script = `
(function() {
  if (window.__anajakChatLoaded) return;
  window.__anajakChatLoaded = true;

  var orgId = document.currentScript && document.currentScript.getAttribute('data-org-id');
  if (!orgId) { console.warn('[Anajak Chat] Missing data-org-id'); return; }

  // Create chat bubble button
  var btn = document.createElement('button');
  btn.id = 'anajak-chat-btn';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99998;width:56px;height:56px;border-radius:50%;background:#6366f1;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';
  btn.onmouseenter = function() { this.style.transform = 'scale(1.1)'; };
  btn.onmouseleave = function() { this.style.transform = 'scale(1)'; };
  document.body.appendChild(btn);

  // Create iframe container
  var iframe = document.createElement('iframe');
  iframe.id = 'anajak-chat-iframe';
  iframe.src = '${origin}/widget?orgId=' + encodeURIComponent(orgId) + '&origin=' + encodeURIComponent(window.location.origin);
  iframe.style.cssText = 'position:fixed;bottom:88px;right:20px;z-index:99999;width:380px;height:600px;max-height:calc(100vh - 120px);border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:none;transition:opacity 0.2s;';
  iframe.allow = 'microphone; camera';
  document.body.appendChild(iframe);

  var open = false;
  btn.addEventListener('click', function() {
    open = !open;
    iframe.style.display = open ? 'block' : 'none';
    iframe.style.opacity = open ? '1' : '0';
  });

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (open && !btn.contains(e.target) && !iframe.contains(e.target)) {
      open = false;
      iframe.style.display = 'none';
    }
  });
})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
