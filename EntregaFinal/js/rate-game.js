const starsContainer = document.querySelectorAll('.stars');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    starsContainer.forEach(el => el.classList.toggle('visible', entry.isIntersecting))
  });
}, { threshold: 0.5 });

starsContainer.forEach(el => observer.observe(el))

