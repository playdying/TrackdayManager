// ── Router & App Init ──

const App = (() => {

  let _current = null;

  function navigate(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-screen]').forEach(b => b.classList.remove('active'));

    const el = document.getElementById(`screen-${screen}`);
    if (!el) return;
    el.classList.add('active');
    _current = screen;

    const navBtn = document.querySelector(`.nav-btn[data-screen="${screen}"]`);
    if (navBtn) navBtn.classList.add('active');

    _initScreen(screen);
  }

  function _initScreen(screen) {
    switch (screen) {
      case 'fahrzeuge':      ScreenFahrzeuge.render(); break;
      case 'wizard':         ScreenWizard.render(); break;
      case 'setup':          ScreenSetup.render(); break;
      case 'zeiten':         ScreenZeiten.render(); break;
      case 'einstellungen':  ScreenEinstellungen.render(); break;
    }
  }

  function _initNav() {
    // Nav buttons
    document.querySelectorAll('.nav-btn[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.screen));
    });

    // Center "+" button → start wizard
    document.getElementById('btn-new-session').addEventListener('click', () => {
      if (getVehicles().length === 0) {
        navigate('fahrzeuge');
        return;
      }
      ScreenWizard.start();
    });
  }

  function init() {
    _initNav();
    navigate('fahrzeuge');
  }

  return { navigate, init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
