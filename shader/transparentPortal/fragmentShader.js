const fragmentShader = /* glsl */`
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
  vec2 newUV = vUv - vec2(0.5);
  newUV.x *= 1.1;
  float dist = length(newUV);
  vec2 distortedUV = newUV + newUV * sin(dist * 50.0 + uTime * 5.0) * 0.2;
  distortedUV += vec2(0.5);
  vec4 color = texture2D(uTexture, distortedUV);
  color.a = 0.5; // Set the alpha value to 0.5 for half transparency
  gl_FragColor = color;
}`

export default fragmentShader;