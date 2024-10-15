<?php

include 'terminus8x16.php';

const FONT_WIDTH   = 8;
const FONT_HEIGHT  = 16;

const NUM_CHARS = 5;

const MAX_OFFSET_X =  0.2;
const MAX_OFFSET_Y =  0.2;
const MAX_OFFSET_Z =  0.2;
const MIN_OFFSET_X = -0.2;
const MIN_OFFSET_Y = -0.2;
const MIN_OFFSET_Z = -0.2;

const MIN_ROTATION = -M_PI_4;
const MAX_ROTATION = +M_PI_4;


class vec3 { public float $x, $y, $z; };
class ray  { public vec3  $point, $normal; }


function font_bitset(int $ch, int $x, int $y)
{
	return TERMINUS_8x16[$ch * FONT_HEIGHT + $y] & 1 << (FONT_WIDTH - $x);
}


function rand_word(int $len) : string 
{
	$word = array_merge(range('a', 'z'), range('A', 'Z'));
	shuffle($word);
	return substr(implode($word), 0, $len);
}


function rand_float(float $min, float $max) : float
{
	$r = mt_rand() / mt_getrandmax();
	return $min + $r * ($max - $min);
}


function rand_ray_to(vec3 $to) : ray
{
	$p   = new vec3;
	$d   = new vec3;
	$ray = new ray;
retry:
	$p->x = rand_float(-0.5, 0.5);
	$p->y = rand_float(-0.5, 0.5);
	$p->z = rand_float(-0.5, 0.5);

	$d->x = $to->x - $p->x;
	$d->y = $to->y - $p->y;
	$d->z = $to->z - $p->z;

	$len = sqrt($d->x * $d->x + 
	            $d->y * $d->y + 
	            $d->z * $d->z);

	if($len == 0) {
		goto retry;
	}

	$d->x /= $len;
	$d->y /= $len;
	$d->z /= $len;

	$ray->point  = $p;
	$ray->normal = $d;
	return $ray;
}


function raycaptcha(string $s) : array
{
	$offset = new vec3;
	$offset->x = rand_float(MIN_OFFSET_X, MAX_OFFSET_X);
	$offset->y = rand_float(MIN_OFFSET_Y, MAX_OFFSET_Y);
	$offset->z = rand_float(MIN_OFFSET_Z, MAX_OFFSET_Z);
	$rotation  = rand_float(MIN_ROTATION, MAX_ROTATION);

	$len  = strlen($s);
	$max  = $len * FONT_WIDTH;
	$midx = 0.5;
	$midy = (FONT_HEIGHT / $max) * 0.5;
	$xoff = 0.0;

	$rays = array();

	for($i = 0; $i < $len; $i++) {
		for($y = 0; $y < FONT_HEIGHT; $y++)
		for($x = 0; $x < FONT_WIDTH;  $x++) {
			if(font_bitset(ord($s[$i]), $x, $y)) {
				$p = new vec3;
				$p->x = $midx - ($x + $xoff) / $max;
				$p->y = $midy -  $y          / $max;
				/* rotate along y-axis */
				$p->z = $p->x * -sin($rotation);
				$p->x = $p->x *  cos($rotation);
				$p->y = $p->y;

				$p->x += $offset->x;
				$p->y += $offset->y;
				$p->z += $offset->z;

				$ray = rand_ray_to($p);

				array_push($rays, $ray);
			}
		}
		$xoff += FONT_WIDTH;
	}
	return $rays;
}


session_start();

if(!isset($_SESSION['captcha_key'])) {
	$_SESSION['captcha_key'] = rand_word(NUM_CHARS);
}

if(isset($_SESSION['captcha_key'])) {
	$rays = raycaptcha($_SESSION['captcha_key']);
	$len  = count($rays);
	$out  = '[';
	for($i = 0; $i < $len; $i++) {
		$point  = sprintf('{"x": %lf, "y": %lf, "z": %lf}',
			          $rays[$i]->point->x,
			          $rays[$i]->point->y,
			          $rays[$i]->point->z);
		$normal = sprintf('{"x": %lf, "y": %lf, "z": %lf}',
			          $rays[$i]->normal->x,
			          $rays[$i]->normal->y,
			          $rays[$i]->normal->z);
		$out   .= sprintf('{"point": %s, "normal": %s}', 
		                  $point, $normal);
		if($i + 1 != $len) {
			$out .= ',';
		}
	}
	$out .= ']';
	echo $out;
}

?>