const settings = {
	frameElementSelector: '#content',
	performance: {
		blur: {
			_directions: '13.0',
			_quality: '4.0',
		},
		maxPixelRatio: Infinity,
	},
}

let scene, camera, renderer, texture, material, plane;
let animateProgress = 0;
let animationFrameId = null;
let pratio = Math.min(window.devicePixelRatio, settings.performance.maxPixelRatio)

// Function to start the airDrop animation
function airDrop() {
	html2canvas(document.querySelector(settings.frameElementSelector)).then(canvas => {
		if (!renderer) {
			initThreeJS(canvas);
		} else {
			updateTexture(canvas);
		}
		animate();
		renderer.domElement.classList.add('act');
	});
}

function initThreeJS(canvas) {
	console.log(initThreeJS)
	setupScene();
	setupCamera();
	setupRenderer();
	setupTexture(canvas);
	setupMaterial();
	setupPlane();
}

function setupScene() {
	scene = new THREE.Scene();
}

function setupCamera() {
	const aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, 0.1, 1000);
	camera.position.z = 1;
}

function setupRenderer() {
	renderer = new THREE.WebGLRenderer({ alpha: false });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	const canvasContainer = document.getElementById('canvas-container');
	canvasContainer.innerHTML = '';
	canvasContainer.appendChild(renderer.domElement);
}

function setupTexture(canvas) {
	texture = new THREE.CanvasTexture(canvas);
}

function updateTexture(canvas) {
	console.log(updateTexture)
	texture.image = canvas;
	texture.needsUpdate = true;
}

function setupMaterial() {
	material = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 0.0 },
			tDiffuse: { value: texture },
			resolution: { value: new THREE.Vector2(window.innerWidth*pratio, window.innerHeight*pratio) },
		},
		vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
		fragmentShader: fragmentShader,
	});
}

function setupPlane() {
	plane = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth * pratio, window.innerHeight * pratio, 1, 1), material);
	scene.add(plane);
}

function animate() {
	animationFrameId = requestAnimationFrame(animate);
	updateUniforms();
	renderer.render(scene, camera);
}

function updateUniforms() {
	animateProgress += 0.01;
	material.uniforms.time.value = animateProgress;

	if (animateProgress > 2.0) {
		resetAnimation();
	}
}

function resetAnimation() {
	animateProgress = 0;
	renderer.domElement.classList.remove('act');
	cancelAnimationFrame(animationFrameId);
	animationFrameId = null;
}

function onWindowResize() {
	console.log('res')
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	if (material && material.uniforms && material.uniforms.resolution) {
		material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
	}
}

window.addEventListener('resize', onWindowResize, false);


let fragmentShader = `
uniform float time;
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float uWaveAmplitude;

const float Pi = 6.28318530718; // yes
const float Directions = ${settings.performance.blur._directions};
const float Quality = ${settings.performance.blur._quality};
const float uv_y_dynamic_island_offset = 0.46;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 uv_centered = uv - 0.5;
    uv_centered.x *= resolution.x / resolution.y;

    float t = time;
    float t2 = t * t;
    float t3 = t * t2;

    // Calculate "stretch" effect
    vec2 uv_stretch = vec2(
        uv.x + ((uv.x - 0.5) * pow(uv.y, 6.0) * t3 * 0.1),
        uv.y * (uv.y * pow((1.0 - (t2 * 0.01)), 8.0)) + (1.0 - uv.y) * uv.y
    );
    uv_stretch = mix(uv, uv_stretch, smoothstep(1.1, 1.0, t));

    // Calculate "bang" effect
    vec2 bang_offset = vec2(0.0);
    float bang_d = 0.0;
    if (t >= 1.0) {
        float aT = t - 0.6;
        vec2 uv2 = uv_centered;
        uv2.y -= 0.7;

        vec2 uv_bang_origin = vec2(uv2.x, uv2.y - uv_y_dynamic_island_offset);
        float length_uv_bang_origin = length(uv_bang_origin);
        bang_d = (aT * 0.1) / length_uv_bang_origin;
        bang_d = smoothstep(0.07, 0.03, bang_d) * smoothstep(0.03, 0.06, bang_d) * (uv.y + 0.05);
        bang_offset = vec2(-8.0 * bang_d * uv2.x, -4.0 * bang_d * (uv2.y - 0.4)) * 0.1;

        float bang_d2 = ((aT - 0.085) * 0.1) / length_uv_bang_origin;
        bang_d2 = smoothstep(0.04, 0.03, bang_d2) * smoothstep(0.03, 0.06, bang_d2) * (uv.y + 0.05);
        bang_offset += vec2(-8.0 * bang_d2 * uv2.x, -4.0 * bang_d2 * (uv2.y - 0.4)) * -0.02;
    }

    vec2 uv_stretch_bang = uv_stretch + bang_offset;

    // Interpolate between original UV and UV with effect
    float stretchEffectFactor = smoothstep(0.0, 1.0, t);
    vec2 uv_effect = mix(uv, uv_stretch_bang, stretchEffectFactor);

    vec4 baseColor = texture2D(tDiffuse, uv_effect);

    // Blur effect
    float blurHeight = 3.0;
    vec4 blurColor = vec4(0.0);
    float Radius = t2 * 0.1 * pow(uv.y, blurHeight) * 0.5;
    Radius *= smoothstep(1.3, 0.9, t);
    Radius += bang_d * 0.05;

    for (float d = 0.0; d < Pi; d += Pi / Directions) {
        for (float i = 1.0 / Quality; i <= 1.0; i += 1.0 / Quality) {
            vec2 blurPos = uv_stretch_bang + vec2(cos(d), sin(d)) * Radius * i;
            blurColor += texture2D(tDiffuse, blurPos);
        }
    }
    blurColor /= Quality * Directions;

    // Blend blur with base color
    vec4 color = blurColor;

    uv -= 0.5;
    uv.x *= resolution.x / resolution.y;
    uv.x -= 0.0;
	float light = 0.0 + (t*2.0) / 4.0;

	//Rainbow blob
    vec2 lighten_uv = vec2(uv.x * 0.25, uv.y - t + 0.3);
	float d = smoothstep(0.0, 0.9, 0.114 / length(lighten_uv)) * light;
	float t_smooth = smoothstep(0.0, 0.9, t);
	d *= t_smooth;

	// Rainbow gradient
    vec3 rainbowColors[7] = vec3[](vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), vec3(0.29, 0.0, 0.51), vec3(0.56, 0.0, 1.0));
    float y = uv.y * 6.0;
    vec3 rainbowColor = rainbowColors[int(clamp(floor(y), 0.0, 6.0))];
    rainbowColor = mix(rainbowColor, rainbowColors[int(clamp(ceil(y), 0.0, 6.0))], fract(y));
    vec4 blobColor = vec4(rainbowColor * d, 1.0);
    color += blobColor;

	//White blob
    vec2 lighten2_uv = vec2(uv.x * 0.4, uv.y - uv_y_dynamic_island_offset);
    float d2 = smoothstep(0.0, 0.9, 0.1 / length(lighten2_uv)) * 0.4;
    float t2_smooth = smoothstep(0.0, 1.0, t2) * 0.4;
    d2 *= t2_smooth;
    d2 *= smoothstep(1.13, 1.0, t);
    color = vec4(color.rgb * (1.0 - d2), 1.0) + vec4(vec3(d2), 1.0);

    gl_FragColor = color;
}
`