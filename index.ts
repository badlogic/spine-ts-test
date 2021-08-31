import { AnimationState, AnimationStateData, AssetManager, AtlasAttachmentLoader, Skeleton, SkeletonBounds, SkeletonJson, SkeletonRenderer, TextureAtlas, Vector2 } from "@esotericsoftware/spine-canvas";

var lastFrameTime = Date.now() / 1000;
var canvas: HTMLCanvasElement, context: CanvasRenderingContext2D;
var assetManager: AssetManager;
var skeleton: Skeleton, state: AnimationState, bounds: { offset: Vector2, size: Vector2 };
var skeletonRenderer: SkeletonRenderer;

var skelName = "spineboy-ess";
var animName = "walk";

function init() {
	canvas = document.getElementById("canvas") as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context = canvas.getContext("2d") as CanvasRenderingContext2D;

	skeletonRenderer = new SkeletonRenderer(context);
	// enable debug rendering
	skeletonRenderer.debugRendering = true;
	// enable the triangle renderer, supports meshes, but may produce artifacts in some browsers
	skeletonRenderer.triangleRendering = false;

	assetManager = new AssetManager("assets/");

	assetManager.loadText(skelName + ".json");
	assetManager.loadText(skelName.replace("-pro", "").replace("-ess", "") + ".atlas");
	assetManager.loadTexture(skelName.replace("-pro", "").replace("-ess", "") + ".png");

	requestAnimationFrame(load);
}

function load() {
	if (assetManager.isLoadingComplete()) {
		var data = loadSkeleton(skelName, animName, "default");
		skeleton = data.skeleton;
		state = data.state;
		bounds = data.bounds;
		requestAnimationFrame(render);
	} else {
		requestAnimationFrame(load);
	}
}

function loadSkeleton(name: string, initialAnimation: string, skin: string) {
	if (skin === undefined) skin = "default";

	// Load the texture atlas using name.atlas and name.png from the AssetManager.
	// The function passed to TextureAtlas is used to resolve relative paths.
	let atlas = new TextureAtlas(assetManager.require(name.replace("-pro", "").replace("-ess", "") + ".atlas"));
	atlas.setTextures(assetManager);

	// Create a AtlasAttachmentLoader, which is specific to the WebGL backend.
	let atlasLoader = new AtlasAttachmentLoader(atlas);

	// Create a SkeletonJson instance for parsing the .json file.
	var skeletonJson = new SkeletonJson(atlasLoader);

	// Set the scale to apply during parsing, parse the file, and create a new skeleton.
	var skeletonData = skeletonJson.readSkeletonData(assetManager.require(name + ".json"));
	var skeleton = new Skeleton(skeletonData);
	skeleton.scaleY = -1;
	var bounds = calculateBounds(skeleton);
	skeleton.setSkinByName(skin);

	// Create an AnimationState, and set the initial animation in looping mode.
	var animationState = new AnimationState(new AnimationStateData(skeleton.data));
	animationState.setAnimation(0, initialAnimation, true);

	// Pack everything up and return to caller.
	return { skeleton: skeleton, state: animationState, bounds: bounds };
}

function calculateBounds(skeleton: Skeleton) {
	var data = skeleton.data;
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform();
	var offset = new Vector2();
	var size = new Vector2();
	skeleton.getBounds(offset, size, []);
	return { offset: offset, size: size };
}

function render() {
	var now = Date.now() / 1000;
	var delta = now - lastFrameTime;
	lastFrameTime = now;

	resize();

	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.fillStyle = "#cccccc";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.restore();

	state.update(delta);
	state.apply(skeleton);
	skeleton.updateWorldTransform();
	skeletonRenderer.draw(skeleton);

	context.strokeStyle = "green";
	context.beginPath();
	context.moveTo(-1000, 0);
	context.lineTo(1000, 0);
	context.moveTo(0, -1000);
	context.lineTo(0, 1000);
	context.stroke();

	requestAnimationFrame(render);
}

function resize() {
	var w = canvas.clientWidth;
	var h = canvas.clientHeight;
	if (canvas.width != w || canvas.height != h) {
		canvas.width = w;
		canvas.height = h;
	}

	// magic
	var centerX = bounds.offset.x + bounds.size.x / 2;
	var centerY = bounds.offset.y + bounds.size.y / 2;
	var scaleX = bounds.size.x / canvas.width;
	var scaleY = bounds.size.y / canvas.height;
	var scale = Math.max(scaleX, scaleY) * 1.2;
	if (scale < 1) scale = 1;
	var width = canvas.width * scale;
	var height = canvas.height * scale;

	context.setTransform(1, 0, 0, 1, 0, 0);
	context.scale(1 / scale, 1 / scale);
	context.translate(-centerX, -centerY);
	context.translate(width / 2, height / 2);
}

(function () {
	init();
}());