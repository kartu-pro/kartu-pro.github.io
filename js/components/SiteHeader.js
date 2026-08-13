class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <a href="/" class="brand-link">
          <div class="logo-circle">
            <img src="/assets/logo.svg" alt="KartuPro - Georgian Language Learning Logo">
          </div>
          <span class="brand-title">KartuPro</span>
        </a>

        <nav class="nav-links">
          <a href="/apps/">Apps</a>
          <a href="/resources/">Resources</a>
          <a href="/about/">About</a>
        </nav>
      </header>
    `;
  }
}

customElements.define('site-header', SiteHeader);
