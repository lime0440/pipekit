document.addEventListener("DOMContentLoaded", function () {
  function observeShadowChatImage(shadowRoot) {
    const observer = new MutationObserver((mutations, obs) => {
      const chatImage = shadowRoot.querySelector(".chat-app img");
      if (chatImage) {
        chatImage.style.width = "45px";
        chatImage.style.height = "45px";
      }
    });

    if (!shadowRoot.getElementById("custom-secondary-color")) {
      const style = document.createElement("style");
      style.id = "custom-secondary-color";
      style.textContent = `
        .hover-effect-button,
        .instant-answers-list__prompt {
          --secondary-color: #ffffff !important;
        }
      `;
      shadowRoot.appendChild(style);
    }

    observer.observe(shadowRoot, {
      childList: true,
      subtree: true,
    });
  }

  const tryObserve = () => {
    const hostEl = document.getElementById("ShopifyChat");
    if (hostEl && hostEl.shadowRoot) {
      observeShadowChatImage(hostEl.shadowRoot);
    } else {
      setTimeout(tryObserve, 500);
    }
  };
  tryObserve();

  if (sessionStorage.getItem("chatOpenedOnce")) {
    return;
  }

  setTimeout(function () {
    const tryOpenChat = () => {
      const hostEl = document.getElementById("ShopifyChat");

      if (hostEl && hostEl.shadowRoot) {
        const btn = hostEl.shadowRoot.querySelector(
          'button[data-spec="toggle-button"]'
        );
        if (btn) {
          if (window.matchMedia("(min-width: 768px)").matches) {
            btn.click();
            sessionStorage.setItem("chatOpenedOnce", "true");
            console.log("✅ Chat opened via button click (desktop only).");
            return;
          } else {
            console.log("📱 Mobile detected — skip auto-click.");
            return;
          }
        } else {
          console.log("❌ Button not yet in shadowRoot, retrying...");
        }
      } else {
        console.log("⏳ Waiting for #ShopifyChat to appear...");
      }

      if (window.__chat_retry_count === undefined)
        window.__chat_retry_count = 0;
      if (window.__chat_retry_count++ < 20) {
        setTimeout(tryOpenChat, 500);
      } else {
        console.log("🛑 Gave up waiting for chat toggle button.");
      }
    };

    tryOpenChat();
  }, 10000);
});
