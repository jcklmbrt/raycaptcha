<!DOCTYPE html>
<html>
	<?php session_start(); ?>
	<?php if(isset($_GET['guess']) && isset($_SESSION['captcha_key'])) { ?>
		<?php session_destroy(); ?>
		<body>
			<?php if($_GET['guess'] == $_SESSION['captcha_key']) { ?>
				<h1>correct :)</h1>
			<?php } else { ?>
				<h1>incorrect</h1>
			<?php } ?>
			<a href='/'> try again? </a>
		</body>
	<?php } else { ?>
		<head><script src="raycaptcha.js"></script></head>
		<body onload="main()">
			<h1>RayCaptcha</h1>
			<p>adjust the rotation and displacement of the plane to reveal a secret message.</p>
			<canvas id="canvas" width="200" height="100"></canvas></br>
			<label>rotation:</label></br><input type="range" id="r_slider"></input></br>
			<label>displacement:</label></br><input type="range" id="d_slider"></input></br>
			<form method="GET">
				<input name="guess" type="text"></input>
				<input type="submit"></input>
			</form>
		</body>
	<?php } ?>
</html>