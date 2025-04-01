document.addEventListener("DOMContentLoaded", () => {
  // Add a subtle fade-in animation for sections
  const sections = document.querySelectorAll("section");
  
  const fadeIn = (element, delay = 0) => {
    setTimeout(() => {
      element.style.opacity = 1;
      element.style.transform = 'translateY(0)';
    }, delay);
  };
  
  sections.forEach((section, index) => {
    section.style.opacity = 0;
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    fadeIn(section, 100 * index);
  });
});