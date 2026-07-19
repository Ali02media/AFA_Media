"use client";

import { useEffect, useRef } from "react";

/* ── Vertex shader — fullscreen quad ── */
const VS = `
attribute vec2 a_p;
void main() { gl_Position = vec4(a_p, 0.0, 1.0); }
`;

/* ── Fragment shader ── */
const FS = `
precision highp float;
uniform float u_t;
uniform vec2  u_res;

/* Value noise */
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),             hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
}

/* Glowing arc: y = mid + tilt*(x-0.5) + bend*(x-0.5)^2 */
float arc(vec2 uv, float mid, float tilt, float bend, float w) {
  float cx = uv.x - 0.5;
  float ay = mid + tilt * cx + bend * cx * cx;
  float slope = tilt + 2.0 * bend * cx;
  float d = abs(uv.y - ay) / sqrt(1.0 + slope * slope);
  return exp(-d * d / (w * w));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;

  float t     = u_t * 0.45;
  float swing = sin(t * 0.85); /* pendulum: -1 … +1 */

  /* ── Background: near-black with subtle blue-purple depth ── */
  vec3 col = vec3(0.027, 0.023, 0.040);

  /* ── Top texture (leopard / marble cells) ──
     Moves OPPOSITE to the streaks — counter-swing creates the cradle illusion */
  float txOff = -swing * 0.065;
  vec2  tuv   = vec2(uv.x + txOff, uv.y);

  float n = vn(tuv * 4.2)                               * 0.55
          + vn(tuv * 9.5  + vec2(t * -0.04, 0.3))       * 0.30
          + vn(tuv * 20.0 + vec2(t * 0.02,  0.1))       * 0.15;

  float cell    = smoothstep(0.38, 0.58, n);
  float topMask = smoothstep(0.72, 0.22, uv.y); /* fades into bottom half */

  col = mix(col,
    vec3(0.035, 0.030, 0.052) + cell * vec3(0.032, 0.027, 0.055),
    topMask * 0.88);

  /* ── Neon blue lightsaber streaks ──
     tilt drives the pendulum rock; three overlapping arcs for depth */
  float tilt = swing * 0.55;

  vec3 cO = vec3(0.00, 0.28, 0.82); /* outer glow */
  vec3 cB = vec3(0.00, 0.60, 1.00); /* vivid blue  */
  vec3 cC = vec3(0.70, 0.93, 1.00); /* white-blue core */

  /* Streak 1 — primary (centre, brightest) */
  col += cO * arc(uv, 0.500, tilt,        -0.22, 0.034) * 0.62;
  col += cB * arc(uv, 0.500, tilt,        -0.22, 0.012) * 1.15;
  col += cC * arc(uv, 0.500, tilt,        -0.22, 0.0045) * 3.10;

  /* Streak 2 — secondary (slightly below, softer) */
  float tilt2 = swing * 0.44;
  col += cO * arc(uv, 0.562, tilt2,       -0.18, 0.024) * 0.40;
  col += cB * arc(uv, 0.562, tilt2,       -0.18, 0.0085) * 0.82;
  col += cC * arc(uv, 0.562, tilt2,       -0.18, 0.0032) * 2.00;

  /* Streak 3 — tertiary (above, thin, wispy) */
  float tilt3 = swing * 0.66;
  col += cO * arc(uv, 0.438, tilt3,       -0.26, 0.018) * 0.26;
  col += cC * arc(uv, 0.438, tilt3,       -0.26, 0.0028) * 1.40;

  /* Atmospheric haze around the arc zone */
  float midY = 0.50 + tilt * 0.30;
  float dx   = uv.x - 0.50;
  float dy   = uv.y - midY;
  col += cO * exp(-(dx * dx + dy * dy * 2.5) / 0.18) * 0.07;

  /* ── Filmic tone map + gamma ── */
  col /= 1.0 + col * 0.55;
  col  = pow(max(col, 0.0), vec3(0.4545));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null
      ?? (canvas.getContext("experimental-webgl") as unknown as WebGLRenderingContext | null);
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS))
        console.error(gl!.getShaderInfoLog(s));
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    /* Fullscreen triangle pair */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1,  1,
      -1,  1,  1, -1,   1,  1,
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_p");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uT   = gl.getUniformLocation(prog, "u_t");
    const uRes = gl.getUniformLocation(prog, "u_res");

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width  = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const mm    = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let raf: number;

    function draw() {
      const elapsed = mm.matches ? 0 : (performance.now() - start) / 1000;
      gl!.uniform1f(uT, elapsed);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="block h-full w-full"
    />
  );
}
