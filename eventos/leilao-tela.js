// A parte do leilão na tela de Eventos: preço agora, fila, o formulário de entrada com o Pix e o lance de quem já entrou.
// Os números vêm de /api/leilao (lances pagos de verdade); esta tela só mostra e envia.
const KEY = 'nv-leilao';
const esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const brl = n => `R$ ${Number(n).toLocaleString('pt-BR')}`;
const saved = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
const save = token => { try { localStorage.setItem(KEY, token); } catch {} };

const CSS = `
.bid{margin:6px 0 18px}
.bid-rule{color:var(--mid);font-size:14.5px}
.bid-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:14px 0}
.bid-stats span{padding:12px 12px 10px;border:1px solid rgba(244,241,234,.16);border-radius:14px;background:rgba(244,241,234,.03)}
.bid-stats small{display:block;font-size:12px;color:var(--mid)}
.bid-stats b{display:block;margin-top:4px;font-size:clamp(18px,5vw,24px);font-weight:500;letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.bid-list{max-height:264px;margin:0 0 16px!important;padding:0!important;border:1px solid rgba(244,241,234,.16);border-radius:14px;list-style:none;overflow:auto}
.bid-list li{display:flex;align-items:center;gap:10px;margin:0;padding:9px 16px;font-size:14.5px;font-variant-numeric:tabular-nums}
.bid-list li + li{border-top:1px solid rgba(244,241,234,.08)}
.bid-list i{flex:none;width:34px;font:400 12px 'IBM Plex Mono',monospace;font-style:normal;color:var(--mid)}
.bid-list b{flex:1;font-weight:500;color:var(--ink)}
.bid-list .out{opacity:.5}
.bid-list .me{background:rgba(244,241,234,.07)}
.bid-list .cut{justify-content:center;padding:5px;background:rgba(229,55,43,.1);font:500 10.5px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#ff8a80}
.bid-tag{padding:3px 8px;border-radius:99px;font-size:11.5px;font-weight:600}
.bid-tag.in{background:rgba(52,199,123,.14);color:#34c77b}
.bid-tag.no{background:rgba(229,55,43,.14);color:#ff8a80}
.bid-card{margin:0 0 16px;padding:16px;border:1px solid rgba(244,241,234,.2);border-radius:16px;background:rgba(244,241,234,.03)}
.bid-card h3{margin:0 0 6px;font-size:18px;font-weight:500;letter-spacing:-.01em;color:var(--ink)}
.bid-card p{margin:0 0 12px!important;font-size:14px;color:var(--mid)}
.bid-card label{display:block;margin:12px 0 6px;font-size:13px;color:var(--mid)}
.bid-card input[type=text],.bid-card input[type=email],.bid-card input[type=number]{width:100%;height:46px;padding:0 14px;border:1px solid rgba(244,241,234,.18);border-radius:12px;background:rgba(244,241,234,.04);color:var(--ink);font:400 15px 'Inter Tight',system-ui,sans-serif;outline:0}
.bid-card input:focus{border-color:rgba(244,241,234,.6)}
.bid-card .agree{margin-top:14px}
.bid-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:16px}
.bid-msg{flex:1;min-width:160px;margin:0!important;font-size:13px;color:#ffb4a8}
.bid-qr{display:block;width:196px;height:196px;margin:4px auto 14px;padding:10px;border-radius:14px;background:#fff}
.bid-qr svg{display:block;width:100%;height:100%}
.bid .talk-note{margin:0!important;font-size:13.5px;color:var(--mid)}
.bid-tip{margin:8px 0 0!important;font-size:13px;color:var(--mid)}
.bid-now{margin:14px 0 0!important;font-size:14px;color:var(--ink)!important}
.bid-code{display:block;margin:0 0 12px;padding:10px 12px;border-radius:10px;background:rgba(244,241,234,.06);font:400 11.5px 'IBM Plex Mono',monospace;color:var(--mid);overflow-wrap:anywhere;user-select:all}
`;

let qrLib;
const qrSvg = text => (qrLib ||= new Promise((ok, fail) => {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  s.onload = () => ok(window.qrcode); s.onerror = fail;
  document.head.append(s);
})).then(qrcode => { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({cellSize:4, margin:0, scalable:true}); });

