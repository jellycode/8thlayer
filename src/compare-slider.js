import ImageCompare from 'image-compare-viewer';
import 'image-compare-viewer/dist/image-compare-viewer.min.css';

class CompareSlider extends HTMLElement {
 constructor() {
  super();
  const element = document.getElementById('image-compare');
  const viewer = new ImageCompare(element).mount();
 }
}
if (!customElements.get('compare-slider')) {
 customElements.define('compare-slider', CompareSlider);
}
