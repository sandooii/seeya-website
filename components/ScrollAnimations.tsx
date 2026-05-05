"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Word-split helper. We split by word (not char) so Arabic ligatures stay intact.
 */
function splitToWords(el: Element) {
  if (el.getAttribute("data-gsap-split") === "done") return;
  const text = (el.textContent || "").trim();
  el.innerHTML = "";
  text.split(/(\s+)/).forEach((part) => {
    if (/^\s+$/.test(part)) {
      el.appendChild(document.createTextNode(" "));
    } else if (part.length) {
      const span = document.createElement("span");
      span.textContent = part;
      span.className = "gsap-word inline-block will-change-transform";
      el.appendChild(span);
    }
  });
  el.setAttribute("data-gsap-split", "done");
}

export default function ScrollAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1) Hero title — words slide up on load
      const heroTitle = document.querySelector('[data-gsap="hero-title"]');
      if (heroTitle) {
        splitToWords(heroTitle);
        gsap.from(heroTitle.querySelectorAll(".gsap-word"), {
          y: 80,
          opacity: 0,
          rotateX: -45,
          duration: 1.1,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.25,
          transformOrigin: "0% 100%",
        });
      }

      // 2) Section titles — split words, animate on scroll
      document.querySelectorAll('[data-gsap="title"]').forEach((title) => {
        splitToWords(title);
        gsap.from(title.querySelectorAll(".gsap-word"), {
          y: 60,
          opacity: 0,
          duration: 0.85,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 88%",
            once: true,
          },
        });
      });

      // 3) Trip cards — ScrollTrigger.batch staggered
      ScrollTrigger.batch('[data-gsap="trip-card"]', {
        start: "top 88%",
        onEnter: (els) =>
          gsap.from(els, {
            y: 70,
            opacity: 0,
            stagger: 0.12,
            duration: 0.85,
            ease: "power3.out",
            overwrite: true,
          }),
      });

      // 4) Gallery — alternate slide left/right
      document
        .querySelectorAll('[data-gsap="gallery-item"]')
        .forEach((el, i) => {
          gsap.from(el, {
            x: i % 2 === 0 ? -100 : 100,
            opacity: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

      // 5) Avatars — staggered spring pop
      ScrollTrigger.batch('[data-gsap="avatar"]', {
        start: "top 90%",
        onEnter: (els) =>
          gsap.from(els, {
            scale: 0,
            opacity: 0,
            stagger: 0.09,
            duration: 0.65,
            ease: "back.out(1.8)",
            overwrite: true,
          }),
      });

      // Refresh once everything is initialized
      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return null;
}
