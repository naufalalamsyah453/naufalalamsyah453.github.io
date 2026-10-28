(function () {
  "use strict";

  var root = document.documentElement;
  var mq = function (query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  };
  var raf =
    window.requestAnimationFrame ||
    function (cb) {
      return window.setTimeout(function () {
        cb(Date.now());
      }, 16);
    };
  var reduceMotion = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(pointer: fine)");

  /* ---------- year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- theme toggle ---------- */
  var toggle = document.querySelector(".theme-toggle");
  function applyTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "light" ? "dark" : "light");
    });
  }
  if (window.matchMedia) window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", function (e) {
      try {
        if (localStorage.getItem("theme")) return;
      } catch (err) {}
      root.dataset.theme = e.matches ? "light" : "dark";
    });

  /* ---------- scroll progress ---------- */
  var progress = document.querySelector(".scroll-progress span");
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    revealables.forEach(function (el) {
      el.classList.add("will-reveal");
      io.observe(el);
    });
  }

  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = Math.min(i * 70, 350) + "ms";
    });
  });

  /* ---------- active nav ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-links a[href^='#']")
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* ---------- typewriter ---------- */
  var typewriter = document.querySelector(".typewriter");
  if (typewriter) {
    var words = (typewriter.dataset.words || "").split("|").filter(Boolean);
    if (reduceMotion || words.length <= 1) {
      typewriter.textContent = words[0] || "";
    } else {
      var wordIndex = 0;
      var charIndex = 0;
      var deleting = false;
      var tick = function () {
        var word = words[wordIndex];
        charIndex += deleting ? -1 : 1;
        typewriter.textContent = word.slice(0, charIndex);
        var delay = deleting ? 38 : 72;
        if (!deleting && charIndex === word.length) {
          deleting = true;
          delay = 1700;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delay = 320;
        }
        setTimeout(tick, delay);
      };
      typewriter.textContent = "";
      setTimeout(tick, 500);
    }
  }

  /* ---------- hero title letter split ---------- */
  var splitTarget = document.querySelector("[data-split]");
  if (splitTarget && !reduceMotion) {
    var label = splitTarget.textContent;
    splitTarget.setAttribute("aria-label", label);
    splitTarget.textContent = "";
    label.split("").forEach(function (char, i) {
      var span = document.createElement("span");
      span.className = "split-char";
      span.setAttribute("aria-hidden", "true");
      span.style.transitionDelay = 120 + i * 22 + "ms";
      span.textContent = char === " " ? "\u00a0" : char;
      splitTarget.appendChild(span);
    });
    raf(function () {
      raf(function () {
        splitTarget.classList.add("is-split");
      });
    });
  }

  /* ---------- count up ---------- */
  var counters = document.querySelectorAll(".count");
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    if (isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var start = performance.now ? performance.now() : Date.now();
    var duration = 1100;
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) raf(frame);
      else el.textContent = target.toFixed(decimals);
    }
    raf(frame);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) {
        countObserver.observe(el);
      });
    }
  }

  /* ---------- cursor glow ---------- */
  var glow = document.querySelector(".cursor-glow");
  if (glow && finePointer && !reduceMotion) {
    var gx = window.innerWidth / 2;
    var gy = window.innerHeight / 2;
    var cx = gx;
    var cy = gy;
    var glowVisible = false;

    window.addEventListener(
      "pointermove",
      function (e) {
        gx = e.clientX;
        gy = e.clientY;
        if (!glowVisible) {
          glow.classList.add("is-active");
          glowVisible = true;
        }
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", function () {
      glow.classList.remove("is-active");
      glowVisible = false;
    });

    (function loop() {
      cx += (gx - cx) * 0.16;
      cy += (gy - cy) * 0.16;
      glow.style.transform =
        "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf(loop);
    })();
  }

  /* ---------- project card tilt ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".project").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" +
          (-py * 3.5).toFixed(2) +
          "deg) rotateY(" +
          (px * 3.5).toFixed(2) +
          "deg)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        var dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        btn.style.transform =
          "translate(" + (dx * 6).toFixed(2) + "px," + (dy * 4).toFixed(2) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- konami easter egg ---------- */
  var konami = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  var konamiIndex = 0;
  document.addEventListener("keydown", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konami[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        document.body.classList.add("konami");
        setTimeout(function () {
          document.body.classList.remove("konami");
        }, 3200);
      }
    } else {
      konamiIndex = key === konami[0] ? 1 : 0;
    }
  });
})();