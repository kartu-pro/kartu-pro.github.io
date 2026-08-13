class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="footer-content">
          <span class="copyright">&copy; KartuPro.</span>
          <nav class="footer-links">
            <a href="/contact/">Contact</a>
          </nav>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);
