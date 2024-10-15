

var mat_projection;
var mat_modelview;

const M_PI   = Math.PI
const M_PI_2 = Math.PI * 0.5;
const M_PI_4 = Math.PI * 0.25; 

const MAX_ROTATION = M_PI_2 + M_PI_4;
const MIN_ROTATION = M_PI_2 - M_PI_4;


function matrix_perspective(fovy, aspect, znear, zfar)
{
	var halffovy = fovy / 2.0;
	var f = Math.cos(halffovy) / Math.sin(halffovy);
	var d = znear - zfar;

	return [[f / aspect, 0.0,                      0.0,  0.0],
	        [0.0,          f,                      0.0,  0.0],
	        [0.0,        0.0,       (zfar + znear) / d, -1.0],
	        [0.0,        0.0, (2.0 * zfar * znear) / d,  0.0]]
}


function matrix_rotatey_and_offsetz(yrot, zoff)
{
	var sr = Math.sin(yrot);
	var cr = Math.cos(yrot);

	return [[ cr, 0.0,  -sr, 0.0],
	        [0.0, 1.0,  0.0, 0.0],
	        [ sr, 0.0,   cr, 0.0],
	        [0.0, 0.0, zoff, 1.0]]

}


function matrix_mul_vector(m, v)
{
	var x = v.x * m[0][0] + v.y * m[1][0] + v.z * m[2][0] + m[3][0];
	var y = v.x * m[0][1] + v.y * m[1][1] + v.z * m[2][1] + m[3][1];
	var z = v.x * m[0][2] + v.y * m[1][2] + v.z * m[2][2] + m[3][2];
	var w = v.x * m[0][3] + v.y * m[1][3] + v.z * m[2][3] + m[3][3];

	if(w <= 0.01) {
		return null;
	}

	x /= w;
	y /= w;
	z /= w;

	return { x: x, y: y, z: z };
}


function world_to_screen(world)
{
	var view = matrix_mul_vector(mat_modelview, world);
	if(view == null) {
		return null;
	}

	var screen = matrix_mul_vector(mat_projection, view);
	if(screen == null) { 
		return null;
	}

	screen.x = (screen.x + 1.0) * (0.5 * canvas.width);
	screen.y = (screen.y + 1.0) * (0.5 * canvas.height);
	screen.y = canvas.height - screen.y;

	return screen;
}


function draw_intersection(ctx, ray, plane)
{
	var nn = ray.normal.x * plane.normal.x +
	         ray.normal.y * plane.normal.y +
	         ray.normal.z * plane.normal.z;
	
	if(nn == 0.0) {
		return;
	}

	var np = ray.point.x * plane.normal.x +
	         ray.point.y * plane.normal.y +
	         ray.point.z * plane.normal.z;

	var t = -(np + plane.d) / nn;

	var p = {
		x: ray.point.x + ray.normal.x * t,
		y: ray.point.y + ray.normal.y * t,
		z: ray.point.z + ray.normal.z * t
	};

	var s_p = world_to_screen(p);
	if(s_p == null) { 
		return 
	};

	ctx.beginPath();
		ctx.arc(s_p.x, s_p.y, 1.5, 0, 2 * Math.PI, false);
		ctx.fillStyle="black";
	ctx.fill();
}


function draw_ray(ctx, ray, size)
{
	var proj = { 
		x: ray.point.x + (ray.normal.x * size),
		y: ray.point.y + (ray.normal.y * size),
		z: ray.point.z + (ray.normal.z * size)
	};

	var s_point = world_to_screen(ray.point);
	if(s_point == null) {
		return;
	}

	var s_proj = world_to_screen(proj);
	if(s_proj == null) {
		return;
	}

	ctx.beginPath();
		ctx.arc(s_point.x, s_point.y, 1, 0, 2 * Math.PI, false);
		ctx.fillStyle = "gray";
	ctx.fill();

	ctx.beginPath();
		ctx.moveTo(s_point.x, s_point.y);
		ctx.lineTo(s_proj.x, s_proj.y);
		ctx.strokeStyle="gray";
	ctx.stroke();
}


function draw(canvas, ctx, rays, rotation, displacement)
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	var plane = {
		normal: { 
			x: Math.cos(rotation), 
			y: 0.0, 
			z: Math.sin(rotation) 
		},
		d: displacement
	}

	mat_modelview = matrix_rotatey_and_offsetz(
		rotation + M_PI_2, 
		-plane.d - 0.5
	);

	for(var i = 0; i < rays.length; i++) {
		var ray = rays[i];
		draw_ray(ctx, ray, 0.2);
	}

	for(var i = 0; i < rays.length; i++) {
		draw_intersection(ctx, rays[i], plane);
	}
}


function main()
{
	var canvas = document.getElementById("canvas");
	var ctx    = canvas.getContext("2d");

	var req = new XMLHttpRequest();
	req.open("POST", "/raycaptcha.php", false);
	req.send(null);

	if(req.status != 200) {
		document.body.innerHTML = "<p>Failed to load rays :(</p><p>check <a href='/raycaptcha.php'>raycaptcha.php</a>";
		return;
	}

	var rays         = JSON.parse(req.responseText);
	var rotation     = M_PI_2;
	var displacement = 0.0;

	var r_slider = document.getElementById("r_slider");
	var d_slider = document.getElementById("d_slider");

	r_slider.min  = MIN_ROTATION;
	r_slider.max  = MAX_ROTATION;
	r_slider.step = 0.001; 

	d_slider.max  = Math.sqrt(0.2 * 0.2 + 
	                          0.2 * 0.2 + 
	                          0.2 * 0.2);
	d_slider.min  = -d_slider.max
	d_slider.step = 0.001;

	r_slider.value = rotation.toString();
	d_slider.value = displacement.toString();

	var aspect = canvas.width / canvas.height;
	mat_projection = matrix_perspective(M_PI_2, aspect, 0.1, 100.0);

	r_slider.oninput = function() {
		rotation = parseFloat(r_slider.value);
		draw(canvas, ctx, rays, rotation, displacement);
	};

	d_slider.oninput = function() {
		displacement = parseFloat(d_slider.value);
		draw(canvas, ctx, rays, rotation, displacement);
	};

	draw(canvas, ctx, rays, rotation, displacement);
}