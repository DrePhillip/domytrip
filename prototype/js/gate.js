/* Porta do protótipo.

   NÃO É SEGURANÇA. A palavra-passe está no código e qualquer pessoa a lê
   no source do browser. Serve para o link não ficar aberto a quem passe por
   ele por acaso — que é o problema real de partilhar um protótipo.
   Para segurança a sério é preciso um servidor. Ver DECISIONS.md → ADR-023. */

const GATE_PASSWORD = 'roma2026';        // vazio ('') desliga a porta

(function () {
  const gate = document.getElementById('gate');
  if (!gate) return;

  let jaAberto = false;
  try { jaAberto = sessionStorage.getItem('dmt-gate') === '1'; } catch {}

  if (!GATE_PASSWORD || jaAberto) {
    gate.hidden = true;
    window.__gateOpen = true;
    return;
  }

  gate.hidden = false;
  const box = gate.querySelector('.gate-box');
  const input = document.getElementById('gatePass');
  const erro = document.getElementById('gateErr');

  const tentar = () => {
    if (input.value.trim() === GATE_PASSWORD) {
      try { sessionStorage.setItem('dmt-gate', '1'); } catch {}
      window.__gateOpen = true;
      gate.hidden = true;
      window.dispatchEvent(new Event('dmt:unlock'));
      return;
    }
    erro.hidden = false;
    box.classList.remove('wrong');
    void box.offsetWidth;                 // reinicia a animação
    box.classList.add('wrong');
    input.select();
  };

  document.getElementById('gateGo').onclick = tentar;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tentar(); });
  input.addEventListener('input', () => { erro.hidden = true; });
  setTimeout(() => input.focus(), 80);
})();