export function mount(el, t, onEnd) {
  document.head.append(Object.assign(document.createElement('style'), {textContent:CSS}));
  let token = saved(), state = null, draft = null, busy = false, message = '';

  const api = async (method, data) => {
    const r = await fetch(method === 'GET' ? `/api/leilao?token=${encodeURIComponent(token)}` : '/api/leilao', method === 'GET' ? undefined : {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || 'Não foi possível agora.');
    return body;
  };
  const fill = (text, s) => esc(text).replace(/\{(\w+)\}/g, (_, k) => ({vagas:s.vagas, entrada:brl(s.entrada), preco:brl(s.preco), paraEntrar:brl(s.paraEntrar), posicao:s.voce?.posicao, lance:s.voce?.lance && brl(s.voce.lance), codigo:s.voce?.codigo, falta:s.voce && brl(s.voce.falta), sinal:`${Math.round(s.sinal * 100)}%`, agora:brl(upfront(s))})[k] ?? '');

  // what the Pix will be for the bid being typed: the entry plus the deposit, less what was already paid
  const upfront = s => { const v = Math.max(draft?.valor ?? s.voce?.valor ?? s.paraEntrar, (draft ? draft.auto && draft.teto : s.voce?.teto) || 0); return Math.max(0, s.entrada + Math.ceil(s.sinal * v) - (s.voce?.recebido || 0)); };
  const fields = (s, mine) => `
    <label for="bid-valor">${esc(t.campoLance)}</label>
    <input id="bid-valor" name="valor" type="number" inputmode="numeric" min="${mine ? mine.valor : s.entrada}" step="1" value="${draft?.valor ?? (mine ? Math.max(mine.valor, s.paraEntrar) : s.paraEntrar)}" />
    <p class="bid-tip">${fill(t.lanceDica, s)}</p>
    ${s.automatico ? `<label class="agree"><input type="checkbox" name="auto" ${draft?.auto ?? mine?.teto > mine?.valor ? 'checked' : ''} /><span><b>${esc(t.automatico)}</b><small>${esc(t.automaticoDica)}</small></span></label>
    <div data-teto ${draft?.auto ?? mine?.teto > mine?.valor ? '' : 'hidden'}>
      <label for="bid-teto">${esc(t.campoTeto)}</label>
      <input id="bid-teto" name="teto" type="number" inputmode="numeric" step="1" value="${draft?.teto ?? mine?.teto ?? ''}" />
    </div>` : ''}
    ${upfront(s) > 0 ? `<p class="bid-now" data-now>${fill(t.pixAgora, s)}</p>` : '<p data-now hidden></p>'}`;

  function render() {
    const s = state;
    if (!s) { el.innerHTML = message ? `<p class="bid-rule">${esc(message)}</p>` : ''; return; }
    const mine = s.voce;
    const rows = s.fila.map(l => `${l.posicao === s.vagas + 1 ? `<li class="cut">${esc(t.corte)}</li>` : ''}<li class="${l.dentro ? '' : 'out'}${l.voce ? ' me' : ''}"><i>#${l.posicao}</i><b>${brl(l.lance)}</b>${l.voce ? `<span class="bid-tag ${l.dentro ? 'in' : 'no'}">${esc(t.voce)}</span>` : ''}</li>`).join('');
    const pay = mine?.falta > 0 ? `<div class="bid-card">
          <h3>${fill(t.pagarTitulo, s)}</h3><p>${fill(t.pagarTexto, s)}</p>
          <span class="bid-qr" data-qr></span>
          <code class="bid-code">${esc(mine.pix)}</code>
          <div class="bid-row"><p class="bid-msg" role="status" style="color:var(--mid)">${fill(t.pagarCodigo, s)}</p><button class="talk-btn solid" type="button" data-copy>${esc(t.copiar)}</button></div>
        </div>` : '';
    const card = !s.aberto ? `<div class="bid-card"><h3>${esc(t.encerrado)}</h3><p>${mine?.posicao ? fill(mine.dentro ? t.fimDentro : t.fimFora, s) : fill(t.fimGeral, s)}</p></div>`
      : !mine ? `<form class="bid-card" data-entrar novalidate>
          <h3>${esc(t.entrarTitulo)}</h3><p>${fill(t.entrarTexto, s)}</p>
          <label for="bid-nome">Nome</label><input id="bid-nome" name="nome" type="text" maxlength="120" autocomplete="name" value="${esc(draft?.nome ?? '')}" />
          <label for="bid-email">E-mail</label><input id="bid-email" name="email" type="email" maxlength="254" autocomplete="email" value="${esc(draft?.email ?? '')}" />
          <label for="bid-pix">${esc(t.campoPix)}</label><input id="bid-pix" name="pix" type="text" maxlength="140" autocomplete="off" value="${esc(draft?.pix ?? '')}" />
          ${fields(s)}
          <input class="hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <div class="bid-row"><p class="bid-msg" role="status">${esc(message)}</p><button class="talk-btn solid" type="submit" ${busy ? 'disabled' : ''}>${esc(t.entrarBotao)}</button></div>
        </form>`
      : `${pay}<form class="bid-card" data-lance novalidate>
          <h3>${mine.posicao ? `${fill(mine.dentro ? t.dentroTitulo : t.foraTitulo, s)} <span class="bid-tag ${mine.dentro ? 'in' : 'no'}">${esc(mine.dentro ? t.dentro : t.fora)}</span>` : esc(t.aguardando)}</h3>
          <p>${mine.posicao ? fill(mine.dentro ? t.dentroTexto : t.foraTexto, s) : fill(t.aguardandoTexto, s)}</p>
          ${fields(s, mine)}
          <div class="bid-row"><p class="bid-msg" role="status">${esc(message)}</p><button class="talk-btn solid" type="submit" ${busy ? 'disabled' : ''}>${esc(t.lanceBotao)}</button></div>
        </form>`;
    const focused = document.activeElement?.name, form = el.querySelector('form');
    el.innerHTML = `<div class="bid">
      <p class="letter-h">${esc(t.rotulo)}</p>
      <p class="bid-rule">${fill(t.regra, s)}</p>
      <div class="bid-stats"><span><small>${esc(t.precoAgora)}</small><b>${brl(s.preco)}</b></span><span><small>${esc(t.paraEntrar)}</small><b>${brl(s.paraEntrar)}</b></span><span><small>${esc(t.lances)}</small><b>${s.participantes}</b></span></div>
      ${rows ? `<ul class="bid-list">${rows}</ul>` : ''}
      ${card}
      <p class="talk-note">${fill(t.desistencia, s)}</p></div>`;
    if (form && focused) el.querySelector(`[name="${focused}"]`)?.focus();
    const qr = el.querySelector('[data-qr]');
    if (qr) qrSvg(mine.pix).then(svg => { qr.innerHTML = svg; }).catch(() => { qr.hidden = true; });
  }

  const read = form => { const d = new FormData(form), n = k => d.get(k) === '' || d.get(k) == null ? null : Number(d.get(k));
    return {nome:d.get('nome'), email:d.get('email'), pix:d.get('pix'), website:d.get('website'), valor:n('valor'), auto:d.get('auto') === 'on', teto:n('teto')}; };
  el.addEventListener('input', e => { const form = e.target.closest('form'); if (!form) return; draft = read(form); const cap = form.querySelector('[data-teto]'), due = form.querySelector('[data-now]'); if (cap) cap.hidden = !draft.auto; due.hidden = !(upfront(state) > 0); due.innerHTML = fill(t.pixAgora, state); });
  el.addEventListener('click', async e => {
    if (!e.target.closest('[data-copy]')) return;
    try { await navigator.clipboard.writeText(state.voce.pix); e.target.closest('[data-copy]').textContent = t.copiado; } catch { getSelection().selectAllChildren(el.querySelector('.bid-code')); }
  });
  el.addEventListener('submit', async e => {
    e.preventDefault();
    const d = read(e.target), entering = e.target.matches('[data-entrar]');
    draft = d; busy = true; message = ''; render();
    try {
      const r = await api('POST', {acao:entering ? 'entrar' : 'lance', token, nome:d.nome, email:d.email, pix:d.pix, website:d.website, valor:d.valor, teto:d.auto ? d.teto : null});
      if (r.token) { token = r.token; save(token); }
      state = r; draft = null;
    } catch (error) { message = error.message; }
    busy = false; render();
  });

  const typing = () => el.contains(document.activeElement) && /INPUT/.test(document.activeElement.tagName);
  const refresh = async () => {
    try { const s = await api('GET'); if (s.voce === null && token && !state) { token = ''; } state = s; message = ''; onEnd?.(s.encerraEm); if (!typing()) render(); }
    catch (error) { if (!state) { message = error.message; render(); } }
  };
  refresh();
  return setInterval(() => { if (!document.hidden && el.isConnected) refresh(); }, 20000);
}
