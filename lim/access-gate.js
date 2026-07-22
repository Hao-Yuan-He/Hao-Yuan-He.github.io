(() => {
  const STORAGE_KEY = "lim-access-granted";
  const ACCESS_PASSWORD = "pswd";
  const root = document.documentElement;

  const style = document.createElement("style");
  style.textContent = `
    html.lim-locked body {
      visibility: hidden;
    }

    html.lim-locked .lim-access-gate {
      visibility: visible;
    }

    .lim-access-gate {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #eaf4fa;
      color: #17324f;
      font-family: Georgia, "Times New Roman", serif;
    }

    .lim-access-card {
      width: min(100%, 420px);
      padding: 34px 36px 36px;
      border: 1px solid #bfd3e0;
      background: #f7fbfd;
      box-shadow: 0 18px 44px rgba(23, 50, 79, 0.12);
      text-align: center;
    }

    .lim-access-card h1 {
      margin: 0 0 8px;
      color: #17324f;
      font-size: 27px;
      font-weight: 600;
      line-height: 1.2;
    }

    .lim-access-card p {
      margin: 0 0 22px;
      color: #59748a;
      font-size: 15px;
      line-height: 1.5;
    }

    .lim-access-form {
      display: grid;
      gap: 10px;
    }

    .lim-access-form input,
    .lim-access-form button {
      width: 100%;
      min-height: 42px;
      padding: 9px 12px;
      border: 1px solid #8fb4ce;
      border-radius: 0;
      font: inherit;
      font-size: 15px;
    }

    .lim-access-form input {
      background: #ffffff;
      color: #17324f;
      text-align: center;
    }

    .lim-access-form input:focus {
      outline: 2px solid rgba(47, 111, 159, 0.28);
      outline-offset: 2px;
    }

    .lim-access-form button {
      background: transparent;
      color: #2f6f9f;
      cursor: pointer;
    }

    .lim-access-form button:hover,
    .lim-access-form button:focus-visible {
      background: #eef7fc;
    }

    .lim-access-error {
      min-height: 1.4em;
      margin: 2px 0 0 !important;
      color: #9a3c46 !important;
      font-size: 13px !important;
    }

    @media (max-width: 520px) {
      .lim-access-card {
        padding: 28px 22px 30px;
      }
    }
  `;
  document.head.appendChild(style);
  root.classList.add("lim-locked");

  const hasAccess = () => {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === "granted";
    } catch {
      return false;
    }
  };

  const grantAccess = (gate) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "granted");
    } catch {
      // Continue for browsers that disable sessionStorage.
    }
    root.classList.remove("lim-locked");
    gate.remove();
  };

  const mountGate = () => {
    if (hasAccess()) {
      root.classList.remove("lim-locked");
      return;
    }

    const gate = document.createElement("div");
    gate.className = "lim-access-gate";
    gate.innerHTML = `
      <section class="lim-access-card" aria-labelledby="lim-access-title">
        <h1 id="lim-access-title">Ming Li · Academic Profile</h1>
        <p>Please enter the password to continue.</p>
        <form class="lim-access-form">
          <label class="sr-only" for="lim-access-password">Password</label>
          <input id="lim-access-password" name="password" type="password" autocomplete="current-password" autofocus required />
          <button type="submit">Enter</button>
          <p class="lim-access-error" role="alert" aria-live="polite"></p>
        </form>
      </section>
    `;
    document.body.appendChild(gate);

    const form = gate.querySelector(".lim-access-form");
    const input = gate.querySelector("#lim-access-password");
    const error = gate.querySelector(".lim-access-error");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value === ACCESS_PASSWORD) {
        grantAccess(gate);
        return;
      }
      error.textContent = "Incorrect password.";
      input.select();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountGate, { once: true });
  } else {
    mountGate();
  }
})();
