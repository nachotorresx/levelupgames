document.querySelectorAll('.carousel').forEach(carousel => {
  const leftArrow = carousel.querySelector('.arrow.left');
  const rightArrow = carousel.querySelector('.arrow.right');
  const container = carousel.querySelector('.carousel-items');

  checkArrowsVisibility(container, leftArrow, rightArrow);

  rightArrow.addEventListener('click', () => {
      container.scrollBy({ left: container.scrollWidth / 5, behavior: 'smooth' });
      applyScaleEffect(container);
      applySkewEffect(container, 'right');
      checkArrowsVisibility(container, leftArrow, rightArrow);
  });

  leftArrow.addEventListener('click', () => {
      container.scrollBy({ left: -container.scrollWidth / 5, behavior: 'smooth' });
      applyScaleEffect(container);
      applySkewEffect(container, 'left');
      checkArrowsVisibility(container, leftArrow, rightArrow);
  });

  container.addEventListener('scroll', () => {
    applyScaleEffect(container);
    checkArrowsVisibility(container, leftArrow, rightArrow)}
  );
});

function checkArrowsVisibility(container, leftArrow, rightArrow) {
  leftArrow.classList.toggle('none', container.scrollLeft < 100 )
  rightArrow.classList.toggle('none', container.scrollWidth - container.scrollLeft < container.clientWidth + 100)
}


function applyScaleEffect(container) {
  setTimeout(() => container.classList.remove('scale-effect'), 200);
}

function applySkewEffect(container, direction) {
  if (direction === 'right') {
      container.classList.add('skew-right');
      setTimeout(() => container.classList.remove('skew-right'), 300);
  } else if (direction === 'left') {
      container.classList.add('skew-left');
      setTimeout(() => container.classList.remove('skew-left'), 300);
  }
}