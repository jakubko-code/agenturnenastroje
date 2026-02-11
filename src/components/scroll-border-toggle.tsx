"use client";

import { useEffect } from "react";

export function ScrollBorderToggle() {
  useEffect(() => {
    function syncScrollClass() {
      if (window.scrollY > 0) {
        document.body.classList.add("is-scrolled");
      } else {
        document.body.classList.remove("is-scrolled");
      }
    }

    syncScrollClass();
    window.addEventListener("scroll", syncScrollClass, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScrollClass);
      document.body.classList.remove("is-scrolled");
    };
  }, []);

  return null;
}
