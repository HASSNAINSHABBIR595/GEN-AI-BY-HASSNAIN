export function clearMotionStyles(targets) {
  targets.forEach((element) => {
    element.style.opacity = "";
    element.style.transform = "";
    element.style.willChange = "";
  });
}
